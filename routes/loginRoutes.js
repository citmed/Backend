const express = require('express');
const router = express.Router();
const login = require('../controllers/loginController');

// Ruta para iniciar sesión
router.post('/', login);

module.exports = router;
