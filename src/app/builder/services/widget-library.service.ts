// src/app/builder/services/widget-library.service.ts - BACKEND-ONLY VERSION

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { ComponentTemplate, WidgetGroup, OrganizedComponents } from '../../shared/models';
import { WidgetRegistryService } from './widget-registry.service';

@Injectable({
  providedIn: 'root'
})
export class WidgetLibraryService {
  private widgetGroupsSubject = new BehaviorSubject<WidgetGroup[]>([]);
  public widgetGroups$ = this.widgetGroupsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private hasLoadedWidgets = false;

  constructor(
    private apiService: ApiService,
    private widgetRegistry: WidgetRegistryService
  ) {
    this.loadWidgets();
  }

  loadWidgets(): void {
    if (this.hasLoadedWidgets || this.loadingSubject.value) {
      return;
    }

    this.loadingSubject.next(true);
    this.hasLoadedWidgets = true;

    // Check if API is configured
    if (!this.apiService.isConfigured()) {
      console.warn('API not configured, cannot load widgets');
      this.loadingSubject.next(false);

      // Show empty state or error message
      this.widgetGroupsSubject.next([]);
      return;
    }

    // Load widgets from backend
    this.apiService.getOrganizedComponents().subscribe({
      next: (response) => {
        if (response && response.components) {
          const widgetGroups = this.transformToWidgetGroups(response.components);
          this.widgetGroupsSubject.next(widgetGroups);
        } else {
          console.warn('No components received from API');
          this.widgetGroupsSubject.next([]);
        }
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading widgets from backend:', error);
        this.widgetGroupsSubject.next([]);
        this.loadingSubject.next(false);
      }
    });
  }

  private transformToWidgetGroups(organizedComponents: OrganizedComponents): WidgetGroup[] {
    const groups: WidgetGroup[] = [];

    // Process each group from backend
    Object.keys(organizedComponents).forEach(groupName => {
      const components = organizedComponents[groupName];

      if (components && components.length > 0) {
        // Sort by display_order if available
        const sortedComponents = components.sort((a, b) => {
          const orderA = a.display_order || 999;
          const orderB = b.display_order || 999;
          return orderA - orderB;
        });

        groups.push({
          name: groupName,
          components: sortedComponents,
          expanded: this.shouldExpandByDefault(groupName)
        });
      }
    });

    // Sort groups by priority
    const groupPriority = ['Basic Layout', 'Layout', 'Basic Display', 'Display', 'Input Controls', 'Input', 'Buttons', 'Navigation', 'Material Design', 'Advanced Layout'];

    return groups.sort((a, b) => {
      const indexA = groupPriority.indexOf(a.name);
      const indexB = groupPriority.indexOf(b.name);

      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  private shouldExpandByDefault(groupName: string): boolean {
    // Expand main groups by default
    const expandedGroups = ['Basic Layout', 'Layout', 'Basic Display', 'Display', 'Input Controls', 'Input', 'Buttons'];
    return expandedGroups.some(name => groupName.toLowerCase().includes(name.toLowerCase()));
  }

  getWidgetGroups(): Observable<WidgetGroup[]> {
    return this.widgetGroups$;
  }

  searchWidgets(searchTerm: string): Observable<ComponentTemplate[]> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    return this.widgetGroups$.pipe(
      map(groups => {
        const allComponents: ComponentTemplate[] = [];
        const term = searchTerm.toLowerCase();

        groups.forEach(group => {
          group.components.forEach(component => {
            if (component.name.toLowerCase().includes(term) ||
                component.flutter_widget.toLowerCase().includes(term) ||
                component.description?.toLowerCase().includes(term) ||
                component.icon?.toLowerCase().includes(term) ||
                component.category?.toLowerCase().includes(term)) {
              allComponents.push(component);
            }
          });
        });

        return this.uniqueComponents(allComponents);
      })
    );
  }

  private uniqueComponents(components: ComponentTemplate[]): ComponentTemplate[] {
    const seen = new Set<string>();
    return components.filter(component => {
      const key = `${component.flutter_widget}-${component.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getWidgetByType(type: string): Observable<ComponentTemplate | undefined> {
    const normalizedType = this.widgetRegistry.normalizeWidgetType(type);

    return this.widgetGroups$.pipe(
      map(groups => {
        for (const group of groups) {
          const widget = group.components.find(c =>
            this.widgetRegistry.normalizeWidgetType(c.flutter_widget) === normalizedType
          );
          if (widget) return widget;
        }
        return undefined;
      })
    );
  }

  createDefaultUIComponent(template: ComponentTemplate): any {
    // Use the widget registry to create component with backend data
    return this.widgetRegistry.createDefaultUIComponent(template);
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

  // Force reload widgets from backend
  forceReloadWidgets(): void {
    this.hasLoadedWidgets = false;
    this.widgetGroupsSubject.next([]);
    this.loadWidgets();
  }

  // Get widget by backend ID
  getWidgetById(id: number): Observable<ComponentTemplate | undefined> {
    return this.widgetGroups$.pipe(
      map(groups => {
        for (const group of groups) {
          const widget = group.components.find(c => c.id === id);
          if (widget) return widget;
        }
        return undefined;
      })
    );
  }
}
