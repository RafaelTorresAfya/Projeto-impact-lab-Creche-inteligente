import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { UnidadeEscolar } from '../core/interfaces/unidade-escolar.interface';

export interface UnidadesFiltro {
  cre?: string;
  tipo?: string;
  cod_territ?: string;
  busca?: string;
}

@Injectable({ providedIn: 'root' })
export class UnidadesEscolaresService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/unidades-escolares`;

  listar(filtro: UnidadesFiltro = {}): Observable<UnidadeEscolar[]> {
    const params: Record<string, string> = {};
    if (filtro.cre) params['cre'] = filtro.cre;
    if (filtro.tipo) params['tipo'] = filtro.tipo;
    if (filtro.cod_territ) params['cod_territ'] = filtro.cod_territ;
    if (filtro.busca) params['busca'] = filtro.busca;
    return this.http
      .get<ApiResponse<UnidadeEscolar[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.base}/geojson`)
      .pipe(map((res) => res.data));
  }
}
