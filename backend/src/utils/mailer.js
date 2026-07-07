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

module.exports = { sendPasswordResetEmail, sendLoginOtpEmail, isConfigured };
