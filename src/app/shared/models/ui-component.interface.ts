// src/app/shared/models/ui-component.interface.ts

export interface UIComponent {
  type: string;
  properties: { [key: string]: any };
  children: UIComponent[];
  id?: string;
}

export interface ComponentTemplate {
  id: number;
  name: string;
  category: string;
  flutter_widget: string;
  icon: string;
  description: string;
  default_properties: { [key: string]: any };
  can_have_children: boolean;
  max_children?: number;
  display_order: number;
  widget_group: string;
  show_in_builder: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface OrganizedComponents {
  [groupName: string]: ComponentTemplate[];
}

export interface WidgetGroup {
  name: string;
  components: ComponentTemplate[];
  expanded: boolean;
}
