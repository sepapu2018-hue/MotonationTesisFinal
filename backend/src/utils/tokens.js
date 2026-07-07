// Gestión de tokens JWT y persistencia en cookies seguras
const jwt = require('jsonwebtoken');

const ACCESS_OPTS = { expiresIn: process.env.JWT_ACCESS_EXPIRES || '8h' };
const REFRESH_OPTS = { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' };

const isProd = process.env.NODE_ENV === 'production';

// Configuración adaptativa de cookies (Bloquea ataques XSS en local y CSRF en producción)
const COOKIE_BASE = {
  httpOnly: true,
  secure: isProd, // Solo requiere HTTPS en entornos de producción reales
  sameSite: isProd ? 'none' : 'lax', // Permite que localhost almacene la cookie sin problemas
  path: '/',
};

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, kind: 'staff', type: 'access' },
    process.env.JWT_SECRET,
    ACCESS_OPTS
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user.id, kind: 'staff', type: 'refresh' },
    process.env.JWT_SECRET,
    REFRESH_OPTS
  );
}

// Token de corta duración que sólo prueba "usuario/contraseña ya validados,
// falta el código de verificación" — no sirve como access token (distinto `type`).
function signOtpPending(user) {
  return jwt.sign(
    { sub: user.id, kind: 'staff', type: 'otp_pending' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function signCustomerAccess(customer) {
  return jwt.sign(
    { sub: customer.id, email: customer.email, kind: 'customer', type: 'access' },
    process.env.JWT_SECRET,
    ACCESS_OPTS
  );
}

function signCustomerRefresh(customer) {
  return jwt.sign(
    { sub: customer.id, kind: 'customer', type: 'refresh' },
    process.env.JWT_SECRET,
    REFRESH_OPTS
  );
}

function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, { ...COOKIE_BASE, maxAge: 1000 * 60 * 60 * 8 });
  res.cookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 1000 * 60 * 60 * 24 * 7 });
}

function setCustomerCookies(res, accessToken, refreshToken) {
  // Sincronizado para mantener la consistencia con las rutas de customerAuth
  res.cookie('customer_access_token', accessToken, { ...COOKIE_BASE, maxAge: 1000 * 60 * 60 * 8 });
  res.cookie('customer_refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 1000 * 60 * 60 * 24 * 7 });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', COOKIE_BASE);
  res.clearCookie('refresh_token', COOKIE_BASE);
}

function clearCustomerCookies(res) {
  res.clearCookie('customer_access_token', COOKIE_BASE);
  res.clearCookie('customer_refresh_token', COOKIE_BASE);
}

module.exports = {
  signAccess, signRefresh, signOtpPending, verify, setAuthCookies, clearAuthCookies,
  signCustomerAccess, signCustomerRefresh, setCustomerCookies, clearCustomerCookies,
};