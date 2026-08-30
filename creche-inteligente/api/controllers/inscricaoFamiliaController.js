const pool = require('../db/connection');
const validacao = require('../services/validacaoService');
const geo = require('../services/geoService');
const bairrosRio = require('../services/bairrosRio');
const criteriosConfig = require('../services/criteriosConfig');
const protocoloService = require('../services/protocoloService');
const unidadesFamiliaService = require('../services/unidadesFamiliaService');

// Parametros do ciclo de inscricao atual. Hardcoded por decisao de escopo
// (ver plano de implementacao, item D5) — mover para tabela de configuracao
// quando houver mais de um ciclo letivo ativo ao mesmo tempo.
const CICLO_ATUAL = {
  ano_letivo: 2026,
  data_corte: new Date(2026, 2, 31), // 31/03/2026
};

const TIPOS_ENDERECO = ['residencia', 'trabalho', 'estudo', 'apoio', 'irmao'];
const PRIORIDADES = ['alta', 'media', 'baixa'];

function erro(res, status, mensagem) {
  return res.status(status).json({ success: false, error: mensagem });
}

async function buscarInscricaoDoResponsavel(id, responsavel_cpf) {
  const [rows] = await pool.query(
    'SELECT * FROM familias_inscricoes WHERE id_inscricao = ? AND responsavel_cpf = ?',
    [id, apenasDigitosOuVazio(responsavel_cpf)]
  );
  return rows[0] || null;
}

function apenasDigitosOuVazio(v) {
  return validacao.apenasDigitos(v);
}

async function recalcularPontuacao(id_inscricao) {
  const [criterios] = await pool.query(
    'SELECT pontos_obtidos FROM inscricao_criterios WHERE id_inscricao = ?',
    [id_inscricao]
  );
  const total = criterios.reduce((acc, c) => acc + (Number(c.pontos_obtidos) || 0), 0);
  await pool.query('UPDATE familias_inscricoes SET pontuacao_total = ? WHERE id_inscricao = ?', [
    total,
    id_inscricao,
  ]);
  return total;
}

async function registrarHistorico(id_inscricao, tipo_evento, descricao = null) {
  await pool.query(
    'INSERT INTO inscricao_historico (id_inscricao, tipo_evento, descricao) VALUES (?, ?, ?)',
    [id_inscricao, tipo_evento, descricao]
  );
}

// POST /rascunho
async function criarRascunho(req, res, next) {
  try {
    const { responsavel_cpf, crianca } = req.body || {};
    const cpfResponsavel = validacao.apenasDigitos(responsavel_cpf);

    if (!validacao.cpfValido(cpfResponsavel)) {
      return erro(res, 400, 'CPF do responsavel invalido.');
    }
    if (!crianca || !crianca.nome || String(crianca.nome).trim().length <= 3) {
      return erro(res, 400, 'Informe o nome completo da crianca.');
    }
    if (!crianca.nascimento) {
      return erro(res, 400, 'Informe a data de nascimento da crianca.');
    }

    const etapa = validacao.calcularEtapa(crianca.nascimento, CICLO_ATUAL.data_corte);
    if (!etapa) {
      return erro(res, 400, 'Data de nascimento invalida.');
    }

    const criancaCpf = crianca.cpf ? validacao.apenasDigitos(crianca.cpf) : null;
    if (criancaCpf && !validacao.cpfValido(criancaCpf)) {
      return erro(res, 400, 'CPF da crianca invalido.');
    }

    const pcdTipos = crianca.pcd && Array.isArray(crianca.pcd_tipos) ? crianca.pcd_tipos : [];
    if (crianca.pcd && !pcdTipos.length) {
      return erro(res, 400, 'Selecione ao menos uma condicao para a crianca com deficiencia.');
    }

    const [result] = await pool.query(
      `INSERT INTO familias_inscricoes
        (responsavel_cpf, crianca_nome, crianca_cpf, crianca_nascimento, crianca_sexo,
         crianca_pcd, crianca_pcd_tipos, crianca_etapa, data_corte)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cpfResponsavel,
        String(crianca.nome).trim(),
        criancaCpf,
        crianca.nascimento,
        crianca.sexo || 'NAO_INFORMADO',
        !!crianca.pcd,
        pcdTipos.length ? JSON.stringify(pcdTipos) : null,
        etapa,
        CICLO_ATUAL.data_corte.toISOString().slice(0, 10),
      ]
    );

    await registrarHistorico(result.insertId, 'criada');

    res.status(201).json({
      success: true,
      data: { id_inscricao: result.insertId, etapa },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/crianca
async function atualizarCrianca(req, res, next) {
  try {
    const { id } = req.params;
    const { responsavel_cpf, crianca } = req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');
    if (!crianca) return erro(res, 400, 'Dados da crianca ausentes.');

    if (!crianca.nome || String(crianca.nome).trim().length <= 3) {
      return erro(res, 400, 'Informe o nome completo da crianca.');
    }
    const etapa = validacao.calcularEtapa(crianca.nascimento, CICLO_ATUAL.data_corte);
    if (!etapa) return erro(res, 400, 'Data de nascimento invalida.');

    const criancaCpf = crianca.cpf ? validacao.apenasDigitos(crianca.cpf) : null;
    if (criancaCpf && !validacao.cpfValido(criancaCpf)) {
      return erro(res, 400, 'CPF da crianca invalido.');
    }

    const pcdTipos = crianca.pcd && Array.isArray(crianca.pcd_tipos) ? crianca.pcd_tipos : [];
    if (crianca.pcd && !pcdTipos.length) {
      return erro(res, 400, 'Selecione ao menos uma condicao para a crianca com deficiencia.');
    }

    await pool.query(
      `UPDATE familias_inscricoes SET
        crianca_nome = ?, crianca_cpf = ?, crianca_nascimento = ?, crianca_sexo = ?,
        crianca_pcd = ?, crianca_pcd_tipos = ?, crianca_etapa = ?
       WHERE id_inscricao = ?`,
      [
        String(crianca.nome).trim(),
        criancaCpf,
        crianca.nascimento,
        crianca.sexo || 'NAO_INFORMADO',
        !!crianca.pcd,
        pcdTipos.length ? JSON.stringify(pcdTipos) : null,
        etapa,
        id,
      ]
    );

    res.json({ success: true, data: { id_inscricao: Number(id), etapa } });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/enderecos
async function atualizarEnderecos(req, res, next) {
  try {
    const { id } = req.params;
    const { responsavel_cpf, enderecos } = req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');

    if (!Array.isArray(enderecos) || !enderecos.length) {
      return erro(res, 400, 'Informe ao menos um endereco de referencia.');
    }
    if (enderecos.length > 3) {
      return erro(res, 400, 'No maximo 3 enderecos de referencia.');
    }
    if (enderecos[0].tipo !== 'residencia') {
      return erro(res, 400, 'O primeiro endereco deve ser a residencia da crianca.');
    }

    const prioridadesUsadas = new Set();
    const resolvidos = [];
    for (const e of enderecos) {
      if (!TIPOS_ENDERECO.includes(e.tipo)) return erro(res, 400, `Tipo de endereco invalido: ${e.tipo}`);
      if (!PRIORIDADES.includes(e.prioridade)) return erro(res, 400, `Prioridade invalida: ${e.prioridade}`);
      if (prioridadesUsadas.has(e.prioridade)) {
        return erro(res, 400, 'Cada grau de prioridade so pode ser usado uma vez.');
      }
      prioridadesUsadas.add(e.prioridade);

      if (!e.bairro) return erro(res, 400, 'Informe o bairro de cada endereco.');
      const bairro = bairrosRio.buscarBairro(e.bairro);
      if (!bairro) return erro(res, 400, `Bairro nao reconhecido: ${e.bairro}`);

      resolvidos.push({
        tipo: e.tipo,
        prioridade: e.prioridade,
        bairro: bairro.nome,
        logradouro: e.logradouro || null,
        numero: e.numero || null,
        dias_semana: Math.min(7, Math.max(1, Number(e.dias_semana) || 5)),
        lat: bairro.lat,
        lng: bairro.lng,
      });
    }

    await pool.query('DELETE FROM inscricao_enderecos WHERE id_inscricao = ?', [id]);
    for (const e of resolvidos) {
      await pool.query(
        `INSERT INTO inscricao_enderecos
          (id_inscricao, tipo, prioridade, bairro, logradouro, numero, dias_semana, lat, lng)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, e.tipo, e.prioridade, e.bairro, e.logradouro, e.numero, e.dias_semana, e.lat, e.lng]
      );
    }

    res.json({ success: true, data: { id_inscricao: Number(id), enderecos: resolvidos } });
  } catch (err) {
    next(err);
  }
}

