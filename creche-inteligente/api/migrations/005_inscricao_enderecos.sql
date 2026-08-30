CREATE TABLE IF NOT EXISTS inscricao_enderecos (
  id_endereco INT AUTO_INCREMENT PRIMARY KEY,
  id_inscricao INT NOT NULL,
  tipo ENUM('residencia','trabalho','estudo','apoio','irmao') NOT NULL,
  prioridade ENUM('alta','media','baixa') NOT NULL,
  bairro VARCHAR(80) NOT NULL,
  logradouro VARCHAR(150) NULL,
  numero VARCHAR(20) NULL,
  dias_semana TINYINT NOT NULL DEFAULT 5,
  lat DECIMAL(9,6) NULL,
  lng DECIMAL(9,6) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_inscricao) REFERENCES familias_inscricoes(id_inscricao) ON DELETE CASCADE,
  UNIQUE KEY uq_prioridade_por_inscricao (id_inscricao, prioridade)
);
