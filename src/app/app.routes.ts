// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { ConfigGuard } from './shared/guards/config.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'config',
    loadComponent: () => import('./builder/components/config/config.component').then(m => m.ConfigComponent),
    data: {
      title: 'Configuration',
      description: 'Configure your backend connection',
      icon: 'settings',
      isPublic: true
    }
  },

  {
    path: 'login',
    loadComponent: () => import('./builder/components/login/login.component').then(m => m.LoginComponent),
    canActivate: [ConfigGuard],
    data: {
      title: 'Sign In',
      description: 'Access your account',
      icon: 'login',
      isPublic: true
    }
  },

  // Protected routes - Builder (main functionality handled by AppComponent)
  {
    path: 'builder',
    loadComponent: () => import('../../src/app/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [AuthGuard],
    data: {
      title: 'Visual Builder',
      description: 'Create Flutter apps visually',
      icon: 'build',
      requiresAuth: true
    }
  },

  // Default route redirects
  {
    path: '',
    redirectTo: '/builder',
    pathMatch: 'full'
  },

  // Wildcard route - redirect to appropriate page based on state
  {
    path: '**',
    redirectTo: '/builder'
  }
];
