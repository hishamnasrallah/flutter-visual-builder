// src/app/builder/components/builder-canvas/builder-canvas.component.ts - ENHANCED

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

// Angular CDK
import { CdkDragDrop, CdkDragEnter, CdkDragExit, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// Services and Models
import { UiBuilderService, SelectedElement } from '../../services/ui-builder.service';
import { WidgetRegistryService } from '../../services/widget-registry.service';
import { UIComponent } from '../../../shared/models';

interface DropZoneInfo {
  path: number[];
  isActive: boolean;
  canDrop: boolean;
}

@Component({
  selector: 'app-builder-canvas',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatRippleModule,
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

  // Enhanced drop zone tracking
  activeDropZone: DropZoneInfo | null = null;
  hoveredPath: number[] = [];

  // Canvas state
  canvasScale = 1;
  showGrid = false;
  showOutlines = false;
  deviceFrame: 'none' | 'phone' | 'tablet' = 'none';

  constructor(
    private uiBuilderService: UiBuilderService,
    private widgetRegistry: WidgetRegistryService,
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
    // Only clear selection if clicking on the actual canvas background
    const target = event.target as HTMLElement;
    if (target.classList.contains('builder-canvas') ||
        target.classList.contains('canvas-content') ||
        target.classList.contains('canvas-viewport')) {
      this.uiBuilderService.clearSelection();
    }
  }

  // Element Events
  onElementClick(component: UIComponent, path: number[], event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.selectElement(component, path);
  }

  onElementMouseEnter(path: number[]): void {
    this.hoveredPath = path;
    this.cdr.markForCheck();
  }

  onElementMouseLeave(): void {
    this.hoveredPath = [];
    this.cdr.markForCheck();
  }

  // Enhanced Drop Events
  onDrop(event: CdkDragDrop<any>, targetPath: number[] = []): void {
    // Handle new widget from toolbox
    if (this.draggedElement) {
      // Check if target can accept children
      const targetComponent = this.getComponentAtPath(targetPath);
      if (targetComponent && !this.canAcceptChildren(targetComponent)) {
        console.warn('Target cannot accept children');
        this.clearDropState();
        return;
      }

      this.uiBuilderService.addWidget(this.draggedElement, targetPath);
      this.uiBuilderService.setDraggedElement(null);
      this.clearDropState();
      return;
    }

    // Handle moving existing widget
    const dragData = event.item.data;
    if (dragData && dragData.component && dragData.path) {
      // Don't allow dropping on self or descendants
      if (this.isDescendantPath(targetPath, dragData.path)) {
        console.warn('Cannot drop element on itself or its descendants');
        this.clearDropState();
        return;
      }

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

    this.clearDropState();
  }

  onDragEnter(event: CdkDragEnter, targetPath: number[]): void {
    const targetComponent = this.getComponentAtPath(targetPath);

    if (targetComponent && this.canAcceptChildren(targetComponent)) {
      this.activeDropZone = {
        path: targetPath,
        isActive: true,
        canDrop: true
      };
    } else {
      this.activeDropZone = {
        path: targetPath,
        isActive: true,
        canDrop: false
      };
    }

    this.cdr.markForCheck();
  }

  onDragExit(event: CdkDragExit): void {
    // Keep some feedback for better UX
    if (this.activeDropZone) {
      this.activeDropZone.isActive = false;
    }
    this.cdr.markForCheck();
  }

  private clearDropState(): void {
    this.activeDropZone = null;
    this.cdr.markForCheck();
  }

  // Helper Methods
  private canAcceptChildren(component: UIComponent): boolean {
    const normalizedType = this.widgetRegistry.normalizeWidgetType(component.type);

    // These widget types can have children
    const containerTypes = [
      'scaffold', 'container', 'column', 'row', 'stack', 'center', 'padding',
      'card', 'listview', 'gridview', 'wrap', 'expanded', 'flexible',
      'sizedbox', 'align', 'positioned', 'aspectratio', 'constrainedbox',
      'fittedbox', 'fractionallysizedbox', 'intrinsicheight', 'intrinsicwidth',
      'limitedbox', 'offstage', 'overflowbox', 'sizedoverflowbox', 'transform',
      'customscrollview', 'listbody', 'layoutbuilder', 'hero', 'dismissible'
    ];

    return containerTypes.includes(normalizedType);
  }

  private getComponentAtPath(path: number[]): UIComponent | null {
    if (!this.uiStructure) return null;
    if (path.length === 0) return this.uiStructure;

    let current = this.uiStructure;
    for (const index of path) {
      if (!current.children || index >= current.children.length) {
        return null;
      }
      current = current.children[index];
    }
    return current;
  }

  private isDescendantPath(descendant: number[], ancestor: number[]): boolean {
    if (descendant.length <= ancestor.length) return false;
    return ancestor.every((val, index) => val === descendant[index]);
  }

  // Delete element
  onDeleteElement(path: number[], event: Event): void {
    event.stopPropagation();

    if (path.length === 0) {
      console.warn('Cannot delete root element');
      return;
    }

    // Confirm deletion for elements with children
    const component = this.getComponentAtPath(path);
    if (component && component.children && component.children.length > 0) {
      if (!confirm(`Delete this element and its ${component.children.length} children?`)) {
        return;
      }
    }

    this.uiBuilderService.removeWidget(path);
  }

  // Duplicate element
  onDuplicateElement(path: number[], event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.duplicateWidget(path);
  }

  // Copy element to clipboard
  onCopyElement(path: number[], event: Event): void {
    event.stopPropagation();
    const component = this.getComponentAtPath(path);
    if (component) {
      navigator.clipboard.writeText(JSON.stringify(component, null, 2));
      console.log('Element copied to clipboard');
    }
  }

  // Visual state helpers
  isElementSelected(path: number[]): boolean {
    if (!this.selectedElement) return false;
    return this.arraysEqual(this.selectedElement.path, path);
  }

  isElementHovered(path: number[]): boolean {
    return this.arraysEqual(this.hoveredPath, path);
  }

  isDropTarget(path: number[]): boolean {
    return this.activeDropZone?.isActive &&
           this.arraysEqual(this.activeDropZone.path, path);
  }

  canDropAtPath(path: number[]): boolean {
    return this.activeDropZone?.canDrop &&
           this.arraysEqual(this.activeDropZone.path, path);
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  // Get element display information
  getElementDisplayName(component: UIComponent): string {
    return component.type.charAt(0).toUpperCase() + component.type.slice(1);
  }

  getElementIcon(component: UIComponent): string {
    const iconMap: { [key: string]: string } = {
      'container': 'crop_free',
      'column': 'view_column',
      'row': 'view_stream',
      'stack': 'layers',
      'text': 'text_fields',
      'button': 'smart_button',
      'elevatedbutton': 'smart_button',
      'textbutton': 'touch_app',
      'outlinedbutton': 'crop_3_2',
      'iconbutton': 'radio_button_unchecked',
      'floatingactionbutton': 'add_circle',
      'image': 'image',
      'icon': 'star',
      'card': 'credit_card',
      'listview': 'list',
      'gridview': 'grid_view',
      'textfield': 'edit',
      'checkbox': 'check_box',
      'switch': 'toggle_on',
      'radio': 'radio_button_checked',
      'slider': 'linear_scale',
      'appbar': 'web_asset',
      'scaffold': 'web',
      'divider': 'remove',
      'listtile': 'list_alt',
      'bottomnavigationbar': 'bottom_navigation',
      'circularprogressindicator': 'refresh',
      'linearprogressindicator': 'show_chart',
      'center': 'center_focus_weak',
      'padding': 'space_bar',
      'expanded': 'open_in_full',
      'flexible': 'fit_screen',
      'sizedbox': 'crop_din',
      'wrap': 'wrap_text'
    };

    const normalizedType = this.widgetRegistry.normalizeWidgetType(component.type);
    return iconMap[normalizedType] || 'widgets';
  }

  // Get computed styles for element
  getElementStyles(component: UIComponent): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    const props = component.properties || {};

    // Width and Height
    if (props.width !== undefined && props.width !== null) {
      styles['width'] = typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    if (props.height !== undefined && props.height !== null) {
      styles['height'] = typeof props.height === 'number' ? `${props.height}px` : props.height;
    }

    // Background
    if (props.color || props.backgroundColor) {
      styles['background-color'] = props.color || props.backgroundColor;
    }

    // Padding
    if (props.padding) {
      styles['padding'] = this.formatSpacing(props.padding);
    }

    // Margin
    if (props.margin) {
      styles['margin'] = this.formatSpacing(props.margin);
    }

    // Border
    if (props.borderRadius !== undefined) {
      styles['border-radius'] = typeof props.borderRadius === 'number' ?
        `${props.borderRadius}px` : props.borderRadius;
    }
    if (props.borderWidth !== undefined || props.borderColor) {
      const width = props.borderWidth || 1;
      const color = props.borderColor || '#e0e0e0';
      styles['border'] = `${width}px solid ${color}`;
    }

    // Elevation (shadow)
    if (props.elevation !== undefined && props.elevation > 0) {
      const elevation = Math.min(props.elevation, 24);
      styles['box-shadow'] = this.getElevationShadow(elevation);
    }

    // Flexbox properties
    const normalizedType = this.widgetRegistry.normalizeWidgetType(component.type);

    if (normalizedType === 'row') {
      styles['display'] = 'flex';
      styles['flex-direction'] = 'row';
      styles['justify-content'] = this.mapMainAxisAlignment(props.mainAxisAlignment);
      styles['align-items'] = this.mapCrossAxisAlignment(props.crossAxisAlignment);
    }

    if (normalizedType === 'column') {
      styles['display'] = 'flex';
      styles['flex-direction'] = 'column';
      styles['justify-content'] = this.mapMainAxisAlignment(props.mainAxisAlignment);
      styles['align-items'] = this.mapCrossAxisAlignment(props.crossAxisAlignment);
    }

    if (normalizedType === 'stack') {
      styles['position'] = 'relative';
    }

    if (normalizedType === 'center') {
      styles['display'] = 'flex';
      styles['justify-content'] = 'center';
      styles['align-items'] = 'center';
    }

    if (normalizedType === 'wrap') {
      styles['display'] = 'flex';
      styles['flex-wrap'] = 'wrap';
      styles['gap'] = props.spacing ? `${props.spacing}px` : '8px';
    }

    // Container alignment
    if (props.alignment && normalizedType === 'container') {
      styles['display'] = 'flex';
      const [vertical, horizontal] = this.parseAlignment(props.alignment);
      styles['justify-content'] = horizontal;
      styles['align-items'] = vertical;
    }

    // Opacity
    if (props.opacity !== undefined) {
      styles['opacity'] = props.opacity.toString();
    }

    return styles;
  }

  private formatSpacing(spacing: any): string {
    if (typeof spacing === 'number') {
      return `${spacing}px`;
    }
    if (typeof spacing === 'object') {
      if ('all' in spacing) {
        return `${spacing.all}px`;
      }
      if ('horizontal' in spacing && 'vertical' in spacing) {
        return `${spacing.vertical}px ${spacing.horizontal}px`;
      }
      if ('top' in spacing || 'right' in spacing || 'bottom' in spacing || 'left' in spacing) {
        const top = spacing.top || 0;
        const right = spacing.right || 0;
        const bottom = spacing.bottom || 0;
        const left = spacing.left || 0;
        return `${top}px ${right}px ${bottom}px ${left}px`;
      }
    }
    return '0';
  }

  private getElevationShadow(elevation: number): string {
    const shadows = [
      'none',
      '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    ];

    const index = Math.min(Math.floor(elevation / 5), shadows.length - 1);
    return shadows[index];
  }

  private mapMainAxisAlignment(alignment: string): string {
    const map: any = {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'spaceBetween': 'space-between',
      'spaceAround': 'space-around',
      'spaceEvenly': 'space-evenly'
    };
    return map[alignment] || 'flex-start';
  }

  private mapCrossAxisAlignment(alignment: string): string {
    const map: any = {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'stretch': 'stretch',
      'baseline': 'baseline'
    };
    return map[alignment] || 'flex-start';
  }

  private parseAlignment(alignment: string): [string, string] {
    const map: any = {
      'topLeft': ['flex-start', 'flex-start'],
      'topCenter': ['flex-start', 'center'],
      'topRight': ['flex-start', 'flex-end'],
      'centerLeft': ['center', 'flex-start'],
      'center': ['center', 'center'],
      'centerRight': ['center', 'flex-end'],
      'bottomLeft': ['flex-end', 'flex-start'],
      'bottomCenter': ['flex-end', 'center'],
      'bottomRight': ['flex-end', 'flex-end']
    };
    return map[alignment] || ['center', 'center'];
  }

  // Get text content for text widgets
  getTextContent(component: UIComponent): string {
    const props = component.properties || {};
    return props.text || props.label || props.title || props.hintText || 'Text';
  }

  // Get icon name
  getIconName(component: UIComponent): string {
    const props = component.properties || {};
    return props.icon || props.leadingIcon || props.trailingIcon || 'star';
  }

  // Track function for ngFor
  trackChild(index: number, child: UIComponent): string {
    return `${child.type}-${index}`;
  }

  // Canvas controls
  zoomIn(): void {
    this.canvasScale = Math.min(this.canvasScale + 0.1, 2);
    this.cdr.markForCheck();
  }

  zoomOut(): void {
    this.canvasScale = Math.max(this.canvasScale - 0.1, 0.5);
    this.cdr.markForCheck();
  }

  resetZoom(): void {
    this.canvasScale = 1;
    this.cdr.markForCheck();
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.cdr.markForCheck();
  }

  toggleOutlines(): void {
    this.showOutlines = !this.showOutlines;
    this.cdr.markForCheck();
  }

  setDeviceFrame(frame: 'none' | 'phone' | 'tablet'): void {
    this.deviceFrame = frame;
    this.cdr.markForCheck();
  }
}
