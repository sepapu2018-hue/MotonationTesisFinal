// Manejador centralizado de errores. Mapea códigos PostgreSQL a respuestas HTTP coherentes.
function errorHandler(err, req, res, _next) {
  // 1. Errores de validación con Zod (Frontend manda datos mal formados)
  if (err && err.name === 'ZodError') {
    const msg = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return res.status(400).json({ detail: msg });
  }

  // 2. Violación de unicidad PostgreSQL (ej: SKU o Email ya registrados en motonation-final)
  if (err && err.code === '23505') {
    return res.status(400).json({ detail: 'Registro duplicado (el correo, SKU o valor único ya existe).' });
  }

  // 3. Violación de Llave Foránea (ej: Intentar borrar una categoría que aún tiene motocicletas amarradas)
  if (err && err.code === '23503') {
    return res.status(400).json({ detail: 'Operación inválida: El registro está siendo utilizado por otra tabla.' });
  }

  // 4. PROTECCIÓN ADICIONAL: Violación de CHECK Constraints (ej: Intentar dejar el stock en negativo)
  if (err && err.code === '23514') {
    return res.status(400).json({ detail: 'Acción rechazada: Los valores no cumplen con las reglas del sistema (ej: stock menor a 0).' });
  }

  // 5. PROTECCIÓN ADICIONAL: Formato UUID inválido (ej: ID de producto o usuario alterado en la URL)
  if (err && err.code === '22P02') {
    return res.status(400).json({ detail: 'El identificador enviado no tiene un formato válido.' });
  }

  // 6. Errores marcados manualmente en controladores mediante httpError()
  if (err && err.status) {
    return res.status(err.status).json({ detail: err.message });
  }

  // 7. Cualquier otro error inesperado (Error de sintaxis de código, etc.)
  console.error('[error inesperado del sistema]:', err);
  res.status(500).json({ detail: 'Error interno del servidor' });
}

// Helper para lanzar errores HTTP controlados desde los controladores
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { errorHandler, httpError };