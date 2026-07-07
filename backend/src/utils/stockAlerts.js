// Avisa por correo a los admins cuando el stock de un producto CRUZA el mínimo
// configurado (pasa de estar arriba a estar en o por debajo) — no se repite en
// cada venta subsiguiente mientras ya esté bajo, para no saturar de correos.
const { query } = require('../config/db');
const { sendLowStockAlertEmail, isConfigured: mailerConfigured } = require('./mailer');

async function checkLowStockAlert(product, previousStock) {
  if (!mailerConfigured()) return;
  if (previousStock <= product.min_stock) return; // ya estaba bajo, no repetir aviso
  if (product.stock > product.min_stock) return; // no cruzó el umbral

  try {
    const admins = await query("SELECT email FROM users WHERE role = 'admin'");
    const emails = admins.map((a) => a.email);
    await sendLowStockAlertEmail(emails, product);
  } catch (err) {
    console.error('Error enviando alerta de stock bajo:', err);
  }
}

module.exports = { checkLowStockAlert };
