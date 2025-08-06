// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideZoneChangeDetection } from '@angular/core';

// Import routes
import { routes } from './app.routes';

// Import interceptors
import { AuthInterceptor } from './shared/guards/auth.interceptor';

// Import services
import { ApiService } from './shared/services/api.service';
import { AuthService } from './shared/services/auth.service';
import { ConfigService } from './shared/services/config.service';
import { TranslationService } from './shared/services/translation.service';
import { WidgetLibraryService } from './builder/services/widget-library.service';
import { UiBuilderService } from './builder/services/ui-builder.service';
import { FlutterProjectService } from './builder/services/flutter-project.service';

// Import third-party modules
import { ColorPickerModule } from 'ngx-color-picker';

// Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Angular CDK
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { A11yModule } from '@angular/cdk/a11y';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router
    provideRouter(routes),

    // HTTP Client with interceptors
    provideHttpClient(withInterceptorsFromDi()),

    // Animations
    provideAnimations(),

    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // Core Services
    ApiService,
    AuthService,
    ConfigService,
    TranslationService,

    // Builder Services
    WidgetLibraryService,
    UiBuilderService,
    FlutterProjectService,

    // Third-party modules
    importProvidersFrom(ColorPickerModule),

    // Angular Material Modules
    importProvidersFrom(MatIconModule),
    importProvidersFrom(MatTabsModule),
    importProvidersFrom(MatFormFieldModule),
    importProvidersFrom(MatStepperModule),
    importProvidersFrom(MatAutocompleteModule),
    importProvidersFrom(MatExpansionModule),
    importProvidersFrom(MatDatepickerModule),
    importProvidersFrom(MatNativeDateModule),
    importProvidersFrom(MatSnackBarModule),
    importProvidersFrom(MatDialogModule),
    importProvidersFrom(MatMenuModule),
    importProvidersFrom(MatToolbarModule),
    importProvidersFrom(MatSidenavModule),
    importProvidersFrom(MatButtonModule),
    importProvidersFrom(MatInputModule),
    importProvidersFrom(MatSelectModule),
    importProvidersFrom(MatCheckboxModule),
    importProvidersFrom(MatRadioModule),
    importProvidersFrom(MatSlideToggleModule),
    importProvidersFrom(MatProgressSpinnerModule),
    importProvidersFrom(MatProgressBarModule),
    importProvidersFrom(MatTooltipModule),
    importProvidersFrom(MatBadgeModule),
    importProvidersFrom(MatChipsModule),
    importProvidersFrom(MatDividerModule),
    importProvidersFrom(MatListModule),
    importProvidersFrom(MatGridListModule),
    importProvidersFrom(MatCardModule),
    importProvidersFrom(MatButtonToggleModule),

    // Angular CDK Modules
    importProvidersFrom(DragDropModule),
    importProvidersFrom(LayoutModule),
    importProvidersFrom(ScrollingModule),
    importProvidersFrom(ClipboardModule),
    importProvidersFrom(A11yModule)
  ]
};
