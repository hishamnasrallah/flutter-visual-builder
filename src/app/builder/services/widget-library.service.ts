// src/app/builder/services/widget-library.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { ComponentTemplate, WidgetGroup, OrganizedComponents } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class WidgetLibraryService {
  private widgetGroupsSubject = new BehaviorSubject<WidgetGroup[]>([]);
  public widgetGroups$ = this.widgetGroupsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadWidgets();
  }

  loadWidgets(): void {
    this.loadingSubject.next(true);

    this.apiService.getOrganizedComponents().subscribe({
      next: (response) => {
        const widgetGroups = this.transformToWidgetGroups(response.components);
        this.widgetGroupsSubject.next(widgetGroups);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading widgets:', error);
        this.loadingSubject.next(false);
      }
    });
  }

  private transformToWidgetGroups(organizedComponents: OrganizedComponents): WidgetGroup[] {
    return Object.keys(organizedComponents).map(groupName => ({
      name: groupName,
      components: organizedComponents[groupName].sort((a, b) => a.display_order - b.display_order),
      expanded: true // Start with groups expanded
    }));
  }

  getWidgetGroups(): Observable<WidgetGroup[]> {
    return this.widgetGroups$;
  }

  searchWidgets(searchTerm: string): Observable<ComponentTemplate[]> {
    return this.apiService.getComponentsForBuilder(undefined, searchTerm)
      .pipe(map(response => response.components));
  }

  getWidgetByType(type: string): Observable<ComponentTemplate | undefined> {
    return this.widgetGroups$.pipe(
      map(groups => {
        for (const group of groups) {
          const widget = group.components.find(c => c.flutter_widget.toLowerCase() === type.toLowerCase());
          if (widget) return widget;
        }
        return undefined;
      })
    );
  }

  createDefaultUIComponent(template: ComponentTemplate): any {
    return {
      type: template.flutter_widget.toLowerCase(),
      properties: { ...template.default_properties },
      children: []
    };
  }

  toggleGroupExpansion(groupName: string): void {
    const currentGroups = this.widgetGroupsSubject.value;
    const updatedGroups = currentGroups.map(group =>
      group.name === groupName
        ? { ...group, expanded: !group.expanded }
        : group
    );
    this.widgetGroupsSubject.next(updatedGroups);
  }

  expandAllGroups(): void {
    const currentGroups = this.widgetGroupsSubject.value;
    const updatedGroups = currentGroups.map(group => ({ ...group, expanded: true }));
    this.widgetGroupsSubject.next(updatedGroups);
  }

  collapseAllGroups(): void {
    const currentGroups = this.widgetGroupsSubject.value;
    const updatedGroups = currentGroups.map(group => ({ ...group, expanded: false }));
    this.widgetGroupsSubject.next(updatedGroups);
  }
}
