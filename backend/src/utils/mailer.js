const nodemailer = require('nodemailer');

const isConfigured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

async function sendPasswordResetEmail(to, resetLink) {
  await getTransporter().sendMail({
    from: `"MotoNation" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Recupera tu contraseña — MotoNation',
    html: `
      <div style="font-family: Arial, sans-serif; background:#0A0A0A; color:#f5f5f5; padding:32px; border-radius:4px;">
        <h2 style="color:#10B981; margin-top:0;">MotoNation</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block; background:#10B981; color:#000; text-decoration:none; font-weight:bold; padding:12px 20px; border-radius:2px; margin:12px 0;">
            Crear nueva contraseña
          </a>
        </p>
        <p style="color:#999; font-size:12px;">Este enlace expira en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  });
}

async function sendLoginOtpEmail(to, code) {
  await getTransporter().sendMail({
    from: `"MotoNation" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${code} — Código de verificación MotoNation`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#0A0A0A; color:#f5f5f5; padding:32px; border-radius:4px;">
        <h2 style="color:#10B981; margin-top:0;">MotoNation — Sistema interno</h2>
        <p>Usa este código para completar el inicio de sesión:</p>
        <p style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#10B981; margin:20px 0;">${code}</p>
        <p style="color:#999; font-size:12px;">Este código expira en 10 minutos. Si no intentaste iniciar sesión, ignora este correo.</p>
      </div>
    `,
  });
}

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const money = (n) => `$${Number(n).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function sendOrderConfirmationEmail(to, order, items) {
  const rows = items.map((it) => `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #222;">${escapeHtml(it.product_name)} <span style="color:#777;">x${it.quantity}</span></td>
          <td style="padding:8px 0; border-bottom:1px solid #222; text-align:right; white-space:nowrap;">${money(it.subtotal)}</td>
        </tr>`).join('');

  await getTransporter().sendMail({
    from: `"MotoNation" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Confirmación de compra ${order.order_number} — MotoNation`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#0A0A0A; color:#f5f5f5; padding:32px; border-radius:4px; max-width:520px; margin:0 auto;">
        <h2 style="color:#10B981; margin-top:0;">MotoNation</h2>
        <p>¡Gracias por tu compra! Este es el comprobante del pedido <strong>${escapeHtml(order.order_number)}</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:14px;">
          ${rows}
        </table>
        <table style="width:100%; font-size:14px;">
          <tr><td style="color:#999;">Subtotal</td><td style="text-align:right;">${money(order.subtotal)}</td></tr>
          <tr><td style="color:#999;">Impuestos</td><td style="text-align:right;">${money(order.tax)}</td></tr>
          <tr><td style="font-weight:bold; padding-top:8px;">Total</td><td style="text-align:right; font-weight:bold; padding-top:8px; color:#10B981;">${money(order.total)}</td></tr>
        </table>
        <p style="color:#999; font-size:12px; margin-top:24px;">Dirección de envío: ${escapeHtml(order.shipping_address)}</p>
        <p style="color:#999; font-size:12px;">Podés ver el detalle y el estado de tu pedido desde "Mis pedidos" en tu cuenta de MotoNation.</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendLoginOtpEmail, sendOrderConfirmationEmail, isConfigured };
