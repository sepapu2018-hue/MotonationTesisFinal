# MotoNation — Sistema Web de Control de Inventarios

Aplicación full-stack que automatiza el registro de stock en tiempo real y la gestión operativa de motocicletas. Incluye alertas de niveles críticos de inventario, kárdex, gestión de pedidos, moderación de reseñas y un control de acceso seguro basado en roles y permisos de usuario.

Incluya sus datos básicos para identificación y control.

## Datos del Estudiante
- **Autor:** Narvaez Leon Jose Sebastian, Daniela Monserratte Pinto Bazante.
- **Carrera:** Tecnologia De Desarrollo Software.
- **Docente:** Jonathan Quespaz
- **Período:** 2026-1

## Estado Actual del Proyecto y Próximos Alcances

Hasta la fecha, el desarrollo de la plataforma ha avanzado significativamente, consolidando tanto la infraestructura principal como gran parte de los módulos administrativos y comerciales. Actualmente, el sistema cuenta con una base sólida y funcional que permite gestionar las operaciones internas del negocio de manera eficiente, manteniendo una arquitectura escalable para futuras mejoras.

## Lo que tenemos desarrollado hasta ahora:

- **Infraestructura Base y Autenticación:** Servidor completamente operativo, conexión estable con la base de datos PostgreSQL y sistema de autenticación basado en roles de Administrador y Empleado, con tokens de acceso y refresco (JWT), protección anti fuerza bruta en los login y cabeceras de seguridad HTTP (helmet).
- **Módulo de Administración de Usuarios:** Registro, listado, edición (nombre, correo, rol, permisos granulares y contraseña) y eliminación de usuarios del sistema, con protecciones para no quedarse sin administradores ni auto-eliminarse. Permisos configurables por usuario (Dashboard, Productos, Categorías, Proveedores, Reseñas, Ventas/Movimientos, Kárdex, Pedidos, Alertas).
- **Maquetación y Componentes UI:** Ventanas modales, paneles deslizables, menús interactivos, diálogos de confirmación reutilizables, un Error Boundary global (evita pantallas en blanco ante errores inesperados de React) y componentes bajo la identidad visual deportiva de la marca (verde esmeralda + negro).
- **Módulo de Inventario:** Gestión de productos (con paginación en el listado), categorías, stock y movimientos de almacén (entradas, salidas, ventas y ajustes por conteo físico).
- **Ajuste de Inventario por Conteo Físico:** Movimiento dedicado (`ajuste +/-`) con motivo obligatorio para reconciliar el stock del sistema contra un conteo físico real, con trazabilidad igual que cualquier entrada/salida.
- **Costeo por Promedio Ponderado:** Al registrar una entrada de stock a un costo distinto, el costo del producto se recalcula como promedio ponderado entre el stock existente y la mercadería que entra (en vez de sobrescribirlo).
- **Módulo de Proveedores:** CRUD de proveedores, ligados opcionalmente a las entradas de stock en Movimientos (trazabilidad de "a quién se le compró").
- **Sistema de Kárdex:** Registro histórico de entradas/salidas/ventas/ajustes por producto, con exportación a PDF.
- **Alertas de Stock:** Panel dedicado a productos por debajo del stock mínimo configurado.
- **Backups:** Respaldo automático diario en Supabase (producción) + scripts propios de backup/restore manual (`npm run backup` / `npm run restore`).
- **Catálogo Público de Productos:** Visualización de productos para clientes externos con filtros, búsqueda y detalle por SKU.
- **Cuenta de Cliente:** Registro, login, edición de perfil y recuperación de contraseña ("olvidé mi contraseña" con token de un solo uso).
- **Carrito de Compras y Checkout:** Flujo funcional para selección de productos, checkout simulado y generación de pedidos con cálculo de impuestos. Al confirmarse la compra, se envía un comprobante por correo al cliente con el detalle de ítems y totales (best effort: si el envío falla, la compra queda igual de confirmada).
- **Gestión de Pedidos (Admin):** Listado y detalle de todos los pedidos, cambio de estado (pendiente → pagado → enviado → entregado / cancelado). El cliente puede ver y cancelar sus propios pedidos (repone stock automáticamente).
- **Reseñas de Clientes:** Los visitantes pueden dejar una reseña pública desde la Home; el panel admin permite moderarlas (listar/eliminar).
- **Sincronización de Inventario:** Actualización automática del stock tras cada venta o cancelación de pedido, con trazabilidad en Kárdex/Movimientos.
- **Pruebas Automatizadas:** Suite de tests con Jest en el backend (utilidades de precios y tokens) y tests unitarios de permisos en el frontend.

