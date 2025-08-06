// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.production) {
  // Disable console logging in production
  console.log = console.warn = console.error = () => {};
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
