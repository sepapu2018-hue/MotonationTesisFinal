# MotoNation — Sistema Web de Control de Inventarios

Aplicación full-stack que automatiza el registro de stock en tiempo real y la gestión operativa de motocicletas. Incluye alertas de niveles críticos de inventario, reportes analíticos y un control de acceso seguro basado en roles de usuario.

Incluya sus datos básicos para identificación y control.

## Datos del Estudiante
- **Autor:** Narvaez Leon Jose Sebastian, Daniela Monserratte Pinto Bazante.
- **Carrera:** Tecnologia De Desarrollo Software.
- **Docente:** Jonathan Quespaz
- **Período:** Ej. 2026-1

## Estado Actual del Proyecto y Próximos Alcances

Hasta la fecha, el desarrollo de la plataforma ha avanzado significativamente, consolidando tanto la infraestructura principal como gran parte de los módulos administrativos y comerciales. Actualmente, el sistema cuenta con una base sólida y funcional que permite gestionar las operaciones internas del negocio de manera eficiente, manteniendo una arquitectura escalable para futuras mejoras.

## Lo que tenemos desarrollado hasta ahora:
Infraestructura Base y Autenticación: Servidor completamente operativo, conexión estable con la base de datos PostgreSQL y sistema de autenticación basado en roles de Administrador y Empleado.
##Módulo de Administración de Usuarios: Funcionalidad para registrar, listar, editar y gestionar usuarios del sistema, incluyendo perfiles y control de permisos.
## Maquetación y Componentes UI: 
Desarrollo de ventanas modales, paneles deslizables, menús interactivos y componentes reutilizables bajo la identidad visual deportiva de la marca.
## Módulo de Inventario: 
Gestión de productos, categorías, stock y movimientos básicos de almacén.
## Módulo Financiero: 
Implementación de indicadores y estadísticas para el control de costos, ganancias y valor del inventario.
## Sistema de Kárdex:
Registro histórico de entradas y salidas de productos, permitiendo el seguimiento detallado de cada movimiento.
## Control de Flujo Monetario: 
Seguimiento de ingresos y egresos relacionados con las operaciones del negocio.
## Catálogo Público de Productos: 
Visualización de productos para clientes externos con filtros y consulta de información detallada.
## Carrito de Compras y Proceso de Venta:
Flujo funcional para selección de productos y generación de pedidos.
## Sincronización de Inventario: 
Actualización automática del stock tras cada venta realizada dentro del sistema.

## Aspectos Pendientes de Optimización y Mejora:

Aunque los módulos principales ya se encuentran desarrollados y operativos, aún existen procesos de optimización y ajustes para mejorar el rendimiento, la experiencia de usuario y la estabilidad general de la plataforma.

## 1 Mejoras del Núcleo Administrativo:
Optimización de reportes financieros y estadísticas en tiempo real.
Mejoras en la visualización y consulta del historial Kárdex.
Refinamiento de los procesos de control de inventario y validación de movimientos.
Implementación de métricas más detalladas para análisis de ventas y rentabilidad.
## 2 Mejoras del Módulo E-commerce:
Optimización de la experiencia de navegación y búsqueda de productos.
Mejoras en el proceso de compra y validación de pedidos.
Integración de métodos de pago adicionales.
Optimización del rendimiento y tiempos de respuesta del catálogo público.
Fortalecimiento de la sincronización entre inventario y ventas para garantizar una mayor precisión operativa.
Estado General del Proyecto

El proyecto se encuentra en una fase avanzada de desarrollo, con la mayoría de las funcionalidades principales implementadas y operativas. El trabajo actual está enfocado principalmente en optimizar procesos, corregir detalles menores, mejorar la experiencia de usuario y fortalecer la integración entre los distintos módulos para garantizar un sistema más eficiente, estable y preparado para su despliegue final

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

**Estructura del backend (`backend/`)** 

```
backend/
├── package.json
├── .env (NO se versiona — copiar de .env.example)
├── .env.example
└── src/
    ├── index.js                  ← punto de entrada Express
    ├── config/
    │   └── db.js                 ← pool de PostgreSQL
    ├── middleware/
    │   ├── auth.js               ← JWT + roles (authRequired, adminRequired)
    │   └── errorHandler.js       ← manejador centralizado de errores
    ├── utils/
    │   ├── tokens.js             ← sign/verify JWT, cookies httpOnly
    │   └── asyncHandler.js       ← wrapper para handlers async
    ├── db/
    │   ├── schema.sql            ← DDL (tablas, índices, constraints)
    │   ├── migrate.js            ← aplica el schema
    │   └── seed.js               ← carga inicial idempotente
    └── routes/
        ├── auth.js               ← login, logout, me, refresh
        ├── users.js              ← gestión de usuarios (admin)
        ├── categories.js
        ├── products.js
        ├── movements.js          ← transacción atómica entrada/salida
        ├── dashboard.js          ← KPIs
        └── reports.js
```

