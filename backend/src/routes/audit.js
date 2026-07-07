// Consulta del registro de auditoría (solo admin, escritura vía utils/auditLog.js)
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size, 10) || 50));
  const offset = (page - 1) * pageSize;

  const { total } = await one('SELECT COUNT(*)::int AS total FROM audit_log');
  const rows = await query(
    'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  );

  res.json({ data: rows, total, page, pageSize });
}));

module.exports = router;
