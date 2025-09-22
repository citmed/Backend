const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // o el que uses
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendRecoverUsernameEmail(to, username) {
  const mailOptions = {
    from: `"Soporte CitaMed" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Recuperación de nombre de usuario",
    html: `
      <h2>Recuperación de usuario</h2>
      <p>Hola, solicitaste recuperar tu usuario.</p>
      <p><b>Tu nombre de usuario es:</b> ${username}</p>
      <br/>
      <p>Si no solicitaste esta acción, por favor ignora este correo.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendRecoverUsernameEmail;
