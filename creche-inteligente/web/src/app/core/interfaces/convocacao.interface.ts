export type StatusConvocacao =
  | 'AGUARDANDO_CONVOCACAO'
  | 'CONVOCADO'
  | 'CONFIRMADO'
  | 'MATRICULADO'
  | 'DESISTIU'
  | 'EXPIRADO';

export interface Convocacao {
  id_convocacao?: number;
  codigo_unidade: string;
  nome_unidade?: string;
  nome_responsavel: string;
  nome_crianca: string;
  contato: string;
  ano: number;
  grupamento: string;
  status: StatusConvocacao;
  data_convocacao?: string;
  prazo_resposta?: string;
  observacao?: string;
  criado_em?: string;
  atualizado_em?: string;
}
