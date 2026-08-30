import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { Convocacao } from '../core/interfaces/convocacao.interface';

@Injectable({ providedIn: 'root' })
export class ConvocacoesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/convocacoes`;

  listar(): Observable<Convocacao[]> {
    return this.http.get<ApiResponse<Convocacao[]>>(this.base).pipe(map((res) => res.data));
  }

  obter(id: number): Observable<Convocacao> {
    return this.http.get<ApiResponse<Convocacao>>(`${this.base}/${id}`).pipe(map((res) => res.data));
  }

  criar(payload: Convocacao): Observable<Convocacao> {
    return this.http.post<ApiResponse<Convocacao>>(this.base, payload).pipe(map((res) => res.data));
  }

  atualizar(id: number, payload: Convocacao): Observable<Convocacao> {
    return this.http.put<ApiResponse<Convocacao>>(`${this.base}/${id}`, payload).pipe(map((res) => res.data));
  }

  remover(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  alertasPrazo(): Observable<Convocacao[]> {
    return this.http
      .get<ApiResponse<Convocacao[]>>(`${this.base}/alertas-prazo`)
      .pipe(map((res) => res.data));
  }
}
