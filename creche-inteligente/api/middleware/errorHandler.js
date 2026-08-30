// Handler de erro padrao: nunca expor stack trace ao cliente.
function errorHandler(err, req, res, next) {
  console.error('[erro]', err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Erro interno do servidor.' : err.message,
  });
}

module.exports = errorHandler;