## Aspectos Pendientes de Optimización y Mejora:

Aunque los módulos principales ya se encuentran desarrollados y operativos, aún existen procesos de optimización y ajustes para mejorar el rendimiento, la experiencia de usuario y la estabilidad general de la plataforma.

### 1. Mejoras del Núcleo Administrativo:
- Ampliar la cobertura de pruebas automatizadas: hoy solo hay tests unitarios de utilidades puras (precios, tokens, costeo) y de permisos en el frontend; falta cobertura de integración de las rutas (auth, products, orders, movements, users, customer, reviews) y tests de componentes en el frontend (no hay `@testing-library/react` instalado todavía).

### 2. Mejoras del Módulo E-commerce:
- Optimización de la experiencia de navegación y búsqueda de productos.
- Integración de métodos de pago adicionales (el checkout actual es simulado).
- Optimización del rendimiento y tiempos de respuesta del catálogo público.
- Envío real de correos para la recuperación de contraseña (actualmente el token se devuelve en la respuesta de desarrollo, no hay proveedor de email configurado).

## Estado General del Proyecto

El proyecto se encuentra en una fase avanzada de desarrollo, con la mayoría de las funcionalidades principales implementadas y operativas. El trabajo actual está enfocado principalmente en optimizar procesos, corregir detalles menores, mejorar la experiencia de usuario y fortalecer la integración entre los distintos módulos para garantizar un sistema más eficiente, estable y preparado para su despliegue final.

> **Stack:** React.js + Node.js (Express) + PostgreSQL · Diseño "moderno y deportivo" en **verde esmeralda + negro**.

---

## 1. Arquitectura General

```
┌────────────────────────┐   HTTPS   ┌────────────────────────┐    SQL    ┌────────────┐
│   Frontend (React)     │  cookies  │  Backend (Node.js +    │   pg      │ PostgreSQL │
│  - React 19 + Router   │ ────────▶ │  Express)              │ ────────▶ │ 15         │
│  - Tailwind + Recharts │           │  - JWT (httpOnly)      │           │ schema.sql │
│  - AuthContext         │ ◀──────── │  - bcrypt + roles      │ ◀──────── │ seed.js    │
└────────────────────────┘           └────────────────────────┘           └────────────┘
```

**Estructura del backend (`backend/`):**

```
backend/
├── package.json
├── package-lock.json
├── .env (NO se versiona — copiar de .env.example)
├── .env.example
├── scripts/
│   ├── backup.js              ← respaldo manual (todas las tablas → JSON con timestamp)
│   └── restore.js             ← restaura un backup puntual (transaccional)
├── tests/
│   ├── pricing.test.js       ← cálculo de totales y número de orden
│   ├── tokens.test.js        ← firma/verificación de JWT
│   └── costing.test.js       ← costeo por promedio ponderado
└── src/
    ├── index.js                  ← punto de entrada Express
    ├── config/
    │   └── db.js                 ← pool de PostgreSQL
    ├── middleware/
    │   ├── auth.js               ← JWT + roles (authRequired, adminRequired, customerRequired)
    │   └── errorHandler.js       ← manejador centralizado de errores
    ├── utils/
    │   ├── tokens.js             ← sign/verify JWT, cookies httpOnly
    │   ├── asyncHandler.js       ← wrapper para handlers async
    │   ├── pricing.js            ← cálculo de subtotal/impuesto/total y número de orden
    │   └── costing.js            ← costeo por promedio ponderado en entradas de stock
    ├── db/
    │   ├── schema.sql            ← DDL (tablas, índices, constraints)
    │   ├── migrate.js            ← aplica el schema
    │   └── seed.js               ← carga inicial idempotente
    └── routes/
        ├── auth.js               ← login, logout, me, refresh (staff)
        ├── users.js               ← gestión de usuarios (admin)
        ├── categories.js
        ├── suppliers.js          ← CRUD de proveedores
        ├── products.js
        ├── movements.js          ← transacción atómica entrada/salida/ajuste + costeo ponderado
        ├── dashboard.js          ← KPIs
        ├── kardex.js              ← historial detallado de movimientos
        ├── orders.js              ← checkout, pedidos del cliente y gestión admin
        ├── customer.js            ← autenticación, perfil y recuperación de contraseña de clientes
        ├── reviews.js             ← moderación de reseñas (admin)
        └── public.js               ← catálogo, categorías, destacados y reseñas públicas (sin autenticación)
```

**Estructura del frontend (`frontend/src/`):**

```
src/
├── App.js                        ← rutas
├── App.css
├── index.css                     ← tema oscuro + verde esmeralda
├── index.js
├── lib/
│   ├── api.js                    ← axios con withCredentials
│   ├── utils.js
│   ├── permissions.js            ← lógica de permisos por usuario/rol
│   └── permissions.test.js       ← tests unitarios de permisos
├── assets/
│   └── motonaations.png          ← logo de la marca
├── context/
│   ├── AuthContext.jsx           ← sesión global de staff
│   ├── CustomerContext.jsx       ← sesión global de clientes
│   └── CartContext.jsx           ← carrito de compras
├── components/
│   ├── ui/                       ← componentes UI reutilizables
│   ├── ConfirmDialog.jsx         ← diálogo de confirmación reutilizable
│   ├── ErrorBoundary.jsx         ← red de seguridad ante errores de React sin capturar
│   ├── Avatar.jsx
│   ├── BrandLogo.jsx
│   ├── Layout.jsx                ← header/nav del panel admin + outlet
│   └── PublicLayout.jsx          ← header/footer de la tienda pública
└── pages/
    ├── public/                   ← vistas para clientes externos
    │   ├── Cart.jsx              ← carrito de compras
    │   ├── Checkout.jsx          ← proceso de pago
    │   ├── CustomerLogin.jsx     ← inicio de sesión de clientes
    │   ├── CustomerRegister.jsx  ← registro de clientes
    │   ├── ForgotPassword.jsx    ← solicitud de recuperación de contraseña
    │   ├── ResetPassword.jsx     ← restablecer contraseña con token
    │   ├── Account.jsx           ← perfil del cliente
    │   ├── Home.jsx              ← página de inicio pública (destacados + reseñas)
    │   ├── MyOrders.jsx          ← historial de pedidos del cliente
    │   ├── ProductDetail.jsx     ← detalle de producto
    │   └── Shop.jsx              ← catálogo de productos
    ├── Alerts.jsx                ← productos bajo stock mínimo
    ├── Categories.jsx
    ├── Suppliers.jsx             ← CRUD de proveedores
    ├── Dashboard.jsx             ← KPIs + movimientos + alertas
    ├── Kardex.jsx                ← historial de movimientos + export PDF
    ├── Login.jsx                 ← usuario/contraseña + código de verificación (2FA)
    ├── ForgotPasswordStaff.jsx   ← recuperar contraseña (staff)
    ├── ResetPasswordStaff.jsx    ← definir nueva contraseña (staff)
    ├── Movements.jsx             ← registro entrada/salida/ajuste por conteo físico
    ├── Orders.jsx                ← gestión de pedidos (admin)
    ├── Products.jsx              ← CRUD con filtros, paginación y modal
    ├── Reviews.jsx                ← moderación de reseñas (admin)
    └── Users.jsx                 ← admin only
```

---

## 2. Tecnologías y Versiones

| Capa     | Tecnología            | Versión  |
|----------|-----------------------|----------|
| Frontend | React                 | 19       |
|          | React Router DOM      | 7        |
|          | Tailwind CSS          | 3.4      |
|          | Recharts              | 3.6      |
|          | Axios                 | 1.8      |
|          | jsPDF + autotable      | 4.2 / 5.0 |
|          | Lucide-react (iconos) | 0.507    |
| Backend  | Node.js               | 20 LTS   |
|          | Express               | 4.21     |
|          | pg (PostgreSQL)       | 8.13     |
|          | jsonwebtoken          | 9.0      |
|          | bcrypt                | 5.1      |
|          | zod (validación)      | 3.23     |
|          | cookie-parser         | 1.4      |
|          | morgan (logging)      | 1.10     |
|          | express-rate-limit    | 8.5      |
|          | jest (tests)          | 30.4     |
| BD       | PostgreSQL            | 15       |
| Otros    | npm / yarn            |          |

---

## 3. Requisitos Previos

