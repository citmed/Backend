const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword,recoverUsername } = require("../controllers/authController");

// 📌 Enviar link de recuperación
router.post("/forgotpassword", forgotPassword);

// 📌 Resetear contraseña
router.post("/reset-password/:token", resetPassword);

router.post("/recover-username", recoverUsername);

module.exports = router;
