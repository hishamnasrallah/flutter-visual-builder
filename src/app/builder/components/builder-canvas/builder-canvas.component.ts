// src/app/builder/components/builder-canvas/builder-canvas.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Angular CDK
import { CdkDragDrop, CdkDragEnter, CdkDragExit, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

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
  private destroy$ = new Subject<void>();

  uiStructure: UIComponent | null = null;
  selectedElement: SelectedElement | null = null;
  draggedElement: UIComponent | null = null;
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

  // Simplified Drop Events
  onDrop(event: CdkDragDrop<any>, targetPath: number[] = []): void {
    // Handle new widget from toolbox
    if (this.draggedElement) {
      this.uiBuilderService.addWidget(this.draggedElement, targetPath);
      this.uiBuilderService.setDraggedElement(null);
      this.clearDropTarget();
      return;
    }

    // Handle moving existing widget
    const dragData = event.item.data;
    if (dragData && dragData.component && dragData.path) {
      // Simple reordering within same container
      if (event.previousContainer === event.container) {
        const parentPath = targetPath;
        const fromIndex = event.previousIndex;
        const toIndex = event.currentIndex;

        if (fromIndex !== toIndex) {
          this.uiBuilderService.reorderWidget(parentPath, fromIndex, toIndex);
        }
      } else {
        // Moving between containers
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
    // Allow drop on any container type
    const component = this.getComponentAtPath(path);
    if (!component) return false;

    const containerTypes = ['container', 'column', 'row', 'stack', 'scaffold', 'card', 'wrap', 'listview', 'gridview'];
    return containerTypes.includes(component.type.toLowerCase());
  }

  private getComponentAtPath(path: number[]): UIComponent | null {
    if (!this.uiStructure) return null;

    let current = this.uiStructure;
    for (const index of path) {
      if (!current.children || index >= current.children.length) {
        return null;
      }
      current = current.children[index];
    }
    return current;
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
    const props = component.properties || {};

    // Width and Height
    if (props.width) {
      styles['width'] = typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    if (props.height) {
      styles['height'] = typeof props.height === 'number' ? `${props.height}px` : props.height;
    }

    // Background
    if (props.color || props.backgroundColor) {
      styles['background-color'] = props.color || props.backgroundColor;
    }

    // Padding
    if (props.padding) {
      if (typeof props.padding === 'object') {
        if (props.padding.all) {
          styles['padding'] = `${props.padding.all}px`;
        } else {
          const top = props.padding.top || 0;
          const right = props.padding.right || 0;
          const bottom = props.padding.bottom || 0;
          const left = props.padding.left || 0;
          styles['padding'] = `${top}px ${right}px ${bottom}px ${left}px`;
        }
      } else if (typeof props.padding === 'number') {
        styles['padding'] = `${props.padding}px`;
      }
    }

    // Margin
    if (props.margin) {
      if (typeof props.margin === 'object') {
        if (props.margin.all) {
          styles['margin'] = `${props.margin.all}px`;
        } else {
          const top = props.margin.top || 0;
          const right = props.margin.right || 0;
          const bottom = props.margin.bottom || 0;
          const left = props.margin.left || 0;
          styles['margin'] = `${top}px ${right}px ${bottom}px ${left}px`;
        }
      } else if (typeof props.margin === 'number') {
        styles['margin'] = `${props.margin}px`;
      }
    }

    // Border Radius
    if (props.borderRadius) {
      styles['border-radius'] = typeof props.borderRadius === 'number' ?
        `${props.borderRadius}px` : props.borderRadius;
    }

    // Border
    if (props.borderWidth || props.borderColor) {
      const width = props.borderWidth || 1;
      const color = props.borderColor || '#ddd';
      styles['border'] = `${width}px solid ${color}`;
    }

    // Flexbox properties for Row/Column
    if (component.type === 'row') {
      styles['display'] = 'flex';
      styles['flex-direction'] = 'row';

      if (props.mainAxisAlignment) {
        const alignMap: any = {
          'start': 'flex-start',
          'end': 'flex-end',
          'center': 'center',
          'spaceBetween': 'space-between',
          'spaceAround': 'space-around',
          'spaceEvenly': 'space-evenly'
        };
        styles['justify-content'] = alignMap[props.mainAxisAlignment] || 'flex-start';
      }

      if (props.crossAxisAlignment) {
        const alignMap: any = {
          'start': 'flex-start',
          'end': 'flex-end',
          'center': 'center',
          'stretch': 'stretch'
        };
        styles['align-items'] = alignMap[props.crossAxisAlignment] || 'flex-start';
      }
    }

    if (component.type === 'column') {
      styles['display'] = 'flex';
      styles['flex-direction'] = 'column';

      if (props.mainAxisAlignment) {
        const alignMap: any = {
          'start': 'flex-start',
          'end': 'flex-end',
          'center': 'center',
          'spaceBetween': 'space-between',
          'spaceAround': 'space-around',
          'spaceEvenly': 'space-evenly'
        };
        styles['justify-content'] = alignMap[props.mainAxisAlignment] || 'flex-start';
      }

      if (props.crossAxisAlignment) {
        const alignMap: any = {
          'start': 'flex-start',
          'end': 'flex-end',
          'center': 'center',
          'stretch': 'stretch'
        };
        styles['align-items'] = alignMap[props.crossAxisAlignment] || 'flex-start';
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
    const props = component.properties || {};

    if (props.text) {
      return props.text;
    }

    if (props.label) {
      return props.label;
    }

    // Default text for specific widget types
    const defaultTexts: any = {
      'text': 'Text Widget',
      'button': 'Button',
      'elevatedbutton': 'Elevated Button',
      'textbutton': 'Text Button',
      'outlinedbutton': 'Outlined Button',
      'iconbutton': '',
      'floatingactionbutton': '',
      'textfield': '',
      'appbar': 'App Bar',
      'listtile': 'List Item'
    };

    return defaultTexts[component.type.toLowerCase()] || '';
  }

  getIconName(component: UIComponent): string {
    const props = component.properties || {};
    return props.icon || props.iconName || 'star';
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
