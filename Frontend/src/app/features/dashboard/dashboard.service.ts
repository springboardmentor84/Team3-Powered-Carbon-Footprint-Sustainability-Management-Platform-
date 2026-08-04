import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/dashboard';

  public async getDashboardData(): Promise<any> {
    try {
      const res: any = await firstValueFrom(this.http.get(this.apiUrl));
      if (res && res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('API getDashboardData failed, using fallback data:', err);
      return null;
    }
  }
}
