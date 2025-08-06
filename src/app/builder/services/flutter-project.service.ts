// src/app/builder/services/flutter-project.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, map, switchMap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { FlutterProject, Screen, CreateScreenRequest } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class FlutterProjectService {
  private currentProjectSubject = new BehaviorSubject<FlutterProject | null>(null);
  private currentScreenSubject = new BehaviorSubject<Screen | null>(null);
  private projectScreensSubject = new BehaviorSubject<Screen[]>([]);

  public currentProject$ = this.currentProjectSubject.asObservable();
  public currentScreen$ = this.currentScreenSubject.asObservable();
  public projectScreens$ = this.projectScreensSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Project Management
  loadProject(projectId: number): Observable<FlutterProject> {
    return this.apiService.getFlutterProject(projectId).pipe(
      switchMap(project => {
        this.currentProjectSubject.next(project);
        return this.loadProjectScreens(project.id).pipe(
          map(() => project)
        );
      })
    );
  }

  createProject(projectData: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.apiService.createFlutterProject(projectData).pipe(
      switchMap(project => {
        this.currentProjectSubject.next(project);

        // Create a default home screen
        const defaultScreen: CreateScreenRequest = {
          project: project.id,
          name: 'Home Screen',
          route: '/',
          is_home: true,
          ui_structure: {
            type: 'container',
            properties: {
              width: null,
              height: null,
              color: '#FFFFFF',
              padding: { all: 16 }
            },
            children: [{
              type: 'text',
              properties: {
                text: 'Welcome to your app!',
                fontSize: 24,
                color: '#000000',
                textAlign: 'center'
              },
              children: []
            }]
          }
        };

        return this.apiService.createScreen(defaultScreen).pipe(
          map(screen => {
            this.projectScreensSubject.next([screen]);
            this.currentScreenSubject.next(screen);
            return project;
          })
        );
      })
    );
  }

  updateProject(projectData: Partial<FlutterProject>): Observable<FlutterProject> {
    const currentProject = this.currentProjectSubject.value;
    if (!currentProject) {
      throw new Error('No project loaded');
    }

    return this.apiService.updateFlutterProject(currentProject.id, projectData).pipe(
      map(project => {
        this.currentProjectSubject.next(project);
        return project;
      })
    );
  }

  getCurrentProject(): FlutterProject | null {
    return this.currentProjectSubject.value;
  }

  // Screen Management
  loadProjectScreens(projectId: number): Observable<Screen[]> {
    return this.apiService.getScreens(projectId).pipe(
      map(screens => {
        this.projectScreensSubject.next(screens);

        // Set home screen as current if no screen is selected
        if (!this.currentScreenSubject.value) {
          const homeScreen = screens.find(s => s.is_home) || screens[0];
          if (homeScreen) {
            this.currentScreenSubject.next(homeScreen);
          }
        }

        return screens;
      })
    );
  }

  createScreen(screenData: CreateScreenRequest): Observable<Screen> {
    return this.apiService.createScreen(screenData).pipe(
      map(screen => {
        const currentScreens = this.projectScreensSubject.value;
        this.projectScreensSubject.next([...currentScreens, screen]);
        return screen;
      })
    );
  }

  updateScreen(screenId: number, screenData: Partial<Screen>): Observable<Screen> {
    return this.apiService.updateScreen(screenId, screenData).pipe(
      map(screen => {
        this.updateScreenInList(screen);

        // Update current screen if it's the one being updated
        const currentScreen = this.currentScreenSubject.value;
        if (currentScreen && currentScreen.id === screen.id) {
          this.currentScreenSubject.next(screen);
        }

        return screen;
      })
    );
  }

  updateScreenUIStructure(screenId: number, uiStructure: any): Observable<Screen> {
    return this.apiService.updateScreenUIStructure(screenId, { ui_structure: uiStructure }).pipe(
      map(screen => {
        this.updateScreenInList(screen);

        // Update current screen if it's the one being updated
        const currentScreen = this.currentScreenSubject.value;
        if (currentScreen && currentScreen.id === screen.id) {
          this.currentScreenSubject.next(screen);
        }

        return screen;
      })
    );
  }

  setScreenAsHome(screenId: number): Observable<void> {
    return this.apiService.setScreenAsHome(screenId).pipe(
      switchMap(() => {
        const currentProject = this.currentProjectSubject.value;
        if (currentProject) {
          return this.loadProjectScreens(currentProject.id);
        }
        return [];
      }),
      map(() => void 0)
    );
  }

  duplicateScreen(screenId: number): Observable<Screen> {
    return this.apiService.duplicateScreen(screenId).pipe(
      map(screen => {
        const currentScreens = this.projectScreensSubject.value;
        this.projectScreensSubject.next([...currentScreens, screen]);
        return screen;
      })
    );
  }

  deleteScreen(screenId: number): Observable<void> {
    return this.apiService.deleteScreen(screenId).pipe(
      map(() => {
        const currentScreens = this.projectScreensSubject.value.filter(s => s.id !== screenId);
        this.projectScreensSubject.next(currentScreens);

        // Clear current screen if it was deleted
        const currentScreen = this.currentScreenSubject.value;
        if (currentScreen && currentScreen.id === screenId) {
          const newCurrentScreen = currentScreens.find(s => s.is_home) || currentScreens[0] || null;
          this.currentScreenSubject.next(newCurrentScreen);
        }
      })
    );
  }

  setCurrentScreen(screen: Screen): void {
    this.currentScreenSubject.next(screen);
  }

  getCurrentScreen(): Screen | null {
    return this.currentScreenSubject.value;
  }

  // Code Generation & Building
  generateCode(): Observable<{ project: string; files: { [key: string]: string }; file_count: number }> {
    const currentProject = this.currentProjectSubject.value;
    if (!currentProject) {
      throw new Error('No project loaded');
    }

    return this.apiService.generateCode(currentProject.id);
  }

  downloadProject(): Observable<Blob> {
    const currentProject = this.currentProjectSubject.value;
    if (!currentProject) {
      throw new Error('No project loaded');
    }

    return this.apiService.downloadProject(currentProject.id);
  }

  buildAPK(buildType: string = 'release'): Observable<any> {
    const currentProject = this.currentProjectSubject.value;
    if (!currentProject) {
      throw new Error('No project loaded');
    }

    return this.apiService.createBuild(currentProject.id, buildType);
  }

  // Auto-save functionality
  autoSaveCurrentScreen(): void {
    const currentScreen = this.currentScreenSubject.value;
    if (currentScreen) {
      // This would be called by the UI builder service when changes are made
      // Implementation depends on your auto-save requirements
    }
  }

  private updateScreenInList(updatedScreen: Screen): void {
    const currentScreens = this.projectScreensSubject.value;
    const updatedScreens = currentScreens.map(screen =>
      screen.id === updatedScreen.id ? updatedScreen : screen
    );
    this.projectScreensSubject.next(updatedScreens);
  }
}
