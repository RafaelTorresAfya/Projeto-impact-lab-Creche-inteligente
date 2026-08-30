const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/unidadesEscolaresController');

// rota estatica /geojson precisa vir antes de qualquer /:id
router.get('/geojson', verifyToken, controller.listarGeoJSON);
router.get('/', verifyToken, controller.listar);

module.exports = router;
