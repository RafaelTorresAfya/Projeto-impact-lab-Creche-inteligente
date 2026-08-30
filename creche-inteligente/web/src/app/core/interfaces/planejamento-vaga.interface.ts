export interface PlanejamentoVaga {
  id_planejamento?: number;
  ano: number;
  codigo_unidade: string;
  nome_unidade?: string;
  grupamento: string;
  turno: string;
  vagas_planejadas: number;
  observacao?: string;
  criado_em?: string;
  atualizado_em?: string;
}
