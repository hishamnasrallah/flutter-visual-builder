// src/app/builder/services/ui-builder.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UIComponent } from '../../shared/models';
import * as _ from 'lodash';

export interface SelectedElement {
  component: UIComponent;
  path: number[];
}

@Injectable({
  providedIn: 'root'
})
export class UiBuilderService {
  private uiStructureSubject = new BehaviorSubject<UIComponent>({
    type: 'container',
    properties: {
      width: null,
      height: null,
      color: '#FFFFFF',
      padding: { all: 16 },
      margin: { all: 0 },
      alignment: 'center'
    },
    children: []
  });

  private selectedElementSubject = new BehaviorSubject<SelectedElement | null>(null);
  private draggedElementSubject = new BehaviorSubject<UIComponent | null>(null);
  private historyStack: UIComponent[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  public uiStructure$ = this.uiStructureSubject.asObservable();
  public selectedElement$ = this.selectedElementSubject.asObservable();
  public draggedElement$ = this.draggedElementSubject.asObservable();

  constructor() {
    // Initialize history with the default structure
    this.pushToHistory(this.uiStructureSubject.value);
  }

  // Canvas Management
  getUIStructure(): UIComponent {
    return _.cloneDeep(this.uiStructureSubject.value);
  }

  setUIStructure(structure: UIComponent): void {
    this.uiStructureSubject.next(_.cloneDeep(structure));
    this.pushToHistory(structure);
  }

  updateUIStructure(structure: UIComponent): void {
    this.uiStructureSubject.next(_.cloneDeep(structure));
  }

  clearCanvas(): void {
    const emptyStructure: UIComponent = {
      type: 'container',
      properties: {
        width: null,
        height: null,
        color: '#FFFFFF',
        padding: { all: 16 },
        margin: { all: 0 }
      },
      children: []
    };
    this.setUIStructure(emptyStructure);
    this.clearSelection();
  }

  // Element Selection
  selectElement(component: UIComponent, path: number[]): void {
    this.selectedElementSubject.next({
      component: _.cloneDeep(component),
      path: [...path]
    });
  }

  clearSelection(): void {
    this.selectedElementSubject.next(null);
  }

  getSelectedElement(): SelectedElement | null {
    return this.selectedElementSubject.value;
  }

  // Drag and Drop
  setDraggedElement(element: UIComponent | null): void {
    this.draggedElementSubject.next(element ? _.cloneDeep(element) : null);
  }

  getDraggedElement(): UIComponent | null {
    return this.draggedElementSubject.value;
  }

  // Widget Operations
  addWidget(widget: UIComponent, targetPath: number[] = []): boolean {
    const currentStructure = this.getUIStructure();
    const success = this.insertWidgetAtPath(currentStructure, widget, targetPath);

    if (success) {
      this.setUIStructure(currentStructure);
      this.selectElement(widget, [...targetPath, this.getChildrenCount(currentStructure, targetPath) - 1]);
    }

    return success;
  }

  removeWidget(path: number[]): boolean {
    if (path.length === 0) return false; // Cannot remove root

    const currentStructure = this.getUIStructure();
    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];

    const parent = this.getComponentAtPath(currentStructure, parentPath);
    if (parent && parent.children && index < parent.children.length) {
      parent.children.splice(index, 1);
      this.setUIStructure(currentStructure);
      this.clearSelection();
      return true;
    }

    return false;
  }

  updateWidgetProperties(path: number[], properties: { [key: string]: any }): boolean {
    const currentStructure = this.getUIStructure();
    const component = this.getComponentAtPath(currentStructure, path);

    if (component) {
      component.properties = { ...component.properties, ...properties };
      this.setUIStructure(currentStructure);
      this.selectElement(component, path);
      return true;
    }

    return false;
  }

  moveWidget(fromPath: number[], toPath: number[]): boolean {
    const currentStructure = this.getUIStructure();

    // Get the widget to move
    const widget = this.getComponentAtPath(currentStructure, fromPath);
    if (!widget) return false;

    // Remove from old location
    if (!this.removeWidgetAtPath(currentStructure, fromPath)) return false;

    // Adjust toPath if needed (when moving within same parent)
    const adjustedToPath = this.adjustPathAfterRemoval(fromPath, toPath);

    // Insert at new location
    if (this.insertWidgetAtPath(currentStructure, widget, adjustedToPath)) {
      this.setUIStructure(currentStructure);
      this.selectElement(widget, adjustedToPath);
      return true;
    }

    return false;
  }

