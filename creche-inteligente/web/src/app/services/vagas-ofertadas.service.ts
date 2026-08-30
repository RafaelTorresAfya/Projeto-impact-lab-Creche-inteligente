import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { VagaOfertada } from '../core/interfaces/vaga-ofertada.interface';

export interface VagasFiltro {
  ano?: number;
  fonte?: string;
  codigo_unidade?: string;
}

@Injectable({ providedIn: 'root' })
export class VagasOfertadasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/vagas-ofertadas`;

  listar(filtro: VagasFiltro = {}): Observable<VagaOfertada[]> {
    const params: Record<string, string> = {};
    if (filtro.ano) params['ano'] = String(filtro.ano);
    if (filtro.fonte) params['fonte'] = filtro.fonte;
    if (filtro.codigo_unidade) params['codigo_unidade'] = filtro.codigo_unidade;
    return this.http
      .get<ApiResponse<VagaOfertada[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }
}
