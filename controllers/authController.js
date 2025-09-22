const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendResetPasswordEmail = require("../utils/sendResetPasswordEmail");
const sendRecoverUsernameEmail = require("../utils/sendRecoverUsernameEmail");

// 📌 Recuperar contraseña (forgot password)
exports.forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;

    // 1. Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    // 2. Buscar correo en InfoUser
    const infoUser = await InfoUser.findOne({ userId: user._id });
    if (!infoUser || !infoUser.email) {
      return res
        .status(400)
        .json({ msg: "No hay correo registrado para este usuario" });
    }
    
    // 3. Generar token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    // 4. Construir link (ajusta la URL a tu frontend en producción)
    const resetUrl = `https://citamedfront.vercel.app/reset-password/${resetToken}`;

    // 5. Enviar correo
    await sendResetPasswordEmail(infoUser.email, resetUrl);

    res.json({ msg: "📩 Correo de recuperación enviado correctamente" });
  } catch (err) {
    console.error("❌ Error en forgotPassword:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// 📌 Resetear contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // 1. Validar token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // aún válido
    });

    if (!user) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    // 2. Encriptar contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 3. Limpiar token de recuperación
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // 4. Guardar cambios
    await user.save();

    res.json({ msg: "✅ Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error en resetPassword:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// 📌 Enviar nombre de usuario por correo
exports.recoverUsername = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar al usuario por su email en InfoUser
    const infoUser = await InfoUser.findOne({ email }).populate("userId");
    if (!infoUser) {
      return res.status(400).json({ msg: "No se encontró usuario con este correo" });
    }

    const username = infoUser.userId.username;

    // Enviar correo con el username
    await sendRecoverUsernameEmail(email, username);

    res.json({ msg: "📩 Tu nombre de usuario fue enviado a tu correo electrónico" });
  } catch (err) {
    console.error("❌ Error en recoverUsername:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};