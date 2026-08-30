const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function carregarJson(nomeArquivo, fallback) {
  const caminho = path.join(DATA_DIR, nomeArquivo);
  try {
    const conteudo = fs.readFileSync(caminho, 'utf8');
    return JSON.parse(conteudo);
  } catch (err) {
    console.warn(`[staticData] nao foi possivel carregar ${nomeArquivo}: ${err.message}`);
    return fallback;
  }
}

const featureCollectionVazia = { type: 'FeatureCollection', features: [] };

// Carregados UMA VEZ na subida do processo e mantidos em memoria.
const unidadesEscolares = carregarJson('unidades-escolares.geojson', featureCollectionVazia);
const microareas = carregarJson('microareas.geojson', featureCollectionVazia);
const dominioTerritorial = carregarJson('dominio-territorial.geojson', featureCollectionVazia);
const inscricoesResumo = carregarJson('inscricoes-resumo.json', []);
const vagasOfertadas = carregarJson('vagas-ofertadas.json', []);

console.log(
  `[staticData] unidades=${unidadesEscolares.features?.length || 0} ` +
  `microareas=${microareas.features?.length || 0} ` +
  `dominioTerritorial=${dominioTerritorial.features?.length || 0} ` +
  `inscricoes=${inscricoesResumo.length} vagasOfertadas=${vagasOfertadas.length}`
);

// ---- filtros em JS puro (Array.filter) ----

function filtrarUnidadesFeatures({ cre, tipo, cod_territ, busca } = {}) {
  return unidadesEscolares.features.filter((f) => {
    const p = f.properties || {};
    if (cre !== undefined && String(p.id_cre) !== String(cre)) return false;
    if (tipo !== undefined && String(p.tipo).toLowerCase() !== String(tipo).toLowerCase()) return false;
    if (cod_territ !== undefined && String(p.cod_territ) !== String(cod_territ)) return false;
    if (busca !== undefined && !String(p.nome || '').toLowerCase().includes(String(busca).toLowerCase())) return false;
    return true;
  });
}

function getUnidadesEscolaresProperties(filtros) {
  return filtrarUnidadesFeatures(filtros).map((f) => f.properties);
}

function getUnidadesEscolaresGeoJSON(filtros) {
  return {
    type: 'FeatureCollection',
    features: filtrarUnidadesFeatures(filtros),
  };
}

function getMicroareasGeoJSON() {
  return microareas;
}

function getDominioTerritorialGeoJSON() {
  return dominioTerritorial;
}

function getInscricoesResumo({ ano, codigo_unidade, situacao } = {}) {
  return inscricoesResumo.filter((r) => {
    if (ano !== undefined && String(r.ano) !== String(ano)) return false;
    if (codigo_unidade !== undefined && String(r.codigo_unidade) !== String(codigo_unidade)) return false;
    if (situacao !== undefined && r.situacao !== situacao) return false;
    return true;
  });
}

function getVagasOfertadas({ ano, fonte, codigo_unidade } = {}) {
  return vagasOfertadas.filter((r) => {
    if (ano !== undefined && String(r.ano) !== String(ano)) return false;
    if (fonte !== undefined && r.fonte !== fonte) return false;
    if (codigo_unidade !== undefined && String(r.codigo_unidade) !== String(codigo_unidade)) return false;
    return true;
  });
}

function getUnidadePorCodigo(codigo_unidade) {
  const feature = unidadesEscolares.features.find(
    (f) => f.properties && String(f.properties.codigo_unidade) === String(codigo_unidade)
  );
  return feature ? feature.properties : null;
}

module.exports = {
  unidadesEscolares,
  microareas,
  dominioTerritorial,
  inscricoesResumo,
  vagasOfertadas,
  getUnidadesEscolaresProperties,
  getUnidadesEscolaresGeoJSON,
  getMicroareasGeoJSON,
  getDominioTerritorialGeoJSON,
  getInscricoesResumo,
  getVagasOfertadas,
  getUnidadePorCodigo,
};
