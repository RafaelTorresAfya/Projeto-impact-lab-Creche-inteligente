export interface RankingUnidade {
  codigo_unidade: string;
  nome: string;
  qtd_lista_espera: number;
  alunos_matriculados: number;
  descompasso: number;
}

export interface SerieHistoricaItem {
  ano: number;
  total_inscricoes: number;
  qtd_lista_espera: number;
}

export interface DashboardKpis {
  total_inscricoes: number;
  pct_lista_espera: number;
  pct_confirmado: number;
  ranking_unidades: RankingUnidade[];
  serie_historica: SerieHistoricaItem[];
}