**Estructura del frontend (`frontend/src/`):**

```
src/
├── App.js                        ← rutas
├── index.css                     ← tema oscuro + verde esmeralda
├── lib/api.js                    ← axios con withCredentials
├── context/AuthContext.jsx       ← sesión global
├── components/
│   ├── Layout.jsx                ← sidebar + outlet
│   ├── ProtectedRoute.jsx
│   └── ui-kit.jsx                ← Card, Badge, Buttons, Field
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx             ← KPIs + movimientos + alertas
    ├── Products.jsx              ← CRUD con filtros + modal
    ├── Categories.jsx
    ├── Movements.jsx             ← registro entrada/salida
    ├── Alerts.jsx                ← productos bajo stock mínimo
    ├── Reports.jsx               ← gráficos Recharts
    └── Users.jsx                 ← admin only
```

---

## 2. Tecnologías y Versiones

| Capa     | Tecnología           | Versión       |
|----------|----------------------|---------------|
| Frontend | React                | 19            |
|          | React Router DOM     | 7             |
|          | Tailwind CSS         | 3.4           |
|          | Recharts             | 3.6           |
|          | Axios                | 1.8           |
|          | Lucide-react (iconos)| 0.507         |
| Backend  | Node.js              | 20 LTS        |
|          | Express              | 4.21          |
|          | pg (PostgreSQL)      | 8.13          |
|          | jsonwebtoken         | 9.0           |
|          | bcrypt               | 5.1           |
|          | zod (validación)     | 3.23          |
|          | cookie-parser        | 1.4           |
|          | morgan (logging)     | 1.10          |
| BD       | PostgreSQL           | 15            |
| Otros    | npm / yarn           |               |

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
2. Crea un usuario nuevo: `motonation` con contraseña `motonation_pass`.
3. Crea una base de datos `motonation_db` con propietario `motonation`.

**Opción B — Terminal:**
```bash
# Linux/Mac
sudo -u postgres psql -c "CREATE USER motonation WITH PASSWORD 'motonation_pass';"
sudo -u postgres psql -c "CREATE DATABASE motonation_db OWNER motonation;"

# Windows (desde PowerShell, con psql en PATH)
psql -U postgres -c "CREATE USER motonation WITH PASSWORD 'motonation_pass';"
psql -U postgres -c "CREATE DATABASE motonation_db OWNER motonation;"
```

### 4.3. Configurar variables de entorno del backend

Desde la raíz del proyecto:

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y ajusta si tu PostgreSQL usa otro usuario/puerto:

```env
PORT=5001
DATABASE_URL=postgresql://motonation:motonation_pass@localhost:5432/motonation_db
JWT_SECRET=cambia_este_token_a_uno_aleatorio_64_chars
ADMIN_EMAIL=admin@motonation.com
ADMIN_PASSWORD=Admin123!
EMPLEADO_EMAIL=empleado@motonation.com
EMPLEADO_PASSWORD=Empleado123!
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000
```

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

El servidor lo hace automáticamente al arrancar (idempotente), pero también puedes ejecutarlos manualmente si dedea ;

```bash
npm run migrate   # crea tablas e índices
npm run seed      # admin + empleado + 6 categorías + 11 productos demo
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
```

Crea `frontend/.env` con:

```env
REACT_APP_BACKEND_URL=http://localhost:5001
```

### 4.8. Instalar dependencias y arrancar el frontend

```bash
yarn install      # o `npm install`
yarn start        # o `npm start`
```

Abre <http://localhost:3000> en el navegador. Verás la pantalla de login.

### 4.9. Iniciar sesión

| Rol      | Email                     | Contraseña     |
|----------|---------------------------|----------------|
| Admin    | admin@motonation.com      | `Admin123!`    |
| Empleado | empleado@motonation.com   | `Empleado123!` |

---

## 5. Puertos utilizados

| Servicio                 | Puerto |
|--------------------------|--------|
| Frontend (React)         | 3000   |
| Backend (Node/Express)   | 5001   |
| PostgreSQL               | 5432   |

---

## 6. Base de Datos

**Tablas principales:**

| Tabla         | Campos clave |
|---------------|--------------|
| `users`       | id (uuid), email (unique), name, password_hash (bcrypt), role (admin/empleado), created_at |
| `categories`  | id, name (unique), description |
| `products`    | id, sku (unique), name, type (motocicleta/accesorio), brand, model, category_id (FK), price, stock, min_stock, image_url |
| `movements`   | id, product_id (FK CASCADE), product_name, product_sku, type (entrada/salida), quantity, reason, user_id, user_name, created_at |

