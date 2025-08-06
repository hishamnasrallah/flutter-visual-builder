// src/app/builder/components/layers-panel/layers-panel.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services and Models
import { UiBuilderService, SelectedElement } from '../../services/ui-builder.service';
import { UIComponent } from '../../../shared/models';

interface LayerNode {
  component: UIComponent;
  path: number[];
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-layers-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './layers-panel.component.html',
  styleUrls: ['./layers-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayersPanelComponent implements OnInit, OnDestroy {
  // ... rest of your existing component logic stays the same
  private destroy$ = new Subject<void>();

  layers: LayerNode[] = [];
  selectedElement: SelectedElement | null = null;
  expandedPaths: Set<string> = new Set(['0']); // Root is expanded by default

  constructor(
    private uiBuilderService: UiBuilderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to UI structure changes
    this.uiBuilderService.uiStructure$
      .pipe(takeUntil(this.destroy$))
      .subscribe(structure => {
        this.buildLayersTree(structure);
        this.cdr.markForCheck();
      });

    // Subscribe to selected element changes
    this.uiBuilderService.selectedElement$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        this.selectedElement = selected;
        this.updateLayersSelection();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildLayersTree(rootComponent: UIComponent): void {
    this.layers = [];
    if (rootComponent) {
      this.traverseComponent(rootComponent, [], 0);
    }
  }

  private traverseComponent(component: UIComponent, path: number[], level: number): void {
    const pathString = path.join('-');
    const isExpanded = this.expandedPaths.has(pathString);

    const layerNode: LayerNode = {
      component,
      path: [...path],
      level,
      expanded: isExpanded,
      hasChildren: component.children && component.children.length > 0,
      isSelected: this.isPathSelected(path)
    };

    this.layers.push(layerNode);

    // Add children if expanded
    if (isExpanded && component.children) {
      component.children.forEach((child, index) => {
        this.traverseComponent(child, [...path, index], level + 1);
      });
    }
  }

  private updateLayersSelection(): void {
    this.layers.forEach(layer => {
      layer.isSelected = this.isPathSelected(layer.path);
    });
  }

  private isPathSelected(path: number[]): boolean {
    if (!this.selectedElement) return false;
    return this.arraysEqual(this.selectedElement.path, path);
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  // Event Handlers
  onLayerClick(layer: LayerNode, event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.selectElement(layer.component, layer.path);
  }

  onToggleExpand(layer: LayerNode, event: Event): void {
    event.stopPropagation();

    const pathString = layer.path.join('-');

    if (layer.expanded) {
      this.expandedPaths.delete(pathString);
    } else {
      this.expandedPaths.add(pathString);
    }

    // Rebuild tree to reflect expansion changes
    const rootStructure = this.uiBuilderService.getUIStructure();
    this.buildLayersTree(rootStructure);
    this.cdr.markForCheck();
  }

  onDeleteLayer(layer: LayerNode, event: Event): void {
    event.stopPropagation();

    if (layer.path.length === 0) {
      // Cannot delete root
      return;
    }

    this.uiBuilderService.removeWidget(layer.path);
  }

  onDuplicateLayer(layer: LayerNode, event: Event): void {
    event.stopPropagation();
    this.uiBuilderService.duplicateWidget(layer.path);
  }

  // Visibility toggle (could be implemented in future)
  onToggleVisibility(layer: LayerNode, event: Event): void {
    event.stopPropagation();
    // Future implementation for hiding/showing elements
    console.log('Toggle visibility for:', layer.component.type);
  }

  // Get display info for layers
  getLayerIcon(component: UIComponent): string {
    const iconMap: { [key: string]: string } = {
      'container': 'crop_free',
      'column': 'view_column',
      'row': 'view_stream',
      'stack': 'layers',
      'text': 'text_fields',
      'button': 'smart_button',
      'image': 'image',
      'icon': 'star',
      'center': 'center_focus_weak',
      'padding': 'space_bar',
      'card': 'crop_landscape',
      'listview': 'list',
      'gridview': 'grid_view'
    };

    return iconMap[component.type.toLowerCase()] || 'widgets';
  }

  getLayerName(component: UIComponent): string {
    // Try to get a meaningful name
    if (component.properties.text) {
      const text = component.properties.text.toString().substring(0, 20);
      return `${this.getTypeName(component.type)} (${text}${text.length > 20 ? '...' : ''})`;
    }

    return this.getTypeName(component.type);
  }

  private getTypeName(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getLayerDescription(component: UIComponent): string {
    const props = component.properties;
    const details: string[] = [];

    if (props.width || props.height) {
      details.push(`${props.width || 'auto'} × ${props.height || 'auto'}`);
    }

    if (props.color) {
      details.push(props.color);
    }

    if (component.children && component.children.length > 0) {
      details.push(`${component.children.length} children`);
    }

    return details.join(' • ');
  }

  // Expand/Collapse all
  expandAll(): void {
    this.layers.forEach(layer => {
      const pathString = layer.path.join('-');
      this.expandedPaths.add(pathString);
    });

    const rootStructure = this.uiBuilderService.getUIStructure();
    this.buildLayersTree(rootStructure);
    this.cdr.markForCheck();
  }

  collapseAll(): void {
    this.expandedPaths.clear();
    this.expandedPaths.add(''); // Keep root expanded

    const rootStructure = this.uiBuilderService.getUIStructure();
    this.buildLayersTree(rootStructure);
    this.cdr.markForCheck();
  }

  // Track function for ngFor
  trackLayer(index: number, layer: LayerNode): string {
    return layer.path.join('-') + '-' + layer.component.type;
  }
}
