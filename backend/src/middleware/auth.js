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

module.exports = { authRequired, adminRequired, customerRequired };