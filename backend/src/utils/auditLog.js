// Best-effort: una falla al registrar auditoría nunca debe romper la acción real.
const { query } = require('../config/db');

async function logAudit(user, action, entityType, entityId, details = {}) {
  try {
    await query(
      'INSERT INTO audit_log (user_id, user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [user?.id || null, user?.name || 'Sistema', action, entityType, String(entityId || ''), JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Error registrando auditoría:', err);
  }
}

module.exports = { logAudit };
