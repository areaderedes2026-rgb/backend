# API — Municipalidad de Trancas

Backend **Node.js + Express + MySQL** para el portal municipal. Expone autenticación JWT, CRUD de **usuarios** (solo administradores) y CRUD de **noticias** (administradores y editores). Las lecturas públicas de noticias no requieren token.

## Requisitos

- **Node.js** 20 o superior  
- **MySQL** 8.x (u 5.7 con soporte InnoDB / utf8mb4)

## Configuración

1. **Base de datos y tablas** — un solo script crea la base `municipalidad_trancas` y las tablas:

   ```bash
   mysql -u TU_USUARIO -p < database/script/01_init_database.sql
   ```

   En **MySQL Workbench**: *File → Open SQL Script*, abrí `database/script/01_init_database.sql` y ejecutá (ícono del rayo).

2. **Usuario administrador**

   - Ejecutá `database/script/02_seed_admin_workbench.sql` (después del paso 1).  
     Credenciales por defecto: `admin` / `123123`.

3. Creá el archivo `.env` y ajustá credenciales:

   Editá `MYSQL_*`, `JWT_SECRET` (obligatorio en producción), `CORS_ORIGIN` y las variables `CLOUDINARY_*`. Podés listar varios orígenes separados por coma (p. ej. `http://localhost:5173,http://127.0.0.1:5173`) para que el navegador permita al frontend en Vite conectarse a la API.

4. Instalá dependencias:

   ```bash
   npm install
   ```

5. Arrancá el servidor:

   ```bash
   npm run dev
   ```

   Por defecto escucha en **http://127.0.0.1:4000**.

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | No | Estado del servicio y conexión a MySQL |
| POST | `/api/auth/login` | No | `{ "username", "password" }` → `{ ok, token, user }` |
| GET | `/api/auth/me` | Bearer | Perfil del usuario autenticado |
| GET | `/api/users` | Admin | Lista pagada (`?limit=&offset=`) |
| GET | `/api/users/:id` | Admin | Detalle |
| POST | `/api/users` | Admin | Crear usuario |
| PUT | `/api/users/:id` | Admin | Actualizar (email, contraseña, nombre, rol, activo) |
| DELETE | `/api/users/:id` | Admin | Eliminar (no podés borrarte a vos mismo) |
| GET | `/api/news` | No | Lista de noticias (orden por `published_at` desc) |
| GET | `/api/news/:idOrSlug` | No | Detalle por **id numérico** o **slug** |
| POST | `/api/news` | Staff | Crear noticia (`admin` o `editor`) |
| PUT | `/api/news/:id` | Staff | Actualizar noticia |
| DELETE | `/api/news/:id` | Staff | Eliminar noticia |
| POST | `/api/upload` | Staff | Subir imagen por archivo (`multipart/form-data`, campo `file`) |
| POST | `/api/upload/from-url` | Staff | Importar imagen desde URL remota (`{ url, kind }`) |

**Autenticación:** cabecera `Authorization: Bearer <token>`.

**Roles:** `admin` (usuarios + noticias), `editor` (solo noticias).

### Formato de noticia (JSON, alineado al frontend)

Campos en **camelCase** en las respuestas:

- `id`, `slug`, `title`, `summary`, `body`, `publishedAt` (ISO 8601), `category`, `imageUrl` (o `null`), `galleryUrls` (array)

Al **crear** (`POST /api/news`), `slug` es opcional (se genera a partir del título si no se envía).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto HTTP (default `4000`) |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Conexión MySQL |
| `JWT_SECRET` | Firma de tokens (usá un valor largo y aleatorio en producción) |
| `JWT_EXPIRES_IN` | Expiración JWT (default `7d`) |
| `CORS_ORIGIN` | Origen permitido del frontend |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Credenciales de Cloudinary |
| `CLOUDINARY_NEWS_FOLDER` | Carpeta base de assets de noticias |
| `CLOUDINARY_IMPORT_ALLOWED_HOSTS` | Allowlist de dominios para importación por URL (coma separada) |
| `CLOUDINARY_IMPORT_MAX_BYTES` | Tamaño máximo de imagen al importar/subir |
| `CLOUDINARY_IMPORT_TIMEOUT_MS` | Timeout de descarga remota de imágenes |

## Estructura del proyecto

```
backend/
├── database/script/   # 01_init_database.sql, 02_seed_admin_workbench.sql, 03_news_images.sql
├── src/
│   ├── config/        # db.js, cors.js, cloudinary.js
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

## Conectar el frontend

En el proyecto Vite del frontend, definí:

```env
VITE_API_URL=http://127.0.0.1:4000
```

Las rutas públicas de noticias coinciden con `fetch` a `${VITE_API_URL}/api/news` y `${VITE_API_URL}/api/news/:id`. Para el panel admin, el login debe enviar `POST /api/auth/login` y guardar el `token` para las peticiones protegidas.
