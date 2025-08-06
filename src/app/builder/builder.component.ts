// src/app/builder/builder.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- This component is empty because the builder UI is handled by AppComponent -->
    <!-- The AppComponent shows/hides the main toolbar based on route -->
  `,
  styles: []
})
export class BuilderComponent {

}
