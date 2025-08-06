// src/app/shared/pipes/translate.pipe.ts
import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subject, takeUntil } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Important: makes the pipe update when translations change
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastKey: string = '';
  private lastValue: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to language changes
    this.translationService.languageChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear cache when language changes
        this.lastKey = '';
        this.lastValue = '';
        this.cdr.markForCheck();
      });
  }

  transform(key: string, interpolateParams?: { [key: string]: any }): string {
    if (!key) return '';

    // Check cache
    if (key === this.lastKey && !interpolateParams) {
      return this.lastValue;
    }

    // Get translation
    let translation = this.translationService.getTranslation(key);

    // Interpolate parameters if provided
    if (interpolateParams && translation) {
      Object.keys(interpolateParams).forEach(param => {
        const regex = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
        translation = translation.replace(regex, interpolateParams[param]);
      });
    }

    // Cache the result
    this.lastKey = key;
    this.lastValue = translation;

    return translation;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