- **Node.js 18+** (recomendado 20 LTS) — <https://nodejs.org>
- **PostgreSQL 13+** (recomendado 15) — <https://www.postgresql.org/download/>
- **Git** — <https://git-scm.com>
- **Visual Studio Code** — <https://code.visualstudio.com>
- (Opcional) Extensión de VS Code: *ES7+ React snippets*, *Tailwind CSS IntelliSense*, *PostgreSQL (Chris Kolkman)*

---

## 4. Levantar el proyecto en VS Code (paso a paso)

### 4.1. Clonar el repositorio

Abre una terminal en VS Code (`Ctrl + ñ` o `View → Terminal`):

```bash
git clone <URL_DEL_REPOSITORIO> motonation
cd motonation
code .
```

VS Code abrirá la carpeta del proyecto.

### 4.2. Configurar PostgreSQL

**Opción A — pgAdmin (interfaz gráfica):**
1. Abre **pgAdmin** y conéctate con tu usuario `postgres`.
2. Crea una base de datos llamada `motonation-final` con propietario `postgres`.

**Opción B — Terminal:**
```bash
# Linux/Mac
sudo -u postgres psql -c "CREATE DATABASE \"motonation-final\";"

# Windows (desde PowerShell, con psql en PATH)
psql -U postgres -c "CREATE DATABASE \"motonation-final\";"
```

### 4.3. Configurar variables de entorno del backend

Desde la raíz del proyecto:

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con la configuración de tu entorno local:

```env
# CONFIGURACIÓN DEL SERVIDOR LOCAL
PORT=5001
JWT_SECRET=cambia_esto_por_un_valor_aleatorio_y_seguro

# CONEXIÓN A LA BASE DE DATOS LOCAL (pgAdmin)
DB_USER=postgres
DB_PASSWORD=tu_password_local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=motonation-final

# CONFIGURACIÓN DE SEGURIDAD (CORS)
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000

# ENLACE DEL FRONTEND (Para tu API de desarrollo)
REACT_APP_BACKEND_URL=http://localhost:5001
```

> Ajusta `DB_PASSWORD` y demás valores según tu instalación local de PostgreSQL.

> Para generar un JWT_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4.4. Instalar dependencias del backend

```bash
# Dentro de la carpeta backend/
npm install
```

### 4.5. Aplicar el esquema y datos iniciales

El servidor lo hace automáticamente al arrancar (idempotente), pero también puedes ejecutarlos manualmente:

```bash
npm run migrate   # crea tablas e índices
npm run seed      # admin + empleado + categorías + productos demo
```

### 4.6. Arrancar el backend

```bash
npm run dev       # modo desarrollo con hot-reload (usa nodemon)
# o bien:
npm start         # producción
```

Verás:

```
[seed] OK
[motonation] API lista en puerto 5001
```

Probar que responde:

```bash
curl http://localhost:5001/api
# {"service":"Motonation API","ok":true}
```

### 4.7. Configurar variables de entorno del frontend

Abre otra terminal (`Terminal → New Terminal`) y:

```bash
cd ../frontend
cp .env.example .env
```

`frontend/.env` queda así:

```env
REACT_APP_BACKEND_URL=http://localhost:5001
```

### 4.8. Instalar dependencias y arrancar el frontend

```bash
yarn install      # o `npm install`
yarn start        # o `npm start`
```

Abre <http://localhost:3000> en el navegador. Verás la tienda pública; el panel administrativo está en `/admin/login`.

### 4.9. Iniciar sesión

| Rol      | Email                     | Contraseña     |
|----------|---------------------------|----------------|
| Admin    | admin@motonation.com      | `admin123`     |
| Empleado | empleado@motonation.com   | `empleado123`  |
| Cliente (tienda) | cliente@demo.com  | `Cliente123!`  |

> Estas son las cuentas de demostración creadas por `backend/src/db/seed.js`. Cámbialas (o crea las tuyas desde **Usuarios**) antes de usar el sistema en un entorno real.

---

## 5. Puertos utilizados

| Servicio               | Puerto |
|------------------------|--------|
| Frontend (React)       | 3000   |
| Backend (Node/Express) | 5001   |
| PostgreSQL             | 5432   |

---

## 6. Base de Datos

**Nombre de la base de datos:** `motonation-final`

**Tablas principales:**

| Tabla             | Campos clave |
|-------------------|--------------|
| `users`           | id (uuid), email (unique), name, password_hash (bcrypt), role (admin/empleado), avatar_url, permissions (jsonb), created_at |
| `categories`      | id, name (unique), description |
| `products`        | id, sku (unique), name, type (motocicleta/accesorio), brand, model, category_id (FK), cost, price, stock, min_stock, image_url, is_published |
| `movements`       | id, product_id (FK CASCADE), product_name, product_sku, type (entrada/salida/venta/ajuste), quantity, unit_cost, unit_price, reason, user_id, user_name, order_id, direction (positivo/negativo, solo para ajuste), supplier_id (FK, solo para entrada), supplier_name, created_at |
| `suppliers`       | id (uuid), name (unique), contact, phone, email, created_at — proveedores, ligados opcionalmente a las entradas de stock |
| `orders`          | id, order_number (unique), customer_id (FK), subtotal, tax, total, status, payment_method, created_at |
| `order_items`     | id, order_id (FK), product_id (FK), quantity, unit_cost, unit_price, subtotal |
| `customers`        | id (uuid), email (unique), name, phone, address, city, password_hash (bcrypt), created_at |
| `password_resets` | id, customer_id (FK CASCADE), token_hash (hash SHA-256, unique), expires_at, used_at — tokens de recuperación de contraseña |
| `login_otps`      | id, user_id (FK CASCADE), code_hash (hash SHA-256), expires_at, used_at, attempts — códigos de verificación (2FA) del login de staff |
| `staff_password_resets` | id, user_id (FK CASCADE), token_hash (hash SHA-256, unique), expires_at, used_at — tokens de recuperación de contraseña del staff |
| `reviews`          | id, name, city, rating (1-5), text, is_published, created_at — reseñas públicas de la tienda (se conservan solo las 3 más recientes) |

Ver `backend/src/db/schema.sql` para el DDL completo (incluye `CHECK` constraints, FKs, índices).

**Seed inicial** (`backend/src/db/seed.js`): crea admin, empleado, categorías (Deportivas, Naked, Touring, Cascos, Repuestos, Accesorios) y productos de muestra. Es idempotente.

### 6.1. Respaldo y recuperación de datos (backups)

**En producción (Supabase):** la base de datos de producción vive en Supabase (ver `DATABASE_URL` en `backend/.env`). Supabase toma backups automáticos diarios de la base completa; en el plan gratuito la retención es de 7 días y no incluye restauración point-in-time (eso es solo de los planes pagos). Se pueden descargar/gestionar desde el panel de Supabase → **Database → Backups**.

**Backup manual (local o antes de una entrega/demo):** además del backup automático de Supabase, el proyecto incluye dos scripts propios en `backend/scripts/` que no dependen de tener `pg_dump` instalado:

```bash
cd backend
npm run backup    # exporta todas las tablas a backend/backups/backup_<fecha>.json
npm run restore -- backups/backup_2026-07-04T23-23-06-148Z.json   # restaura un backup puntual
```

- `npm run backup` recorre todas las tablas del esquema `public` y guarda su contenido completo (todas las filas) en un único archivo JSON con timestamp, dentro de `backend/backups/` (carpeta ignorada por git — nunca se sube al repositorio porque contiene datos reales de clientes).
- `npm run restore` trunca las tablas y reinserta los datos del backup indicado dentro de una única transacción: si algo falla, se revierte todo y la base queda intacta. También resincroniza las secuencias (`SERIAL`) para que no choquen con nuevos registros después de restaurar.
- Recomendación práctica para la tesis: correr `npm run backup` antes de cada demo o entrega importante, y guardar esa copia fuera del repo (por ejemplo en Drive) como respaldo adicional al automático de Supabase.

---

## 7. Endpoints (todos bajo `/api`)

### Autenticación (Staff)

| Método | Ruta                          | Descripción                                              | Rol      |
|--------|--------------------------------|-----------------------------------------------------------|----------|
| POST   | `/api/auth/login`             | Paso 1: valida usuario/contraseña y envía un código de verificación por correo | público  |
| POST   | `/api/auth/login/verify-otp`  | Paso 2: valida el código y recién ahí abre la sesión      | público  |
| POST   | `/api/auth/login/resend-otp`  | Reenvía un nuevo código de verificación                   | público  |
| POST   | `/api/auth/forgot-password`   | Solicita un enlace de recuperación de contraseña (staff)  | público  |
| POST   | `/api/auth/reset-password`    | Restablece la contraseña con el token del correo          | público  |
| POST   | `/api/auth/logout`             | Cerrar sesión                                              | autent.  |
| GET    | `/api/auth/me`                 | Datos del usuario actual                                   | autent.  |
| POST   | `/api/auth/refresh`            | Renovar access token                                       | autent.  |