  duplicateWidget(path: number[]): boolean {
    const currentStructure = this.getUIStructure();
    const widget = this.getComponentAtPath(currentStructure, path);

    if (widget) {
      const duplicatedWidget = _.cloneDeep(widget);
      const parentPath = path.slice(0, -1);
      const index = path[path.length - 1] + 1;

      if (this.insertWidgetAtPath(currentStructure, duplicatedWidget, [...parentPath, index])) {
        this.setUIStructure(currentStructure);
        return true;
      }
    }

    return false;
  }

  // History Management
  undo(): void {
    if (this.canUndo()) {
      this.historyIndex--;
      const structure = _.cloneDeep(this.historyStack[this.historyIndex]);
      this.updateUIStructure(structure);
      this.clearSelection();
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.historyIndex++;
      const structure = _.cloneDeep(this.historyStack[this.historyIndex]);
      this.updateUIStructure(structure);
      this.clearSelection();
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.historyStack.length - 1;
  }

  // Utility Methods
  private getComponentAtPath(structure: UIComponent, path: number[]): UIComponent | null {
    let current = structure;

    for (const index of path) {
      if (!current.children || index >= current.children.length) {
        return null;
      }
      current = current.children[index];
    }

    return current;
  }

  private insertWidgetAtPath(structure: UIComponent, widget: UIComponent, path: number[]): boolean {
    if (path.length === 0) {
      // Replace root
      Object.assign(structure, widget);
      return true;
    }

    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    const parent = this.getComponentAtPath(structure, parentPath);

    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }

      // Insert at specified index or at the end
      if (index <= parent.children.length) {
        parent.children.splice(index, 0, _.cloneDeep(widget));
        return true;
      }
    }

    return false;
  }

  private removeWidgetAtPath(structure: UIComponent, path: number[]): boolean {
    if (path.length === 0) return false; // Cannot remove root

    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    const parent = this.getComponentAtPath(structure, parentPath);

    if (parent && parent.children && index < parent.children.length) {
      parent.children.splice(index, 1);
      return true;
    }

    return false;
  }

  private getChildrenCount(structure: UIComponent, path: number[]): number {
    const component = this.getComponentAtPath(structure, path);
    return component?.children?.length || 0;
  }

  private adjustPathAfterRemoval(fromPath: number[], toPath: number[]): number[] {
  // If moving within the same parent
  if (fromPath.length === toPath.length &&
      fromPath.slice(0, -1).every((val, i) => val === toPath[i])) {

    const fromIndex = fromPath[fromPath.length - 1];
    const toIndex = toPath[toPath.length - 1];

    // If moving to a position after the original, adjust for the removal
    if (toIndex > fromIndex) {
      return [...toPath.slice(0, -1), toIndex - 1];
    }
  }

  return toPath;
}

  private pushToHistory(structure: UIComponent): void {
    // Remove any history beyond current index
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);

    // Add new state
    this.historyStack.push(_.cloneDeep(structure));
    this.historyIndex = this.historyStack.length - 1;

    // Limit history size
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift();
      this.historyIndex--;
    }
  }

  // Validation
  canDropWidget(targetPath: number[], widgetType: string): boolean {
  const currentStructure = this.getUIStructure();
  const target = this.getComponentAtPath(currentStructure, targetPath);

  if (!target) return false;

  // Check if target can have children
  const targetCanHaveChildren = this.widgetCanHaveChildren(target.type);
  if (!targetCanHaveChildren) return false;

  // Check max children constraint
  const maxChildren = this.getMaxChildren(target.type);
  if (maxChildren !== null && target.children && target.children.length >= maxChildren) {
    return false;
  }

  // Additional validation for specific widget types
  if (target.type === 'center' && target.children && target.children.length > 0) {
    return false; // Center can only have one child
  }

  return true;
}

  private widgetCanHaveChildren(widgetType: string): boolean {
    const containerTypes = ['container', 'column', 'row', 'stack', 'center', 'padding', 'card'];
    return containerTypes.includes(widgetType.toLowerCase());
  }

  private getMaxChildren(widgetType: string): number | null {
    const singleChildTypes = ['container', 'center', 'padding', 'card'];
    return singleChildTypes.includes(widgetType.toLowerCase()) ? 1 : null;
  }
}
