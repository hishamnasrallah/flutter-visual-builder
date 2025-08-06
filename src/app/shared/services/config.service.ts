// src/app/shared/services/config.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly BASE_URL_KEY = 'base_url';

  setBaseUrl(url: string): void {
    localStorage.setItem(this.BASE_URL_KEY, url);
  }

  getBaseUrl(): string {
    return localStorage.getItem(this.BASE_URL_KEY) || '';
  }

  isConfigured(): boolean {
    return !!this.getBaseUrl();
  }
}
