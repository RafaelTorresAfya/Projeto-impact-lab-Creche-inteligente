'use strict';

/**
 * Step 02 — Parseia o CSV de domínio territorial (WKT POLYGON já em WGS84,
 * não precisa reprojeção) e gera um FeatureCollection de polígonos.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const SRC = path.resolve(
  __dirname,
  '../../../../dadoscreche/dominio_territorial - Extração 1.csv'
);
const OUT_DIR = path.resolve(__dirname, '../../output');
const OUT_FILE = path.join(OUT_DIR, 'dominio-territorial.geojson');

function parseWktPolygon(wkt) {
  // Extrai o conteúdo entre POLYGON(( ... )) e separa os pares "lon lat".
  const match = /POLYGON\s*\(\(\s*(.+?)\s*\)\)/i.exec(wkt);
  if (!match) return null;
  const coords = match[1]
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lon, lat] = pair.split(/\s+/).map(Number);
      return [lon, lat];
    });
  return coords;
}

function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const raw = fs.readFileSync(SRC, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  const features = [];
  let skipped = 0;

  for (const rec of records) {
    const coords = parseWktPolygon(rec.geometria || '');
    if (!coords || coords.length < 4) {
      skipped++;
      continue;
    }
    features.push({
      type: 'Feature',
      properties: {
        nome_territorio: rec.nome_territorio,
        tipo_dominio: rec.dominio_orcrim,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    });
  }

  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync(OUT_FILE, JSON.stringify(geojson));

  console.log(
    `[02] dominio-territorial.geojson gerado com ${features.length} polígonos (${skipped} linhas puladas por WKT inválido).`
  );
  return features.length;
}

if (require.main === module) {
  run();
}

module.exports = { run, OUT_FILE };
