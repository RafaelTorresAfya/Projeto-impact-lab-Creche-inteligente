import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';
import { DashboardKpis } from '../core/interfaces/dashboard-kpis.interface';

export interface DashboardFiltro {
  ano?: number;
  cre?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard/kpis`;

  getKpis(filtro: DashboardFiltro = {}): Observable<DashboardKpis> {
    const params: Record<string, string> = {};
    if (filtro.ano) params['ano'] = String(filtro.ano);
    if (filtro.cre) params['cre'] = filtro.cre;
    return this.http.get<ApiResponse<DashboardKpis>>(this.base, { params }).pipe(map((res) => res.data));
  }
}
