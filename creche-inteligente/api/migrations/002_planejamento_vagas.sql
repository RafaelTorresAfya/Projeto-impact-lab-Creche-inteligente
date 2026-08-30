CREATE TABLE IF NOT EXISTS planejamento_vagas (
  id_planejamento INT AUTO_INCREMENT PRIMARY KEY,
  ano_letivo SMALLINT NOT NULL,
  codigo_unidade CHAR(7) NULL,
  cod_territ VARCHAR(10) NULL,
  grupamento VARCHAR(60) NOT NULL,
  turno ENUM('Integral','Parcial') NOT NULL,
  vagas_planejadas INT NOT NULL,
  vagas_referencia_fila_anterior INT NULL,
  justificativa TEXT NULL,
  status ENUM('rascunho','aprovado','publicado') NOT NULL DEFAULT 'rascunho',
  id_usuario_responsavel INT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario_responsavel) REFERENCES usuarios(id_usuario)
);
