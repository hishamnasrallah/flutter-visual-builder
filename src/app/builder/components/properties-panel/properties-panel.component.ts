// src/app/builder/components/properties-panel/properties-panel.component.ts - DYNAMIC VERSION

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';

// Services and Models
import { UiBuilderService, SelectedElement } from '../../services/ui-builder.service';
import { WidgetRegistryService, WidgetPropertySchema } from '../../services/widget-registry.service';
import { WidgetLibraryService } from '../../services/widget-library.service';
import { UIComponent, ComponentTemplate } from '../../../shared/models';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    MatTabsModule
  ],
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedElement: SelectedElement | null = null;
  currentWidget: ComponentTemplate | null = null;
  propertiesForm: FormGroup;
  propertySchemas: WidgetPropertySchema[] = [];
  isUpdating = false;

  // Categorized properties for tabs
  basicProperties: WidgetPropertySchema[] = [];
  styleProperties: WidgetPropertySchema[] = [];
  layoutProperties: WidgetPropertySchema[] = [];
  advancedProperties: WidgetPropertySchema[] = [];

  // Special property editors
  paddingExpanded = false;
  marginExpanded = false;
  alignmentOptions = [
    { value: 'topLeft', label: 'Top Left', icon: 'north_west' },
    { value: 'topCenter', label: 'Top Center', icon: 'north' },
    { value: 'topRight', label: 'Top Right', icon: 'north_east' },
    { value: 'centerLeft', label: 'Center Left', icon: 'west' },
    { value: 'center', label: 'Center', icon: 'center_focus_strong' },
    { value: 'centerRight', label: 'Center Right', icon: 'east' },
    { value: 'bottomLeft', label: 'Bottom Left', icon: 'south_west' },
    { value: 'bottomCenter', label: 'Bottom Center', icon: 'south' },
    { value: 'bottomRight', label: 'Bottom Right', icon: 'south_east' }
  ];

  // Common Material icons for icon picker
  commonIcons = [
    'home', 'star', 'favorite', 'settings', 'search', 'menu', 'close', 'add', 'remove',
    'edit', 'delete', 'save', 'share', 'person', 'email', 'phone', 'location_on',
    'calendar_today', 'shopping_cart', 'visibility', 'visibility_off', 'lock', 'lock_open',
    'check', 'check_circle', 'cancel', 'info', 'warning', 'error', 'help',
    'arrow_back', 'arrow_forward', 'arrow_upward', 'arrow_downward', 'refresh',
    'more_vert', 'more_horiz', 'fullscreen', 'fullscreen_exit', 'zoom_in', 'zoom_out',
    'filter_list', 'sort', 'attach_file', 'cloud', 'cloud_upload', 'cloud_download',
    'folder', 'folder_open', 'create_new_folder', 'insert_drive_file', 'description',
    'notifications', 'notifications_off', 'send', 'drafts', 'inbox', 'mail',
    'reply', 'forward', 'archive', 'unarchive', 'label', 'bookmark', 'bookmark_border'
  ];

  constructor(
    private fb: FormBuilder,
    private uiBuilderService: UiBuilderService,
    private widgetRegistry: WidgetRegistryService,
    private widgetLibrary: WidgetLibraryService,
    private cdr: ChangeDetectorRef
  ) {
    this.propertiesForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Subscribe to selected element changes
    this.uiBuilderService.selectedElement$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(selected => {
          this.selectedElement = selected;

          if (selected) {
            // Get widget definition from backend through widget library
            const normalizedType = this.widgetRegistry.normalizeWidgetType(selected.component.type);
            return this.widgetLibrary.getWidgetByType(normalizedType);
          }
          return of(null);
        })
      )
      .subscribe(widget => {
        this.currentWidget = widget || null;
        this.setupPropertiesForm();
        this.cdr.markForCheck();
      });

    // Subscribe to form changes with debouncing
    this.propertiesForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(values => {
        if (!this.isUpdating && this.selectedElement) {
          this.updateElementProperties(values);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPropertiesForm(): void {
    this.isUpdating = true;

    if (!this.selectedElement || !this.currentWidget) {
      this.propertySchemas = [];
      this.categorizeProperties();
      this.propertiesForm = this.fb.group({});
      this.isUpdating = false;
      return;
    }

    const component = this.selectedElement.component;

    // Generate property schemas dynamically from backend widget
    this.propertySchemas = this.widgetRegistry.generatePropertySchemas(this.currentWidget);
    this.categorizeProperties();

    // Build form controls
    const formControls: { [key: string]: any } = {};

    this.propertySchemas.forEach(schema => {
      let value = this.getPropertyValue(component.properties, schema.key);

      // Transform value for UI if needed
      value = this.widgetRegistry.transformPropertyForUI(this.currentWidget!, schema.key, value);

      // Use default value if undefined
      if (value === undefined || value === null) {
        value = schema.defaultValue;
      }

      formControls[schema.key] = [value];

      // Special handling for padding/margin
      if (schema.type === 'padding' || schema.type === 'margin') {
        const objValue = typeof value === 'object' ? value : { all: value || 0 };

        if ('all' in objValue) {
          formControls[`${schema.key}_all`] = [objValue.all || 0];
          formControls[`${schema.key}_mode`] = ['all'];
        } else if ('horizontal' in objValue && 'vertical' in objValue) {
          formControls[`${schema.key}_horizontal`] = [objValue.horizontal || 0];
          formControls[`${schema.key}_vertical`] = [objValue.vertical || 0];
          formControls[`${schema.key}_mode`] = ['axis'];
        } else {
          formControls[`${schema.key}_top`] = [objValue.top || 0];
          formControls[`${schema.key}_right`] = [objValue.right || 0];
          formControls[`${schema.key}_bottom`] = [objValue.bottom || 0];
          formControls[`${schema.key}_left`] = [objValue.left || 0];
          formControls[`${schema.key}_mode`] = ['individual'];
        }
      }
    });

    this.propertiesForm = this.fb.group(formControls);

    setTimeout(() => {
      this.isUpdating = false;
    });
  }

  private categorizeProperties(): void {
    this.basicProperties = this.propertySchemas.filter(p => !p.category || p.category === 'basic');
    this.styleProperties = this.propertySchemas.filter(p => p.category === 'style');
    this.layoutProperties = this.propertySchemas.filter(p => p.category === 'layout');
    this.advancedProperties = this.propertySchemas.filter(p => p.category === 'advanced');
  }

  private getPropertyValue(properties: any, key: string): any {
    return properties[key];
  }

  private updateElementProperties(formValues: any): void {
    if (!this.selectedElement || !this.currentWidget) return;

    const updates: { [key: string]: any } = {};

    this.propertySchemas.forEach(schema => {
      let value = formValues[schema.key];

      // Handle special property types
      if (schema.type === 'padding' || schema.type === 'margin') {
        const mode = formValues[`${schema.key}_mode`];

        if (mode === 'all') {
          value = { all: formValues[`${schema.key}_all`] || 0 };
        } else if (mode === 'axis') {
          value = {
            horizontal: formValues[`${schema.key}_horizontal`] || 0,
            vertical: formValues[`${schema.key}_vertical`] || 0
          };
        } else if (mode === 'individual') {
          value = {
            top: formValues[`${schema.key}_top`] || 0,
            right: formValues[`${schema.key}_right`] || 0,
            bottom: formValues[`${schema.key}_bottom`] || 0,
            left: formValues[`${schema.key}_left`] || 0
          };
        }
      }

      // Transform value from UI if needed
      value = this.widgetRegistry.transformPropertyFromUI(this.currentWidget!, schema.key, value);

      // Validate and include the value
      if (value !== undefined) {
        updates[schema.key] = value;
      }
    });

    if (Object.keys(updates).length > 0) {
      this.uiBuilderService.updateWidgetProperties(this.selectedElement.path, updates);
    }
  }

  // Reset properties to default
  resetProperties(): void {
    if (!this.selectedElement || !this.currentWidget) return;

    this.isUpdating = true;

    const defaultValues: { [key: string]: any } = {};
    this.propertySchemas.forEach(schema => {
      defaultValues[schema.key] = schema.defaultValue;

      // Handle special types
      if (schema.type === 'padding' || schema.type === 'margin') {
        const value = schema.defaultValue || { all: 0 };
        if ('all' in value) {
          defaultValues[`${schema.key}_all`] = value.all;
          defaultValues[`${schema.key}_mode`] = 'all';
        }
      }
    });

    this.propertiesForm.patchValue(defaultValues);
    this.isUpdating = false;

    // Update widget with defaults from backend
    this.uiBuilderService.updateWidgetProperties(
      this.selectedElement.path,
      this.currentWidget.default_properties
    );
  }

  // Get display name for selected element
  getElementDisplayName(): string {
    if (!this.currentWidget) {
      return this.selectedElement?.component.type || '';
    }
    return this.currentWidget.name;
  }

  getElementIcon(): string {
    if (!this.currentWidget) {
      return 'widgets';
    }
    return this.currentWidget.icon;
  }

  // Helper methods for template
  formatSliderValue(value: number): string {
    return value.toString();
  }

  onPaddingModeChange(mode: string): void {
    const currentPadding = this.propertiesForm.value;
    this.isUpdating = true;

    if (mode === 'all') {
      const value = currentPadding.padding_top || currentPadding.padding_all || 0;
      this.propertiesForm.patchValue({
        padding_all: value,
        padding_mode: 'all'
      });
    } else if (mode === 'axis') {
      this.propertiesForm.patchValue({
        padding_horizontal: currentPadding.padding_left || 0,
        padding_vertical: currentPadding.padding_top || 0,
        padding_mode: 'axis'
      });
    } else {
      this.propertiesForm.patchValue({
        padding_top: currentPadding.padding_all || 0,
        padding_right: currentPadding.padding_all || 0,
        padding_bottom: currentPadding.padding_all || 0,
        padding_left: currentPadding.padding_all || 0,
        padding_mode: 'individual'
      });
    }

    this.isUpdating = false;
  }

  onMarginModeChange(mode: string): void {
    const currentMargin = this.propertiesForm.value;
    this.isUpdating = true;

    if (mode === 'all') {
      const value = currentMargin.margin_top || currentMargin.margin_all || 0;
      this.propertiesForm.patchValue({
        margin_all: value,
        margin_mode: 'all'
      });
    } else if (mode === 'axis') {
      this.propertiesForm.patchValue({
        margin_horizontal: currentMargin.margin_left || 0,
        margin_vertical: currentMargin.margin_top || 0,
        margin_mode: 'axis'
      });
    } else {
      this.propertiesForm.patchValue({
        margin_top: currentMargin.margin_all || 0,
        margin_right: currentMargin.margin_all || 0,
        margin_bottom: currentMargin.margin_all || 0,
        margin_left: currentMargin.margin_all || 0,
        margin_mode: 'individual'
      });
    }

    this.isUpdating = false;
  }

  selectIcon(icon: string, propertyKey: string): void {
    this.propertiesForm.patchValue({ [propertyKey]: icon });
  }

  selectAlignment(alignment: string, propertyKey: string): void {
    this.propertiesForm.patchValue({ [propertyKey]: alignment });
  }

  hasProperties(): boolean {
    return this.propertySchemas.length > 0;
  }

  hasCategoryProperties(category: 'basic' | 'style' | 'layout' | 'advanced'): boolean {
    switch (category) {
      case 'basic': return this.basicProperties.length > 0;
      case 'style': return this.styleProperties.length > 0;
      case 'layout': return this.layoutProperties.length > 0;
      case 'advanced': return this.advancedProperties.length > 0;
      default: return false;
    }
  }

  // Track function for ngFor
  trackPropertySchema(index: number, schema: WidgetPropertySchema): string {
    return schema.key;
  }
}
