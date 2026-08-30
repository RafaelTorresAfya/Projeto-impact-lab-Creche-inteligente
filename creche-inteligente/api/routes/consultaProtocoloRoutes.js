const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/consultaProtocoloController');
const { verifyProtocolo } = require('../middleware/protocoloMiddleware');

const router = express.Router();

// Limita tentativas de protocolo+CPF por IP para dificultar forca bruta,
// ja que esta rota nao usa JWT (autenticacao publica da familia).
const limiteConsulta = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', limiteConsulta, verifyProtocolo, controller.consultar);
router.post('/aceitar', limiteConsulta, verifyProtocolo, controller.aceitarConvocacao);
router.post('/recusar', limiteConsulta, verifyProtocolo, controller.recusarConvocacao);

module.exports = router;
