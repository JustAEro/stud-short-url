import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token'); // Получаем токен из localStorage

    if (token) {
      // Клонируем запрос и добавляем заголовок Authorization
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.handleUnauthorized();
          }
          return throwError(() => error);
        })
      );
  }

  private handleUnauthorized() {
    localStorage.removeItem('access_token'); // Удаляем токен
    this.router.navigate(['/login']); // Перенаправляем на страницу логина
  }
}
