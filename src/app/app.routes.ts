// src/app/app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route - the app component itself handles the builder
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/'  // Just load the main app
  },

  // Since AppComponent IS the builder, we don't need separate routing
  // Remove the builder route that loads AppComponent again

  // Future routes can be added here
  // {
  //   path: 'projects',
  //   loadComponent: () => import('./projects/project-list/project-list.component').then(m => m.ProjectListComponent)
  // },

  // Wildcard - stay on main app
  {
    path: '**',
    redirectTo: '/'
  }
];
