import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShortLinkDto } from '@stud-short-url/common';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-short-links-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule, LucideAngularModule],
  template: `
    <div class="container">
      <ng-container *ngIf="loading; else content">
        <p>Загрузка...</p>
      </ng-container>

      <ng-template #content>
        <div *ngIf="shortLinks.length === 0">
          <p>No short links found.</p>
        </div>
        <ul *ngIf="shortLinks.length > 0" class="short-links-list">
          <li *ngFor="let link of shortLinks" class="short-link-item">
            <a [routerLink]="['/short-links', link.shortKey]">
              <h3>{{ link.description || link.shortKey }}</h3>
            </a>
            <p style="display: inline-flex; align-items: center; gap: 3px;">
              <strong>Короткая ссылка:</strong>
              <a href="{{ origin + '/' + link.shortKey }}">
                {{ origin + '/' + link.shortKey }}
              </a>
              <button
                class="copy-short-link-button"
                (click)="copyToClipboard(origin + '/' + link.shortKey)"
              >
                <lucide-icon
                  class="copy-short-link-button_icon"
                  name="clipboard-copy"
                ></lucide-icon>
              </button>
            </p>
            <p>
              <strong>Целевая ссылка: </strong>
              <a href="{{ link.longLink }}">{{ link.longLink }}</a>
            </p>
            <p style="margin-top: 10px;">
              <strong>Дата создания:</strong>
              {{ link.createdAt | date : 'dd-MM-YYYY HH:mm:ss' }}
            </p>
            <p style="margin-top: 10px;">
              <strong>Дата изменения:</strong>
              {{ link.updatedAt | date : 'dd-MM-YYYY HH:mm:ss' }}
            </p>
          </li>
        </ul>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
      }

      .short-links-list {
        list-style: none;
        padding: 0;
      }

      .short-link-item {
        padding: 1rem;
        margin: 0.5rem 0;
        border: 1px solid #ccc;
        border-radius: 8px;
        overflow-wrap: break-word;
      }

      .short-link-item a {
        text-decoration: none;
        color: #007bff;
      }

      .short-link-item a:hover {
        text-decoration: underline;
      }

      p {
        margin: 0.2rem 0;
      }

      .copy-short-link-button {
        border: none;
        background-color: white;
        cursor: pointer;
      }

      ::ng-deep .success-toast {
        --mdc-snackbar-container-color: #007bff;
        color: white;
      }
    `,
  ],
})
export class ShortLinksListComponent implements OnInit {
  shortLinks: ShortLinkDto[] = [];
  loading = false;
  origin = window.location.origin;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadShortLinks();
  }

  loadShortLinks(): void {
    this.loading = true;

    this.http.get<ShortLinkDto[]>('/api/v1/short-links').subscribe({
      next: (data) => {
        this.shortLinks = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load short links:', err);
        this.loading = false;
      },
    });
  }

  copyToClipboard(link: string): void {
    navigator.clipboard.writeText(link).then(
      () => {
        this.snackBar.open('Скопировано', '', {
          duration: 2000, // Уведомление будет показываться 2 секунды
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-toast'],
        });
      },
      (err) => console.error('Ошибка при копировании в буфер обмена', err)
    );
  }
}
