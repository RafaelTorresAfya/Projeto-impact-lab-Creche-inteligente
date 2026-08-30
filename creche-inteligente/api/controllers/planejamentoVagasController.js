const pool = require('../db/connection');

async function listar(req, res, next) {
  try {
    const { ano_letivo, codigo_unidade, status } = req.query;
    const condicoes = [];
    const params = [];

    if (ano_letivo !== undefined) {
      condicoes.push('ano_letivo = ?');
      params.push(ano_letivo);
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
      `SELECT * FROM planejamento_vagas ${where} ORDER BY id_planejamento DESC`,
      params
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
      'SELECT * FROM planejamento_vagas WHERE id_planejamento = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Planejamento nao encontrado.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const {
      ano_letivo,
      codigo_unidade,
      cod_territ,
      grupamento,
      turno,
      vagas_planejadas,
      vagas_referencia_fila_anterior,
      justificativa,
      status,
    } = req.body || {};

    if (!ano_letivo || !grupamento || !turno || vagas_planejadas === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatorios: ano_letivo, grupamento, turno, vagas_planejadas.',
      });
    }

    const id_usuario_responsavel = req.usuario.id_usuario;

    const [result] = await pool.query(
      `INSERT INTO planejamento_vagas
        (ano_letivo, codigo_unidade, cod_territ, grupamento, turno, vagas_planejadas,
         vagas_referencia_fila_anterior, justificativa, status, id_usuario_responsavel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ano_letivo,
        codigo_unidade || null,
        cod_territ || null,
        grupamento,
        turno,
        vagas_planejadas,
        vagas_referencia_fila_anterior ?? null,
        justificativa || null,
        status || 'rascunho',
        id_usuario_responsavel,
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM planejamento_vagas WHERE id_planejamento = ?',
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
      'ano_letivo',
      'codigo_unidade',
      'cod_territ',
      'grupamento',
      'turno',
      'vagas_planejadas',
      'vagas_referencia_fila_anterior',
      'justificativa',
      'status',
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
      `UPDATE planejamento_vagas SET ${atualizacoes.join(', ')} WHERE id_planejamento = ?`,
      params
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: 'Planejamento nao encontrado.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM planejamento_vagas WHERE id_planejamento = ?',
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
      'DELETE FROM planejamento_vagas WHERE id_planejamento = ?',
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: 'Planejamento nao encontrado.' });
    }

    res.json({ success: true, data: { id_planejamento: Number(id) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
