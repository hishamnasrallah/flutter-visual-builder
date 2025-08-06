// src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Default route - redirect to builder
  {
    path: '',
    redirectTo: '/builder',
    pathMatch: 'full'
  },

  // Builder route (main application)
  {
    path: 'builder',
    loadChildren: () => import('./builder/builder.module').then(m => m.BuilderModule)
  },

  // Projects management (could be added later)
  // {
  //   path: 'projects',
  //   loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule)
  // },

  // Wildcard route - redirect to builder
  {
    path: '**',
    redirectTo: '/builder'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Enable router tracing for development
    enableTracing: false,
    // Use hash location strategy if needed
    // useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