### Productos y Categorías

| Método | Ruta                        | Descripción                        | Rol     |
|--------|-----------------------------|-------------------------------------|---------|
| GET    | `/api/products`             | Listar productos (con filtros; `?page`/`?page_size` activa paginación) | autent. |
| POST   | `/api/products`             | Crear producto                     | admin   |
| PUT    | `/api/products/:id`         | Actualizar producto                | admin   |
| DELETE | `/api/products/:id`         | Eliminar producto                  | admin   |
| GET    | `/api/categories`           | Listar categorías                  | autent. |
| POST   | `/api/categories`           | Crear categoría                    | admin   |
| DELETE | `/api/categories/:id`       | Eliminar categoría                 | admin   |
| GET    | `/api/suppliers`            | Listar proveedores                 | autent. |
| POST   | `/api/suppliers`            | Crear proveedor                    | admin   |
| PUT    | `/api/suppliers/:id`        | Actualizar proveedor                | admin   |
| DELETE | `/api/suppliers/:id`        | Eliminar proveedor                  | admin   |

### Movimientos y Kárdex

| Método | Ruta                        | Descripción                          | Rol     |
|--------|-----------------------------|----------------------------------------|---------|
| GET    | `/api/movements`            | Listar movimientos                   | autent. |
| POST   | `/api/movements`            | Registrar movimiento: entrada, salida o ajuste por conteo físico (transacción) | autent. |
| GET    | `/api/kardex`               | Historial kárdex por producto        | autent. |

### Dashboard

| Método | Ruta                                       | Descripción                    | Rol     |
|--------|---------------------------------------------|----------------------------------|---------|
| GET    | `/api/dashboard/stats`                     | KPIs globales                  | autent. |
| GET    | `/api/dashboard/low-stock`                 | Productos bajo stock mínimo    | autent. |

### Usuarios internos (Admin)

| Método | Ruta                  | Descripción                                          | Rol   |
|--------|-----------------------|---------------------------------------------------------|-------|
| GET    | `/api/users`          | Listar usuarios (staff + clientes)                    | admin |
| POST   | `/api/users`          | Crear usuario (admin/empleado)                        | admin |
| PUT    | `/api/users/:id`      | Editar usuario (datos, rol, permisos, contraseña)     | admin |
| PATCH  | `/api/users/:id`      | Actualizar solo la foto de perfil                     | admin |
| DELETE | `/api/users/:id`      | Eliminar usuario (bloqueado para auto-eliminarse o dejar el sistema sin admins) | admin |

### Reseñas (Admin)

| Método | Ruta                  | Descripción                    | Rol   |
|--------|-----------------------|-----------------------------------|-------|
| GET    | `/api/reviews`        | Listar todas las reseñas         | autent. |
| DELETE | `/api/reviews/:id`    | Eliminar una reseña               | autent. |

### E-commerce (Clientes)

| Método | Ruta                            | Descripción                           | Rol      |
|--------|----------------------------------|------------------------------------------|----------|
| GET    | `/api/public/products`         | Catálogo público de productos         | público  |
| GET    | `/api/public/products/:sku`    | Detalle de producto público (por SKU) | público  |
| GET    | `/api/public/categories`       | Categorías con contador de productos  | público  |
| GET    | `/api/public/featured`         | Productos destacados para la Home     | público  |
| GET    | `/api/public/reviews`          | Reseñas publicadas                    | público  |
| POST   | `/api/public/reviews`          | Publicar una reseña                   | público  |
| POST   | `/api/customer/register`       | Registro de cliente                   | público  |
| POST   | `/api/customer/login`          | Login de cliente                      | público  |
| POST   | `/api/customer/forgot-password`| Solicitar recuperación de contraseña  | público  |
| POST   | `/api/customer/reset-password` | Restablecer contraseña con token      | público  |
| POST   | `/api/customer/logout`         | Cerrar sesión de cliente              | cliente  |
| GET    | `/api/customer/me`             | Datos del cliente actual              | cliente  |
| PUT    | `/api/customer/me`              | Actualizar perfil / contraseña del cliente | cliente  |
| DELETE | `/api/customer/:id`             | Eliminar cliente                      | admin    |
| POST   | `/api/orders/checkout`         | Crear pedido (checkout simulado)      | cliente  |
| GET    | `/api/orders/mine`              | Listar pedidos del cliente actual     | cliente  |
| GET    | `/api/orders/mine/:id`          | Detalle de un pedido propio           | cliente  |
| PUT    | `/api/orders/mine/:id/cancel`   | Cancelar un pedido propio (repone stock) | cliente  |

