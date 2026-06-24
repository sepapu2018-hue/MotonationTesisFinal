const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authRequired } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    const dbPassword = user ? (user.password || user.password_hash) : null;

    if (!user || !dbPassword || !(await bcrypt.compare(password, dbPassword))) {
      return res.status(401).json({ detail: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'access', kind: 'staff' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    // CORREGIDO: incluye permissions en la respuesta
    const permissions = Array.isArray(user.permissions)
      ? user.permissions
      : (user.permissions ? Object.values(user.permissions) : []);

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || '',
        permissions,
      }
    });
  } catch (error) {
    res.status(500).json({ detail: "Error interno" });
  }
});

router.get('/me', authRequired, (req, res) => {
  res.json(req.user);
});

router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ ok: true });
});

module.exports = router;