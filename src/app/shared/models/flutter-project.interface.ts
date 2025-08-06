// src/app/shared/models/flutter-project.interface.ts

import { UIComponent } from './ui-component.interface';

export interface FlutterProject {
  id: number;
  name: string;
  description?: string;
  package_name: string;
  user: number;
  app_version?: number;
  supported_languages: LocalVersion[];
  supported_language_ids?: number[];
  default_language: string;
  app_icon?: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LocalVersion {
  lang: string;
  version_number: string;
  active_ind: boolean;
}

export interface Build {
  id: number;
  project: number;
  project_name: string;
  project_package: string;
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled';
  status_display: string;
  build_type: 'debug' | 'release' | 'profile';
  build_type_display: string;
  version_number: string;
  build_number: number;
  apk_file?: string;
  apk_url?: string;
  apk_size?: number;
  flutter_version?: string;
  dart_version?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  duration_display?: string;
  logs_count: number;
}
