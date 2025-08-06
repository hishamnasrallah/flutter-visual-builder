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

  private readonly LANGUAGE_KEY = 'flutter_builder_language';

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
    const savedLang = localStorage.getItem(this.LANGUAGE_KEY) || 'en';
    return this.loadTranslations(savedLang);
  }

  /**
   * Load translations for a specific language
   */
  loadTranslations(language: string): Observable<any> {
    if (!this.configService.isConfigured()) {
      // Use default translations if no backend configured
      const defaultTranslations = this.getDefaultTranslations();
      this.translations$.next(defaultTranslations);
      this.currentLanguage$.next(language);
      return of(defaultTranslations);
    }

    const baseUrl = this.configService.getBaseUrl();
    const url = `${baseUrl}/auth/translation/${language}/`;

    console.log(`TranslationService: Loading translations for ${language}`);

    return this.http.get<{ [key: string]: string }>(url).pipe(
      tap(translations => {
        console.log(`TranslationService: Loaded ${Object.keys(translations).length} translations for ${language}`);
        this.translations$.next(translations);
        this.currentLanguage$.next(language);
        localStorage.setItem(this.LANGUAGE_KEY, language);

        // Update document direction for RTL languages
        this.updateDocumentDirection(language);

        // Notify about language change
        this.languageChange$.next(language);
      }),
      catchError(error => {
        console.error('TranslationService: Error loading translations:', error);
        // Fallback to default translations
        const defaultTranslations = this.getDefaultTranslations();
        this.translations$.next(defaultTranslations);
        this.currentLanguage$.next(language);
        return of(defaultTranslations);
      })
    );
  }

  /**
   * Update document direction based on language
   */
  private updateDocumentDirection(language: string): void {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const isRtl = rtlLanguages.includes(language);

    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    // Update body class for styling
    document.body.classList.toggle('rtl', isRtl);
    document.body.classList.toggle('ltr', !isRtl);
  }

  /**
   * Get a single translation by key
   */
  getTranslation(key: string): string {
    const translations = this.translations$.value;
    return translations[key] || key; // Return key if translation not found
  }

  /**
   * Get multiple translations by keys
   */
  getTranslations(keys: string[]): { [key: string]: string } {
    const translations = this.translations$.value;
    const result: { [key: string]: string } = {};

    keys.forEach(key => {
      result[key] = translations[key] || key;
    });

    return result;
  }

  /**
   * Get all current translations
   */
  getAllTranslations(): { [key: string]: string } {
    return this.translations$.value;
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
   * Get instant translation (alias for getTranslation)
   */
  instant(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }

  /**
   * Default translations for Flutter Visual Builder
   */
  private getDefaultTranslations(): { [key: string]: string } {
    return {
      // App Title & Branding
      'app_title': 'Flutter Visual Builder',
      'app_subtitle': 'Build Flutter UIs visually',
      'brand_tagline': 'Visual Development Platform',

      // Authentication
      'login_title': 'Welcome Back',
      'login_subtitle': 'Sign in to continue building',
      'username': 'Username',
      'password': 'Password',
      'remember_me': 'Remember me',
      'forgot_password': 'Forgot password?',
      'sign_in': 'Sign In',
      'sign_out': 'Sign Out',
      'login_failed': 'Login failed. Please check your credentials.',
      'login_success': 'Login successful!',
      'invalid_credentials': 'Invalid username or password',
      'access_denied': 'Access denied',
      'connection_error': 'Connection error. Please check your network.',
      'username_required': 'Username is required',
      'password_required': 'Password is required',
      'password_min_length': 'Password must be at least 6 characters',
      'enter_username': 'Enter your username',
      'enter_password': 'Enter your password',

      // Configuration
      'configuration': 'Configuration',
      'system_configuration': 'System Configuration',
      'backend_url': 'Backend API URL',
      'test_connection': 'Test Connection',
      'save_configuration': 'Save Configuration',
      'connection_successful': 'Connection successful',
      'connection_failed': 'Connection failed',
      'config_saved': 'Configuration saved successfully',

      // Navigation & UI
      'dashboard': 'Dashboard',
      'projects': 'Projects',
      'settings': 'Settings',
      'profile': 'Profile',
      'help': 'Help',
      'about': 'About',

      // Builder Interface
      'widgets': 'Widgets',
      'properties': 'Properties',
      'layers': 'Layers',
      'preview': 'Preview',
      'canvas': 'Canvas',
      'toolbox': 'Toolbox',

      // Project Management
      'new_project': 'New Project',
      'open_project': 'Open Project',
      'save_project': 'Save Project',
      'project_name': 'Project Name',
      'project_description': 'Project Description',
      'create_project': 'Create Project',

      // Code Generation
      'generate_code': 'Generate Code',
      'download_project': 'Download Project',
      'build_apk': 'Build APK',
      'preview_app': 'Preview App',

      // Common Actions
      'save': 'Save',
      'cancel': 'Cancel',
      'delete': 'Delete',
      'edit': 'Edit',
      'add': 'Add',
      'remove': 'Remove',
      'duplicate': 'Duplicate',
      'copy': 'Copy',
      'paste': 'Paste',
      'undo': 'Undo',
      'redo': 'Redo',
      'search': 'Search',
      'filter': 'Filter',
      'refresh': 'Refresh',
      'loading': 'Loading...',
      'no_results_found': 'No results found',
      'success': 'Success',
      'error': 'Error',
      'warning': 'Warning',
      'info': 'Info',

      // Widget Properties
      'width': 'Width',
      'height': 'Height',
      'color': 'Color',
      'background_color': 'Background Color',
      'text_color': 'Text Color',
      'font_size': 'Font Size',
      'font_weight': 'Font Weight',
      'text_align': 'Text Alignment',
      'padding': 'Padding',
      'margin': 'Margin',
      'border': 'Border',
      'border_radius': 'Border Radius',

      // Language & Localization
      'language': 'Language',
      'change_language': 'Change Language',
      'select_language': 'Select Language',
      'all_rights_reserved': 'All rights reserved',

      // Error Messages
      'error_loading_data': 'Error loading data',
      'error_saving_data': 'Error saving data',
      'error_generating_code': 'Error generating code',
      'validation_error': 'Validation error',
      'network_error': 'Network error',
      'unexpected_error': 'An unexpected error occurred',

      // Confirmations
      'confirm_delete': 'Are you sure you want to delete this?',
      'confirm_discard_changes': 'Discard unsaved changes?',
      'changes_saved': 'Changes saved successfully',

      // Feature descriptions
      'feature_faster': 'Faster Development',
      'feature_faster_desc': 'Build Flutter UIs 10x faster with visual tools',
      'feature_api': 'Code Generation',
      'feature_api_desc': 'Generate clean, production-ready Flutter code',
      'feature_secure': 'Secure & Reliable',
      'feature_secure_desc': 'Enterprise-grade security and reliability',

      // Form validation
      'fill_required_fields': 'Please fill in all required fields',
      'complete_all_fields': 'Please complete all required fields',

      // Contact & Support
      'no_account': "Don't have an account?",
      'contact_admin': 'Contact Administrator',
      'build_faster_deploy_smarter': 'Build Faster, Deploy Smarter',
      'platform_description': 'Create stunning Flutter applications with our visual development platform'
    };
  }
}
