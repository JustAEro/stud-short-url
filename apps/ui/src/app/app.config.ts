import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ArrowDownToLine,
  ClipboardCopy,
  LucideAngularModule,
  Plus,
  QrCode,
  Trash,
  User,
} from 'lucide-angular';
import { AuthInterceptor } from './auth/auth.interceptor';
import { ErrorInterceptor } from './error/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    importProvidersFrom(
      LucideAngularModule.pick({
        User,
        Plus,
        ClipboardCopy,
        Trash,
        QrCode,
        ArrowDownToLine,
      })
    ),
    importProvidersFrom(MatSnackBarModule),
  ],
};
