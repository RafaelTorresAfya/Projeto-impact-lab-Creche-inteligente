'use strict';

/**
 * Step 01 — Reprojeta o shapefile de microáreas SME (SIRGAS2000 UTM 23S)
 * para WGS84 (EPSG:4326) e exporta GeoJSON só com os campos que
 * interessam pro app: cod_territ, cre, st_area_sh.
 *
 * Usa a API programática do mapshaper (mais simples que orquestrar o
 * CLI via child_process e evita problemas de path/quoting).
 */

const path = require('path');
const fs = require('fs');
const mapshaper = require('mapshaper');

const SRC = path.resolve(
  __dirname,
  '../../../../dadoscreche/Microáreas_SME_revisãoIPP/Microareas_SME_revisao.shp'
);
const OUT_DIR = path.resolve(__dirname, '../../output');
const OUT_FILE = path.join(OUT_DIR, 'microareas.geojson');

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const cmd = [
    `-i "${SRC}"`,
    '-proj wgs84',
    '-filter-fields cod_territ,cre,st_area_sh',
    `-o format=geojson "${OUT_FILE}" force`,
  ].join(' ');

  await mapshaper.runCommands(cmd);

  const geojson = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const n = geojson.features.length;

  // Sanity check: coordenadas devem estar em graus decimais (~ -43.x / -22.x),
  // não em metros UTM (~ 600000 / 7400000). Se a reprojeção falhar, aborta
  // sem deixar um arquivo final incorreto no lugar.
  const sample = geojson.features[0]?.geometry?.coordinates;
  const flat = JSON.stringify(sample);
  const firstNum = flat.match(/-?\d+\.?\d*/)?.[0];
  const val = firstNum ? Math.abs(parseFloat(firstNum)) : null;

  if (val === null || val > 180) {
    throw new Error(
      `Reprojeção de microareas.geojson parece ter falhado — coordenada de exemplo fora do range esperado em graus decimais: ${firstNum}`
    );
  }

  console.log(`[01] microareas.geojson gerado com ${n} feições (esperado ~232-233).`);
  return n;
}

if (require.main === module) {
  run().catch((err) => {
    console.error('[01] ERRO:', err);
    process.exit(1);
  });
}

module.exports = { run, OUT_FILE };
