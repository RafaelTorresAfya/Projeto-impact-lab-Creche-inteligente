CREATE TABLE IF NOT EXISTS inscricao_criterios (
  id_criterio_inscricao INT AUTO_INCREMENT PRIMARY KEY,
  id_inscricao INT NOT NULL,
  criterio_chave ENUM('violencia','acolhimento','deficiencia','cadunico','bolsa','renda','monoparental','trabalho','irmao') NOT NULL,
  fonte ENUM('automatica','documento','declarada') NOT NULL,
  pontos_maximos TINYINT NOT NULL,
  pontos_obtidos TINYINT NOT NULL DEFAULT 0,
  status ENUM('pendente','aguardando_consulta','em_revisao_humana','verificado','documento_lido','declarado') NOT NULL DEFAULT 'pendente',
  confianca_ocr DECIMAL(4,3) NULL,
  documento_nome VARCHAR(255) NULL,
  verificado_em DATETIME NULL,
  verificado_por VARCHAR(120) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_inscricao) REFERENCES familias_inscricoes(id_inscricao) ON DELETE CASCADE,
  UNIQUE KEY uq_criterio_por_inscricao (id_inscricao, criterio_chave)
);
