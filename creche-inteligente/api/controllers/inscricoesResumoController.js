const staticData = require('../services/staticData');

function listar(req, res, next) {
  try {
    const { ano, codigo_unidade, situacao } = req.query;
    const data = staticData.getInscricoesResumo({ ano, codigo_unidade, situacao });
    res.json({ success: true, data, total: data.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
