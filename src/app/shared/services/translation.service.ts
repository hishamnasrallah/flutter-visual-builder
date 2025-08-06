// src/app/shared/services/translation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations$ = new BehaviorSubject<{ [key: string]: string }>({});
  private currentLanguage$ = new BehaviorSubject<string>('en');

  // Language change notifier
  public languageChange$ = new Subject<string>();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    console.log('TranslationService: Initialized');
  }

  /**
   * Initialize translations with default language or user preference
   */
  initializeWithDefaults(): Observable<any> {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    return this.loadTranslations(savedLang);
  }

  /**
   * Load translations for a specific language
   */
  loadTranslations(language: string): Observable<any> {
    const baseUrl = this.configService.getBaseUrl();

    if (!baseUrl) {
      // If no base URL configured, use default translations
      const defaultTranslations = this.getDefaultTranslations();
      this.translations$.next(defaultTranslations);
      this.currentLanguage$.next(language);
      localStorage.setItem('preferredLanguage', language);
      this.languageChange$.next(language);
      return of(defaultTranslations);
    }

    const url = `${baseUrl}/auth/translation/${language}/`;

    console.log(`TranslationService: Loading translations for ${language}`);

    return this.http.get<{ [key: string]: string }>(url).pipe(
      tap(translations => {
        console.log(`TranslationService: Loaded ${Object.keys(translations).length} translations for ${language}`);
        this.translations$.next(translations);
        this.currentLanguage$.next(language);
        localStorage.setItem('preferredLanguage', language);
        this.languageChange$.next(language);
      }),
      catchError(error => {
        console.error('TranslationService: Error loading translations:', error);
        const defaultTranslations = this.getDefaultTranslations();
        this.translations$.next(defaultTranslations);
        this.currentLanguage$.next(language);
        localStorage.setItem('preferredLanguage', language);
        this.languageChange$.next(language);
        return of(defaultTranslations);
      })
    );
  }

  /**
   * Get a single translation by key
   */
  getTranslation(key: string): string {
    const translations = this.translations$.value;
    return translations[key] || key;
  }

  /**
   * Set current language and load translations
   */
  setLanguage(language: string): Observable<any> {
    console.log(`TranslationService: Setting language to ${language}`);
    return this.loadTranslations(language);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage$.value;
  }

  /**
   * Get instant translation (alias for getTranslation)
   */
  instant(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }

  /**
   * Translate with interpolation
   */
  translate(key: string, params?: { [key: string]: any }): string {
    let translation = this.getTranslation(key);

    if (params) {
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
        translation = translation.replace(regex, params[param]);
      });
    }

    return translation;
  }

  /**
   * Default translations fallback
   */
  private getDefaultTranslations(): { [key: string]: string } {
    return {
      // App Title
      'flutter_visual_builder': 'Flutter Visual Builder',

      // Authentication
      'sign_in': 'Sign In',
      'login': 'Login',
      'logout': 'Logout',
      'username': 'Username',
      'password': 'Password',
      'remember_me': 'Remember me',
      'forgot_password': 'Forgot password?',
      'login_failed': 'Login failed',
      'invalid_credentials': 'Invalid username or password',
      'login_success': 'Login successful',
      'welcome_back': 'Welcome Back',
      'sign_in_to_continue': 'Sign in to continue to your account',
      'enter_username': 'Enter your username',
      'enter_password': 'Enter your password',
      'username_required': 'Username is required',
      'password_required': 'Password is required',
      'password_min_length': 'Password must be at least 3 characters',
      'fill_required_fields': 'Please fill all required fields',
      'complete_all_fields': 'Please complete all fields',
      'access_denied': 'Access denied',
      'connection_error': 'Connection error',
      'no_account': 'Don\'t have an account?',
      'contact_admin': 'Contact administrator',

      // Branding and Features
      'build_beautiful_apps': 'Build Beautiful Apps',
      'build_faster_deploy_smarter': 'Build Faster, Deploy Smarter',
      'platform_description': 'Create stunning Flutter applications with our intuitive visual builder',

      // Navigation
      'profile': 'Profile',
      'settings': 'Settings',
      'change_language': 'Change Language',
      'select_language': 'Select Language',

      // Builder
      'save': 'Save',
      'properties': 'Properties',
      'layers': 'Layers',
      'preview': 'Preview',
      'generate_code': 'Generate Code',
      'download_project': 'Download Project',
      'build_apk': 'Build APK',

      // Common
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'cancel': 'Cancel',
      'ok': 'OK',
      'close': 'Close',
      'yes': 'Yes',
      'no': 'No',
      'confirm': 'Confirm',
      'delete': 'Delete',
      'edit': 'Edit',
      'add': 'Add',
      'create': 'Create',
      'update': 'Update',
      'refresh': 'Refresh',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'export': 'Export',
      'import': 'Import',
      'back': 'Back',
      'next': 'Next',
      'previous': 'Previous',
      'continue': 'Continue',
      'finish': 'Finish',

      // Builder specific
      'undo': 'Undo',
      'redo': 'Redo',
      'clear_canvas': 'Clear Canvas',
      'zoom_in': 'Zoom In',
      'zoom_out': 'Zoom Out',
      'toggle_layers': 'Toggle Layers Panel',
      'toggle_properties': 'Toggle Properties Panel',
      'toggle_preview': 'Toggle Preview Panel',
      'current_screen': 'Current Screen',
      'home_screen': 'Home Screen',
      'add_screen': 'Add Screen',
      'screen_name': 'Screen Name',
      'screen_route': 'Screen Route',
      'is_home_screen': 'Is Home Screen',

      // Widgets and Components
      'widgets': 'Widgets',
      'components': 'Components',
      'layout': 'Layout',
      'input': 'Input',
      'display': 'Display',
      'navigation': 'Navigation',
      'material': 'Material',
      'basic': 'Basic',
      'advanced': 'Advanced',

      // Properties Panel
      'appearance': 'Appearance',
      'size': 'Size',
      'position': 'Position',
      'spacing': 'Spacing',
      'alignment': 'Alignment',
      'colors': 'Colors',
      'typography': 'Typography',
      'borders': 'Borders',
      'shadows': 'Shadows',
      'animation': 'Animation',
      'behavior': 'Behavior',

      // Project Management
      'project': 'Project',
      'projects': 'Projects',
      'new_project': 'New Project',
      'open_project': 'Open Project',
      'save_project': 'Save Project',
      'project_name': 'Project Name',
      'project_description': 'Project Description',
      'project_settings': 'Project Settings',
      'package_name': 'Package Name',
      'version': 'Version',
      'target_platform': 'Target Platform',

      // Build and Deploy
      'build': 'Build',
      'builds': 'Builds',
      'deploy': 'Deploy',
      'build_status': 'Build Status',
      'build_history': 'Build History',
      'build_success': 'Build successful',
      'build_failed': 'Build failed',
      'build_in_progress': 'Build in progress',
      'download_apk': 'Download APK',

      // Error Messages
      'error_loading': 'Error loading data',
      'error_saving': 'Error saving data',
      'error_deleting': 'Error deleting item',
      'error_uploading': 'Error uploading file',
      'error_processing': 'Error processing request',
      'error_network': 'Network error occurred',
      'error_server': 'Server error occurred',
      'error_validation': 'Validation error',
      'error_permission': 'Permission denied',

      // Success Messages
      'saved_successfully': 'Saved successfully',
      'deleted_successfully': 'Deleted successfully',
      'uploaded_successfully': 'Uploaded successfully',
      'created_successfully': 'Created successfully',
      'updated_successfully': 'Updated successfully',
      'exported_successfully': 'Exported successfully',
      'imported_successfully': 'Imported successfully',

      // Status
      'active': 'Active',
      'inactive': 'Inactive',
      'enabled': 'Enabled',
      'disabled': 'Disabled',
      'online': 'Online',
      'offline': 'Offline',
      'connected': 'Connected',
      'disconnected': 'Disconnected',
      'available': 'Available',
      'unavailable': 'Unavailable',

      // Time and Date
      'today': 'Today',
      'yesterday': 'Yesterday',
      'tomorrow': 'Tomorrow',
      'this_week': 'This week',
      'last_week': 'Last week',
      'this_month': 'This month',
      'last_month': 'Last month',
      'created_at': 'Created at',
      'updated_at': 'Updated at',
      'last_modified': 'Last modified'
    };
  }
}
