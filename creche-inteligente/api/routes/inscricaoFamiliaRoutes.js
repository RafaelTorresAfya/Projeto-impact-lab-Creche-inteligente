const express = require('express');
const controller = require('../controllers/inscricaoFamiliaController');

const router = express.Router();

// Rotas publicas do modulo familia: sem verifyToken (nao e staff). A posse da
// inscricao e checada em cada controller por responsavel_cpf, e o envio final
// exige protocolo (gerado pelo servidor) + CPF para qualquer consulta depois.
router.post('/rascunho', controller.criarRascunho);
router.put('/:id/crianca', controller.atualizarCrianca);
router.put('/:id/enderecos', controller.atualizarEnderecos);
router.get('/:id/recomendacoes', controller.recomendarUnidades);
router.put('/:id/escolhas', controller.atualizarEscolhas);
router.put('/:id/criterios', controller.atualizarCriterios);
router.post('/:id/criterios/:chave/documento', controller.simularDocumento);
router.put('/:id/contato', controller.atualizarContato);
router.post('/:id/enviar', controller.enviarInscricao);

module.exports = router;
