const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { one, query } = require('../config/db');
const {
  signAccess, signRefresh, signOtpPending, verify, setAuthCookies, clearAuthCookies,
} = require('../utils/tokens');
const { sendLoginOtpEmail, isConfigured: mailerConfigured } = require('../utils/mailer');
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

// Verificación/reenvío del código: límite aparte para no gastar los intentos de /login
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;

const userToPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar_url: user.avatar_url || '',
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
});

async function issueAndSendOtp(user) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

  await query('DELETE FROM login_otps WHERE user_id = $1 AND used_at IS NULL', [user.id]);
  await query(
    'INSERT INTO login_otps (user_id, code_hash, expires_at) VALUES ($1,$2,$3)',
    [user.id, codeHash, expiresAt]
  );

  const pendingToken = signOtpPending(user);

  if (mailerConfigured()) {
    try {
      await sendLoginOtpEmail(user.email, code);
      return { pendingToken };
    } catch (err) {
      console.error('Error enviando código de verificación:', err);
      // Si falla el envío, se entrega el código en la respuesta para no bloquear el acceso
      return { pendingToken, dev_otp_code: code };
    }
  }
  // Sin GMAIL_USER/GMAIL_APP_PASSWORD configurados: el código se devuelve directo en la respuesta
  return { pendingToken, dev_otp_code: code };
}

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

  const { pendingToken, dev_otp_code } = await issueAndSendOtp(user);

  res.json({ ok: true, otp_required: true, pending_token: pendingToken, dev_otp_code });
}));

function verifyPendingToken(pendingToken) {
  let payload;
  try {
    payload = verify(pendingToken);
  } catch {
    throw httpError(401, 'La sesión de verificación expiró, vuelve a iniciar sesión');
  }
  if (payload.type !== 'otp_pending' || payload.kind !== 'staff') {
    throw httpError(401, 'Token inválido');
  }
  return payload;
}

router.post('/login/verify-otp', otpLimiter, asyncHandler(async (req, res) => {
  const { pending_token, code } = z.object({
    pending_token: z.string().min(10),
    code: z.string().min(6).max(6),
  }).parse(req.body);

  const payload = verifyPendingToken(pending_token);

  const otp = await one(
    'SELECT id, code_hash, expires_at, used_at, attempts FROM login_otps WHERE user_id = $1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [payload.sub]
  );
  if (!otp || new Date(otp.expires_at) < new Date()) {
    throw httpError(400, 'El código no es válido o ya expiró, solicita uno nuevo');
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await query('DELETE FROM login_otps WHERE id = $1', [otp.id]);
    throw httpError(400, 'Demasiados intentos fallidos, vuelve a iniciar sesión');
  }

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  if (codeHash !== otp.code_hash) {
    await query('UPDATE login_otps SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
    throw httpError(401, 'Código incorrecto');
  }

  await query('UPDATE login_otps SET used_at = NOW() WHERE id = $1', [otp.id]);

  const user = await one(
    'SELECT id, email, name, role, avatar_url, permissions FROM users WHERE id = $1',
    [payload.sub]
  );
  if (!user) throw httpError(401, 'Usuario no encontrado');

  setAuthCookies(res, signAccess(user), signRefresh(user));
  res.json({ ok: true, user: userToPayload(user) });
}));

router.post('/login/resend-otp', otpLimiter, asyncHandler(async (req, res) => {
  const { pending_token } = z.object({ pending_token: z.string().min(10) }).parse(req.body);
  const payload = verifyPendingToken(pending_token);

  const user = await one('SELECT id, email, name, role, avatar_url, permissions FROM users WHERE id = $1', [payload.sub]);
  if (!user) throw httpError(401, 'Usuario no encontrado');

  const { pendingToken, dev_otp_code } = await issueAndSendOtp(user);
  res.json({ ok: true, otp_required: true, pending_token: pendingToken, dev_otp_code });
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
