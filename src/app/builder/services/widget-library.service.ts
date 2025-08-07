// src/app/builder/services/widget-library.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
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

  private hasLoadedWidgets = false; // Track if widgets have been loaded

  constructor(private apiService: ApiService) {
    this.loadWidgets();
  }

  loadWidgets(): void {
    // Prevent duplicate loading
    if (this.hasLoadedWidgets || this.loadingSubject.value) {
      return;
    }

    this.loadingSubject.next(true);
    this.hasLoadedWidgets = true;

    // Use hardcoded widgets if API fails or is not configured
    if (!this.apiService.isConfigured()) {
      this.loadHardcodedWidgets();
      return;
    }

    this.apiService.getOrganizedComponents().subscribe({
      next: (response) => {
        if (response && response.components) {
          const widgetGroups = this.transformToWidgetGroups(response.components);
          this.widgetGroupsSubject.next(this.removeDuplicates(widgetGroups));
        } else {
          console.warn('No components received from API, loading defaults');
          this.loadHardcodedWidgets();
        }
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading widgets, using defaults:', error);
        this.loadHardcodedWidgets();
      }
    });
  }

  private loadHardcodedWidgets(): void {
    const hardcodedGroups: WidgetGroup[] = [
      {
        name: 'Layout',
        expanded: true,
        components: [
          { id: 1, name: 'Scaffold', flutter_widget: 'Scaffold', icon: 'web', category: 'Layout',
            description: 'Basic app structure', default_properties: { showAppBar: true, title: 'My App' },
            can_have_children: true, display_order: 1, widget_group: 'Layout', show_in_builder: true },
          { id: 2, name: 'Container', flutter_widget: 'Container', icon: 'crop_free', category: 'Layout',
            description: 'A box container', default_properties: { padding: { all: 8 } },
            can_have_children: true, display_order: 2, widget_group: 'Layout', show_in_builder: true },
          { id: 3, name: 'Column', flutter_widget: 'Column', icon: 'view_column', category: 'Layout',
            description: 'Vertical layout', default_properties: { mainAxisAlignment: 'start' },
            can_have_children: true, display_order: 3, widget_group: 'Layout', show_in_builder: true },
          { id: 4, name: 'Row', flutter_widget: 'Row', icon: 'view_stream', category: 'Layout',
            description: 'Horizontal layout', default_properties: { mainAxisAlignment: 'start' },
            can_have_children: true, display_order: 4, widget_group: 'Layout', show_in_builder: true },
          { id: 5, name: 'Stack', flutter_widget: 'Stack', icon: 'layers', category: 'Layout',
            description: 'Overlapping widgets', default_properties: {},
            can_have_children: true, display_order: 5, widget_group: 'Layout', show_in_builder: true },
          { id: 6, name: 'Card', flutter_widget: 'Card', icon: 'credit_card', category: 'Layout',
            description: 'Material card', default_properties: { elevation: 2 },
            can_have_children: true, display_order: 6, widget_group: 'Layout', show_in_builder: true },
          { id: 7, name: 'ListView', flutter_widget: 'ListView', icon: 'list', category: 'Layout',
            description: 'Scrollable list', default_properties: { scrollDirection: 'vertical' },
            can_have_children: true, display_order: 7, widget_group: 'Layout', show_in_builder: true }
        ]
      },
      {
        name: 'Display',
        expanded: true,
        components: [
          { id: 10, name: 'Text', flutter_widget: 'Text', icon: 'text_fields', category: 'Display',
            description: 'Display text', default_properties: { text: 'Text Widget', fontSize: 16 },
            can_have_children: false, display_order: 1, widget_group: 'Display', show_in_builder: true },
          { id: 11, name: 'Icon', flutter_widget: 'Icon', icon: 'star', category: 'Display',
            description: 'Material icon', default_properties: { icon: 'star', size: 24 },
            can_have_children: false, display_order: 2, widget_group: 'Display', show_in_builder: true },
          { id: 12, name: 'Image', flutter_widget: 'Image', icon: 'image', category: 'Display',
            description: 'Display image', default_properties: { source: 'https://via.placeholder.com/150' },
            can_have_children: false, display_order: 3, widget_group: 'Display', show_in_builder: true },
          { id: 13, name: 'Divider', flutter_widget: 'Divider', icon: 'remove', category: 'Display',
            description: 'Visual divider', default_properties: { thickness: 1 },
            can_have_children: false, display_order: 4, widget_group: 'Display', show_in_builder: true },
          { id: 14, name: 'Progress', flutter_widget: 'CircularProgressIndicator', icon: 'refresh', category: 'Display',
            description: 'Loading indicator', default_properties: {},
            can_have_children: false, display_order: 5, widget_group: 'Display', show_in_builder: true }
        ]
      },
      {
        name: 'Input',
        expanded: true,
        components: [
          { id: 20, name: 'TextField', flutter_widget: 'TextField', icon: 'edit', category: 'Input',
            description: 'Text input field', default_properties: { hintText: 'Enter text' },
            can_have_children: false, display_order: 1, widget_group: 'Input', show_in_builder: true },
          { id: 21, name: 'Checkbox', flutter_widget: 'Checkbox', icon: 'check_box', category: 'Input',
            description: 'Checkbox input', default_properties: { value: false },
            can_have_children: false, display_order: 2, widget_group: 'Input', show_in_builder: true },
          { id: 22, name: 'Switch', flutter_widget: 'Switch', icon: 'toggle_on', category: 'Input',
            description: 'Toggle switch', default_properties: { value: false },
            can_have_children: false, display_order: 3, widget_group: 'Input', show_in_builder: true },
          { id: 23, name: 'Radio', flutter_widget: 'Radio', icon: 'radio_button_checked', category: 'Input',
            description: 'Radio button', default_properties: { value: false },
            can_have_children: false, display_order: 4, widget_group: 'Input', show_in_builder: true },
          { id: 24, name: 'Slider', flutter_widget: 'Slider', icon: 'linear_scale', category: 'Input',
            description: 'Value slider', default_properties: { min: 0, max: 100, value: 50 },
            can_have_children: false, display_order: 5, widget_group: 'Input', show_in_builder: true }
        ]
      },
      {
        name: 'Buttons',
        expanded: true,
        components: [
          { id: 30, name: 'Elevated Button', flutter_widget: 'ElevatedButton', icon: 'smart_button', category: 'Buttons',
            description: 'Raised button', default_properties: { text: 'Elevated Button' },
            can_have_children: false, display_order: 1, widget_group: 'Buttons', show_in_builder: true },
          { id: 31, name: 'Text Button', flutter_widget: 'TextButton', icon: 'touch_app', category: 'Buttons',
            description: 'Flat text button', default_properties: { text: 'Text Button' },
            can_have_children: false, display_order: 2, widget_group: 'Buttons', show_in_builder: true },
          { id: 32, name: 'Outlined Button', flutter_widget: 'OutlinedButton', icon: 'crop_3_2', category: 'Buttons',
            description: 'Outlined button', default_properties: { text: 'Outlined Button' },
            can_have_children: false, display_order: 3, widget_group: 'Buttons', show_in_builder: true },
          { id: 33, name: 'Icon Button', flutter_widget: 'IconButton', icon: 'radio_button_unchecked', category: 'Buttons',
            description: 'Circular icon button', default_properties: { icon: 'favorite' },
            can_have_children: false, display_order: 4, widget_group: 'Buttons', show_in_builder: true },
          { id: 34, name: 'FAB', flutter_widget: 'FloatingActionButton', icon: 'add_circle', category: 'Buttons',
            description: 'Floating action button', default_properties: { icon: 'add' },
            can_have_children: false, display_order: 5, widget_group: 'Buttons', show_in_builder: true }
        ]
      },
      {
        name: 'Navigation',
        expanded: false,
        components: [
          { id: 40, name: 'AppBar', flutter_widget: 'AppBar', icon: 'web_asset', category: 'Navigation',
            description: 'Top app bar', default_properties: { title: 'App Bar' },
            can_have_children: false, display_order: 1, widget_group: 'Navigation', show_in_builder: true },
          { id: 41, name: 'Bottom Nav', flutter_widget: 'BottomNavigationBar', icon: 'bottom_navigation', category: 'Navigation',
            description: 'Bottom navigation', default_properties: { items: [] },
            can_have_children: false, display_order: 2, widget_group: 'Navigation', show_in_builder: true },
          { id: 42, name: 'ListTile', flutter_widget: 'ListTile', icon: 'list_alt', category: 'Navigation',
            description: 'List item tile', default_properties: { title: 'List Item' },
            can_have_children: false, display_order: 3, widget_group: 'Navigation', show_in_builder: true }
        ]
      }
    ];

    this.widgetGroupsSubject.next(hardcodedGroups);
    this.loadingSubject.next(false);
  }

  private transformToWidgetGroups(organizedComponents: OrganizedComponents): WidgetGroup[] {
    return Object.keys(organizedComponents).map(groupName => ({
      name: groupName,
      components: organizedComponents[groupName].sort((a, b) => a.display_order - b.display_order),
      expanded: true
    }));
  }

  private removeDuplicates(groups: WidgetGroup[]): WidgetGroup[] {
    return groups.map(group => ({
      ...group,
      components: this.uniqueComponents(group.components)
    }));
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
        groups.forEach(group => {
          group.components.forEach(component => {
            if (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                component.flutter_widget.toLowerCase().includes(searchTerm.toLowerCase()) ||
                component.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
              allComponents.push(component);
            }
          });
        });
        return this.uniqueComponents(allComponents);
      })
    );
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
    const defaultProps = JSON.parse(JSON.stringify(template.default_properties || {}));

    return {
      type: template.flutter_widget.toLowerCase(),
      properties: {
        ...defaultProps,
        ...this.getCommonDefaults(template.flutter_widget.toLowerCase())
      },
      children: []
    };
  }

  private getCommonDefaults(widgetType: string): any {
    const commonDefaults: { [key: string]: any } = {
      // Layout widgets
      scaffold: {
        showAppBar: true,
        title: 'My App'
      },
      container: {
        width: null,
        height: null,
        padding: { all: 8 }
      },
      column: {
        mainAxisAlignment: 'start',
        crossAxisAlignment: 'start'
      },
      row: {
        mainAxisAlignment: 'start',
        crossAxisAlignment: 'center'
      },
      stack: {},
      card: {
        elevation: 2,
        padding: { all: 16 }
      },
      listview: {
        scrollDirection: 'vertical'
      },

      // Display widgets
      text: {
        text: 'Text Widget',
        fontSize: 16,
        color: '#000000'
      },
      icon: {
        icon: 'star',
        size: 24,
        color: '#000000'
      },
      image: {
        source: 'https://via.placeholder.com/150',
        width: 150,
        height: 150,
        fit: 'cover'
      },
      divider: {
        thickness: 1,
        color: '#e0e0e0'
      },
      circularprogressindicator: {
        color: '#2196F3'
      },

      // Input widgets
      textfield: {
        hintText: 'Enter text',
        label: 'Text Field'
      },
      checkbox: {
        value: false,
        label: 'Checkbox'
      },
      switch: {
        value: false,
        label: 'Switch'
      },
      radio: {
        value: false,
        label: 'Radio'
      },
      slider: {
        min: 0,
        max: 100,
        value: 50
      },

      // Button widgets
      elevatedbutton: {
        text: 'Elevated Button'
      },
      textbutton: {
        text: 'Text Button'
      },
      outlinedbutton: {
        text: 'Outlined Button'
      },
      iconbutton: {
        icon: 'favorite'
      },
      floatingactionbutton: {
        icon: 'add'
      },

      // Navigation widgets
      appbar: {
        title: 'App Bar'
      },
      bottomnavigationbar: {
        items: [
          { icon: 'home', label: 'Home' },
          { icon: 'search', label: 'Search' },
          { icon: 'person', label: 'Profile' }
        ]
      },
      listtile: {
        title: 'List Item',
        subtitle: 'Supporting text',
        leadingIcon: 'folder',
        trailingIcon: 'arrow_forward'
      }
    };

    return commonDefaults[widgetType.toLowerCase()] || {};
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

  // Force reload widgets (useful for debugging)
  forceReloadWidgets(): void {
    this.hasLoadedWidgets = false;
    this.widgetGroupsSubject.next([]);
    this.loadWidgets();
  }
}
