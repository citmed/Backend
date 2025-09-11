const express = require('express');
const router = express.Router();
const { getInfoUser, updateInfoUser } = require('../controllers/infoUserController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', authMiddleware, getInfoUser);

router.put('/', authMiddleware, updateInfoUser);

module.exports = router;
