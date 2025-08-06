// src/app/shared/models/screen.interface.ts

import { UIComponent } from './ui-component.interface';

export interface Screen {
  id: number;
  project: number;
  name: string;
  route: string;
  is_home: boolean;
  ui_structure: UIComponent;
  created_at: string;
  updated_at: string;
}

export interface CreateScreenRequest {
  project: number;
  name: string;
  route: string;
  is_home?: boolean;
  ui_structure?: UIComponent;
}

export interface UpdateUIStructureRequest {
  ui_structure: UIComponent;
}
