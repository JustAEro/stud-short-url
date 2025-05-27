import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { CreateReportBodyDto, ShortLinkDto } from '@stud-short-url/common';
import { ShortLinkSelectorComponent } from '../report-page/short-link-selector.component';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    ShortLinkSelectorComponent,
  ],
  template: `
    <app-header></app-header>
    <div class="container">
      <button class="back-btn" (click)="goBack()">← Назад</button>
      <h1>Создать новый отчёт</h1>
      <form [formGroup]="reportForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Название отчёта</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Введите название отчёта"
            required
          />
          <div
            class="error"
            *ngIf="
              reportForm.get('name')?.invalid && reportForm.get('name')?.touched
            "
          >
            Название отчёта обязательно
          </div>
        </div>

        <div class="form-group">
          <label for="sortBy">Сортировать по</label>
          <select
            id="sortBy"
            formControlName="sortBy"
            (change)="onSortChange()"
          >
            <option value="createdAt">Дате создания</option>
            <option value="shortKey">Короткому ключу</option>
            <option value="description">Описанию</option>
          </select>
        </div>

        <div class="form-group">
          <label for="sortOrder">Направление сортировки</label>
          <select
            id="sortOrder"
            formControlName="sortOrder"
            (change)="onSortChange()"
          >
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>

        <!-- Здесь вставляем готовый компонент выбора ссылок -->
        <app-short-link-selector
          [selectedLinkIds]="selectedLinkIdsSet"
          (selectionChange)="onSelectionChange($event)"
          [searchTerm]="reportForm.get('searchQuery')?.value"
          [sortBy]="reportForm.get('sortBy')?.value"
          [sortOrder]="reportForm.get('sortOrder')?.value"
        ></app-short-link-selector>

        <button
          type="submit"
          class="create-btn"
          [disabled]="
            reportForm.get('name')?.invalid || selectedLinkIds.length === 0
          "
        >
          Создать
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 1rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background-color: #ffffff;
      }

      .back-btn {
        display: inline-block;
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        background: #f5f5f5;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .back-btn:hover {
        background-color: #e2e6ea;
      }

      h1 {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
      }

      input,
      select {
        width: 97%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
      }

      .error {
        color: red;
        font-size: 0.9rem;
        margin-top: 0.5rem;
      }

      .create-btn {
        display: block;
        width: 100%;
        padding: 0.7rem;
        background-color: #28a745;
        color: white;
        font-size: 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }

      .create-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }

      .links-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #ccc;
        padding: 0.5rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .links-list label {
        display: block;
        margin-bottom: 0.5rem;
      }

      .load-more-btn {
        margin-top: 0.5rem;
        background: #f0f0f0;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
      }

      .load-more-btn:disabled {
        background-color: #e0e0e0;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CreateReportPageComponent {
  reportForm: FormGroup;
  links: ShortLinkDto[] = [];
  selectedLinkIds: string[] = [];
  page = 1;
  pageSize = 5;
  loading = false;
  noMoreLinks = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.reportForm = this.fb.group({
      name: ['', [Validators.required]],
      searchQuery: [''],
      sortBy: ['updatedAt'],
      sortOrder: ['desc'],
    });

    this.loadLinks(true);
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  onSelectionChange(selectedIds: Set<string>) {
    this.selectedLinkIds = [...selectedIds];
  }

  onSortChange() {
    this.loadLinks(true);
  }

  loadLinks(reset = false) {
    if (this.loading || this.noMoreLinks) return;

    if (reset) {
      this.page = 1;
      this.links = [];
      this.noMoreLinks = false;
    }

    const { sortBy, sortOrder, searchQuery } = this.reportForm.value;

    this.loading = true;

    const params = new HttpParams()
      .set('page', this.page.toString())
      .set('limit', this.pageSize.toString())
      .set('search', searchQuery || '')
      .set('sortBy', sortBy)
      .set('sortDirection', sortOrder);

    this.http
      .get<{
        data: ShortLinkDto[];
        totalPages: number;
        currentPage: number;
      }>('/api/v1/short-links', { params })
      .subscribe({
        next: (response) => {
          if (
            response.data.length < this.pageSize ||
            response.currentPage + 1 >= response.totalPages
          ) {
            this.noMoreLinks = true;
          }
          this.links = [...this.links, ...response.data];
          this.page++;
          this.loading = false;
        },
        error: (err) => {
          console.error('Ошибка загрузки ссылок:', err);
          this.loading = false;
        },
      });
  }

  onSubmit() {
    if (this.reportForm.invalid || this.selectedLinkIds.length === 0) {
      return;
    }
    const reportData: CreateReportBodyDto = {
      name: this.reportForm.value.name,
      shortLinkIds: Array.from(this.selectedLinkIds),
    };

    this.http.post('/api/v1/reports', reportData).subscribe(() => {
      this.router.navigate(['/reports']);
    });
  }

  get selectedLinkIdsSet(): Set<string> {
    return new Set(this.selectedLinkIds);
  }
}
