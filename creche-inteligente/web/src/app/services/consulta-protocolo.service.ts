import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { StatusInscricao } from '../core/interfaces/inscricao-familia.interface';

@Injectable({ providedIn: 'root' })
export class ConsultaProtocoloService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/consulta-protocolo`;

  consultar(protocolo: string, cpf: string): Observable<StatusInscricao> {
    return this.http
      .get<ApiResponse<StatusInscricao>>(this.base, { params: { protocolo, cpf } })
      .pipe(map((res) => res.data));
  }

  aceitar(protocolo: string, cpf: string): Observable<StatusInscricao> {
    return this.http
      .post<ApiResponse<StatusInscricao>>(`${this.base}/aceitar`, { protocolo, cpf })
      .pipe(map((res) => res.data));
  }

  recusar(protocolo: string, cpf: string, motivo: string): Observable<StatusInscricao> {
    return this.http
      .post<ApiResponse<StatusInscricao>>(`${this.base}/recusar`, { protocolo, cpf, motivo })
      .pipe(map((res) => res.data));
  }
}
