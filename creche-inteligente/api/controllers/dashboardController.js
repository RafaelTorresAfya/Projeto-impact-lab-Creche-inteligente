const staticData = require('../services/staticData');

const SITUACAO_LISTA_ESPERA = 'Lista de espera';
const SITUACAO_CONFIRMADO = 'Confirmado';

function getUnidadesPorCre(cre) {
  if (cre === undefined) return null;
  const set = new Set();
  for (const feature of staticData.unidadesEscolares.features) {
    const p = feature.properties || {};
    if (String(p.id_cre) === String(cre)) {
      set.add(String(p.codigo_unidade));
    }
  }
  return set;
}

function kpis(req, res, next) {
  try {
    const { ano, cre } = req.query;
    const unidadesDoCre = getUnidadesPorCre(cre);

    const inscricoesFiltradas = staticData.inscricoesResumo.filter((r) => {
      if (ano !== undefined && String(r.ano) !== String(ano)) return false;
      if (unidadesDoCre && !unidadesDoCre.has(String(r.codigo_unidade))) return false;
      return true;
    });

    let total_inscricoes = 0;
    let qtd_lista_espera_total = 0;
    let qtd_confirmado_total = 0;
    const listaEsperaPorUnidade = new Map();

    for (const r of inscricoesFiltradas) {
      const qtd = Number(r.qtd_inscricoes) || 0;
      total_inscricoes += qtd;
      if (r.situacao === SITUACAO_LISTA_ESPERA) {
        qtd_lista_espera_total += qtd;
        const chave = String(r.codigo_unidade);
        listaEsperaPorUnidade.set(chave, (listaEsperaPorUnidade.get(chave) || 0) + qtd);
      }
      if (r.situacao === SITUACAO_CONFIRMADO) {
        qtd_confirmado_total += qtd;
      }
    }

    const pct_lista_espera = total_inscricoes > 0
      ? Number(((qtd_lista_espera_total / total_inscricoes) * 100).toFixed(2))
      : 0;
    const pct_confirmado = total_inscricoes > 0
      ? Number(((qtd_confirmado_total / total_inscricoes) * 100).toFixed(2))
      : 0;

    const vagasFiltradas = staticData.vagasOfertadas.filter((r) => {
      if (ano !== undefined && String(r.ano) !== String(ano)) return false;
      if (unidadesDoCre && !unidadesDoCre.has(String(r.codigo_unidade))) return false;
      return true;
    });

    const matriculadosPorUnidade = new Map();
    for (const r of vagasFiltradas) {
      const chave = String(r.codigo_unidade);
      const qtd = Number(r.alunos_matriculados) || 0;
      matriculadosPorUnidade.set(chave, (matriculadosPorUnidade.get(chave) || 0) + qtd);
    }

    const codigosUnidade = new Set([
      ...listaEsperaPorUnidade.keys(),
      ...matriculadosPorUnidade.keys(),
    ]);

    const ranking_unidades = Array.from(codigosUnidade)
      .map((codigo_unidade) => {
        const qtd_lista_espera = listaEsperaPorUnidade.get(codigo_unidade) || 0;
        const alunos_matriculados = matriculadosPorUnidade.get(codigo_unidade) || 0;
        const unidade = staticData.getUnidadePorCodigo(codigo_unidade);
        return {
          codigo_unidade,
          nome: unidade ? unidade.nome : null,
          qtd_lista_espera,
          alunos_matriculados,
          descompasso: qtd_lista_espera - alunos_matriculados,
        };
      })
      .sort((a, b) => b.descompasso - a.descompasso)
      .slice(0, 15);

    const inscricoesParaSerie = staticData.inscricoesResumo.filter((r) => {
      if (unidadesDoCre && !unidadesDoCre.has(String(r.codigo_unidade))) return false;
      return true;
    });

    const serieMap = new Map();
    for (const r of inscricoesParaSerie) {
      const anoAtual = r.ano;
      if (!serieMap.has(anoAtual)) {
        serieMap.set(anoAtual, { ano: anoAtual, total_inscricoes: 0, qtd_lista_espera: 0 });
      }
      const entry = serieMap.get(anoAtual);
      entry.total_inscricoes += Number(r.qtd_inscricoes) || 0;
      if (r.situacao === SITUACAO_LISTA_ESPERA) {
        entry.qtd_lista_espera += Number(r.qtd_inscricoes) || 0;
      }
    }

    const serie_historica = Array.from(serieMap.values()).sort((a, b) => a.ano - b.ano);

    res.json({
      success: true,
      data: {
        total_inscricoes,
        pct_lista_espera,
        pct_confirmado,
        ranking_unidades,
        serie_historica,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { kpis };
