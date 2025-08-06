// src/app/shared/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../../builder/services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add token to request if available
    const token = this.authService.getAccessToken();

    if (token) {
      req = this.addTokenToRequest(req, token);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors (unauthorized)
        if (error.status === 401 && token) {
          return this.handle401Error(req, next);
        }

        // Handle 403 errors (forbidden)
        if (error.status === 403) {
          console.error('Access forbidden - insufficient permissions');
        }

        return throwError(error);
      })
    );
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap((tokenResponse: any) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(tokenResponse.access);

            return next.handle(this.addTokenToRequest(request, tokenResponse.access));
          }),
          catchError((refreshError) => {
            this.isRefreshing = false;
            this.authService.logout();
            this.router.navigate(['/login']);
            return throwError(refreshError);
          })
        );
      } else {
        // No refresh token, redirect to login
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError('No refresh token available');
      }
    } else {
      // If we're already refreshing, wait for the new token
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addTokenToRequest(request, token));
        })
      );
    }
  }
}
