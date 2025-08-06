// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Import necessary modules that need to be provided
import { ColorPickerModule } from 'ngx-color-picker';

// Import routes
import { routes } from './app.routes';

// Import services
import { ApiService } from './shared/services/api.service';
import { WidgetLibraryService } from './builder/services/widget-library.service';
import { UiBuilderService } from './builder/services/ui-builder.service';
import { FlutterProjectService } from './builder/services/flutter-project.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),

    // Provide third-party modules
    importProvidersFrom(ColorPickerModule),

    // Provide services
    ApiService,
    WidgetLibraryService,
    UiBuilderService,
    FlutterProjectService,

    // HTTP Interceptors can be added here if needed
    // provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
