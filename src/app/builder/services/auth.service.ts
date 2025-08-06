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
  user?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly ACCESS_TOKEN_KEY = 'flutter_builder_access_token';
  private readonly REFRESH_TOKEN_KEY = 'flutter_builder_refresh_token';
  private readonly USER_KEY = 'flutter_builder_user';

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
          console.log('Auth: Login successful');
          localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);

          if (response.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          }

          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticatedSubject.next(false);
    console.log('Auth: User logged out');
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): any {
    const userString = localStorage.getItem(this.USER_KEY);
    return userString ? JSON.parse(userString) : null;
  }

  refreshToken(): Observable<LoginResponse> {
    const baseUrl = this.configService.getBaseUrl();
    const refreshToken = this.getRefreshToken();

    return this.http.post<LoginResponse>(`${baseUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  private checkAuthStatus(): void {
    const token = this.getAccessToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
