# Backend

API separada del frontend, construida con FastAPI.

## Configuración

1. Copia `.env.example` como `.env` dentro de `backend/`.
2. En `SUPABASE_URL`, coloca la URL del proyecto.
3. En `SUPABASE_SERVICE_ROLE_KEY`, usa una clave secreta del servidor de Supabase. Nunca uses la clave `publishable` para esta variable ni expongas la clave secreta en el frontend.
4. Genera un valor aleatorio largo para `JWT_SECRET_KEY`.
5. Confirma que las tablas tengan los nombres y columnas `usuario(id_usuario, nombre, usuario, password, id_rol, id_sucursal)`, `rol(id_rol, nombre)` y `sucursal(id_sucursal, nombre)`.

El archivo `.env` se carga desde la carpeta `backend/`, incluso si ejecutas Uvicorn desde la raíz del repositorio.

El backend consulta Supabase con su cliente de servidor. La clave secreta no se envía al navegador. Las claves foráneas de `usuario.id_rol` y `usuario.id_sucursal` deben referenciar las tablas `rol` y `sucursal`.

Instala las dependencias con `python -m pip install -r requirements.txt` dentro de `backend/`. Configura también `NEXT_PUBLIC_API_URL=http://localhost:8000` en `frontend/.env.local` (puedes copiar `frontend/.env.example`).

## Login

- `POST /api/v1/auth/login`: recibe `usuario`, `password` y `remember_me`; establece una cookie de sesión `HttpOnly` y devuelve el perfil sin la contraseña.
- `POST /api/v1/auth/register`: recibe nombre, usuario y contraseña, crea el perfil con rol `Cliente` y la primera sucursal disponible, y abre una sesión `HttpOnly`. Debe existir ese rol y al menos una sucursal.
- `GET /api/v1/auth/me`: devuelve el perfil asociado a la cookie.
- `POST /api/v1/auth/logout`: elimina la cookie de sesión.
- `GET /health`: comprobación básica de la API.

## Gestión de usuarios

El menú **Usuarios** y sus endpoints están disponibles únicamente para una cuenta cuyo valor en `rol.nombre` sea `Administrador` (sin distinguir mayúsculas/minúsculas). Debe existir al menos una cuenta administradora para abrir el panel.

- `GET /api/v1/users/options`: devuelve los roles y sucursales actuales.
- `GET /api/v1/users`: lista usuarios sin exponer contraseñas.
- `POST /api/v1/users`: crea un usuario con nombre, usuario, contraseña, rol y sucursal. La contraseña nueva se guarda con hash PBKDF2.

El registro público y la creación administrativa requieren las tablas existentes `usuario`, `rol` y `sucursal`, y las columnas ya usadas por el login.

## Catálogo de vehículos

El catálogo usa la tabla `vehiculo` con `placa` como identificador y las columnas `anio`, `color`, `kilometraje_actual`, `monto_garantia`, `sector_estacionamiento`, `estado`, `id_modelo`, `id_sucursal`, `id_categoria`, `id_seguro` e `imagen_url`, según el esquema compartido. Se requiere que modelo, sucursal, categoría y seguro referencien registros existentes.

- `GET /api/v1/vehicles`: lista vehículos para usuarios con sesión.
- `POST /api/v1/vehicles`: registra un vehículo (solo Administrador).
- `PUT /api/v1/vehicles/{plate}`: actualiza los datos excepto la placa (solo Administrador).
- `DELETE /api/v1/vehicles/{plate}`: elimina un vehículo solo si no tiene datos relacionados (solo Administrador). La base de datos bloquea la eliminación cuando existe historial o dependencias.
- `POST /api/v1/vehicles/{plate}/image`: sube una foto JPG, PNG o WebP de hasta 5 MB a Storage y guarda su URL en la tabla (solo Administrador).

La placa debe ser única; el formulario recibe directamente los IDs ya existentes de modelo, sucursal y categoría, más el seguro opcional. El catálogo obtiene marca, modelo, categoría y sucursal desde sus tablas relacionadas.

Para fotos, crea en **Supabase → Storage** un bucket público llamado `vehiculos`, con límite de archivo de al menos 5 MB y tipos permitidos `image/jpeg`, `image/png` e `image/webp`. El endpoint autenticado por rol Administrador sube el archivo al bucket y escribe su URL pública en `vehiculo.imagen_url`; no hace falta una columna nueva ni se envía la clave secreta al navegador. Configura `SUPABASE_VEHICLE_IMAGES_BUCKET=vehiculos` en `backend/.env` si usas otro nombre.

## Requisitos funcionales cubiertos hasta ahora

- **RF001 (parcial):** se limita la administración de usuarios y vehículos al rol `Administrador`; los permisos específicos de los demás roles todavía no están implementados.
- **RF002:** el acceso se valida con usuario y contraseña mediante el backend.
- **RF006 (parcial):** permite registrar vehículos y valida placa única en la base de datos; no incluye todavía todos los controles operativos de inventario.
- **RF007 (parcial):** guarda los datos disponibles en el esquema de vehículo, relaciona modelo/categoría/sucursal/seguro y admite una URL de imagen. No incluye carga de archivos, documentos, accesorios ni traslados.
- **RF067:** permite registrar y modificar vehículos. La eliminación segura es una acción adicional: se rechaza si el vehículo tiene registros relacionados para proteger el historial.

Reservas/alquileres completos, clientes, pagos, devoluciones, mantenimientos, incidentes, documentos, tarifas, reportes y los demás requisitos del documento aún no forman parte de estas pantallas.

Las contraseñas existentes en texto plano se verifican para la migración inicial. Cuando un usuario inicia sesión correctamente, el backend reemplaza su valor por un hash PBKDF2. Los logins posteriores comparan el hash. Por ello, las cuentas que aún no hayan iniciado sesión siguen teniendo la contraseña legible en la base de datos; cámbialas desde Supabase cuanto antes y nunca reutilices estas credenciales de ejemplo.

Las contraseñas de demostración mostradas en capturas o compartidas en conversaciones deben considerarse expuestas: reemplázalas por contraseñas nuevas. El backend migra a hash una contraseña antigua al primer login exitoso, pero eso no revoca copias anteriores.

Para desarrollo en Windows, desde la raíz del proyecto:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

La API estará en `http://127.0.0.1:8000` y su documentación automática en `/docs`.
