import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from postgrest.exceptions import APIError

from app.api.dependencies import get_auth_service, get_authenticated_user_id
from app.core.config import get_settings
from app.core.security import SESSION_COOKIE_NAME, create_session_token
from app.schemas.auth import LoginRequest, LoginResponse, MessageResponse, RegisterRequest
from app.schemas.user import UserProfileResponse
from app.repositories.user_repository import UserRelationNotFoundError
from app.services.auth_service import (
    AuthService,
    InvalidCredentialsError,
    UsernameAlreadyExistsError,
)
from app.repositories.user_repository import RegistrationSetupError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=LoginResponse)
def login(
    credentials: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    try:
        user_id, profile = auth_service.login(credentials.usuario, credentials.password)
    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
        ) from error
    except APIError as error:
        logger.exception("Supabase rejected the login database request.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo consultar la base de datos. Revisa la configuración y las tablas.",
        ) from error
    except httpx.HTTPError as error:
        logger.exception("Could not reach Supabase during login.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar con Supabase.",
        ) from error
    except UserRelationNotFoundError as error:
        logger.error("User profile refers to a missing role or branch: %s", error)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario no tiene un rol o una sucursal válidos.",
        ) from error
    except RuntimeError as error:
        logger.exception("Login server configuration is invalid.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El backend no está configurado correctamente.",
        ) from error

    settings = get_settings()
    token, max_age = create_session_token(user_id, credentials.remember_me)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age if credentials.remember_me else None,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    return LoginResponse(
        user=UserProfileResponse(
            id_usuario=profile.id_usuario,
            nombre=profile.nombre,
            usuario=profile.usuario,
            rol=profile.rol,
            sucursal=profile.sucursal,
        )
    )


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(
    credentials: RegisterRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    try:
        user_id, profile = auth_service.register(
            credentials.nombre, credentials.usuario, credentials.password
        )
    except UsernameAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese nombre de usuario.",
        ) from error
    except RegistrationSetupError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    except APIError as error:
        if getattr(error, "code", None) == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una cuenta con ese nombre de usuario.",
            ) from error
        logger.exception("Supabase rejected the registration request.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo crear la cuenta. Revisa la configuración y las tablas.",
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar con Supabase.",
        ) from error

    settings = get_settings()
    token, max_age = create_session_token(user_id, True)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    return LoginResponse(user=UserProfileResponse(
        id_usuario=profile.id_usuario,
        nombre=profile.nombre,
        usuario=profile.usuario,
        rol=profile.rol,
        sucursal=profile.sucursal,
    ))


@router.get("/me", response_model=UserProfileResponse)
def current_user(
    user_id: int = Depends(get_authenticated_user_id),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserProfileResponse:
    try:
        profile = auth_service.get_profile(user_id)
    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta asociada a esta sesión ya no existe.",
        ) from error
    except APIError as error:
        logger.exception("Supabase rejected the current-user database request.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo consultar la base de datos.",
        ) from error
    except httpx.HTTPError as error:
        logger.exception("Could not reach Supabase while loading the current user.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar con Supabase.",
        ) from error
    except UserRelationNotFoundError as error:
        logger.error("User profile refers to a missing role or branch: %s", error)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario no tiene un rol o una sucursal válidos.",
        ) from error

    return UserProfileResponse(
        id_usuario=profile.id_usuario,
        nombre=profile.nombre,
        usuario=profile.usuario,
        rol=profile.rol,
        sucursal=profile.sucursal,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response) -> MessageResponse:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=get_settings().is_production,
        samesite="lax",
        path="/",
    )
    return MessageResponse(message="Sesión cerrada.")
