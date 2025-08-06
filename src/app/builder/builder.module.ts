// src/app/builder/builder.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

// Angular CDK Imports
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

// Color Picker
import { ColorPickerModule } from 'ngx-color-picker';

// Components
import { WidgetToolboxComponent } from './components/widget-toolbox/widget-toolbox.component';
import { BuilderCanvasComponent } from './components/builder-canvas/builder-canvas.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { LayersPanelComponent } from './components/layers-panel/layers-panel.component';
import { PreviewPanelComponent } from './components/preview-panel/preview-panel.component';

// Services
import { WidgetLibraryService } from './services/widget-library.service';
import { UiBuilderService } from './services/ui-builder.service';
import { FlutterProjectService } from './services/flutter-project.service';

const MATERIAL_MODULES = [
  MatToolbarModule,
  MatButtonModule,
  MatIconModule,
  MatSidenavModule,
  MatListModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatProgressSpinnerModule,
  MatTooltipModule,
  MatExpansionModule,
  MatTabsModule,
  MatDialogModule,
  MatSnackBarModule,
  MatMenuModule,
  MatChipsModule,
  MatBadgeModule,
  MatDividerModule
];

const CDK_MODULES = [
  DragDropModule,
  OverlayModule,
  PortalModule
];

const COMPONENTS = [
  WidgetToolboxComponent,
  BuilderCanvasComponent,
  PropertiesPanelComponent,
  LayersPanelComponent,
  PreviewPanelComponent
];

@NgModule({
  declarations: [
    ...COMPONENTS
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ColorPickerModule,
    ...MATERIAL_MODULES,
    ...CDK_MODULES
  ],
  providers: [
    WidgetLibraryService,
    UiBuilderService,
    FlutterProjectService
  ],
  exports: [
    ...COMPONENTS
  ]
})
export class BuilderModule { }
