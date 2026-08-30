import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../core/environment/environment';
import { ApiResponse } from '../core/interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class DominioTerritorialService {
  private http = inject(HttpClient);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/dominio-territorial/geojson`)
      .pipe(map((res) => res.data));
  }
}
