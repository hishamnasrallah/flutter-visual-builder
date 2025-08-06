// src/app/app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route - redirect to builder
  {
    path: '',
    redirectTo: '/builder',
    pathMatch: 'full'
  },

  // Builder route (main application) - now loads standalone components
  {
    path: 'builder',
    loadComponent: () => import('./app.component').then(m => m.AppComponent)
  },

  // Projects management (could be added later)
  // {
  //   path: 'projects',
  //   loadChildren: () => import('./projects/project.routes').then(m => m.PROJECT_ROUTES)
  // },

  // Wildcard route - redirect to builder
  {
    path: '**',
    redirectTo: '/builder'
  }
];
