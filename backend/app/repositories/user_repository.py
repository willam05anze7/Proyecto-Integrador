from typing import Any

from supabase import Client

from app.models.user import UserProfile, UserRecord


class UserRepository:
    def __init__(self, client: Client) -> None:
        self.client = client

    def find_by_username(self, username: str) -> UserRecord | None:
        result = (
            self.client.table("usuario")
            .select("id_usuario,nombre,usuario,password,id_rol,id_sucursal")
            .eq("usuario", username)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return self._to_user_record(result.data[0])

    def find_by_id(self, user_id: int) -> UserRecord | None:
        result = (
            self.client.table("usuario")
            .select("id_usuario,nombre,usuario,password,id_rol,id_sucursal")
            .eq("id_usuario", user_id)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return self._to_user_record(result.data[0])

    def update_password(self, user_id: int, password_hash: str) -> None:
        self.client.table("usuario").update({"password": password_hash}).eq(
            "id_usuario", user_id
        ).execute()

    def create_customer(self, nombre: str, usuario: str, password_hash: str) -> UserRecord:
        role_result = (
            self.client.table("rol")
            .select("id_rol")
            .ilike("nombre", "cliente")
            .limit(1)
            .execute()
        )
        branch_result = (
            self.client.table("sucursal")
            .select("id_sucursal")
            .order("id_sucursal")
            .limit(1)
            .execute()
        )
        if not role_result.data:
            raise RegistrationSetupError("No existe un rol Cliente en la base de datos.")
        if not branch_result.data:
            raise RegistrationSetupError("No existe una sucursal para asignar a la cuenta.")

        result = self.client.table("usuario").insert(
            {
                "nombre": nombre,
                "usuario": usuario,
                "password": password_hash,
                "id_rol": int(role_result.data[0]["id_rol"]),
                "id_sucursal": int(branch_result.data[0]["id_sucursal"]),
            }
        ).execute()
        if result.data:
            return self._to_user_record(result.data[0])
        user = self.find_by_username(usuario)
        if user is None:
            raise RuntimeError("No se pudo recuperar la cuenta recién creada.")
        return user

    def get_profile(self, user: UserRecord) -> UserProfile:
        role_result = (
            self.client.table("rol")
            .select("nombre")
            .eq("id_rol", user.id_rol)
            .limit(1)
            .execute()
        )
        branch_result = (
            self.client.table("sucursal")
            .select("nombre")
            .eq("id_sucursal", user.id_sucursal)
            .limit(1)
            .execute()
        )

        if not role_result.data:
            raise UserRelationNotFoundError(
                f"No existe el rol con id_rol={user.id_rol}."
            )
        if not branch_result.data:
            raise UserRelationNotFoundError(
                f"No existe la sucursal con id_sucursal={user.id_sucursal}."
            )

        return UserProfile(
            id_usuario=user.id_usuario,
            nombre=user.nombre,
            usuario=user.usuario,
            rol=str(role_result.data[0]["nombre"]),
            sucursal=str(branch_result.data[0]["nombre"]),
        )

    @staticmethod
    def _to_user_record(row: dict[str, Any]) -> UserRecord:
        return UserRecord(
            id_usuario=int(row["id_usuario"]),
            nombre=str(row["nombre"]),
            usuario=str(row["usuario"]),
            password=str(row["password"]),
            id_rol=int(row["id_rol"]),
            id_sucursal=int(row["id_sucursal"]),
        )


class UserRelationNotFoundError(Exception):
    pass


class RegistrationSetupError(Exception):
    pass
