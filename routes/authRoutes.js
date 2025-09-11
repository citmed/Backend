const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../controllers/authController");

// 📌 Enviar link de recuperación
router.post("/forgot-password", forgotPassword);

// 📌 Resetear contraseña
router.post("/reset-password/:token", resetPassword);

module.exports = router;
