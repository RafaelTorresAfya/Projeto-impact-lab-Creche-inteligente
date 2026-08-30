require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db/connection');

// Uso: node scripts/seed-usuarios.js [email] [senha] [nome]
// Se os argumentos nao forem passados, usa as variaveis SEED_ADMIN_* do .env.
async function seed() {
  const nome = process.argv[4] || process.env.SEED_ADMIN_NOME || 'Administrador';
  const email = process.argv[2] || process.env.SEED_ADMIN_EMAIL;
  const senha = process.argv[3] || process.env.SEED_ADMIN_SENHA;

  if (!email || !senha) {
    console.error('Informe email e senha via argv ou SEED_ADMIN_EMAIL/SEED_ADMIN_SENHA no .env');
    process.exitCode = 1;
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
     VALUES (?, ?, ?, 'ADMIN', TRUE)
     ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash), nome = VALUES(nome)`,
    [nome, email, senhaHash]
  );

  console.log(`Usuario ADMIN criado/atualizado: ${email}`);
}

seed()
  .catch((err) => {
    console.error('Erro ao criar usuario seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
