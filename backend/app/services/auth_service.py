import logging

from app.core.security import hash_password, verify_password
from app.models.user import UserProfile
from app.repositories.user_repository import RegistrationSetupError, UserRepository

logger = logging.getLogger(__name__)


class InvalidCredentialsError(Exception):
    pass


class UsernameAlreadyExistsError(Exception):
    pass


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def login(self, username: str, password: str) -> tuple[int, UserProfile]:
        user = self.users.find_by_username(username)
        if user is None:
            raise InvalidCredentialsError

        is_valid, is_legacy_password = verify_password(password, user.password)
        if not is_valid:
            raise InvalidCredentialsError

        if is_legacy_password:
            self.users.update_password(user.id_usuario, hash_password(password))
            logger.info("Migrated legacy password to a secure hash for user id %s", user.id_usuario)

        return user.id_usuario, self.users.get_profile(user)

    def register(self, nombre: str, username: str, password: str) -> tuple[int, UserProfile]:
        if self.users.find_by_username(username) is not None:
            raise UsernameAlreadyExistsError
        user = self.users.create_customer(nombre, username, hash_password(password))
        return user.id_usuario, self.users.get_profile(user)

    def get_profile(self, user_id: int) -> UserProfile:
        user = self.users.find_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError
        return self.users.get_profile(user)
