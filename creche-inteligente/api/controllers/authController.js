const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

async function login(req, res, next) {
  try {
    const { email, senha } = req.body || {};

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Informe email e senha.',
      });
    }

    const [rows] = await pool.query(
      'SELECT id_usuario, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    const usuario = rows[0];

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais invalidas.',
      });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaConfere) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais invalidas.',
      });
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        usuario: {
          id_usuario: usuario.id_usuario,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
