// src/app/shared/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
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

    return true;
  }
}
