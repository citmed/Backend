const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { registerUser } = require('../controllers/registerUserController'); 

router.post('/', registerUser);

module.exports = router; 
