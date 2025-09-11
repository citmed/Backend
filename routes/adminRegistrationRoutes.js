const express = require('express');
const router = express.Router();
const adminRegistration = require('../controllers/adminRegistrationController'); 

// Ruta para registrar un administrador
router.post('/register-admin', adminRegistration);

module.exports = router;
