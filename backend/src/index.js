require('dotenv').config();

const express = require('express');
const cors = require('cors');
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
const reportsRoutes = require('./routes/reports');
const kardexRoutes = require('./routes/kardex');
const financeRoutes = require('./routes/finance');
const publicRoutes = require('./routes/public');
const customerRoutes = require('./routes/customer');
const orderRoutes = require('./routes/orders');

const { errorHandler } = require('./middleware/errorHandler');
const { pool } = require('./config/db');
const { run: seedRun } = require('./db/seed');

const app = express();

// --- CONFIGURACIÓN DE CORS ---
// ✅ CORREGIDO: Se permite una lista de puertos (3000, 5173, 5174) para que 
// el navegador guarde las cookies de sesión sin importar el puerto del frontend.
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

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
safeRegister('/api/reports', reportsRoutes, 'reportsRoutes');
safeRegister('/api/kardex', kardexRoutes, 'kardexRoutes');
safeRegister('/api/finance', financeRoutes, 'financeRoutes');
safeRegister('/api/orders', orderRoutes, 'orderRoutes');

app.use('/api/*', (req, res) => res.status(404).json({ detail: 'Ruta no encontrada' }));
app.use(errorHandler);

async function bootstrap() {
  try {
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('Montando esquema inicial...');
      const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf-8');
      await pool.query(schema);
      await seedRun();
    }
  } catch (error) {
    console.error('Error en base de datos:', error);
  }
}

const PORT = process.env.PORT || 5001;
bootstrap().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[motonation] API lista y escuchando en puerto ${PORT}`);
  });
});