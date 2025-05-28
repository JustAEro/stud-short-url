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

@Component({
  selector: 'app-short-link-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule],
  template: `
    <div class="selector-container">
      <div class="top-bar">
        <input
          class="input"
          #searchInput
          [(ngModel)]="searchQuery"
          (input)="onSearchInputChange()"
          placeholder="Поиск по описанию или ключу..."
        />

        <select
          class="select"
          [(ngModel)]="localSortBy"
          (change)="onSortByChange()"
        >
          <option value="updatedAt">По дате обновления</option>
          <option value="createdAt">По дате создания</option>
          <option value="description">По описанию</option>
        </select>

        <select
          class="select"
          [(ngModel)]="localSortDirection"
          (change)="onSortDirectionChange()"
        >
          <option value="asc">Возрастание</option>
          <option value="desc">Убывание</option>
        </select>
      </div>

      <div *ngIf="shortLinks.length === 0 && !loading" class="empty">
        Ничего не найдено
      </div>
      <div *ngIf="loading" class="loading">Загрузка...</div>

      <ul class="link-list">
        <li *ngFor="let link of shortLinks">
          <mat-checkbox
            [checked]="selectedLinkIds.has(link.id)"
            (change)="toggleSelection(link.id)"
          >
            {{ link.description || link.shortKey }}
          </mat-checkbox>
        </li>
      </ul>

      <div class="pagination" *ngIf="totalPages > 1">
        <button class="btn" (click)="prevPage()" [disabled]="page === 1">
          Назад
        </button>
        <select class="select" [(ngModel)]="page" (change)="loadShortLinks()">
          <option *ngFor="let p of totalPagesArray" [value]="p">{{ p }}</option>
        </select>
        <button
          class="btn"
          (click)="nextPage()"
          [disabled]="page === totalPages"
        >
          Вперёд
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .selector-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .top-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
        flex-grow: 1;
        min-width: 200px;
      }

      .select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
      }

      .link-list {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .pagination {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .btn {
        background-color: #e5e7eb;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        cursor: pointer;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .loading {
        font-style: italic;
        color: #6b7280;
      }

      .empty {
        color: #9ca3af;
      }
    `,
  ],
})
export class ShortLinkSelectorComponent implements OnInit, OnChanges {
  @Input() selectedLinkIds = new Set<string>();

  // Входные параметры
  @Input() searchTerm = '';
  @Input() sortBy = 'updatedAt';
  @Input() sortOrder: 'asc' | 'desc' = 'desc';

  // Выходные события, чтобы родитель знал об изменениях
  @Output() selectionChange = new EventEmitter<Set<string>>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() sortByChange = new EventEmitter<string>();
  @Output() sortOrderChange = new EventEmitter<'asc' | 'desc'>();

  @ViewChild('searchInput') searchInput!: ElementRef;

  shortLinks: ShortLinkDto[] = [];
  loading = false;

  // Локальные переменные, связанные с UI и синхронизированные с @Input
  searchQuery = '';
  localSortBy = 'updatedAt';
  localSortDirection: 'asc' | 'desc' = 'desc';

  searchSubject = new Subject<string>();
  page = 1;
  limit = 10;
  totalPages = 1;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // При вводе в поле поиска с дебаунсом
    this.searchSubject.pipe(debounceTime(400)).subscribe((query) => {
      // Обновляем page
      this.page = 1;
      // Эмитим событие наружу
      this.searchTermChange.emit(query);
      // Загружаем данные
      this.loadShortLinks();
    });

    // Инициализируем локальные значения из входных
    this.syncInputsToLocals();

    // Первоначальная загрузка
    this.loadShortLinks();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Если входные параметры изменились — синхронизируем локальные значения и загружаем данные
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

  onSearchInputChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onSortByChange() {
    this.page = 1;
    this.sortByChange.emit(this.localSortBy);
    this.loadShortLinks();
  }

  onSortDirectionChange() {
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
