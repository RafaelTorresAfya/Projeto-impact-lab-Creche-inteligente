const staticData = require('../services/staticData');

function listarGeoJSON(req, res, next) {
  try {
    const geojson = staticData.getMicroareasGeoJSON();
    res.json({ success: true, data: geojson, total: geojson.features.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarGeoJSON };
