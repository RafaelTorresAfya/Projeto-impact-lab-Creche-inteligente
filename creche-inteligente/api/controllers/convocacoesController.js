const pool = require('../db/connection');

async function listar(req, res, next) {
  try {
    const { ano, codigo_unidade, status } = req.query;
    const condicoes = [];
    const params = [];

    if (ano !== undefined) {
      condicoes.push('ano = ?');
      params.push(ano);
    }
    if (codigo_unidade !== undefined) {
      condicoes.push('codigo_unidade = ?');
      params.push(codigo_unidade);
    }
    if (status !== undefined) {
      condicoes.push('status = ?');
      params.push(status);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM convocacoes ${where} ORDER BY id_convocacao DESC`,
      params
    );

    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
}

async function alertasPrazo(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM convocacoes
       WHERE prazo_confirmacao <= CURDATE() + INTERVAL 3 DAY
         AND status NOT IN ('confirmado', 'matriculado', 'prazo_perdido', 'desistiu')
       ORDER BY prazo_confirmacao ASC`
    );

    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM convocacoes WHERE id_convocacao = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Convocacao nao encontrada.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const {
      aluno_anon,
      responsavel_anon,
      ano,
      codigo_unidade,
      grupamento,
      turno,
      status,
      data_convocacao,
      prazo_confirmacao,
      data_confirmacao,
      data_matricula,
      canal_convocacao,
      observacoes,
    } = req.body || {};

    if (!aluno_anon || !ano || !codigo_unidade) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatorios: aluno_anon, ano, codigo_unidade.',
      });
    }

    const id_usuario_responsavel = req.usuario.id_usuario;

    const [result] = await pool.query(
      `INSERT INTO convocacoes
        (aluno_anon, responsavel_anon, ano, codigo_unidade, grupamento, turno, status,
         data_convocacao, prazo_confirmacao, data_confirmacao, data_matricula,
         canal_convocacao, observacoes, id_usuario_responsavel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        aluno_anon,
        responsavel_anon || null,
        ano,
        codigo_unidade,
        grupamento || null,
        turno || null,
        status || 'fila',
        data_convocacao || null,
        prazo_confirmacao || null,
        data_confirmacao || null,
        data_matricula || null,
        canal_convocacao || null,
        observacoes || null,
        id_usuario_responsavel,
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM convocacoes WHERE id_convocacao = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const campos = [
      'aluno_anon',
      'responsavel_anon',
      'ano',
      'codigo_unidade',
      'grupamento',
      'turno',
      'status',
      'data_convocacao',
      'prazo_confirmacao',
      'data_confirmacao',
      'data_matricula',
      'canal_convocacao',
      'observacoes',
    ];

    const atualizacoes = [];
    const params = [];

    for (const campo of campos) {
      if (req.body && req.body[campo] !== undefined) {
        atualizacoes.push(`${campo} = ?`);
        params.push(req.body[campo]);
      }
    }

    if (!atualizacoes.length) {
      return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar.' });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE convocacoes SET ${atualizacoes.join(', ')} WHERE id_convocacao = ?`,
      params
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: 'Convocacao nao encontrada.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM convocacoes WHERE id_convocacao = ?',
      [id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM convocacoes WHERE id_convocacao = ?',
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: 'Convocacao nao encontrada.' });
    }

    res.json({ success: true, data: { id_convocacao: Number(id) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, alertasPrazo, buscarPorId, criar, atualizar, remover };
