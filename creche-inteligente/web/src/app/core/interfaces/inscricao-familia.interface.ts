export interface CriancaPayload {
  nome: string;
  cpf?: string;
  nascimento: string;
  sexo?: 'F' | 'M' | 'NAO_INFORMADO';
  pcd?: boolean;
  pcd_tipos?: string[];
}

export interface EnderecoReferencia {
  tipo: 'residencia' | 'trabalho' | 'estudo' | 'apoio' | 'irmao';
  prioridade: 'alta' | 'media' | 'baixa';
  bairro: string;
  logradouro?: string;
  numero?: string;
  dias_semana: number;
}

export interface UnidadeRecomendada {
  codigo_unidade: string;
  nome: string;
  bairro: string | null;
  vagas: number;
  fila: number;
  geo_aproximado: boolean | null;
  score: number;
  distancia_km: number;
  nivel_pressao: 'alta' | 'media' | 'baixa';
}

export interface ContatoFamilia {
  nome: string;
  cpf: string;
  parentesco: string;
  telefone: string;
  whatsapp_ativo: boolean;
  arroba_whatsapp?: string;
  arroba_status?: 'nao_verificado' | 'verificado' | 'invalido';
  email?: string;
  nome2: string;
  telefone2: string;
  whatsapp2_ativo?: boolean;
  parentesco2: string;
  arroba2?: string;
  canal_preferido?: 'whatsapp' | 'telefone' | 'email' | 'presencial';
}

export interface CriterioVulnerabilidade {
  criterio_chave: string;
  fonte: 'automatica' | 'documento' | 'declarada';
  pontos_maximos: number;
  pontos_obtidos: number;
  status: string;
}

export interface EscolhaStatus {
  ordem: number;
  codigo_unidade: string;
  nome: string | null;
  recusada: boolean;
  ofertada: boolean;
  posicao_estimada: number;
  vagas: number | null;
}

export interface ConvocacaoStatus {
  codigo_unidade: string;
  data_convocacao: string | null;
  prazo_final: string;
  prazo_expirado: boolean;
}

export interface StatusInscricao {
  protocolo: string;
  fase: 'recebida' | 'validacao' | 'classificada' | 'convocada' | 'matriculada';
  desfecho: string;
  pontuacao_total: number;
  indice_alcance_contato: number;
  crianca_etapa: string;
  escolhas: EscolhaStatus[];
  criterios: CriterioVulnerabilidade[];
  historico: { tipo_evento: string; descricao: string | null; criado_em: string }[];
  convocacao: ConvocacaoStatus | null;
}
