import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import {
  CriancaPayload,
  ContatoFamilia,
  EnderecoReferencia,
  UnidadeRecomendada,
} from '../core/interfaces/inscricao-familia.interface';

@Injectable({ providedIn: 'root' })
export class InscricaoFamiliaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/inscricao-familia`;

  criarRascunho(responsavel_cpf: string, crianca: CriancaPayload): Observable<{ id_inscricao: number; etapa: string }> {
    return this.http
      .post<ApiResponse<{ id_inscricao: number; etapa: string }>>(`${this.base}/rascunho`, {
        responsavel_cpf,
        crianca,
      })
      .pipe(map((res) => res.data));
  }

  atualizarCrianca(id: number, responsavel_cpf: string, crianca: CriancaPayload): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/${id}/crianca`, { responsavel_cpf, crianca })
      .pipe(map((res) => res.data));
  }

  atualizarEnderecos(id: number, responsavel_cpf: string, enderecos: EnderecoReferencia[]): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/${id}/enderecos`, { responsavel_cpf, enderecos })
      .pipe(map((res) => res.data));
  }

  recomendarUnidades(id: number, responsavel_cpf: string): Observable<UnidadeRecomendada[]> {
    return this.http
      .get<ApiResponse<UnidadeRecomendada[]>>(`${this.base}/${id}/recomendacoes`, {
        params: { responsavel_cpf },
      })
      .pipe(map((res) => res.data));
  }

  atualizarEscolhas(
    id: number,
    responsavel_cpf: string,
    escolhas: string[],
    fora?: { ativo: boolean; motivo: string },
  ): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/${id}/escolhas`, { responsavel_cpf, escolhas, fora })
      .pipe(map((res) => res.data));
  }

  atualizarCriterios(
    id: number,
    responsavel_cpf: string,
    payload: {
      executar_consulta_automatica?: boolean;
      criterios: Record<string, { on: boolean }>;
      renda_valor?: number;
      pessoas_domicilio?: number;
    },
  ): Observable<{ pontuacao_total: number; consulta_automatica: { cadunico: boolean; bolsa: boolean } | null }> {
    return this.http
      .put<ApiResponse<{ pontuacao_total: number; consulta_automatica: { cadunico: boolean; bolsa: boolean } | null }>>(
        `${this.base}/${id}/criterios`,
        { responsavel_cpf, ...payload },
      )
      .pipe(map((res) => res.data));
  }

  simularDocumento(
    id: number,
    responsavel_cpf: string,
    chave: string,
    nome_arquivo: string,
    tamanho: number,
  ): Observable<{ confianca: number; status: string; pontuacao_total: number }> {
    return this.http
      .post<ApiResponse<{ confianca: number; status: string; pontuacao_total: number }>>(
        `${this.base}/${id}/criterios/${chave}/documento`,
        { responsavel_cpf, nome_arquivo, tamanho },
      )
      .pipe(map((res) => res.data));
  }

  atualizarContato(
    id: number,
    responsavel_cpf: string,
    contato: ContatoFamilia,
    assistido: boolean,
  ): Observable<{ indice_alcance: { total: number; faixa: string } }> {
    return this.http
      .put<ApiResponse<{ indice_alcance: { total: number; faixa: string } }>>(`${this.base}/${id}/contato`, {
        responsavel_cpf,
        contato,
        assistido,
      })
      .pipe(map((res) => res.data));
  }

  enviarInscricao(
    id: number,
    responsavel_cpf: string,
    lgpd_aceite: boolean,
    prazo_aceite: boolean,
  ): Observable<{ protocolo: string; pontuacao_total: number }> {
    return this.http
      .post<ApiResponse<{ protocolo: string; pontuacao_total: number }>>(`${this.base}/${id}/enviar`, {
        responsavel_cpf,
        lgpd_aceite,
        prazo_aceite,
      })
      .pipe(map((res) => res.data));
  }
}
