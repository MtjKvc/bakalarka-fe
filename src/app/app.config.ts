import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// 1. KROK: Importuj 'withInterceptors' a svoj interceptor
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth-interceptor';

import { registerLocaleData } from '@angular/common'; // <--- NOVÝ IMPORT
import localeSk from '@angular/common/locales/sk'; // <--- NOVÝ IMPORT
import { LOCALE_ID } from '@angular/core';
registerLocaleData(localeSk);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // 2. KROK: Uprav provideHttpClient a pridaj interceptor
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'sk' }

  ]
};
