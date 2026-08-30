const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/dominioTerritorialController');

router.get('/geojson', verifyToken, controller.listarGeoJSON);

module.exports = router;
