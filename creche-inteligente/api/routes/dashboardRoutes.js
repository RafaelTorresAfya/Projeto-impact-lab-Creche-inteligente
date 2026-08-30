const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/dashboardController');

router.get('/kpis', verifyToken, controller.kpis);

module.exports = router;