Ver `backend/src/db/schema.sql` para el DDL completo (incluye `CHECK` constraints, FKs, índices).

**Seed inicial** (`backend/src/db/seed.js`): crea admin, empleado, 6 categorías (Deportivas, Naked, Touring, Cascos, Repuestos, Accesorios) y 11 productos de muestra. Es idempotente.

---

## 7. Endpoints (todos bajo `/api`)

| Método | Ruta                          | Descripción                          | Rol      |
|--------|-------------------------------|--------------------------------------|----------|
| POST   | `/api/auth/login`             | Iniciar sesión                       | público  |
| POST   | `/api/auth/logout`            | Cerrar sesión                        | autent.  |
| GET    | `/api/auth/me`                | Datos del usuario actual             | autent.  |
| POST   | `/api/auth/refresh`           | Renovar access token                 | autent.  |
| GET    | `/api/products`               | Listar productos (con filtros)       | autent.  |
| POST   | `/api/products`               | Crear producto                       | admin    |
| PUT    | `/api/products/:id`           | Actualizar producto                  | admin    |
| DELETE | `/api/products/:id`           | Eliminar producto                    | admin    |
| GET    | `/api/categories`             | Listar categorías                    | autent.  |
| POST   | `/api/categories`             | Crear categoría                      | admin    |
| DELETE | `/api/categories/:id`         | Eliminar categoría                   | admin    |
| GET    | `/api/movements`              | Listar movimientos                   | autent.  |
| POST   | `/api/movements`              | Registrar movimiento (transacción)   | autent.  |
| GET    | `/api/dashboard/stats`        | KPIs globales                        | autent.  |
| GET    | `/api/dashboard/low-stock`    | Productos bajo stock mínimo          | autent.  |
| GET    | `/api/reports/stock-by-category`         | Stock y valor por categoría | autent.  |
| GET    | `/api/reports/movements-summary?days=7`  | Movimientos por día         | autent.  |
| GET    | `/api/users`                  | Listar usuarios                      | admin    |
| POST   | `/api/users`                  | Crear usuario                        | admin    |
| DELETE | `/api/users/:id`              | Eliminar usuario                     | admin    |

**Filtros disponibles en `/api/products`:**
- `?q=texto` — busca en nombre, SKU, marca, modelo (ILIKE)
- `?type=motocicleta|accesorio`
- `?category_id=<uuid>`
- `?low_stock=true`

---

## 8. Pruebas Funcionales

### 8.1. Smoke test con `curl`

```bash
API=http://localhost:5001

# Login (guarda cookies)
curl -c cookies.txt -X POST $API/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@motonation.com","password":"Admin123!"}'

# Usar la cookie en peticiones posteriores
curl -b cookies.txt $API/api/auth/me
curl -b cookies.txt $API/api/dashboard/stats
curl -b cookies.txt $API/api/products | head
```

### 8.2. Pruebas funcionales recomendadas (E2E manuales)

1. **Login** con credenciales válidas → redirección a `/dashboard`.
2. **Crear producto** (admin) → aparece en la tabla.
3. **Registrar salida** con cantidad mayor al stock actual → debe rechazarse con `400 Stock insuficiente para salida`.
4. **Registrar entrada/salida** → el stock se actualiza y aparece en `Movimientos`.
5. **Bajar stock por debajo de `min_stock`** → el producto aparece en `Alertas` (tarjeta ámbar).
6. **Cerrar sesión** → redirección a `/login`.
7. **Login como empleado** → el menú `Usuarios` NO aparece (control de rol).
8. **Crear categoría con productos** → no se puede eliminar (FK protegida).

---

## 9. Datos / Archivos Adicionales

- Las imágenes de productos se referencian por URL (Unsplash) — no se almacenan binarios.
- El seed completo está en `backend/src/db/seed.js`.
- No se requieren archivos adicionales externos.

---

## 10. Para Despliegue en Producción

- Configurar `CORS_ORIGIN` con el dominio del frontend (no `*`).
- Las cookies usan `SameSite=None; Secure=true`, requieren **HTTPS**.
- Cambiar `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` antes de exponer.
- Usar `npm start` (no `dev`).
- Considerar PM2 o systemd para mantener el proceso vivo.

---

## 11. Comandos Útiles (Cheat Sheet)

```bash
# Backend
cd backend
npm install              # instalar deps
npm run dev              # arrancar con hot-reload (nodemon)
npm start                # arrancar en modo producción
npm run migrate          # aplicar schema manualmente
npm run seed             # cargar datos demo

# Frontend
cd frontend
yarn install
yarn start

# PostgreSQL — entrar al CLI
psql -U motonation -d motonation_db
\dt                      # listar tablas
SELECT * FROM products LIMIT 5;
\q                       # salir
```

---

## Autor
Narvaez Jose - Monse Pinto 

