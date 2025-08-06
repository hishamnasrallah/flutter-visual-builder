// src/app/builder/components/widget-toolbox/widget-toolbox.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

// Angular CDK
import { CdkDragStart, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';

// Services and Models
import { WidgetLibraryService } from '../../services/widget-library.service';
import { UiBuilderService } from '../../services/ui-builder.service';
import { ComponentTemplate, WidgetGroup } from '../../../shared/models';

@Component({
  selector: 'app-widget-toolbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTooltipModule,
    DragDropModule
  ],
  templateUrl: './widget-toolbox.component.html',
  styleUrls: ['./widget-toolbox.component.scss']
})
export class WidgetToolboxComponent implements OnInit, OnDestroy {
  // ... rest of your existing component logic stays the same
  private destroy$ = new Subject<void>();

  widgetGroups: WidgetGroup[] = [];
  searchTerm = '';
  filteredComponents: ComponentTemplate[] = [];
  isLoading = false;
  isSearching = false;

  private searchSubject = new Subject<string>();

  constructor(
    private widgetLibraryService: WidgetLibraryService,
    private uiBuilderService: UiBuilderService
  ) {
    // Setup search with debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnInit(): void {
    // Load widget groups
    this.widgetLibraryService.widgetGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => {
        this.widgetGroups = groups;
      });

    // Loading state
    this.widgetLibraryService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  private performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.isSearching = false;
      this.filteredComponents = [];
      return;
    }

    this.isSearching = true;
    this.widgetLibraryService.searchWidgets(searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe(components => {
        this.filteredComponents = components;
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.isSearching = false;
    this.filteredComponents = [];
  }

  toggleGroup(groupName: string): void {
    this.widgetLibraryService.toggleGroupExpansion(groupName);
  }

  expandAllGroups(): void {
    this.widgetLibraryService.expandAllGroups();
  }

  collapseAllGroups(): void {
    this.widgetLibraryService.collapseAllGroups();
  }

  // Drag Events
  onDragStart(event: CdkDragStart, template: ComponentTemplate): void {
    const uiComponent = this.widgetLibraryService.createDefaultUIComponent(template);
    this.uiBuilderService.setDraggedElement(uiComponent);
  }

  onDragEnd(event: CdkDragEnd): void {
    // Small delay to allow drop to complete
    setTimeout(() => {
      this.uiBuilderService.setDraggedElement(null);
    }, 100);
  }

  // Double-click to add widget to canvas
  onWidgetDoubleClick(template: ComponentTemplate): void {
    const uiComponent = this.widgetLibraryService.createDefaultUIComponent(template);
    this.uiBuilderService.addWidget(uiComponent);
  }

  // Track functions for ngFor
  trackWidgetGroup(index: number, group: WidgetGroup): string {
    return group.name;
  }

  trackComponent(index: number, component: ComponentTemplate): number {
    return component.id;
  }
}
