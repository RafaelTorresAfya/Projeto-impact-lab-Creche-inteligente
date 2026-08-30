import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../core/environment/environment';

@Injectable({ providedIn: 'root' })
export class DominioTerritorialService {
  private http = inject(HttpClient);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/dominio-territorial/geojson`);
  }
}
