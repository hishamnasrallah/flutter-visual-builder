// src/app/builder/services/widget-registry.service.ts - DYNAMIC VERSION

import { Injectable } from '@angular/core';
import { ComponentTemplate } from '../../shared/models';

export interface WidgetPropertySchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'slider' | 'textarea' | 'padding' | 'margin' | 'alignment' | 'icon';
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  category?: 'basic' | 'style' | 'layout' | 'advanced';
  visible?: boolean;
  hint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetRegistryService {

  // No static definitions! This service enhances backend data

  constructor() {}

  // Normalize widget type to lowercase for consistency
  normalizeWidgetType(type: string): string {
    return type.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Generate property schemas dynamically from backend widget
  generatePropertySchemas(widget: ComponentTemplate): WidgetPropertySchema[] {
    const schemas: WidgetPropertySchema[] = [];
    const defaultProps = widget.default_properties || {};
    const widgetType = this.normalizeWidgetType(widget.flutter_widget);

    // Generate schemas based on widget type and default properties
    Object.keys(defaultProps).forEach(key => {
      const value = defaultProps[key];
      const schema = this.inferPropertySchema(key, value, widgetType);
      if (schema) {
        schemas.push(schema);
      }
    });

    // Add common properties based on widget characteristics
    if (widget.can_have_children) {
      // Container widgets often need these
      if (!defaultProps.hasOwnProperty('padding')) {
        schemas.push({
          key: 'padding',
          label: 'Padding',
          type: 'padding',
          defaultValue: { all: 8 },
          category: 'layout'
        });
      }
      if (!defaultProps.hasOwnProperty('margin')) {
        schemas.push({
          key: 'margin',
          label: 'Margin',
          type: 'margin',
          defaultValue: { all: 0 },
          category: 'layout'
        });
      }
    }

    return schemas;
  }

  // Infer property schema from key name and value
  private inferPropertySchema(key: string, value: any, widgetType: string): WidgetPropertySchema | null {
    const schema: WidgetPropertySchema = {
      key: key,
      label: this.formatLabel(key),
      type: 'text',
      defaultValue: value,
      category: this.inferCategory(key)
    };

    // Infer type based on property name patterns
    if (key.includes('color') || key.includes('Color')) {
      schema.type = 'color';
      schema.defaultValue = value || '#000000';
    }
    else if (key === 'icon' || key.includes('Icon')) {
      schema.type = 'icon';
      schema.defaultValue = value || 'star';
    }
    else if (key === 'padding' || key === 'margin') {
      schema.type = key as 'padding' | 'margin';
      schema.defaultValue = typeof value === 'object' ? value : { all: value || 0 };
    }
    else if (key === 'alignment' || key.includes('Alignment')) {
      if (key.includes('mainAxis') || key.includes('crossAxis')) {
        schema.type = 'select';
        schema.options = this.getAlignmentOptions(key);
      } else {
        schema.type = 'alignment';
      }
    }
    else if (key === 'text' || key === 'label' || key === 'title' || key === 'hintText' || key === 'labelText' || key === 'subtitle') {
      schema.type = key === 'text' && widgetType === 'text' ? 'textarea' : 'text';
    }
    else if (key === 'fontSize' || key === 'size' || key === 'iconSize') {
      schema.type = 'slider';
      schema.min = key === 'fontSize' ? 8 : 12;
      schema.max = key === 'fontSize' ? 72 : 96;
      schema.step = key === 'fontSize' ? 1 : 2;
    }
    else if (key === 'width' || key === 'height' || key === 'elevation' || key === 'thickness' || key === 'strokeWidth') {
      schema.type = 'number';
      schema.min = 0;
      if (key === 'elevation') {
        schema.type = 'slider';
        schema.max = 24;
      }
    }
    else if (typeof value === 'boolean') {
      schema.type = 'boolean';
    }
    else if (typeof value === 'number') {
      schema.type = 'number';
      schema.min = 0;
    }
    else if (key === 'fontWeight') {
      schema.type = 'select';
      schema.options = [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
        { value: 'w100', label: 'Thin (100)' },
        { value: 'w300', label: 'Light (300)' },
        { value: 'w500', label: 'Medium (500)' },
        { value: 'w700', label: 'Bold (700)' },
        { value: 'w900', label: 'Black (900)' }
      ];
    }
    else if (key === 'textAlign') {
      schema.type = 'select';
      schema.options = [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
        { value: 'justify', label: 'Justify' }
      ];
    }
    else if (key === 'fit' && widgetType === 'image') {
      schema.type = 'select';
      schema.options = [
        { value: 'cover', label: 'Cover' },
        { value: 'contain', label: 'Contain' },
        { value: 'fill', label: 'Fill' },
        { value: 'fitWidth', label: 'Fit Width' },
        { value: 'fitHeight', label: 'Fit Height' },
        { value: 'none', label: 'None' }
      ];
    }
    else if (key === 'scrollDirection') {
      schema.type = 'select';
      schema.options = [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' }
      ];
    }
    else if (key === 'keyboardType') {
      schema.type = 'select';
      schema.options = [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'url', label: 'URL' },
        { value: 'multiline', label: 'Multiline' }
      ];
    }

    return schema;
  }

  // Get alignment options based on property name
  private getAlignmentOptions(key: string): Array<{ value: string; label: string }> {
    if (key.includes('mainAxis')) {
      return [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
        { value: 'spaceBetween', label: 'Space Between' },
        { value: 'spaceAround', label: 'Space Around' },
        { value: 'spaceEvenly', label: 'Space Evenly' }
      ];
    } else if (key.includes('crossAxis')) {
      return [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
        { value: 'stretch', label: 'Stretch' }
      ];
    }
    return [];
  }

  // Infer property category from key name
  private inferCategory(key: string): 'basic' | 'style' | 'layout' | 'advanced' {
    const styleKeys = ['color', 'Color', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'elevation', 'backgroundColor', 'foregroundColor', 'borderRadius', 'borderWidth', 'borderColor'];
    const layoutKeys = ['width', 'height', 'padding', 'margin', 'alignment', 'Alignment', 'mainAxis', 'crossAxis', 'flex', 'fit'];
    const advancedKeys = ['enabled', 'readOnly', 'obscureText', 'maxLines', 'maxLength', 'shrinkWrap', 'reverse', 'dense', 'controller', 'divisions'];

    if (styleKeys.some(k => key.includes(k))) return 'style';
    if (layoutKeys.some(k => key.includes(k))) return 'layout';
    if (advancedKeys.some(k => key.includes(k))) return 'advanced';
    return 'basic';
  }

  // Format property key to readable label
  private formatLabel(key: string): string {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Create default UI component from backend widget
  createDefaultUIComponent(widget: ComponentTemplate): any {
    return {
      type: this.normalizeWidgetType(widget.flutter_widget),
      properties: { ...widget.default_properties },
      children: []
    };
  }

  // Transform property value for UI display
  transformPropertyForUI(widget: ComponentTemplate, key: string, value: any): any {
    // Handle special transformations
    if (key === 'padding' || key === 'margin') {
      if (typeof value === 'object' && value !== null) {
        if ('all' in value) {
          return value.all;
        }
        return value;
      }
      return value;
    }

    return value;
  }

  // Transform property value from UI input
  transformPropertyFromUI(widget: ComponentTemplate, key: string, value: any): any {
    // Handle special transformations
    if (key === 'padding' || key === 'margin') {
      if (typeof value === 'number') {
        return { all: value };
      }
      return value;
    }

    return value;
  }

  // Check if widget can have children (from backend data)
  canHaveChildren(widget: ComponentTemplate): boolean {
    return widget.can_have_children || false;
  }

  // Get max children for widget (from backend data)
  getMaxChildren(widget: ComponentTemplate): number | undefined {
    return widget.max_children;
  }

  // Validate widget properties based on backend definition
  validateProperties(widget: ComponentTemplate, properties: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation based on default properties
    const defaultProps = widget.default_properties || {};

    Object.keys(properties).forEach(key => {
      const value = properties[key];
      const defaultValue = defaultProps[key];

      // Type checking based on default value type
      if (defaultValue !== undefined && value !== undefined && value !== null) {
        const expectedType = typeof defaultValue;
        const actualType = typeof value;

        if (expectedType !== actualType && !(expectedType === 'object' && actualType === 'object')) {
          errors.push(`Property ${key} should be ${expectedType} but got ${actualType}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }
}