### Pedidos (Admin)

| Método | Ruta                          | Descripción                           | Rol      |
|--------|-------------------------------|------------------------------------------|----------|
| GET    | `/api/orders`                 | Listar todos los pedidos              | autent.  |
| GET    | `/api/orders/:id`             | Detalle de cualquier pedido           | autent.  |
| PUT    | `/api/orders/:id/status`      | Cambiar estado del pedido             | autent.  |

**Filtros disponibles en `/api/products`:**
- `?q=texto` — busca en nombre, SKU, marca, modelo (ILIKE)
- `?type=motocicleta|accesorio`
- `?category_id=<uuid>`
- `?low_stock=true`

---

## 8. Pruebas

### 8.1. Pruebas automatizadas

```bash
# Backend (Jest) — utilidades de precios y tokens JWT
cd backend
npm test

# Frontend — tests unitarios de permisos
cd frontend
yarn test    # o `npm test`
```

### 8.2. Smoke test con `curl`

```bash
API=http://localhost:5001

# Login (guarda cookies)
curl -c cookies.txt -X POST $API/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@motonation.com","password":"admin123"}'

# Usar la cookie en peticiones posteriores
curl -b cookies.txt $API/api/auth/me
curl -b cookies.txt $API/api/dashboard/stats
curl -b cookies.txt $API/api/products | head
```

### 8.3. Pruebas funcionales recomendadas (E2E manuales)

1. **Login** con credenciales válidas → redirección a `/admin/dashboard`.
2. **Crear producto** (admin) → aparece en la tabla.
3. **Registrar salida** con cantidad mayor al stock actual → debe rechazarse con `400 Stock insuficiente para salida`.
4. **Registrar entrada/salida** → el stock se actualiza y aparece en `Movimientos` y `Kárdex`.
5. **Bajar stock por debajo de `min_stock`** → el producto aparece en `Alertas` (tarjeta ámbar).
6. **Cerrar sesión** → redirección a `/admin/login`.
7. **Login como empleado** → el menú `Usuarios` NO aparece (control de rol) y solo se ven las secciones habilitadas por sus permisos.
8. **Crear categoría con productos** → no se puede eliminar (FK protegida).
9. **Registrar un cliente** en la tienda pública → puede iniciar sesión y ver sus pedidos en `Mis Pedidos`.
10. **Agregar productos al carrito** y completar el Checkout → el stock se descuenta automáticamente y el pedido aparece en `Pedidos` (admin).
11. **Cancelar un pedido propio** desde `Mis Pedidos` → el stock se repone y queda registrado en Kárdex.
12. **Editar un usuario** (admin) → cambiar nombre, correo, rol, permisos o contraseña se refleja de inmediato en la tabla.
13. **Intentar eliminar tu propio usuario o al único admin** → debe rechazarse con `400`.
14. **Dejar una reseña** desde la Home pública → aparece de inmediato en la sección de testimonios; moderarla/eliminarla desde `Reseñas` (admin).
15. **Solicitar recuperación de contraseña** → usar el token devuelto en modo desarrollo para restablecerla en `/cuenta/restablecer`.
16. **Fallar el login 11 veces seguidas** (mismo IP) → la 11.ª intenta debe devolver `429 Too Many Requests`.
17. **Registrar un ajuste de inventario** (Movimientos → Ajuste) sin indicar motivo → debe rechazarse; con motivo y dirección (+/-) → el stock se corrige y queda registrado en Kárdex con el signo correcto.
18. **Registrar una entrada con costo distinto al actual** → el costo del producto se recalcula como promedio ponderado (no se sobrescribe).
19. **Crear un proveedor** en `Proveedores` y usarlo en una entrada de stock desde Movimientos → el movimiento y el Kárdex muestran el proveedor asociado.
20. **Iniciar sesión en el panel** con usuario/contraseña correctos → no entra directo, pide un código de 6 dígitos enviado al correo; con el código correcto entra, con uno incorrecto lo rechaza (`Código incorrecto`).
21. **Solicitar recuperación de contraseña del staff** desde `/admin/olvide` → usar el token devuelto en modo desarrollo para restablecerla en `/admin/restablecer`; con la contraseña nueva el login pide el código de verificación como cualquier login.
22. **Completar una compra** desde el checkout → al cliente le llega un correo de confirmación con el número de pedido, los ítems y el total; si el correo no está configurado, la compra se confirma igual sin bloquear el checkout.

