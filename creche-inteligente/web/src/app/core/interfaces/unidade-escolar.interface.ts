export interface UnidadeEscolar {
  codigo_unidade: string;
  nome: string;
  tipo: string;
  id_cre: string;
  cod_territ: string;
  logradouro: string;
  bairro: string;
  cep: string;
  fonte_geo?: string;
  latitude?: number;
  longitude?: number;
}
