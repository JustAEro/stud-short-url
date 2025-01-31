import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.getToken()) {
      // Сохраняем текущий URL в сервисе перед редиректом на страницу входа
      const redirectUrl = route.url.join('/');
      this.authService.setRedirectUrl(redirectUrl);
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
