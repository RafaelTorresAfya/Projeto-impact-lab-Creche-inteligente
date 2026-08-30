const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticacao ausente ou invalido.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token invalido ou expirado.',
    });
  }
}

function verifyPerfil(perfisPermitidos) {
  const permitidos = Array.isArray(perfisPermitidos)
    ? perfisPermitidos
    : [perfisPermitidos];

  return (req, res, next) => {
    if (!req.usuario || !permitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Voce nao tem permissao para executar esta acao.',
      });
    }
    next();
  };
}

module.exports = { verifyToken, verifyPerfil };
