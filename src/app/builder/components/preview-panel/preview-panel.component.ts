// src/app/builder/components/preview-panel/preview-panel.component.ts

import {Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Subject, takeUntil} from 'rxjs';

// Angular Material
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

// Services and Models
import {UiBuilderService} from '../../services/ui-builder.service';
import {FlutterProjectService} from '../../services/flutter-project.service';
import {ApiService} from '../../../shared/services/api.service';
import {UIComponent, FlutterProject, Screen} from '../../../shared/models';

@Component({
  selector: 'app-preview-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './preview-panel.component.html',
  styleUrls: ['./preview-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewPanelComponent implements OnInit, OnDestroy {
  // ... rest of your existing component logic stays the same
  private destroy$ = new Subject<void>();

  uiStructure: UIComponent | null = null;
  currentProject: FlutterProject | null = null;
  currentScreen: Screen | null = null;

  // Preview options
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile';
  orientation: 'portrait' | 'landscape' = 'portrait';
  showGrid = false;

  // Code generation
  generatedCode = '';
  isGenerating = false;
  codeVisible = false;

  constructor(
    private uiBuilderService: UiBuilderService,
    private flutterProjectService: FlutterProjectService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    // Subscribe to UI structure changes
    this.uiBuilderService.uiStructure$
      .pipe(takeUntil(this.destroy$))
      .subscribe(structure => {
        this.uiStructure = structure;
        this.cdr.markForCheck();
      });

    // Subscribe to current project
    this.flutterProjectService.currentProject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.currentProject = project;
        this.cdr.markForCheck();
      });

    // Subscribe to current screen
    this.flutterProjectService.currentScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screen => {
        this.currentScreen = screen;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Device and orientation controls
  setDeviceType(type: 'mobile' | 'tablet' | 'desktop'): void {
    this.deviceType = type;
    this.cdr.markForCheck();
  }

  toggleOrientation(): void {
    this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
    this.cdr.markForCheck();
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.cdr.markForCheck();
  }

  // Get device dimensions
  getDeviceDimensions(): { width: number; height: number } {
    const dimensions = {
      mobile: {width: 375, height: 667}, // iPhone dimensions
      tablet: {width: 768, height: 1024}, // iPad dimensions
      desktop: {width: 1200, height: 800} // Better desktop dimensions
    };

    const deviceDimensions = dimensions[this.deviceType];
    let {width, height} = deviceDimensions;

    if (this.orientation === 'landscape' && this.deviceType !== 'desktop') {
      [width, height] = [height, width];
    }

    return {width, height};
  }

  // Preview styles
  getPreviewStyles(): { [key: string]: string } {
    const {width, height} = this.getDeviceDimensions();

    return {
      'width': width + 'px',
      'height': height + 'px',
      'border': '1px solid #ddd',
      'border-radius': this.deviceType === 'mobile' ? '20px' : '8px',
      'overflow': 'hidden',
      'background': '#ffffff',
      'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.1)'
    };
  }

  getPreviewContentStyles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {
      'width': '100%',
      'height': '100%',
      'overflow': 'auto'
    };

    if (this.showGrid) {
      styles['background-image'] = `
        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
      `;
      styles['background-size'] = '20px 20px';
    }

    return styles;
  }

  // Code generation
  generateCode(): void {
    if (!this.currentProject) {
      this.snackBar.open('No project selected', 'Close', {duration: 3000});
      return;
    }

    this.isGenerating = true;
    this.cdr.markForCheck();

    this.apiService.generateCode(this.currentProject.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result && result.files) {
            // Get the main screen file or main.dart
            let screenFileName = Object.keys(result.files).find(key =>
              key.includes('screens/') && key.endsWith('.dart')
            );

            if (!screenFileName) {
              screenFileName = Object.keys(result.files).find(key =>
                key.endsWith('main.dart')
              );
            }

            if (screenFileName) {
              this.generatedCode = result.files[screenFileName];
            } else {
              // Show first dart file if no screen or main found
              const dartFile = Object.keys(result.files).find(key => key.endsWith('.dart'));
              this.generatedCode = dartFile ? result.files[dartFile] : 'No Dart code generated';
            }

            this.codeVisible = true;
            this.snackBar.open(`Generated ${result.file_count} files`, 'Close', {
              duration: 3000
            });
          } else {
            this.generatedCode = 'No code generated';
            this.snackBar.open('No code was generated', 'Close', {duration: 3000});
          }

          this.isGenerating = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error generating code:', error);
          this.isGenerating = false;
          this.generatedCode = '';
          this.cdr.markForCheck();

          const errorMsg = error?.error?.detail || 'Error generating code';
          this.snackBar.open(errorMsg, 'Close', {
            duration: 5000
          });
        }
      });
  }

  toggleCodeVisibility(): void {
    this.codeVisible = !this.codeVisible;
    this.cdr.markForCheck();
  }

  copyCode(): void {
    if (this.generatedCode) {
      navigator.clipboard.writeText(this.generatedCode).then(() => {
        this.snackBar.open('Code copied to clipboard!', 'Close', {
          duration: 2000
        });
      });
    }
  }

  // Helper methods for rendering
  getElementPreviewStyles(component: UIComponent): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    const props = component.properties;

    if (props['width']) {
      styles['width'] = props['width'] + 'px';
    }
    if (props['height']) {
      styles['height'] = props['height'] + 'px';
    }
    if (props['color']) {
      styles['background-color'] = props['color'];
    }
    if (props['padding'] && typeof props['padding'] === 'object') {
      if (props['padding'].all) {
        styles['padding'] = props['padding'].all + 'px';
      }
    }
    if (props['margin'] && typeof props['margin'] === 'object') {
      if (props['margin'].all) {
        styles['margin'] = props['margin'].all + 'px';
      }
    }

    return styles;
  }

  getTextStyles(component: UIComponent): { [key: string]: string } {
  const styles: { [key: string]: string } = {};
  const props = component.properties;

  if (props['fontSize']) {
    styles['font-size'] = props['fontSize'] + 'px';
  }
  if (props['color']) {
    styles['color'] = props['color'];
  }
  if (props['textAlign']) {
    styles['text-align'] = props['textAlign'];
  }
  if (props['fontWeight']) {
    styles['font-weight'] = props['fontWeight'];
  }

  return styles;
}

  getDisplayText(component: UIComponent): string {
  return component.properties['text'] || component.type;
}

  // Track function for ngFor
  trackChild(index: number, child: UIComponent): string {
    return `${child.type}-${index}`;
  }
}
