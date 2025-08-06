// src/app/shared/services/api.service.ts - Updated with config integration
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../builder/services/config.service';
import {
  ComponentTemplate,
  OrganizedComponents,
  FlutterProject,
  Screen,
  CreateScreenRequest,
  UpdateUIStructureRequest,
  Build
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  private getApiUrl(endpoint: string): string {
    const baseUrl = this.configService.getBaseUrl();
    if (!baseUrl) {
      throw new Error('Backend URL not configured. Please configure the backend connection first.');
    }
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  }

  // Health check to test connection
  testConnection(): Observable<any> {
    return this.http.get(this.getApiUrl('/health/') || this.getApiUrl('/api/health/'));
  }

  // Component Templates APIs
  getOrganizedComponents(): Observable<{ groups: string[]; total_components: number; components: OrganizedComponents }> {
    return this.http.get<any>(this.getApiUrl('/api/projects/component-templates/organized/'));
  }

  getComponentsForBuilder(category?: string, search?: string): Observable<{ count: number; components: ComponentTemplate[] }> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);

    return this.http.get<any>(this.getApiUrl('/api/projects/component-templates/components/'), { params });
  }

  // Flutter Projects APIs
  getFlutterProjects(): Observable<FlutterProject[]> {
    return this.http.get<FlutterProject[]>(this.getApiUrl('/api/projects/flutter-projects/'));
  }

  getFlutterProject(id: number): Observable<FlutterProject> {
    return this.http.get<FlutterProject>(this.getApiUrl(`/api/projects/flutter-projects/${id}/`));
  }

  createFlutterProject(project: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.http.post<FlutterProject>(this.getApiUrl('/api/projects/flutter-projects/'), project);
  }

  updateFlutterProject(id: number, project: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.http.put<FlutterProject>(this.getApiUrl(`/api/projects/flutter-projects/${id}/`), project);
  }

  deleteFlutterProject(id: number): Observable<void> {
    return this.http.delete<void>(this.getApiUrl(`/api/projects/flutter-projects/${id}/`));
  }

  // Screens APIs
  getScreens(projectId?: number): Observable<Screen[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('project', projectId.toString());

    return this.http.get<Screen[]>(this.getApiUrl('/api/projects/screens/'), { params });
  }

  getScreen(id: number): Observable<Screen> {
    return this.http.get<Screen>(this.getApiUrl(`/api/projects/screens/${id}/`));
  }

  createScreen(screen: CreateScreenRequest): Observable<Screen> {
    return this.http.post<Screen>(this.getApiUrl('/api/projects/screens/'), screen);
  }

  updateScreen(id: number, screen: Partial<Screen>): Observable<Screen> {
    return this.http.put<Screen>(this.getApiUrl(`/api/projects/screens/${id}/`), screen);
  }

  updateScreenUIStructure(id: number, request: UpdateUIStructureRequest): Observable<Screen> {
    return this.http.put<Screen>(this.getApiUrl(`/api/projects/screens/${id}/update_ui_structure/`), request);
  }

  setScreenAsHome(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(this.getApiUrl(`/api/projects/screens/${id}/set_as_home/`), {});
  }

  duplicateScreen(id: number): Observable<Screen> {
    return this.http.post<Screen>(this.getApiUrl(`/api/projects/screens/${id}/duplicate/`), {});
  }

  deleteScreen(id: number): Observable<void> {
    return this.http.delete<void>(this.getApiUrl(`/api/projects/screens/${id}/`));
  }

  // Code Generation APIs
  generateCode(projectId: number): Observable<{ project: string; files: { [key: string]: string }; file_count: number }> {
    return this.http.post<any>(this.getApiUrl('/api/builder/code-generator/generate_code/'), { project_id: projectId });
  }

  downloadProject(projectId: number): Observable<Blob> {
    return this.http.post(this.getApiUrl('/api/builder/code-generator/download_project/'),
      { project_id: projectId },
      { responseType: 'blob' }
    );
  }

  // Build APIs
  getBuilds(projectId?: number, status?: string): Observable<Build[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('project', projectId.toString());
    if (status) params = params.set('status', status);

    return this.http.get<Build[]>(this.getApiUrl('/api/builds/'), { params });
  }

  createBuild(projectId: number, buildType: string = 'release', versionNumber: string = '1.0.0', buildNumber: number = 1): Observable<Build> {
    return this.http.post<Build>(this.getApiUrl('/api/builds/'), {
      project_id: projectId,
      build_type: buildType,
      version_number: versionNumber,
      build_number: buildNumber
    });
  }

  getBuild(id: number): Observable<Build> {
    return this.http.get<Build>(this.getApiUrl(`/api/builds/${id}/`));
  }

  downloadBuild(id: number): Observable<Blob> {
    return this.http.get(this.getApiUrl(`/api/builds/${id}/download/`), { responseType: 'blob' });
  }

  cancelBuild(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(this.getApiUrl(`/api/builds/${id}/cancel/`), {});
  }

  // User profile API
  getUserProfile(): Observable<any> {
    return this.http.get(this.getApiUrl('/auth/me/'));
  }

  // Generic API call method for flexibility
  call(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET', data?: any, options?: any): Observable<any> {
    const url = this.getApiUrl(endpoint);

    switch (method) {
      case 'GET':
        return this.http.get(url, options);
      case 'POST':
        return this.http.post(url, data, options);
      case 'PUT':
        return this.http.put(url, data, options);
      case 'DELETE':
        return this.http.delete(url, options);
      case 'PATCH':
        return this.http.patch(url, data, options);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  // Utility method to check if API is configured
  isConfigured(): boolean {
    return this.configService.isConfigured();
  }
}
