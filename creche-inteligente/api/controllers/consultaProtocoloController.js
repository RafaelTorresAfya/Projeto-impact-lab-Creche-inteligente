const pool = require('../db/connection');
const unidadesFamiliaService = require('../services/unidadesFamiliaService');

const PRAZO_CONVOCACAO_DIAS = 3;

function posicaoEstimada(fila, pontos) {
  const norm = Math.min(1, (Number(pontos) || 0) / 160);
  const posicao = Math.round(Number(fila) * (1 - norm) * 0.62) + 1;
  return Math.max(1, posicao);
}

async function montarStatus(inscricao) {
  const id = inscricao.id_inscricao;

  const [escolhas] = await pool.query(
    'SELECT * FROM inscricao_escolhas WHERE id_inscricao = ? ORDER BY ordem ASC',
    [id]
  );
  const [criterios] = await pool.query(
    'SELECT criterio_chave, fonte, pontos_maximos, pontos_obtidos, status FROM inscricao_criterios WHERE id_inscricao = ?',
    [id]
  );
  const [historico] = await pool.query(
    'SELECT tipo_evento, descricao, criado_em FROM inscricao_historico WHERE id_inscricao = ? ORDER BY criado_em ASC',
    [id]
  );

  const ofertada = escolhas.find((e) => !e.recusada) || null;
  const unidadesPorCodigo = new Map(
    unidadesFamiliaService.listarUnidadesElegiveis().map((u) => [u.codigo_unidade, u])
  );

  let convocacao = null;
  if (inscricao.fase === 'convocada' && ofertada) {
    const [convRows] = inscricao.id_convocacao
      ? await pool.query('SELECT data_convocacao, criado_em FROM convocacoes WHERE id_convocacao = ?', [
          inscricao.id_convocacao,
        ])
      : [[]];
    const dataConvocacao =
      (convRows[0] && (convRows[0].data_convocacao || convRows[0].criado_em)) || inscricao.atualizado_em;
    const fim = new Date(new Date(dataConvocacao).getTime() + PRAZO_CONVOCACAO_DIAS * 86400000);
    const faltaMs = fim.getTime() - Date.now();
    convocacao = {
      codigo_unidade: ofertada.codigo_unidade,
      data_convocacao: dataConvocacao,
      prazo_final: fim,
      prazo_expirado: faltaMs <= 0,
    };
  }

  return {
    protocolo: inscricao.protocolo,
    fase: inscricao.fase,
    desfecho: inscricao.desfecho,
    pontuacao_total: inscricao.pontuacao_total,
    indice_alcance_contato: inscricao.indice_alcance_contato,
    crianca_etapa: inscricao.crianca_etapa,
    escolhas: escolhas.map((e) => {
      const unidade = unidadesPorCodigo.get(e.codigo_unidade);
      return {
        ordem: e.ordem,
        codigo_unidade: e.codigo_unidade,
        nome: unidade ? unidade.nome : null,
        recusada: !!e.recusada,
        ofertada: ofertada && ofertada.id_escolha === e.id_escolha,
        posicao_estimada: posicaoEstimada(unidade ? unidade.fila : 0, inscricao.pontuacao_total),
        vagas: unidade ? unidade.vagas : null,
      };
    }),
    criterios,
    historico,
    convocacao,
  };
}

// GET /?protocolo=...&cpf=...  (req.inscricao populado por verifyProtocolo)
async function consultar(req, res, next) {
  try {
    const status = await montarStatus(req.inscricao);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

// POST /aceitar { protocolo, cpf }
async function aceitarConvocacao(req, res, next) {
  try {
    const inscricao = req.inscricao;
    if (inscricao.fase !== 'convocada') {
      return res.status(400).json({ success: false, error: 'Nao ha convocacao pendente para esta inscricao.' });
    }

    await pool.query(
      "UPDATE familias_inscricoes SET fase = 'matriculada', desfecho = 'confirmado' WHERE id_inscricao = ?",
      [inscricao.id_inscricao]
    );
    await pool.query(
      "INSERT INTO inscricao_historico (id_inscricao, tipo_evento, descricao) VALUES (?, 'aceite', 'Familia confirmou comparecimento.')",
      [inscricao.id_inscricao]
    );

    const status = await montarStatus({ ...inscricao, fase: 'matriculada', desfecho: 'confirmado' });
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

// POST /recusar { protocolo, cpf, motivo }
// Recusar NAO reordena as preferencias: so marca a unidade ofertada como
// recusada e a proxima preferencia nao recusada passa a ser a ofertada
// quando uma nova convocacao for feita. Pontuacao e posicao sao mantidas.
async function recusarConvocacao(req, res, next) {
  try {
    const inscricao = req.inscricao;
    const { motivo } = req.body || {};
    if (inscricao.fase !== 'convocada') {
      return res.status(400).json({ success: false, error: 'Nao ha convocacao pendente para esta inscricao.' });
    }

    const [escolhas] = await pool.query(
      'SELECT * FROM inscricao_escolhas WHERE id_inscricao = ? ORDER BY ordem ASC',
      [inscricao.id_inscricao]
    );
    const ofertada = escolhas.find((e) => !e.recusada);
    if (!ofertada) {
      return res.status(400).json({ success: false, error: 'Nenhuma unidade ofertada encontrada.' });
    }

    await pool.query(
      'UPDATE inscricao_escolhas SET recusada = TRUE, recusada_em = NOW(), motivo_recusa = ? WHERE id_escolha = ?',
      [motivo || null, ofertada.id_escolha]
    );
    await pool.query(
      "UPDATE familias_inscricoes SET fase = 'classificada', id_convocacao = NULL WHERE id_inscricao = ?",
      [inscricao.id_inscricao]
    );
    await pool.query(
      "INSERT INTO inscricao_historico (id_inscricao, tipo_evento, descricao) VALUES (?, 'recusa', ?)",
      [inscricao.id_inscricao, motivo || null]
    );

    const status = await montarStatus({ ...inscricao, fase: 'classificada', id_convocacao: null });
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

module.exports = { consultar, aceitarConvocacao, recusarConvocacao };
