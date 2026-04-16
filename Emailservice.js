const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Envía el código 2FA al correo del usuario
 * @param {string} destinatario - Correo del usuario
 * @param {string} codigo - Código de 4 dígitos
 */
const enviarCodigo2FA = async (destinatario, codigo) => {
  const opciones = {
    from: `"📚 Biblioteca Segura" <${process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: "🔐 Tu código de acceso - Biblioteca",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">📚 Biblioteca Segura</h2>
        <hr style="border-color: #eee;">
        <p style="color: #555;">Hola, recibiste este correo porque alguien intentó iniciar sesión en tu cuenta.</p>
        <p style="color: #555;">Tu código de verificación de un solo uso es:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 12px;
            color: #2980b9;
            background: #eaf4fb;
            padding: 15px 25px;
            border-radius: 8px;
            border: 2px dashed #2980b9;
          ">${codigo}</span>
        </div>

        <p style="color: #e74c3c; font-size: 13px; text-align: center;">
          ⚠️ Este código expira en <strong>5 minutos</strong>.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center;">
          Si no solicitaste esto, ignora este correo.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(opciones);
};

module.exports = { enviarCodigo2FA };