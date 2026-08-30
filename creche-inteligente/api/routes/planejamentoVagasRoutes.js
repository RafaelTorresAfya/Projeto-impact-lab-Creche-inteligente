const express = require('express');
const router = express.Router();
const { verifyToken, verifyPerfil } = require('../middleware/authMiddleware');
const controller = require('../controllers/planejamentoVagasController');

router.get('/', verifyToken, controller.listar);
router.get('/:id', verifyToken, controller.buscarPorId);
router.post('/', verifyToken, verifyPerfil(['ADMIN', 'GESTOR']), controller.criar);
router.put('/:id', verifyToken, verifyPerfil(['ADMIN', 'GESTOR']), controller.atualizar);
router.delete('/:id', verifyToken, verifyPerfil('ADMIN'), controller.remover);

module.exports = router;
