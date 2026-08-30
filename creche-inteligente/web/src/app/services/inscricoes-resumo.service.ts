import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { InscricaoResumo } from '../core/interfaces/inscricao-resumo.interface';

export interface InscricoesFiltro {
  ano?: number;
  codigo_unidade?: string;
  situacao?: string;
}

@Injectable({ providedIn: 'root' })
export class InscricoesResumoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/inscricoes-resumo`;

  listar(filtro: InscricoesFiltro = {}): Observable<InscricaoResumo[]> {
    const params: Record<string, string> = {};
    if (filtro.ano) params['ano'] = String(filtro.ano);
    if (filtro.codigo_unidade) params['codigo_unidade'] = filtro.codigo_unidade;
    if (filtro.situacao) params['situacao'] = filtro.situacao;
    return this.http
      .get<ApiResponse<InscricaoResumo[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }
}
