// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Check if running in production - set to false for development
const isProduction = false; // Change to true for production builds
if (isProduction) {
  // Disable console logging in production for better performance
  console.log = console.warn = console.info = () => {};
}

// Bootstrap the Angular application
bootstrapApplication(AppComponent, appConfig)
  .catch(err => {
    console.error('Error starting Flutter Visual Builder:', err);

    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: 'Roboto', sans-serif;
        background: #f5f5f5;
        color: #333;
        padding: 20px;
        text-align: center;
      ">
        <div style="
          max-width: 500px;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
          <div style="color: #f44336; font-size: 48px; margin-bottom: 20px;">⚠️</div>
          <h2 style="margin: 0 0 16px 0; color: #f44336;">Application Failed to Start</h2>
          <p style="margin: 0 0 20px 0; line-height: 1.5;">
            Flutter Visual Builder encountered an error during initialization.
            Please refresh the page or contact support if the problem persists.
          </p>
          <button onclick="window.location.reload()" style="
            padding: 12px 24px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">
            Refresh Page
          </button>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            Error details: ${err.message || 'Unknown error'}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  });
