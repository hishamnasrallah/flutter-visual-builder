// src/app/builder/components/preview-panel/preview-panel.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { UiBuilderService } from '../../services/ui-builder.service';
import { FlutterProjectService } from '../../services/flutter-project.service';
import { ApiService } from '../../../shared/services/api.service';
import { UIComponent, FlutterProject, Screen } from '../../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-preview-panel',
  templateUrl: './preview-panel.component.html',
  styleUrls: ['./preview-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewPanelComponent implements OnInit, OnDestroy {
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
  ) {}

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
      mobile: { width: 375, height: 667 }, // iPhone dimensions
      tablet: { width: 768, height: 1024 }, // iPad dimensions
      desktop: { width: 1024, height: 768 }
    };

    let { width, height } = dimensions[this.deviceType];

    if (this.orientation === 'landscape' && this.deviceType !== 'desktop') {
      [width, height] = [height, width];
    }

    return { width, height };
  }

  // Preview styles
  getPreviewStyles(): { [key: string]: string } {
    const { width, height } = this.getDeviceDimensions();

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
    if (!this.currentProject) return;

    this.isGenerating = true;
    this.cdr.markForCheck();

    this.apiService.generateCode(this.currentProject.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Get the main screen file
          const screenFileName = Object.keys(result.files).find(key =>
            key.includes('screens/') && key.endsWith('.dart')
          );

          if (screenFileName) {
            this.generatedCode = result.files[screenFileName];
          } else {
            this.generatedCode = 'No screen code generated';
          }

          this.isGenerating = false;
          this.codeVisible = true;
          this.cdr.markForCheck();

          this.snackBar.open(`Generated ${result.file_count} files`, 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error generating code:', error);
          this.isGenerating = false;
          this.cdr.markForCheck();

          this.snackBar.open('Error generating code', 'Close', {
            duration: 3000
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

    if (component.properties.width) {
      styles['width'] = component.properties.width + 'px';
    }
    if (component.properties.height) {
      styles['height'] = component.properties.height + 'px';
    }
    if (component.properties.color) {
      styles['background-color'] = component.properties.color;
    }
    if (component.properties.padding && typeof component.properties.padding === 'object') {
      if (component.properties.padding.all) {
        styles['padding'] = component.properties.padding.all + 'px';
      }
    }
    if (component.properties.margin && typeof component.properties.margin === 'object') {
      if (component.properties.margin.all) {
        styles['margin'] = component.properties.margin.all + 'px';
      }
    }

    return styles;
  }

  getTextStyles(component: UIComponent): { [key: string]: string } {
    const styles: { [key: string]: string } = {};

    if (component.properties.fontSize) {
      styles['font-size'] = component.properties.fontSize + 'px';
    }
    if (component.properties.color) {
      styles['color'] = component.properties.color;
    }
    if (component.properties.textAlign) {
      styles['text-align'] = component.properties.textAlign;
    }
    if (component.properties.fontWeight) {
      styles['font-weight'] = component.properties.fontWeight;
    }

    return styles;
  }

  getDisplayText(component: UIComponent): string {
    return component.properties.text || component.type;
  }

  // Track function for ngFor
  trackChild(index: number, child: UIComponent): string {
    return `${child.type}-${index}`;
  }
}
