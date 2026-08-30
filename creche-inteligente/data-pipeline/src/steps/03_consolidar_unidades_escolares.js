'use strict';

/**
 * Step 03 — LEFT JOIN do catálogo mestre de unidades escolares (CSV sem
 * header, ';') com o enriquecimento geográfico (xlsx Unidades_Unificadas),
 * casando esc_codigo (já 7 chars, ex. "0101601") com
 * String(DESIGNACAO).padStart(7,'0').
 *
 * DECISÃO DE FORMATO: geramos UM ÚNICO arquivo
 * output/unidades-escolares.geojson contendo TODAS as unidades (inclusive
 * as sem geo). Unidades sem coordenadas válidas entram como
 * `geometry: null` (GeoJSON permite Feature com geometry null) e
 * `properties.fonte_geo: "ausente"`. Isso é mais simples de consumir pela
 * API (um único fetch, um único parser) do que manter dois arquivos
 * sincronizados. Um segundo arquivo, unidades-escolares-sem-geo.json,
 * também é gerado como conveniência (lista simples, já filtrada) caso o
 * front-end prefira não lidar com geometry:null.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const CSV_SRC = path.resolve(
  __dirname,
  '../../../../dadoscreche/Bases IC_ ClassificadoseFila/04_UnidadesEscolaresComEndereco.csv'
);
const XLSX_SRC = path.resolve(
  __dirname,
  '../../../../dadoscreche/OferecimentosEvagas/Unidades_Unificadas_com_Localizacao.xlsx'
);
const OUT_DIR = path.resolve(__dirname, '../../output');
const OUT_FILE = path.join(OUT_DIR, 'unidades-escolares.geojson');
const OUT_SEM_GEO = path.join(OUT_DIR, 'unidades-escolares-sem-geo.json');

function nullify(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' || s === 'NULL' ? null : s;
}

function loadCatalogo() {
  const raw = fs.readFileSync(CSV_SRC, 'utf8').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    const cols = line.split(';');
    const [seq, esc_codigo, nome, tipo, logradouro, numero, complemento, bairro, cep] = cols;
    return {
      seq: nullify(seq),
      esc_codigo: nullify(esc_codigo),
      nome: nullify(nome),
      tipo: nullify(tipo),
      logradouro: nullify(logradouro),
      numero: nullify(numero),
      complemento: nullify(complemento),
      bairro: nullify(bairro),
      cep: nullify(cep),
    };
  });
}

function loadEnriquecimento() {
  const wb = XLSX.readFile(XLSX_SRC);
  const ws = wb.Sheets['Unidades_Unificadas'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  const map = new Map();
  for (const row of rows) {
    const designacao = row.DESIGNACAO;
    if (designacao === null || designacao === undefined) continue;
    const key = String(designacao).padStart(7, '0');
    map.set(key, row);
  }
  return map;
}

function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const catalogo = loadCatalogo();
  const enriquecimento = loadEnriquecimento();

  const features = [];
  const semGeo = [];
  let comGeo = 0;
  let semGeoCount = 0;

  for (const unidade of catalogo) {
    const match = unidade.esc_codigo ? enriquecimento.get(unidade.esc_codigo) : null;

    const lat = match ? Number(match.LATITUDE) : null;
    const lon = match ? Number(match.LONGITUDE) : null;
    const hasGeo = match && Number.isFinite(lat) && Number.isFinite(lon);

    const properties = {
      codigo_unidade: unidade.esc_codigo,
      nome: unidade.nome,
      tipo: unidade.tipo,
      id_cre: match && match.CRE !== null && match.CRE !== undefined ? Number(match.CRE) : null,
      cod_territ: match ? nullify(match['microárea']) : null,
      logradouro: unidade.logradouro,
      bairro: unidade.bairro,
      cep: unidade.cep,
      fonte_geo: hasGeo ? 'unidades_unificadas' : 'ausente',
    };

    if (hasGeo) {
      comGeo++;
      features.push({
        type: 'Feature',
        properties,
        geometry: { type: 'Point', coordinates: [lon, lat] },
      });
    } else {
      semGeoCount++;
      features.push({
        type: 'Feature',
        properties,
        geometry: null,
      });
      semGeo.push(properties);
    }
  }

  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync(OUT_FILE, JSON.stringify(geojson));
  fs.writeFileSync(OUT_SEM_GEO, JSON.stringify(semGeo, null, 2));

  console.log(
    `[03] unidades-escolares.geojson gerado com ${features.length} unidades — ${comGeo} com coordenadas, ${semGeoCount} sem coordenadas (fonte_geo: "ausente").`
  );
  return { total: features.length, comGeo, semGeoCount };
}

if (require.main === module) {
  run();
}

module.exports = { run, OUT_FILE, OUT_SEM_GEO };
