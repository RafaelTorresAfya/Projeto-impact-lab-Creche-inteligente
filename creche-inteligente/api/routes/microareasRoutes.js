const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/microareasController');

router.get('/geojson', verifyToken, controller.listarGeoJSON);

module.exports = router;
