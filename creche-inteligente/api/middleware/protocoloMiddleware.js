const pool = require('../db/connection');
const { apenasDigitos } = require('../services/validacaoService');

// Autenticacao propria do modulo familia: protocolo + CPF do responsavel,
// nunca o JWT de staff (verifyToken). Erro generico em qualquer falha para
// nao permitir enumerar protocolos ou CPFs validos.
async function verifyProtocolo(req, res, next) {
  const origem = req.method === 'GET' ? req.query : req.body || {};
  const protocolo = String(origem.protocolo || '').trim();
  const cpf = apenasDigitos(origem.cpf);

  if (!protocolo || cpf.length !== 11) {
    return res.status(400).json({
      success: false,
      error: 'Informe protocolo e CPF do responsavel.',
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM familias_inscricoes WHERE protocolo = ? AND responsavel_cpf = ?',
      [protocolo, cpf]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Nao encontramos inscricao com esse protocolo e CPF.',
      });
    }

    req.inscricao = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyProtocolo };
