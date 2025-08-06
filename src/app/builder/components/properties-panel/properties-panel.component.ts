// src/app/builder/components/properties-panel/properties-panel.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms'; // Add FormsModule for ngModel

// Services and Models
import { UiBuilderService, SelectedElement } from '../../services/ui-builder.service';
import { UIComponent } from '../../../shared/models';

interface PropertyConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'slider' | 'textarea';
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

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
  MatTooltipModule
],
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  // ... rest of your existing component logic stays the same
  private destroy$ = new Subject<void>();

  selectedElement: SelectedElement | null = null;
  propertiesForm: FormGroup;
  propertyConfigs: PropertyConfig[] = [];
  isUpdating = false;

  // Common property configurations
  private commonProperties: { [key: string]: PropertyConfig[] } = {
    text: [
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'fontSize', label: 'Font Size', type: 'slider', min: 8, max: 72, step: 1 },
      { key: 'color', label: 'Text Color', type: 'color' },
      {
        key: 'fontWeight',
        label: 'Font Weight',
        type: 'select',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'bold', label: 'Bold' },
          { value: 'w100', label: 'Thin' },
          { value: 'w300', label: 'Light' },
          { value: 'w500', label: 'Medium' },
          { value: 'w700', label: 'Bold' },
          { value: 'w900', label: 'Black' }
        ]
      },
      {
        key: 'textAlign',
        label: 'Text Align',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
          { value: 'justify', label: 'Justify' }
        ]
      },
      { key: 'maxLines', label: 'Max Lines', type: 'number', min: 1 }
    ],
    container: [
      { key: 'width', label: 'Width', type: 'number', min: 0 },
      { key: 'height', label: 'Height', type: 'number', min: 0 },
      { key: 'color', label: 'Background Color', type: 'color' },
      { key: 'padding', label: 'Padding', type: 'number', min: 0 },
      { key: 'margin', label: 'Margin', type: 'number', min: 0 },
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'topLeft', label: 'Top Left' },
          { value: 'topCenter', label: 'Top Center' },
          { value: 'topRight', label: 'Top Right' },
          { value: 'centerLeft', label: 'Center Left' },
          { value: 'center', label: 'Center' },
          { value: 'centerRight', label: 'Center Right' },
          { value: 'bottomLeft', label: 'Bottom Left' },
          { value: 'bottomCenter', label: 'Bottom Center' },
          { value: 'bottomRight', label: 'Bottom Right' }
        ]
      }
    ],
    column: [
      {
        key: 'mainAxisAlignment',
        label: 'Main Axis Alignment',
        type: 'select',
        options: [
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
          { value: 'spaceBetween', label: 'Space Between' },
          { value: 'spaceAround', label: 'Space Around' },
          { value: 'spaceEvenly', label: 'Space Evenly' }
        ]
      },
      {
        key: 'crossAxisAlignment',
        label: 'Cross Axis Alignment',
        type: 'select',
        options: [
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
          { value: 'stretch', label: 'Stretch' }
        ]
      }
    ],
    row: [
      {
        key: 'mainAxisAlignment',
        label: 'Main Axis Alignment',
        type: 'select',
        options: [
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
          { value: 'spaceBetween', label: 'Space Between' },
          { value: 'spaceAround', label: 'Space Around' },
          { value: 'spaceEvenly', label: 'Space Evenly' }
        ]
      },
      {
        key: 'crossAxisAlignment',
        label: 'Cross Axis Alignment',
        type: 'select',
        options: [
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
          { value: 'stretch', label: 'Stretch' }
        ]
      }
    ],
    button: [
      { key: 'text', label: 'Button Text', type: 'text' },
      {
        key: 'style',
        label: 'Button Style',
        type: 'select',
        options: [
          { value: 'elevated', label: 'Elevated' },
          { value: 'filled', label: 'Filled' },
          { value: 'outlined', label: 'Outlined' },
          { value: 'text', label: 'Text' }
        ]
      }
    ],
    icon: [
      { key: 'icon', label: 'Icon Name', type: 'text' },
      { key: 'size', label: 'Icon Size', type: 'slider', min: 12, max: 96, step: 2 },
      { key: 'color', label: 'Icon Color', type: 'color' }
    ],
    image: [
      { key: 'source', label: 'Image URL', type: 'text' },
      { key: 'width', label: 'Width', type: 'number', min: 0 },
      { key: 'height', label: 'Height', type: 'number', min: 0 },
      {
        key: 'fit',
        label: 'Image Fit',
        type: 'select',
        options: [
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
          { value: 'fill', label: 'Fill' },
          { value: 'fitWidth', label: 'Fit Width' },
          { value: 'fitHeight', label: 'Fit Height' },
          { value: 'none', label: 'None' }
        ]
      },
      { key: 'alt', label: 'Alt Text', type: 'text' }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private uiBuilderService: UiBuilderService,
    private cdr: ChangeDetectorRef
  ) {
    this.propertiesForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Subscribe to selected element changes
    this.uiBuilderService.selectedElement$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        this.selectedElement = selected;
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
  // Add this method to the PropertiesPanelComponent class
  formatSliderValue(value: number): string {
    return value.toString();
  }
  private setupPropertiesForm(): void {
    this.isUpdating = true;

    if (!this.selectedElement) {
      this.propertyConfigs = [];
      this.propertiesForm = this.fb.group({});
      this.isUpdating = false;
      return;
    }

    const component = this.selectedElement.component;
    const widgetType = component.type.toLowerCase();

    // Get property configs for this widget type
    this.propertyConfigs = this.getPropertyConfigs(widgetType);

    // Build form controls
    const formControls: { [key: string]: any } = {};

    this.propertyConfigs.forEach(config => {
      let value = this.getPropertyValue(component.properties, config.key);

      // Handle special cases
      if (config.key === 'padding' || config.key === 'margin') {
        if (typeof value === 'object' && value?.all !== undefined) {
          value = value.all;
        }
      }

      formControls[config.key] = [value || this.getDefaultValue(config)];
    });

    this.propertiesForm = this.fb.group(formControls);

    setTimeout(() => {
      this.isUpdating = false;
    });
  }

  private getPropertyConfigs(widgetType: string): PropertyConfig[] {
    return this.commonProperties[widgetType] || [];
  }

  private getPropertyValue(properties: any, key: string): any {
  const value = properties[key];

  // Handle nested object properties like padding.all
  if (key === 'padding' || key === 'margin') {
    if (typeof value === 'object' && value?.all !== undefined) {
      return value.all;
    }
    return value;
  }

  return value;
}

private getDefaultValue(config: PropertyConfig): any {
  switch (config.type) {
    case 'boolean':
      return false;
    case 'number':
    case 'slider':
      return config.min || 0;
    case 'select':
      return config.options?.[0]?.value || '';
    case 'color':
      return '#000000';
    default:
      return '';
  }
}

  private updateElementProperties(formValues: any): void {
  if (!this.selectedElement) return;

  const updates: { [key: string]: any } = {};

  Object.keys(formValues).forEach(key => {
    const config = this.propertyConfigs.find(c => c.key === key);
    let value = formValues[key];

    if (!config) return;

    // Handle special transformations
    if (config.key === 'padding' || config.key === 'margin') {
      if (typeof value === 'number' && value >= 0) {
        value = { all: value };
      } else {
        return; // Skip invalid padding/margin values
      }
    }

    // Handle color values
    if (config.type === 'color') {
      if (!value || (!value.startsWith('#') && !value.toLowerCase().startsWith('rgb'))) {
        return; // Skip invalid colors
      }
    }

    // Include the value (don't skip empty strings for some properties like text)
    if (value !== null && value !== undefined) {
      if (config.type === 'text' || value !== '') {
        updates[key] = value;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    // Update the element properties
    this.uiBuilderService.updateWidgetProperties(this.selectedElement.path, updates);
  }
}

  // Reset properties to default
  resetProperties(): void {
    if (!this.selectedElement) return;

    const defaultProperties: { [key: string]: any } = {};

    this.propertyConfigs.forEach(config => {
      defaultProperties[config.key] = this.getDefaultValue(config);
    });

    this.isUpdating = true;
    this.propertiesForm.patchValue(defaultProperties);
    this.isUpdating = false;
  }

  // Get display name for selected element
  getElementDisplayName(): string {
    if (!this.selectedElement) return '';

    const type = this.selectedElement.component.type;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  // Track function for ngFor
  trackPropertyConfig(index: number, config: PropertyConfig): string {
    return config.key;
  }
}
