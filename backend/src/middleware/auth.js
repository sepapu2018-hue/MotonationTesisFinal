const { verify } = require('../utils/tokens');
const { one } = require('../config/db');

function extractToken(req, cookieName = 'access_token') {
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

async function authRequired(req, res, next) {
  const token = extractToken(req, 'access_token');
  if (!token) return res.status(401).json({ detail: 'No autenticado' });

  try {
    const payload = verify(token);
    if (payload.type !== 'access' || payload.kind !== 'staff') {
      return res.status(401).json({ detail: 'Token inválido' });
    }

    const user = await one(
      'SELECT id, email, name, role, avatar_url, permissions, created_at FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!user) return res.status(401).json({ detail: 'Usuario no encontrado' });

    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expirado' });
    }
    return res.status(401).json({ detail: 'Token inválido' });
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Acceso denegado: requiere rol admin' });
  }
  next();
}

// Autorización por permiso granular (ej. "view_reports"). Los admin siempre pasan;
// un empleado necesita tener AL MENOS UNO de los permisos listados en req.user.permissions.
// Antes esto solo se validaba en el frontend (ocultar el link del menú), así que un empleado
// podía llamar la API directo sin el permiso correspondiente — esto lo bloquea también acá.
function permissionRequired(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ detail: 'No autenticado' });
    if (req.user.role === 'admin') return next();
    const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (allowed.some((p) => perms.includes(p))) return next();
    return res.status(403).json({ detail: 'Acceso denegado: no tienes permiso para esta acción' });
  };
}

async function customerRequired(req, res, next) {
  // CORREGIDO: customer_access_token en lugar de customer_token
  const token = extractToken(req, 'customer_access_token') || extractToken(req, 'access_token');
  if (!token) return res.status(401).json({ detail: 'No autenticado' });

  try {
    const payload = verify(token);
    if (payload.type !== 'access' || payload.kind !== 'customer') {
      return res.status(401).json({ detail: 'Token inválido' });
    }

    const customer = await one(
      'SELECT id, email, name, phone, address, city, created_at FROM customers WHERE id = $1',
      [payload.sub]
    );

    if (!customer) return res.status(401).json({ detail: 'Cliente no encontrado' });

    req.customer = customer;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expirado' });
    }
    return res.status(401).json({ detail: 'Token inválido' });
  }
}

module.exports = { authRequired, adminRequired, customerRequired, permissionRequired };