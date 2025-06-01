import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { ShortLinkDto } from '@stud-short-url/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-short-link-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="selector-container">
      <div style="display: flex; justify-content: space-between;">
        <div *ngIf="shortLinks.length > 0">
          <label for="sort" style="margin-left: 10px;">Сортировка:</label>
          <div class="sort-container">
            <select
              class="sort-select"
              id="sort"
              [(ngModel)]="localSortBy"
              (change)="onSortByChange()"
            >
              <option value="updatedAt">По дате обновления</option>
              <option value="createdAt">По дате создания</option>
              <option value="description">По описанию</option>
            </select>
          </div>
        </div>

        <div *ngIf="shortLinks.length > 0">
          <label for="order" style="margin-left: 10px;"
            >Порядок сортировки:</label
          >
          <div class="sort-container">
            <select
              class="sort-select"
              id="order"
              [(ngModel)]="localSortDirection"
              (change)="toggleSortDirection()"
            >
              <option value="asc">
                @if (localSortBy === "updatedAt" || localSortBy === "createdAt") { От
                более давних к менее давним } @else { A-Z }
              </option>
              <option value="desc">
                @if (localSortBy === "updatedAt" || localSortBy === "createdAt") { От
                менее давних к более давним } @else { Z-A }
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
          (input)="onSearchInputChange()"
          placeholder="Поиск (введите часть описания или ключа короткой ссылки) ..."
        />
      </div>

      <!-- <mat-form-field appearance="outline" class="search-field">
        <mat-label>Поиск (введите часть описания или ключа)</mat-label>
        <input
          matInput
          #searchInput
          [(ngModel)]="searchQuery"
          (input)="onSearchInputChange()"
        />
      </mat-form-field> -->

      <!-- <div class="sort-controls">
        <span class="sort-label">Сортировка:</span>
        <mat-form-field appearance="outline" class="sort-field">
          <mat-select
            [(ngModel)]="localSortBy"
            (selectionChange)="onSortByChange()"
          >
            <mat-option value="updatedAt">Дата изменения</mat-option>
            <mat-option value="createdAt">Дата создания</mat-option>
            <mat-option value="description">Описание</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-icon-button (click)="toggleSortDirection()">
          <mat-icon>{{
            localSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'
          }}</mat-icon>
        </button>
      </div> -->

      <div *ngIf="shortLinks.length === 0 && !loading" class="empty">
        Ничего не найдено
      </div>

      <div *ngIf="loading && shortLinks.length === 0" class="loading-spinner">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="link-list-container">
        <mat-card *ngFor="let link of shortLinks" class="link-card">
          <mat-checkbox
            [checked]="selectedLinkIds.has(link.id)"
            (change)="toggleSelection(link.id)"
            color="primary"
          >
            <div class="link-content">
              <div class="link-title">
                {{ link.description || link.shortKey }}
              </div>
              <div class="link-url">{{ getShortUrl(link.shortKey) }}</div>
            </div>
          </mat-checkbox>
        </mat-card>
      </div>

      <div *ngIf="loading && shortLinks.length > 0" class="loading-spinner">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      @if (shortLinks.length > 0 && totalPages > 1) {
      <div class="pagination">
        <button
          class="pagination-btn"
          (click)="prevPage()"
          [disabled]="page === 1"
        >
          Назад
        </button>
        <span>Страница</span>
        <select
          class="sort-select"
          [(ngModel)]="page"
          (change)="loadShortLinks()"
          [disabled]="totalPages === 1"
        >
          <option *ngFor="let p of totalPagesArray" [value]="p">{{ p }}</option>
        </select>
        <button
          class="pagination-btn"
          (click)="nextPage()"
          [disabled]="page === totalPages"
        >
          Вперед
        </button>
      </div>
      }

      <!-- <div class="pagination" *ngIf="totalPages > 1">
        <button mat-button (click)="prevPage()" [disabled]="page === 1">
          Назад
        </button>
        <mat-form-field appearance="outline" class="page-select">
          <mat-select [(ngModel)]="page" (selectionChange)="loadShortLinks()">
            <mat-option *ngFor="let p of totalPagesArray" [value]="p">{{
              p
            }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button
          mat-button
          (click)="nextPage()"
          [disabled]="page === totalPages"
        >
          Вперёд
        </button>
      </div> -->
    </div>
  `,
  styles: [
    `
      .selector-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .search-field {
        width: 100%;
      }

      .sort-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sort-label {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }

      .sort-field {
        flex-grow: 1;
      }

      .link-list-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .link-card {
        padding: 12px;
        background-color: #ffffff; /* Светло-серый фон карточки */
        border-radius: 8px;
        box-shadow: none;
        border: 1px solid #e0e0e0; /* Легкая граница */
      }

      .link-content {
        margin-left: 8px;
      }

      .link-title {
        font-weight: 500;
        margin-bottom: 4px;
        color: #333; /* Темный цвет текста для контраста */
      }

      .link-url {
        font-size: 12px;
        color: #666;
      }

      .empty {
        text-align: center;
        color: #9ca3af;
        padding: 16px;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        padding: 16px;
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
      }

      .page-select {
        width: 80px;
      }

      /* Стили для чекбокса */
      ::ng-deep .mat-checkbox-checked.mat-primary .mat-checkbox-background {
        background-color: #3f51b5; /* Цвет выбранного чекбокса */
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

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 1rem;
        gap: 10px;
      }

      .pagination button,
      .pagination select {
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
    `,
  ],
})
export class ShortLinkSelectorComponent implements OnInit, OnChanges {
  @Input() selectedLinkIds = new Set<string>();
  @Input() searchTerm = '';
  @Input() sortBy = 'updatedAt';
  @Input() sortOrder: 'asc' | 'desc' = 'desc';

  @Output() selectionChange = new EventEmitter<Set<string>>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() sortByChange = new EventEmitter<string>();
  @Output() sortOrderChange = new EventEmitter<'asc' | 'desc'>();

  @ViewChild('searchInput') searchInput!: ElementRef;

  shortLinks: ShortLinkDto[] = [];
  loading = false;
  searchQuery = '';
  localSortBy = 'updatedAt';
  localSortDirection: 'asc' | 'desc' = 'desc';
  searchSubject = new Subject<string>();
  page = 1;
  limit = 10;
  totalPages = 1;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(500)).subscribe((query) => {
      this.page = 1;
      this.searchTermChange.emit(query);
      this.loadShortLinks();
    });

    this.syncInputsToLocals();
    this.loadShortLinks();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchTerm'] || changes['sortBy'] || changes['sortOrder']) {
      this.syncInputsToLocals();
      this.page = 1;
      this.loadShortLinks();
    }
  }

  private syncInputsToLocals() {
    this.searchQuery = this.searchTerm ?? '';
    this.localSortBy = this.sortBy ?? 'updatedAt';
    this.localSortDirection = this.sortOrder ?? 'desc';
  }

  getShortUrl(shortKey: string): string {
    return `${window.location.origin}/${shortKey}`;
  }

  onSearchInputChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onSortByChange() {
    this.page = 1;
    this.sortByChange.emit(this.localSortBy);
    this.loadShortLinks();
  }

  toggleSortDirection() {
    this.localSortDirection =
      this.localSortDirection === 'asc' ? 'desc' : 'asc';
    this.page = 1;
    this.sortOrderChange.emit(this.localSortDirection);
    this.loadShortLinks();
  }

  loadShortLinks(): void {
    this.loading = true;
    this.http
      .get<{ data: ShortLinkDto[]; totalPages: number; currentPage: number }>(
        `/api/v1/short-links?sortBy=${this.localSortBy}&sortDirection=${
          this.localSortDirection
        }&search=${encodeURIComponent(this.searchQuery)}&page=${
          this.page
        }&limit=${this.limit}`
      )
      .subscribe({
        next: (res) => {
          this.shortLinks = res.data;
          this.totalPages = res.totalPages;
          this.page = res.currentPage;
          this.loading = false;
          setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
        },
        error: (err) => {
          console.error('Ошибка загрузки ссылок:', err);
          this.loading = false;
        },
      });
  }

  toggleSelection(id: string): void {
    if (this.selectedLinkIds.has(id)) {
      this.selectedLinkIds.delete(id);
    } else {
      this.selectedLinkIds.add(id);
    }
    this.selectionChange.emit(new Set(this.selectedLinkIds));
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
