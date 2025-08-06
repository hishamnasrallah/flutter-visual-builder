// src/app/app.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material Imports
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Angular CDK
import { LayoutModule, BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// App Components
import { WidgetToolboxComponent } from './builder/components/widget-toolbox/widget-toolbox.component';
import { BuilderCanvasComponent } from './builder/components/builder-canvas/builder-canvas.component';
import { PropertiesPanelComponent } from './builder/components/properties-panel/properties-panel.component';
import { LayersPanelComponent } from './builder/components/layers-panel/layers-panel.component';
import { PreviewPanelComponent } from './builder/components/preview-panel/preview-panel.component';

// Services
import { FlutterProjectService } from './builder/services/flutter-project.service';
import { UiBuilderService } from './builder/services/ui-builder.service';
import { FlutterProject, Screen } from './shared/models';

import { Observable, map, shareReplay } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    // Material Modules
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatButtonToggleModule,

    // CDK Modules
    LayoutModule,

    // App Components
    WidgetToolboxComponent,
    BuilderCanvasComponent,
    PropertiesPanelComponent,
    LayersPanelComponent,
    PreviewPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('drawer', { static: true }) drawer!: MatSidenav;

  title = 'Flutter Visual Builder';

  isHandset$!: Observable<boolean>;

  // Panel visibility
  showPropertiesPanel = true;
  showLayersPanel = false;
  showPreviewPanel = false;

  // Current project state
  currentProject: FlutterProject | null = null;
  currentScreen: Screen | null = null;
  projectScreens: Screen[] = [];

  constructor(
  private breakpointObserver: BreakpointObserver,
  private flutterProjectService: FlutterProjectService,
  private uiBuilderService: UiBuilderService,
  private snackBar: MatSnackBar
) {
  this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}

  // ... rest of your existing component logic stays the same
  ngOnInit(): void {
    // Subscribe to current project
    this.flutterProjectService.currentProject$.subscribe(project => {
      this.currentProject = project;
    });

    // Subscribe to current screen
    this.flutterProjectService.currentScreen$.subscribe(screen => {
      this.currentScreen = screen;
      if (screen && screen.ui_structure) {
        this.uiBuilderService.setUIStructure(screen.ui_structure);
      }
    });

    // Subscribe to project screens
    this.flutterProjectService.projectScreens$.subscribe(screens => {
      this.projectScreens = screens;
    });

    // Load a demo project for development
    this.loadDemoProject();
  }

  private async loadDemoProject(): Promise<void> {
    try {
      // This would typically be loaded from user's project list
      // For demo purposes, we'll create a sample project structure
      const demoProject: FlutterProject = {
        id: 1,
        name: 'My Flutter App',
        package_name: 'com.example.myapp',
        description: 'A demo Flutter app',
        user: 1,
        supported_languages: [],
        default_language: 'en',
        primary_color: '#2196F3',
        secondary_color: '#03DAC6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      const demoScreen: Screen = {
        id: 1,
        project: 1,
        name: 'Home Screen',
        route: '/',
        is_home: true,
        ui_structure: {
          type: 'container',
          properties: {
            width: null,
            height: null,
            color: '#FFFFFF',
            padding: { all: 16 }
          },
          children: [{
            type: 'text',
            properties: {
              text: 'Welcome to Flutter Visual Builder!',
              fontSize: 24,
              color: '#333333',
              textAlign: 'center',
              fontWeight: 'bold'
            },
            children: []
          }]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Set demo data (in real app, this would come from API)
      this.currentProject = demoProject;
      this.currentScreen = demoScreen;
      this.projectScreens = [demoScreen];

      // Set UI structure in builder service
      this.uiBuilderService.setUIStructure(demoScreen.ui_structure);

    } catch (error) {
      console.error('Error loading demo project:', error);
    }
  }

  // Toolbar Actions
  onSave(): void {
    if (!this.currentScreen) return;

    const uiStructure = this.uiBuilderService.getUIStructure();

    this.flutterProjectService.updateScreenUIStructure(this.currentScreen.id, uiStructure)
      .subscribe({
        next: () => {
          this.snackBar.open('Screen saved successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        },
        error: (error) => {
          console.error('Error saving screen:', error);
          this.snackBar.open('Error saving screen', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });
  }

  onUndo(): void {
    this.uiBuilderService.undo();
  }

  onRedo(): void {
    this.uiBuilderService.redo();
  }

  canUndo(): boolean {
    return this.uiBuilderService.canUndo();
  }

  canRedo(): boolean {
    return this.uiBuilderService.canRedo();
  }

  onClearCanvas(): void {
    this.uiBuilderService.clearCanvas();
    this.snackBar.open('Canvas cleared', 'Close', { duration: 2000 });
  }

  onGenerateCode(): void {
  if (!this.currentProject) {
    this.snackBar.open('No project selected', 'Close', { duration: 3000 });
    return;
  }

  const generatingSnackBar = this.snackBar.open('Generating code...', '', {
    duration: 0 // Keep open until dismissed
  });

  this.flutterProjectService.generateCode().subscribe({
    next: (result) => {
      generatingSnackBar.dismiss();
      this.snackBar.open(`Generated ${result.file_count} files for ${result.project}`, 'Close', {
        duration: 4000
      });
      console.log('Generated files:', result.files);
    },
    error: (error) => {
      generatingSnackBar.dismiss();
      console.error('Error generating code:', error);
      const errorMsg = error?.error?.detail || 'Error generating code';
      this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
    }
  });
}

  onBuildAPK(): void {
    if (!this.currentProject) return;

    this.snackBar.open('Building APK... This may take a few minutes', 'Close', {
      duration: 5000
    });

    this.flutterProjectService.buildAPK().subscribe({
      next: (build) => {
        this.snackBar.open('Build started successfully!', 'View Builds', {
          duration: 5000
        });
      },
      error: (error) => {
        console.error('Error starting build:', error);
        this.snackBar.open('Error starting build', 'Close', { duration: 3000 });
      }
    });
  }

  onDownloadProject(): void {
    if (!this.currentProject) return;

    this.flutterProjectService.downloadProject().subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentProject?.package_name || 'flutter-project'}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Project downloaded!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error downloading project:', error);
        this.snackBar.open('Error downloading project', 'Close', { duration: 3000 });
      }
    });
  }

  // Panel Toggles
  togglePropertiesPanel(): void {
    this.showPropertiesPanel = !this.showPropertiesPanel;
  }

  toggleLayersPanel(): void {
    this.showLayersPanel = !this.showLayersPanel;
  }

  togglePreviewPanel(): void {
    this.showPreviewPanel = !this.showPreviewPanel;
  }

  // Screen Management
onScreenSelected(screen: Screen): void {
  this.flutterProjectService.setCurrentScreen(screen);
}

onScreenSelectionChange(screenId: number): void {
  const screen = this.projectScreens.find(s => s.id === screenId);
  if (screen) {
    this.onScreenSelected(screen);
  }
}

  getCurrentScreenName(): string {
    return this.currentScreen?.name || 'No Screen Selected';
  }
}
