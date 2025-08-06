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

  // Protected routes - Main builder (default route)
  {
    path: '',
    pathMatch: 'full',
    canActivate: [AuthGuard],
    loadComponent: () => import('./app.component').then(m => m.AppComponent),
    data: {
      title: 'Flutter Visual Builder',
      description: 'Build Flutter applications visually',
      icon: 'build',
      requiresAuth: true
    }
  },

  // Builder route (alternative path)
  {
    path: 'builder',
    canActivate: [AuthGuard],
    loadComponent: () => import('./app.component').then(m => m.AppComponent),
    data: {
      title: 'Visual Builder',
      description: 'Create Flutter apps visually',
      icon: 'build',
      requiresAuth: true
    }
  },

  // Future routes can be added here
  // {
  //   path: 'projects',
  //   loadComponent: () => import('./projects/project-list/project-list.component').then(m => m.ProjectListComponent),
  //   canActivate: [AuthGuard]
  // },

  // Wildcard route - redirect based on auth state
  {
    path: '**',
    redirectTo: ''
  }
];
