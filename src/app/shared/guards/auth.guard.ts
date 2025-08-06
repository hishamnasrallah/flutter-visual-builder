// src/app/shared/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../builder/services/auth.service';
import { ConfigService } from '../../builder/services/config.service';
import { JwtService } from '../services/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // First check if configuration is available
    if (!this.configService.isConfigured()) {
      console.log('AuthGuard: App not configured, redirecting to config');
      this.router.navigate(['/config']);
      return false;
    }

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('AuthGuard: User not authenticated, redirecting to login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if token is still valid
    const token = this.authService.getAccessToken();
    if (token && this.jwtService.isTokenExpired(token)) {
      console.log('AuthGuard: Token expired, attempting refresh');

      // Try to refresh token
      this.authService.refreshToken().subscribe({
        next: () => {
          console.log('AuthGuard: Token refreshed successfully');
          // Continue with navigation
          return true;
        },
        error: () => {
          console.log('AuthGuard: Token refresh failed, redirecting to login');
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      });

      // For now, allow access while refresh is in progress
      return true;
    }

    return true;
  }
}
