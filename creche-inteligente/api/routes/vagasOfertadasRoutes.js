const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/vagasOfertadasController');

router.get('/', verifyToken, controller.listar);

module.exports = router;
