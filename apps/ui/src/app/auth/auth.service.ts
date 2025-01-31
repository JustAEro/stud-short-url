import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'access_token';
  private userLoginKey = 'user_login';

  isLoggedIn$ = new BehaviorSubject<boolean>(!!this.getToken());

  private userLoginSubject = new BehaviorSubject<string | null>(this.getUserLogin());

  // Сохраняем в sessionStorage URL, на который пользователь пытался попасть
  private redirectUrl: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login({login, password}: {login: string, password: string}) {
    return this.http.post<{ accessToken: string, login: string }>('/api/v1/auth/login', { login, password }).subscribe(response => {
      localStorage.setItem(this.tokenKey, response.accessToken);
      localStorage.setItem(this.userLoginKey, response.login);

      this.isLoggedIn$.next(true);
      this.userLoginSubject.next(response.login);  // Обновляем логин

      const redirectUrl = this.redirectUrl || '/'; // Если URL не был сохранён, редиректим на главную
      
      this.router.navigate([redirectUrl]);

      this.redirectUrl = null; // Сбрасываем после редиректа
    });
  }

  register({login, password}: {login: string, password: string}) {
    return this.http.post('/api/v1/auth/register', { login, password }).subscribe(() => {
      // После успешной регистрации выполняем вход
      this.login({ login, password });
    });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userLoginKey);

    this.isLoggedIn$.next(false);
    this.userLoginSubject.next(null);  // Обновляем логин на null
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUserLogin() {
    return localStorage.getItem(this.userLoginKey);  // Возвращаем логин текущего пользователя
  }

  getUserLogin$() {
    return this.userLoginSubject.asObservable();  // Возвращаем Observable для логина
  }

  // Сохраняем URL в случае, если пользователь пытается попасть на защищённую страницу
  setRedirectUrl(url: string) {
    console.log(url);
    this.redirectUrl = url;
  }
}
