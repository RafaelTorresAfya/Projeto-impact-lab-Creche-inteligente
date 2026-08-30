CREATE TABLE IF NOT EXISTS inscricao_historico (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_inscricao INT NOT NULL,
  tipo_evento ENUM('criada','validada','classificada','convocada','aceite','recusa','matriculada','prazo_perdido') NOT NULL,
  descricao VARCHAR(255) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_inscricao) REFERENCES familias_inscricoes(id_inscricao) ON DELETE CASCADE
);