---

## 9. Datos / Archivos Adicionales

- Las imágenes de productos se referencian por URL (Unsplash) — no se almacenan binarios.
- El logo de la marca se encuentra en `frontend/public/motonaations.png` y `frontend/src/assets/motonaations.png`.
- El seed completo está en `backend/src/db/seed.js`.
- El Kárdex permite exportar el historial de movimientos a PDF (jsPDF).
- No se requieren archivos adicionales externos.

---

## 10. Seguridad Implementada

- Contraseñas con **bcrypt** (10 rondas), nunca en texto plano.
- Sesión de staff y de clientes con **JWT** de acceso (8h) + refresco (7d) en cookies `httpOnly`.
- Protección **anti fuerza bruta**: `express-rate-limit` en `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/customer/login`, `/api/customer/register`, `/api/customer/forgot-password` y `/api/customer/reset-password` (10 intentos / 15 min por IP).
- Recuperación de contraseña (tanto de clientes como de staff) con token de un solo uso, hasheado (SHA-256) y con expiración de 30 minutos; la respuesta al solicitar el reset no revela si el correo existe.
- **Verificación en dos pasos (2FA) por correo en el login del panel interno**: tras validar usuario/contraseña no se abre la sesión de inmediato — se envía un código de 6 dígitos por correo (`login_otps`, hasheado con SHA-256, expira en 10 minutos, máximo 5 intentos por código) y solo se emiten las cookies de sesión al validarlo correctamente. No aplica al login de clientes, solo al staff.
- Cabeceras de seguridad HTTP con **helmet** (XSS, sniffing, clickjacking). El CSP de helmet se deja deshabilitado a propósito: esta API solo devuelve JSON (no sirve HTML), así que no tiene superficie sobre la que aplicar una Content-Security-Policy.
- Protección **CSRF**: toda petición que cambia estado (POST/PUT/PATCH/DELETE) y trae cabecera `Origin` o `Referer` debe coincidir con un origen permitido (la misma lista blanca que usa CORS); si no matchea, se rechaza con `403`. Las peticiones sin esas cabeceras (clientes no-navegador) no se bloquean, porque un ataque CSRF real siempre parte de un navegador y esas cabeceras las pone el navegador, no el atacante.
- Reglas de negocio a nivel de API: nadie puede eliminar su propia cuenta ni dejar el sistema sin administradores (ni por edición de rol ni por borrado).
- Validación de payloads con **zod** en todas las rutas que escriben en la base de datos.

## 11. Para Despliegue en Producción

- Configurar `CORS_ORIGIN` con el dominio del frontend (no `*`).
- Las cookies usan `SameSite=None; Secure=true`, requieren **HTTPS**.
- Cambiar `JWT_SECRET`, credenciales de admin y contraseña de base de datos antes de exponer.
- Usar `npm start` (no `dev`).
- Configurar un proveedor de email real para la recuperación de contraseña (hoy el token se devuelve en la respuesta, solo apto para desarrollo).
- Considerar PM2 o systemd para mantener el proceso vivo.

---

## 12. Comandos Útiles (Cheat Sheet)

```bash
# Backend
cd backend
npm install              # instalar deps
npm run dev              # arrancar con hot-reload (nodemon)
npm start                # arrancar en modo producción
npm run migrate          # aplicar schema manualmente
npm run seed              # cargar datos demo
npm run backup            # respaldo manual de la BD (JSON con timestamp)
npm run restore -- <ruta> # restaurar un backup puntual
npm test                  # correr tests (Jest)

# Frontend
cd frontend
yarn install
yarn start
yarn test                 # correr tests

# PostgreSQL — entrar al CLI
psql -U postgres -d motonation-final
\dt                      # listar tablas
SELECT * FROM products LIMIT 5;
\q                       # salir
```

---

## Autor
Narvaez Jose - Monse Pinto
