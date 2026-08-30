require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db/connection');

async function executarMigrations() {
  const dir = path.join(__dirname, '..', 'migrations');
  const arquivos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Encontradas ${arquivos.length} migrations em ${dir}`);

  for (const arquivo of arquivos) {
    const caminho = path.join(dir, arquivo);
    const sql = fs.readFileSync(caminho, 'utf8');
    console.log(`Executando ${arquivo}...`);
    try {
      await pool.query(sql);
      console.log(`OK: ${arquivo}`);
    } catch (err) {
      console.error(`Falhou: ${arquivo} ->`, err.message);
      process.exitCode = 1;
      return;
    }
  }

  console.log('Todas as migrations foram executadas.');
}

executarMigrations()
  .catch((err) => {
    console.error('Erro inesperado ao executar migrations:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
