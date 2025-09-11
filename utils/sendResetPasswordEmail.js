const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📩 Función para enviar correo de recuperación
const sendResetPasswordEmail = async (to, resetUrl) => {
  const mailOptions = {
    from: `"CITAMED 🔐" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Recuperación de contraseña",
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>Este enlace expirará en 1 hora.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📨 Correo de recuperación enviado a", to);
  } catch (error) {
    console.error("❌ Error al enviar correo de recuperación:", error);
  }
};

module.exports = sendResetPasswordEmail;
