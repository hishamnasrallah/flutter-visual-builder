/ src/main.ts

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  // Disable console logging in production
  console.log = console.warn = console.error = () => {};
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
