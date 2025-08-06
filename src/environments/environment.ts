// src/environments/environment.ts

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000', // Django backend URL
  wsUrl: 'ws://localhost:8000/ws', // WebSocket URL (if using real-time features)
  enableDebug: true,
  version: '1.0.0'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.


// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com', // Production API URL
  wsUrl: 'wss://your-api-domain.com/ws', // Production WebSocket URL
  enableDebug: false,
  version: '1.0.0'
};
