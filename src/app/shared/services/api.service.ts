// src/app/shared/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
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
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Component Templates APIs
getOrganizedComponents(): Observable<{ groups: string[]; total_components: number; components: OrganizedComponents }> {
  return this.http.get<any>(`${this.baseUrl}/api/projects/component-templates/organized/`)
    .pipe(
      catchError(this.handleError<any>('getOrganizedComponents'))
    );
}

private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed:`, error);

    // Log error details for debugging
    if (error.error) {
      console.error('Error details:', error.error);
    }

    // Return safe fallback value
    return of(result as T);
  };
}

  getComponentsForBuilder(category?: string, search?: string): Observable<{ count: number; components: ComponentTemplate[] }> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);

    return this.http.get<any>(`${this.baseUrl}/api/projects/component-templates/components/`, { params });
  }

  // Flutter Projects APIs
getFlutterProjects(): Observable<FlutterProject[]> {
  return this.http.get<FlutterProject[]>(`${this.baseUrl}/api/projects/flutter-projects/`)
    .pipe(
      catchError(this.handleError<FlutterProject[]>('getFlutterProjects', []))
    );
}

getFlutterProject(id: number): Observable<FlutterProject> {
  return this.http.get<FlutterProject>(`${this.baseUrl}/api/projects/flutter-projects/${id}/`)
    .pipe(
      catchError(this.handleError<FlutterProject>('getFlutterProject'))
    );
}

  createFlutterProject(project: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.http.post<FlutterProject>(`${this.baseUrl}/api/projects/flutter-projects/`, project);
  }

  updateFlutterProject(id: number, project: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.http.put<FlutterProject>(`${this.baseUrl}/api/projects/flutter-projects/${id}/`, project);
  }

  deleteFlutterProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/projects/flutter-projects/${id}/`);
  }

  // Screens APIs
  getScreens(projectId?: number): Observable<Screen[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('project', projectId.toString());

    return this.http.get<Screen[]>(`${this.baseUrl}/api/projects/screens/`, { params });
  }

  getScreen(id: number): Observable<Screen> {
    return this.http.get<Screen>(`${this.baseUrl}/api/projects/screens/${id}/`);
  }

  createScreen(screen: CreateScreenRequest): Observable<Screen> {
    return this.http.post<Screen>(`${this.baseUrl}/api/projects/screens/`, screen);
  }

  updateScreen(id: number, screen: Partial<Screen>): Observable<Screen> {
    return this.http.put<Screen>(`${this.baseUrl}/api/projects/screens/${id}/`, screen);
  }

  updateScreenUIStructure(id: number, request: UpdateUIStructureRequest): Observable<Screen> {
    return this.http.put<Screen>(`${this.baseUrl}/api/projects/screens/${id}/update_ui_structure/`, request);
  }

  setScreenAsHome(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/api/projects/screens/${id}/set_as_home/`, {});
  }

  duplicateScreen(id: number): Observable<Screen> {
    return this.http.post<Screen>(`${this.baseUrl}/api/projects/screens/${id}/duplicate/`, {});
  }

  deleteScreen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/projects/screens/${id}/`);
  }

  // Code Generation APIs
  generateCode(projectId: number): Observable<{ project: string; files: { [key: string]: string }; file_count: number }> {
    return this.http.post<any>(`${this.baseUrl}/api/builder/code-generator/generate_code/`, { project_id: projectId });
  }

  downloadProject(projectId: number): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/api/builder/code-generator/download_project/`,
      { project_id: projectId },
      { responseType: 'blob' }
    );
  }

  // Build APIs
  getBuilds(projectId?: number, status?: string): Observable<Build[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('project', projectId.toString());
    if (status) params = params.set('status', status);

    return this.http.get<Build[]>(`${this.baseUrl}/api/builds/`, { params });
  }

  createBuild(projectId: number, buildType: string = 'release', versionNumber: string = '1.0.0', buildNumber: number = 1): Observable<Build> {
    return this.http.post<Build>(`${this.baseUrl}/api/builds/`, {
      project_id: projectId,
      build_type: buildType,
      version_number: versionNumber,
      build_number: buildNumber
    });
  }

  getBuild(id: number): Observable<Build> {
    return this.http.get<Build>(`${this.baseUrl}/api/builds/${id}/`);
  }

  downloadBuild(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/builds/${id}/download/`, { responseType: 'blob' });
  }

  cancelBuild(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/api/builds/${id}/cancel/`, {});
  }
}
