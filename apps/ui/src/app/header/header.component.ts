import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule} from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <header class="header">
      <a class="logo" routerLink="">Student Short URL</a>
      <nav class="nav">
        <div 
          class="profile-menu" 
          (click)="toggleMenu($event)" 
          (blur)="delayedCloseMenu()" 
          tabindex="0"
        >
          <lucide-icon name="user" class="profile-icon"></lucide-icon>
          <div 
            class="menu" 
            *ngIf="menuOpen" 
            (click)="onMenuClick($event)"
          >
            <p class="user-info">{{ userName }}</p>
            <!-- <a 
              class="menu-item" 
              (click)="navigateToProfile($event)" 
            >
              Профиль
            </a> -->
            <button 
              class="menu-item logout-btn" 
              (click)="logout($event)"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background-color: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: #007bff;
        text-decoration: none;
      }

      .logo:hover {
        text-decoration: underline;
      }

      .nav {
        display: flex;
        align-items: center;
      }

      .profile-menu {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background-color: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: background-color 0.2s ease;
        cursor: pointer;
      }

      .profile-menu:focus {
        outline: none;
      }

      .profile-menu:hover {
        background-color: #f1f1f1;
      }

      .profile-icon {
        width: 1.5rem;
        height: 1.5rem;
        color: #007bff;
      }

      .menu {
        position: absolute;
        top: 3rem;
        right: 0;
        background-color: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        width: 200px;
        z-index: 1000;
      }

      .menu-item {
        display: block;
        padding: 0.75rem 1rem;
        text-decoration: none;
        color: #333;
        font-size: 1rem;
        transition: background-color 0.2s ease;
      }

      .menu-item:hover {
        background-color: #f8f9fa;
      }

      .logout-btn {
        pointer-events: auto;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 0.75rem 1rem;
        color: #d9534f;
        cursor: pointer;
      }

      .logout-btn:hover {
        background-color: #f8f9fa;
      }

      .user-info {
        padding: 0.5rem 1rem;
        border-bottom: 1px solid #e9ecef;
        font-weight: bold;
        color: #555;
      }
    `,
  ],
})
export class HeaderComponent implements OnInit {
  menuOpen = false;
  userName$: Observable<string | null>;  // Реальные данные пользователя можно получить из сервиса
  userName: string | null = '';

  constructor(private router: Router, private authService: AuthService) {
    this.userName$ = this.authService.getUserLogin$();
  }

  ngOnInit() {
    this.authService.getUserLogin$().subscribe((login) => {
      this.userName = login;
    })
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  delayedCloseMenu() {
    setTimeout(() => {
      this.closeMenu();
    }, 200); // Даем Angular 200 мс на обработку клика
  }

  onMenuClick(event: MouseEvent) {
    // Останавливаем всплытие клика, чтобы меню не закрывалось сразу
    event.stopPropagation();
  }

  navigateToProfile(event: MouseEvent) {
    event.stopPropagation(); // Останавливаем всплытие
    this.closeMenu(); // Закрываем меню
    this.router.navigate(['/profile']); // Переход на страницу профиля
  }

  logout(event: MouseEvent) {
    event.stopPropagation();
    //this.closeMenu(); // Закрываем меню
    // Добавьте реальную логику выхода
    
    this.authService.logout();
  }
}
