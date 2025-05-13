import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);

        this.snackBar.open(
          error.error?.message
            ? `Ошибка: ${error.error?.message}`
            : 'Произошла ошибка, попробуйте позже',
          '✕',
          { duration: 5000, panelClass: ['snackbar-error'] }
        );

        if (error.status === 403 && !req.url.includes('/api/v1/edit-permission/')) {
          // Перенаправляем на главную страницу при 403 ошибке
          this.router.navigate(['/']);
        }

        return throwError(() => error);
      })
    );
  }
}
