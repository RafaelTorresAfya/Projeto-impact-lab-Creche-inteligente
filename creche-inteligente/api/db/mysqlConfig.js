// Monta a configuracao de conexao MySQL priorizando, nesta ordem:
// DB_URL > MYSQL_PUBLIC_URL > MYSQL_URL > DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
// Isso permite plugar direto uma URL do Railway (MYSQL_URL / MYSQL_PUBLIC_URL) ou
// variaveis separadas em outros ambientes.

function getConnectionUri() {
  return (
    process.env.DB_URL ||
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL ||
    null
  );
}

function getMysqlConfig() {
  const uri = getConnectionUri();

  if (uri) {
    return uri;
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

module.exports = { getMysqlConfig, getConnectionUri };
