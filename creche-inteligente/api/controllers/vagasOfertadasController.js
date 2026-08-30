const staticData = require('../services/staticData');

function listar(req, res, next) {
  try {
    const { ano, fonte, codigo_unidade } = req.query;
    const data = staticData.getVagasOfertadas({ ano, fonte, codigo_unidade });
    res.json({ success: true, data, total: data.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
