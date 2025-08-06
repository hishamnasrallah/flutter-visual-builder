// src/app/builder/components/builder-canvas/builder-canvas.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Angular CDK
import { CdkDragDrop, CdkDragEnter, CdkDragExit, DragDropModule } from '@angular/cdk/drag-drop';

// Services and Models
import { UiBuilderService, SelectedElement } from '../../services/ui-builder.service';
import { UIComponent } from '../../../shared/models';

@Component({
  selector: 'app-builder-canvas',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    DragDropModule
  ],
  templateUrl: './builder-canvas.component.html',
  styleUrls: ['./builder-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuilderCanvasComponent implements OnInit, OnDestroy {
  // ... rest of your existing component logic stays the same
  private destroy$ = new Subject<void>();

  uiStructure: UIComponent | null = null;
  selectedElement: SelectedElement | null = null;
  draggedElement: UIComponent | null = null;

  // Drop zone state
  dropTargetPath: number[] = [];
  isDropTarget = false;

  constructor(
    private uiBuilderService: UiBuilderService,
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

    // Subscribe to selected element changes
    this.uiBuilderService.selectedElement$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        this.selectedElement = selected;
        this.cdr.markForCheck();
      });

    // Subscribe to dragged element changes
    this.uiBuilderService.draggedElement$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dragged => {
        this.draggedElement = dragged;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Canvas Events
  onCanvasClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.uiBuilderService.clearSelection();
    }
  }

  // Element Events
  onElementClick(component: UIComponent, path: number[], event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.selectElement(component, path);
  }

  onElementDoubleClick(component: UIComponent, path: number[], event: Event): void {
    event.stopPropagation();
    // Could open inline editing or properties panel
  }

  // Drop Events
  onDrop(event: CdkDragDrop<any>, targetPath: number[] = []): void {
    event.preventDefault();

    if (this.draggedElement) {
      // Adding new widget from toolbox
      this.uiBuilderService.addWidget(this.draggedElement, targetPath);
    } else if (event.previousContainer !== event.container) {
      // Moving widget between containers
      const dragData = event.previousContainer.data;
      if (dragData && dragData.component && dragData.path) {
        this.uiBuilderService.moveWidget(dragData.path, targetPath);
      }
    }

    this.clearDropTarget();
  }

  onDragEnter(event: CdkDragEnter, targetPath: number[]): void {
    if (this.canDropAtPath(targetPath)) {
      this.dropTargetPath = targetPath;
      this.isDropTarget = true;
      this.cdr.markForCheck();
    }
  }

  onDragExit(event: CdkDragExit): void {
    this.clearDropTarget();
  }

  private clearDropTarget(): void {
    this.dropTargetPath = [];
    this.isDropTarget = false;
    this.cdr.markForCheck();
  }

  private canDropAtPath(path: number[]): boolean {
    const draggedWidget = this.draggedElement;
    if (!draggedWidget) return false;

    return this.uiBuilderService.canDropWidget(path, draggedWidget.type);
  }

  // Delete element
  onDeleteElement(path: number[], event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.removeWidget(path);
  }

  // Duplicate element
  onDuplicateElement(path: number[], event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.duplicateWidget(path);
  }

  // Helper methods
  isElementSelected(path: number[]): boolean {
    if (!this.selectedElement) return false;
    return this.arraysEqual(this.selectedElement.path, path);
  }

  isDropTargetAtPath(path: number[]): boolean {
    return this.isDropTarget && this.arraysEqual(this.dropTargetPath, path);
  }

  getElementStyles(component: UIComponent): { [key: string]: string } {
    const styles: { [key: string]: string } = {};

    // Apply width and height
    if (component.properties.width) {
      styles['width'] = component.properties.width + 'px';
    }
    if (component.properties.height) {
      styles['height'] = component.properties.height + 'px';
    }

    // Apply background color
    if (component.properties.color) {
      styles['background-color'] = component.properties.color;
    }

    // Apply padding
    if (component.properties.padding) {
      if (typeof component.properties.padding === 'object' && component.properties.padding.all) {
        styles['padding'] = component.properties.padding.all + 'px';
      }
    }

    // Apply margin
    if (component.properties.margin) {
      if (typeof component.properties.margin === 'object' && component.properties.margin.all) {
        styles['margin'] = component.properties.margin.all + 'px';
      }
    }

    return styles;
  }

  getElementClasses(component: UIComponent, path: number[]): string[] {
    const classes = ['canvas-element', `canvas-${component.type}`];

    if (this.isElementSelected(path)) {
      classes.push('selected');
    }

    if (this.isDropTargetAtPath(path)) {
      classes.push('drop-target');
    }

    return classes;
  }

  getDisplayText(component: UIComponent): string {
    if (component.properties.text) {
      return component.properties.text;
    }

    switch (component.type.toLowerCase()) {
      case 'text':
        return component.properties.text || 'Text';
      case 'button':
        return component.properties.text || 'Button';
      case 'container':
        return component.children?.length ? '' : 'Container';
      default:
        return component.type;
    }
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  // Track functions for ngFor
  trackChild(index: number, child: UIComponent): string {
    return `${child.type}-${index}`;
  }
}