// GET /:id/recomendacoes?responsavel_cpf=...
async function recomendarUnidades(req, res, next) {
  try {
    const { id } = req.params;
    const inscricao = await buscarInscricaoDoResponsavel(id, req.query.responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');

    const [enderecos] = await pool.query(
      'SELECT * FROM inscricao_enderecos WHERE id_inscricao = ?',
      [id]
    );
    if (!enderecos.length) {
      return erro(res, 400, 'Cadastre os enderecos de referencia antes de recomendar unidades.');
    }

    const referencias = enderecos.map((e) => ({
      lat: Number(e.lat),
      lng: Number(e.lng),
      prioridade: e.prioridade,
      dias_semana: e.dias_semana,
    }));

    const unidades = unidadesFamiliaService.listarUnidadesElegiveis().filter((u) => !u.sem_localizacao);
    const ranking = geo.ranquearUnidades(referencias, unidades);

    const resultado = ranking.slice(0, 20).map((r) => ({
      codigo_unidade: r.unidade.codigo_unidade,
      nome: r.unidade.nome,
      bairro: r.unidade.bairro,
      vagas: r.unidade.vagas,
      fila: r.unidade.fila,
      geo_aproximado: r.unidade.geo_aproximado,
      score: Number(r.score.toFixed(2)),
      distancia_km: Number(r.maisProxima.d.toFixed(2)),
      nivel_pressao: r.nivelPressao,
    }));

    res.json({ success: true, data: resultado, total: resultado.length });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/escolhas
async function atualizarEscolhas(req, res, next) {
  try {
    const { id } = req.params;
    const { responsavel_cpf, escolhas, fora } = req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');

    const listaEscolhas = Array.isArray(escolhas) ? escolhas : [];
    if (listaEscolhas.length > 3) return erro(res, 400, 'No maximo 3 unidades escolhidas.');

    for (const codigo of listaEscolhas) {
      if (!unidadesFamiliaService.existeUnidade(codigo)) {
        return erro(res, 400, `Unidade nao encontrada: ${codigo}`);
      }
    }

    const forcaExcecao = !!(fora && fora.ativo);
    if (forcaExcecao && (!fora.motivo || String(fora.motivo).trim().length < 15)) {
      return erro(res, 400, 'Explique em pelo menos 15 caracteres o motivo do pedido fora da recomendacao.');
    }
    if (!listaEscolhas.length && !forcaExcecao) {
      return erro(res, 400, 'Escolha ao menos uma unidade ou registre um pedido fora da recomendacao.');
    }

    const [enderecos] = await pool.query(
      'SELECT * FROM inscricao_enderecos WHERE id_inscricao = ?',
      [id]
    );
    const referencias = enderecos.map((e) => ({
      lat: Number(e.lat),
      lng: Number(e.lng),
      prioridade: e.prioridade,
      dias_semana: e.dias_semana,
    }));
    const unidadesPorCodigo = new Map(
      unidadesFamiliaService.listarUnidadesElegiveis().map((u) => [u.codigo_unidade, u])
    );

    await pool.query('DELETE FROM inscricao_escolhas WHERE id_inscricao = ?', [id]);
    let ordem = 1;
    for (const codigo of listaEscolhas) {
      const unidade = unidadesPorCodigo.get(codigo);
      const resultado = unidade && !unidade.sem_localizacao ? geo.calcularScore(referencias, unidade) : null;
      await pool.query(
        `INSERT INTO inscricao_escolhas (id_inscricao, ordem, codigo_unidade, score_calculado)
         VALUES (?, ?, ?, ?)`,
        [id, ordem, codigo, resultado ? Number(resultado.score.toFixed(2)) : null]
      );
      ordem++;
    }

    await pool.query(
      'UPDATE familias_inscricoes SET fora_recomendacao = ?, fora_motivo = ? WHERE id_inscricao = ?',
      [forcaExcecao, forcaExcecao ? String(fora.motivo).trim() : null, id]
    );

    res.json({ success: true, data: { id_inscricao: Number(id), escolhas: listaEscolhas } });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/criterios
async function atualizarCriterios(req, res, next) {
  try {
    const { id } = req.params;
    const { responsavel_cpf, criterios, executar_consulta_automatica, renda_valor, pessoas_domicilio } =
      req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');

    // Consulta automatica simulada as bases da assistencia social, na mesma
    // logica do prototipo (semente a partir do CPF da crianca/responsavel).
    let consultaAutomatica = null;
    if (executar_consulta_automatica) {
      const semente = protocoloService.hashStr(inscricao.crianca_cpf || inscricao.responsavel_cpf || 'semente');
      consultaAutomatica = {
        cadunico: semente % 3 !== 0,
        bolsa: semente % 3 !== 0 && semente % 2 === 0,
      };
    }

    const entradas = criterios && typeof criterios === 'object' ? criterios : {};
    for (const chave of Object.keys(entradas)) {
      const config = criteriosConfig.buscarCriterio(chave);
      if (!config) return erro(res, 400, `Criterio invalido: ${chave}`);

      const marcado = !!entradas[chave].on;
      const [existente] = await pool.query(
        'SELECT * FROM inscricao_criterios WHERE id_inscricao = ? AND criterio_chave = ?',
        [id, chave]
      );

      if (!marcado) {
        if (existente.length) {
          await pool.query(
            'DELETE FROM inscricao_criterios WHERE id_inscricao = ? AND criterio_chave = ?',
            [id, chave]
          );
        }
        continue;
      }

      let verificado = false;
      if (config.fonte === 'automatica' && consultaAutomatica && chave in consultaAutomatica) {
        verificado = consultaAutomatica[chave];
      } else if (existente.length) {
        verificado = existente[0].status === 'verificado';
      }

      const temDocumento = existente.length && !!existente[0].documento_nome;
      const confianca = existente.length ? existente[0].confianca_ocr : null;
      const avaliacao = criteriosConfig.avaliarCriterio(chave, {
        verificado,
        confiancaOcr: confianca,
        temDocumento,
      });

      if (existente.length) {
        await pool.query(
          `UPDATE inscricao_criterios SET status = ?, pontos_obtidos = ?, verificado_em = ?
           WHERE id_inscricao = ? AND criterio_chave = ?`,
          [avaliacao.status, avaliacao.pontos, verificado ? new Date() : existente[0].verificado_em, id, chave]
        );
      } else {
        await pool.query(
          `INSERT INTO inscricao_criterios
            (id_inscricao, criterio_chave, fonte, pontos_maximos, pontos_obtidos, status, verificado_em)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, chave, config.fonte, config.pontos, avaliacao.pontos, avaliacao.status, verificado ? new Date() : null]
        );
      }
    }

    if (renda_valor !== undefined || pessoas_domicilio !== undefined) {
      await pool.query(
        'UPDATE familias_inscricoes SET renda_valor = ?, pessoas_domicilio = ? WHERE id_inscricao = ?',
        [renda_valor || null, pessoas_domicilio || null, id]
      );
    }

    const pontuacao_total = await recalcularPontuacao(id);

    res.json({ success: true, data: { id_inscricao: Number(id), pontuacao_total, consulta_automatica: consultaAutomatica } });
  } catch (err) {
    next(err);
  }
}

// POST /:id/criterios/:chave/documento
async function simularDocumento(req, res, next) {
  try {
    const { id, chave } = req.params;
    const { responsavel_cpf, nome_arquivo, tamanho } = req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');

    const config = criteriosConfig.buscarCriterio(chave);
    if (!config) return erro(res, 400, `Criterio invalido: ${chave}`);
    if (!nome_arquivo || !tamanho) return erro(res, 400, 'Informe nome e tamanho do arquivo.');

    const confianca = protocoloService.simularConfiancaOcr(nome_arquivo, tamanho, chave);

    const [existente] = await pool.query(
      'SELECT * FROM inscricao_criterios WHERE id_inscricao = ? AND criterio_chave = ?',
      [id, chave]
    );
    const verificado = existente.length && existente[0].status === 'verificado';
    const avaliacao = criteriosConfig.avaliarCriterio(chave, {
      verificado,
      confiancaOcr: confianca,
      temDocumento: true,
    });

    if (existente.length) {
      await pool.query(
        `UPDATE inscricao_criterios
         SET status = ?, pontos_obtidos = ?, confianca_ocr = ?, documento_nome = ?
         WHERE id_inscricao = ? AND criterio_chave = ?`,
        [avaliacao.status, avaliacao.pontos, confianca, nome_arquivo, id, chave]
      );
    } else {
      await pool.query(
        `INSERT INTO inscricao_criterios
          (id_inscricao, criterio_chave, fonte, pontos_maximos, pontos_obtidos, status, confianca_ocr, documento_nome)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, chave, config.fonte, config.pontos, avaliacao.pontos, avaliacao.status, confianca, nome_arquivo]
      );
    }

    const pontuacao_total = await recalcularPontuacao(id);

    res.json({
      success: true,
      data: { id_inscricao: Number(id), chave, confianca, status: avaliacao.status, pontuacao_total },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/contato
async function atualizarContato(req, res, next) {
  try {
    const { id } = req.params;
    const { responsavel_cpf, contato, assistido } = req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');
    if (!contato) return erro(res, 400, 'Dados de contato ausentes.');

    if (!contato.nome || String(contato.nome).trim().length <= 3) {
      return erro(res, 400, 'Informe o nome completo do contato principal.');
    }
    if (!validacao.telefoneValido(contato.telefone)) {
      return erro(res, 400, 'Telefone do contato principal invalido.');
    }
    if (!contato.parentesco) return erro(res, 400, 'Informe o parentesco do contato principal.');
    const cpfContato = validacao.apenasDigitos(contato.cpf);
    if (!validacao.cpfValido(cpfContato)) return erro(res, 400, 'CPF do contato principal invalido.');

    if (!contato.nome2 || String(contato.nome2).trim().length <= 3) {
      return erro(res, 400, 'Informe o nome completo do segundo contato.');
    }
    if (!validacao.telefoneValido(contato.telefone2)) {
      return erro(res, 400, 'Telefone do segundo contato invalido.');
    }
    if (!contato.parentesco2) return erro(res, 400, 'Informe o parentesco do segundo contato.');

    if (contato.arroba_whatsapp && !validacao.arrobaValido(contato.arroba_whatsapp)) {
      return erro(res, 400, 'Formato do @ do WhatsApp invalido.');
    }
    if (contato.email && !validacao.emailValido(contato.email)) {
      return erro(res, 400, 'E-mail invalido.');
    }

    await pool.query(
      `INSERT INTO inscricao_contatos
        (id_inscricao, nome, cpf, parentesco, telefone, whatsapp_ativo, arroba_whatsapp, arroba_status,
         email, nome2, telefone2, whatsapp2_ativo, parentesco2, arroba2, canal_preferido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        nome=VALUES(nome), cpf=VALUES(cpf), parentesco=VALUES(parentesco), telefone=VALUES(telefone),
        whatsapp_ativo=VALUES(whatsapp_ativo), arroba_whatsapp=VALUES(arroba_whatsapp),
        arroba_status=VALUES(arroba_status), email=VALUES(email), nome2=VALUES(nome2),
        telefone2=VALUES(telefone2), whatsapp2_ativo=VALUES(whatsapp2_ativo),
        parentesco2=VALUES(parentesco2), arroba2=VALUES(arroba2), canal_preferido=VALUES(canal_preferido)`,
      [
        id,
        String(contato.nome).trim(),
        cpfContato,
        contato.parentesco,
        validacao.apenasDigitos(contato.telefone),
        !!contato.whatsapp_ativo,
        contato.arroba_whatsapp || null,
        contato.arroba_status || 'nao_verificado',
        contato.email || null,
        String(contato.nome2).trim(),
        validacao.apenasDigitos(contato.telefone2),
        contato.whatsapp2_ativo === undefined ? true : !!contato.whatsapp2_ativo,
        contato.parentesco2,
        contato.arroba2 || null,
        contato.canal_preferido || 'whatsapp',
      ]
    );

    const indice = validacao.calcularIndiceAlcance({
      telefone: contato.telefone,
      whatsapp_ativo: contato.whatsapp_ativo,
      arroba_whatsapp: contato.arroba_whatsapp,
      arroba_status: contato.arroba_status,
      email: contato.email,
      telefone2: contato.telefone2,
      arroba2: contato.arroba2,
      assistido: assistido !== undefined ? assistido : inscricao.assistido,
    });

    await pool.query(
      'UPDATE familias_inscricoes SET indice_alcance_contato = ?, assistido = ? WHERE id_inscricao = ?',
      [indice.total, assistido !== undefined ? !!assistido : !!inscricao.assistido, id]
    );

    res.json({ success: true, data: { id_inscricao: Number(id), indice_alcance: indice } });
  } catch (err) {
    next(err);
  }
}

// POST /:id/enviar
async function enviarInscricao(req, res, next) {
  try {
    const { id } = req.params;
    const { responsavel_cpf, lgpd_aceite, prazo_aceite } = req.body || {};
    const inscricao = await buscarInscricaoDoResponsavel(id, responsavel_cpf);
    if (!inscricao) return erro(res, 404, 'Inscricao nao encontrada.');

    if (!lgpd_aceite || !prazo_aceite) {
      return erro(res, 400, 'E preciso aceitar os termos de privacidade e o prazo de convocacao.');
    }

    const [enderecos] = await pool.query('SELECT * FROM inscricao_enderecos WHERE id_inscricao = ?', [id]);
    if (!enderecos.length) return erro(res, 400, 'Cadastre os enderecos de referencia.');

    const [escolhas] = await pool.query('SELECT * FROM inscricao_escolhas WHERE id_inscricao = ?', [id]);
    if (!escolhas.length && !inscricao.fora_recomendacao) {
      return erro(res, 400, 'Escolha ao menos uma unidade ou registre um pedido fora da recomendacao.');
    }

    const [contatos] = await pool.query('SELECT * FROM inscricao_contatos WHERE id_inscricao = ?', [id]);
    if (!contatos.length) return erro(res, 400, 'Cadastre os contatos da familia.');

    const pontuacao_total = await recalcularPontuacao(id);
    const protocolo = protocoloService.gerarProtocolo(CICLO_ATUAL.ano_letivo, id);

    await pool.query(
      `UPDATE familias_inscricoes SET
        protocolo = ?, lgpd_aceite = TRUE, prazo_aceite = TRUE, fase = 'validacao',
        desfecho = 'em_fila', enviado_em = NOW()
       WHERE id_inscricao = ?`,
      [protocolo, id]
    );

    await registrarHistorico(id, 'validada', 'Inscricao enviada pela familia.');

    res.json({ success: true, data: { id_inscricao: Number(id), protocolo, pontuacao_total } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  criarRascunho,
  atualizarCrianca,
  atualizarEnderecos,
  recomendarUnidades,
  atualizarEscolhas,
  atualizarCriterios,
  simularDocumento,
  atualizarContato,
  enviarInscricao,
};
