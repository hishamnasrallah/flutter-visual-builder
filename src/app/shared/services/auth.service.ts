// src/app/shared/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.checkAuthStatus();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const baseUrl = this.configService.getBaseUrl();
    return this.http.post<LoginResponse>(`${baseUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  refreshToken(): Observable<LoginResponse> {
    const baseUrl = this.configService.getBaseUrl();
    const refreshToken = this.getRefreshToken();

    return this.http.post<LoginResponse>(`${baseUrl}/auth/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.isAuthenticatedSubject.next(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private checkAuthStatus(): void {
    const token = this.getAccessToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
