require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Enrutadores
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const movementRoutes = require('./routes/movements');
const dashboardRoutes = require('./routes/dashboard');
const kardexRoutes = require('./routes/kardex');
const publicRoutes = require('./routes/public');
const customerRoutes = require('./routes/customer');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');

const { errorHandler } = require('./middleware/errorHandler');
const { pool } = require('./config/db');
const { run: seedRun } = require('./db/seed');

const app = express();

// Cabeceras de seguridad HTTP estándar (XSS, sniffing, clickjacking).
// CSP deshabilitada: esta API solo devuelve JSON, no HTML.
app.use(helmet({ contentSecurityPolicy: false }));

// --- CONFIGURACIÓN DE CORS ---
// ✅ CORREGIDO: Se permite una lista de puertos (3000, 5173, 5174) para que 
// el navegador guarde las cookies de sesión sin importar el puerto del frontend.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.get('/api', (req, res) => res.json({ service: 'Motonation API', ok: true }));

// Helper seguro para evitar el "TypeError: Router.use() requires a middleware function"
const safeRegister = (path, routeModule, moduleName) => {
  if (routeModule && (typeof routeModule === 'function' || typeof routeModule.use === 'function')) {
    app.use(path, routeModule);
  } else {
    console.error(`\x1b[31m❌ ERROR CRÍTICO: El archivo './routes/${moduleName.replace('Routes', '')}' no está exportando el router correctamente. Asegúrate de que termine con 'module.exports = router;'\x1b[0m`);
  }
};

// Registro seguro de rutas (Previene caídas del servidor por imports corruptos)
safeRegister('/api/public', publicRoutes, 'publicRoutes');
safeRegister('/api/customer', customerRoutes, 'customerRoutes');
safeRegister('/api/auth', authRoutes, 'authRoutes');
safeRegister('/api/users', userRoutes, 'userRoutes');
safeRegister('/api/categories', categoryRoutes, 'categoryRoutes');
safeRegister('/api/products', productRoutes, 'productRoutes');
safeRegister('/api/movements', movementRoutes, 'movementsRoutes');
safeRegister('/api/dashboard', dashboardRoutes, 'dashboardRoutes');
safeRegister('/api/kardex', kardexRoutes, 'kardexRoutes');
safeRegister('/api/orders', orderRoutes, 'orderRoutes');
safeRegister('/api/reviews', reviewRoutes, 'reviewRoutes');

app.use('/api/*', (req, res) => res.status(404).json({ detail: 'Ruta no encontrada' }));
app.use(errorHandler);

async function bootstrap() {
  try {
    // El schema.sql es 100% idempotente (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS),
    // así que se aplica en cada arranque para que las bases de datos ya existentes también
    // reciban columnas/tablas nuevas sin necesitar borrar todo o correr migrate.js a mano.
    const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf-8');
    await pool.query(schema);
    await seedRun();
  } catch (error) {
    console.error('Error en base de datos:', error);
  }
}

const PORT = process.env.PORT || 5001;
const bootstrapPromise = bootstrap();

if (!process.env.VERCEL) {
  bootstrapPromise.then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[motonation] API lista y escuchando en puerto ${PORT}`);
    });
  });
}

module.exports = app;