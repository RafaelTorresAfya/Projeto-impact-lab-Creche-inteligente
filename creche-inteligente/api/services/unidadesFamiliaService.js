// Camada sobre staticData.js que resolve o universo de unidades elegiveis
// para recomendacao a familias, a partir dos dados reais (GeoJSON de unidades
// + series de vagas ofertadas/inscricoes ja usadas pelo dashboard da secretaria).
// Substitui as 20 unidades ficticias do prototipo por dados reais, tratando
// unidades sem geometria com uma aproximacao por bairro/CRE (ver bairrosRio.js).

const staticData = require('./staticData');
const bairrosRio = require('./bairrosRio');

function anoMaisRecente() {
  const anos = staticData.vagasOfertadas.map((r) => Number(r.ano)).filter(Boolean);
  return anos.length ? Math.max(...anos) : new Date().getFullYear();
}

function somarPorUnidade(registros, campoValor, ano) {
  const mapa = new Map();
  for (const r of registros) {
    if (String(r.ano) !== String(ano)) continue;
    const chave = String(r.codigo_unidade);
    const valor = Number(r[campoValor]) || 0;
    mapa.set(chave, (mapa.get(chave) || 0) + valor);
  }
  return mapa;
}

function resolverCoordenadas(unidade, feature) {
  const geometry = feature && feature.geometry;
  if (geometry && geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, geo_aproximado: false };
    }
  }

  if (unidade.bairro) {
    const bairro = bairrosRio.buscarBairro(unidade.bairro);
    if (bairro) return { lat: bairro.lat, lng: bairro.lng, geo_aproximado: true };
  }

  if (unidade.id_cre) {
    const centro = bairrosRio.centroideCre(`${unidade.id_cre}ª CRE`);
    if (centro) return { lat: centro.lat, lng: centro.lng, geo_aproximado: true };
  }

  return null;
}

// Retorna as unidades com oferta de creche conhecida (aparecem em vagas
// ofertadas ou inscricoes-resumo, que ja sao series exclusivas de creche),
// com fila/vagas do ano mais recente e coordenadas resolvidas (reais ou
// aproximadas). Unidades sem nenhuma coordenada possivel ficam de fora do
// ranking geografico, mas continuam disponiveis para o pedido de excecao.
function listarUnidadesElegiveis() {
  const ano = anoMaisRecente();
  const matriculadosPorUnidade = somarPorUnidade(staticData.vagasOfertadas, 'alunos_matriculados', ano);
  const listaEsperaPorUnidade = somarPorUnidade(staticData.inscricoesResumo, 'qtd_inscricoes', ano);

  const codigos = new Set([...matriculadosPorUnidade.keys(), ...listaEsperaPorUnidade.keys()]);

  const resultado = [];
  for (const codigo_unidade of codigos) {
    const propriedades = staticData.getUnidadePorCodigo(codigo_unidade);
    if (!propriedades) continue;

    const feature = staticData.unidadesEscolares.features.find(
      (f) => f.properties && String(f.properties.codigo_unidade) === codigo_unidade
    );

    const coords = resolverCoordenadas(propriedades, feature);
    const matriculados = matriculadosPorUnidade.get(codigo_unidade) || 0;
    const fila = listaEsperaPorUnidade.get(codigo_unidade) || 0;

    resultado.push({
      codigo_unidade,
      nome: propriedades.nome,
      bairro: propriedades.bairro,
      id_cre: propriedades.id_cre,
      vagas: Math.max(1, matriculados),
      fila,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      geo_aproximado: coords ? coords.geo_aproximado : null,
      sem_localizacao: !coords,
    });
  }

  return resultado;
}

function existeUnidade(codigo_unidade) {
  return !!staticData.getUnidadePorCodigo(codigo_unidade);
}

module.exports = { listarUnidadesElegiveis, existeUnidade, anoMaisRecente };
