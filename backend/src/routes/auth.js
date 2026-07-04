const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { one } = require('../config/db');
const {
  signAccess, signRefresh, verify, setAuthCookies, clearAuthCookies,
} = require('../utils/tokens');
const { authRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();

// Protección anti fuerza bruta: máx. 10 intentos de login cada 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.' },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const normalized = email.toLowerCase().trim();

  const user = await one(
    'SELECT id, email, name, role, avatar_url, permissions, password_hash FROM users WHERE email = $1',
    [normalized]
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw httpError(401, 'Credenciales incorrectas');
  }

  setAuthCookies(res, signAccess(user), signRefresh(user));

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  res.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || '',
      permissions,
    },
  });
}));

router.get('/me', authRequired, (req, res) => {
  res.json(req.user);
});

router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refresh_token;
  if (!token) throw httpError(401, 'No refresh token');
  try {
    const payload = verify(token);
    if (payload.type !== 'refresh' || payload.kind !== 'staff') throw httpError(401, 'Token inválido');
    const user = await one(
      'SELECT id, email, name, role, avatar_url, permissions FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!user) throw httpError(401, 'Usuario no encontrado');
    setAuthCookies(res, signAccess(user), token);
    res.json({ ok: true });
  } catch (e) {
    if (e.status) throw e;
    throw httpError(401, 'Token inválido');
  }
}));

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

module.exports = router;
