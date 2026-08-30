const mysql = require('mysql2');
const { getMysqlConfig } = require('./mysqlConfig');

const config = getMysqlConfig();

// createPool nao abre conexao imediatamente (conexao e "lazy"): so conecta de
// fato quando a primeira query e executada. Isso permite a API subir mesmo
// sem um DB_URL valido configurado ainda (uso no dashboard/mapa nao depende de MySQL).
const rawPool = typeof config === 'string'
  ? mysql.createPool(config)
  : mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

// Evita que erros assincronos do pool (ex: conexao perdida, host invalido)
// derrubem o processo inteiro.
rawPool.on('error', (err) => {
  console.error('[mysql pool] erro assincrono:', err.message);
});

const pool = rawPool.promise();

module.exports = pool;
