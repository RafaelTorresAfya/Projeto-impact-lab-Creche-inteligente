'use strict';

/**
 * Orquestrador do pipeline "Creche Inteligente".
 * Roda os steps 01 -> 05 em sequência e copia os artefatos finais pra
 * ../api/data/, de onde a API do hackathon vai servir os dados.
 */

const fs = require('fs');
const path = require('path');

const step01 = require('./steps/01_reprojetar_microareas');
const step02 = require('./steps/02_parse_dominio_territorial');
const step03 = require('./steps/03_consolidar_unidades_escolares');
const step04 = require('./steps/04_consolidar_vagas_ofertadas');
const step05 = require('./steps/05_agregar_inscricoes_resumo');

const API_DATA_DIR = path.resolve(__dirname, '../../api/data');

async function main() {
  console.log('=== Pipeline Creche Inteligente — iniciando ===');

  console.log('\n[1/5] Reprojetando microáreas...');
  const nMicroareas = await step01.run();

  console.log('\n[2/5] Parseando domínio territorial...');
  const nDominio = step02.run();

  console.log('\n[3/5] Consolidando unidades escolares...');
  const unidadesStats = step03.run();

  console.log('\n[4/5] Consolidando vagas ofertadas...');
  const nVagas = step04.run();

  console.log('\n[5/5] Agregando resumo de inscrições (streaming, pode demorar alguns segundos)...');
  const nInscricoes = await step05.run();

  console.log('\n=== Copiando artefatos finais para api/data/ ===');
  if (!fs.existsSync(API_DATA_DIR)) fs.mkdirSync(API_DATA_DIR, { recursive: true });

  const artifacts = [
    step01.OUT_FILE,
    step02.OUT_FILE,
    step03.OUT_FILE,
    step04.OUT_FILE,
    step05.OUT_FILE,
  ];

  for (const src of artifacts) {
    const dest = path.join(API_DATA_DIR, path.basename(src));
    fs.copyFileSync(src, dest);
    console.log(`  copiado: ${path.basename(src)}`);
  }

  console.log('\n=== Resumo final ===');
  console.log(`microareas.geojson:         ${nMicroareas} feições`);
  console.log(`dominio-territorial.geojson: ${nDominio} polígonos`);
  console.log(`unidades-escolares.geojson: ${unidadesStats.total} unidades (${unidadesStats.comGeo} com geo, ${unidadesStats.semGeoCount} sem geo)`);
  console.log(`vagas-ofertadas.json:       ${nVagas} registros`);
  console.log(`inscricoes-resumo.json:     ${nInscricoes} grupos agregados`);
  console.log('\n=== Pipeline concluído com sucesso ===');
}

main().catch((err) => {
  console.error('\nPIPELINE FALHOU:', err);
  process.exit(1);
});
