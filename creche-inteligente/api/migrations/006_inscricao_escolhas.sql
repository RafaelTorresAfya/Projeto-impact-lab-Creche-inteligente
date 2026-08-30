CREATE TABLE IF NOT EXISTS inscricao_escolhas (
  id_escolha INT AUTO_INCREMENT PRIMARY KEY,
  id_inscricao INT NOT NULL,
  ordem TINYINT NOT NULL,
  codigo_unidade CHAR(7) NOT NULL,
  score_calculado DECIMAL(6,2) NULL,
  recusada BOOLEAN NOT NULL DEFAULT FALSE,
  recusada_em DATETIME NULL,
  motivo_recusa VARCHAR(255) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_inscricao) REFERENCES familias_inscricoes(id_inscricao) ON DELETE CASCADE,
  UNIQUE KEY uq_ordem_por_inscricao (id_inscricao, ordem)
);
