import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { ShortLinksListComponent } from '../short-links-list/short-links-list.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ShortLinksListComponent, LucideAngularModule],
  template: `
    <app-header></app-header>
    <main class="main-content">
      <div class="action-bar">
        <h2 class="title">Your Short Links</h2>
        <button class="create-btn" routerLink="/create">
          <lucide-icon name="plus" class="icon"></lucide-icon>
          Create Short Link
        </button>
      </div>
      <app-short-links-list></app-short-links-list>
    </main>
  `,
  styles: [
    `
    .title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: bold;
      }

      .main-content {
        padding: 1rem 2rem;
      }

      .action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .create-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #007bff;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .create-btn:hover {
        background-color: #0056b3;
      }

      .icon {
        width: 1rem;
        margin-top: 4px;
      }
    `,
  ],
})
export class MainPageComponent {}
