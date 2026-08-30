const staticData = require('../services/staticData');

function listar(req, res, next) {
  try {
    const { cre, tipo, cod_territ, busca } = req.query;
    const data = staticData.getUnidadesEscolaresProperties({ cre, tipo, cod_territ, busca });
    res.json({ success: true, data, total: data.length });
  } catch (err) {
    next(err);
  }
}

function listarGeoJSON(req, res, next) {
  try {
    const { cre, tipo, cod_territ, busca } = req.query;
    const geojson = staticData.getUnidadesEscolaresGeoJSON({ cre, tipo, cod_territ, busca });
    res.json({ success: true, data: geojson, total: geojson.features.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, listarGeoJSON };
