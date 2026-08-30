import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { PlanejamentoVaga } from '../core/interfaces/planejamento-vaga.interface';

@Injectable({ providedIn: 'root' })
export class PlanejamentoVagasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/planejamento-vagas`;

  listar(): Observable<PlanejamentoVaga[]> {
    return this.http.get<ApiResponse<PlanejamentoVaga[]>>(this.base).pipe(map((res) => res.data));
  }

  obter(id: number): Observable<PlanejamentoVaga> {
    return this.http.get<ApiResponse<PlanejamentoVaga>>(`${this.base}/${id}`).pipe(map((res) => res.data));
  }

  criar(payload: PlanejamentoVaga): Observable<PlanejamentoVaga> {
    return this.http.post<ApiResponse<PlanejamentoVaga>>(this.base, payload).pipe(map((res) => res.data));
  }

  atualizar(id: number, payload: PlanejamentoVaga): Observable<PlanejamentoVaga> {
    return this.http
      .put<ApiResponse<PlanejamentoVaga>>(`${this.base}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  remover(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}
