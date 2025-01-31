import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShortLinkDto } from '@stud-short-url/common';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-short-links-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    LucideAngularModule,
    FormsModule,
  ],
  template: `
    <div class="container">
      <ng-container *ngIf="loading; else content">
        <p>Загрузка...</p>
      </ng-container>

      <ng-template #content>
        <div *ngIf="shortLinks.length === 0">
          <p>No short links found.</p>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <div *ngIf="shortLinks.length > 0">
            <label for="sort" style="margin-left: 10px;">Сортировка:</label>
            <div class="sort-container">
              <select class="sort-select" id="sort" [(ngModel)]="sortBy" (change)="loadShortLinks()">
                <option value="updatedAt">По дате обновления</option>
                <option value="createdAt">По дате создания</option>
                <option value="description">По описанию</option>
              </select>
            </div>
          </div>

          <div *ngIf="shortLinks.length > 0">
            <label for="order" style="margin-left: 10px;">Порядок сортировки:</label>
            <div class="sort-container">
              <select class="sort-select" id="order" [(ngModel)]="sortDirection" (change)="loadShortLinks()">
                <option value="asc">
                  @if (sortBy === "updatedAt" || sortBy === "createdAt") {
                    От более давних к менее давним
                  }
                  @else {
                    A-Z
                  }
                </option>
                <option value="desc">
                  @if (sortBy === "updatedAt" || sortBy === "createdAt") {
                    От менее давних к более давним
                  }
                  @else {
                    Z-A
                  }
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="search-container">
          <input 
            class="search-input"
            style="width: 100%;" 
            #searchInput 
            [(ngModel)]="searchQuery" 
            (input)="onSearchChange()" 
            placeholder="Поиск (введите часть описания или ключа короткой ссылки) ..." />
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
        
        @if (shortLinks.length > 0 && totalPages > 1) {
          <div class="pagination">
            <button class="pagination-btn" (click)="prevPage()" [disabled]="page === 1">Назад</button>
            <span>Страница</span>
            <select class="sort-select" [(ngModel)]="page" (change)="loadShortLinks()" [disabled]="totalPages === 1">
              <option *ngFor="let p of totalPagesArray" [value]="p">{{ p }}</option>
            </select>
            <button class="pagination-btn" (click)="nextPage()" [disabled]="page === totalPages">Вперед</button>
          </div>
        }
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

      .pagination { 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        margin-top: 1rem; 
        gap: 10px; 
      }

      .pagination button, .pagination select { 
        padding: 5px 10px; 
      }

      .pagination-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;
      }

      .pagination-btn:hover {
        background-color: #007bff;
        color: #fff;
      }

      .pagination-btn:disabled {
        background-color: #e9ecef;
        cursor: not-allowed;
      }

      .search-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
      }

      .search-input {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        width: 200px;
        transition: border-color 0.2s ease;
      }

      .search-input:focus {
        border-color: #007bff;
        outline: none;
      }

      .sort-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
      }

      .sort-select {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
      }

      .sort-select:focus {
        border-color: #007bff;
        outline: none;
      }
    `,
  ],
})
export class ShortLinksListComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  shortLinks: ShortLinkDto[] = [];
  loading = false;
  origin = window.location.origin;
  sortBy = 'updatedAt';
  sortDirection = 'desc';
  searchQuery = '';
  searchSubject = new Subject<string>();
  page = 1;
  limit = 5;
  totalPages = 1;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.loadShortLinks();
    });
    
    this.loadShortLinks();
  }

  loadShortLinks(): void {
    this.loading = true;

    this.http
      .get<{ data: ShortLinkDto[], totalPages: number, currentPage: number }>(`/api/v1/short-links?sortBy=${this.sortBy}&sortDirection=${this.sortDirection}&search=${this.searchQuery}&page=${this.page}&limit=${this.limit}`)
      .subscribe({
        next: (response) => {
          this.shortLinks = response.data;
          this.totalPages = response.totalPages;
          this.page = response.currentPage
          this.loading = false;
          setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
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

  onSearchChange(): void {
    this.page = 1;

    this.searchSubject.next(this.searchQuery);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadShortLinks();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadShortLinks();
    }
  }
}
