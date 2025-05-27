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
import { ReportDto, ShortLinkDto } from '@stud-short-url/common';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
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
              reportForm.get('name')?.invalid &&
              reportForm.get('name')?.touched
            "
          >
            Название отчёта обязательно
          </div>
        </div>

        <div class="form-group">
          <label for="sortBy">Сортировать по</label>
          <select id="sortBy" formControlName="sortBy" (change)="loadLinks(true)">
            <option value="createdAt">Дате создания</option>
            <option value="shortKey">Короткому ключу</option>
            <option value="description">Описанию</option>
          </select>
        </div>

        <div class="form-group">
          <label for="sortOrder">Направление сортировки</label>
          <select id="sortOrder" formControlName="sortOrder" (change)="loadLinks(true)">
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>

        <div class="form-group">
          <label for="search">Поиск ссылок</label>
          <input
            id="search"
            type="text"
            formControlName="searchQuery"
            (input)="loadLinks(true)"
            placeholder="Поиск по ссылкам"
          />
        </div>

        <div class="links-list">
          <div *ngFor="let link of links">
            <label>
              <input
                type="checkbox"
                [value]="link.id"
                (change)="onCheckboxChange(link.id, $event)"
                [checked]="selectedLinkIds.includes(link.id)"
              />
              {{ link.shortKey }} — {{ link.description || link.longLink }}
            </label>
          </div>

          <button
            class="load-more-btn"
            type="button"
            (click)="loadLinks()"
            [disabled]="loading || noMoreLinks"
          >
            {{ loading ? 'Загрузка...' : 'Загрузить ещё' }}
          </button>
        </div>

        <button
          type="submit"
          class="create-btn"
          [disabled]="reportForm.get('name')?.invalid || selectedLinkIds.length === 0"
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

  onCheckboxChange(id: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleLinkSelection(id, checked);
  }

  toggleLinkSelection(id: string, checked: boolean) {
    if (checked) {
      if (!this.selectedLinkIds.includes(id)) {
        this.selectedLinkIds.push(id);
      }
    } else {
      this.selectedLinkIds = this.selectedLinkIds.filter((item) => item !== id);
    }
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
    if (this.reportForm.valid && this.selectedLinkIds.length > 0) {
      const { name } = this.reportForm.value;

      this.http
        .post<ReportDto>('/api/v1/reports', {
          name,
          shortLinkIds: this.selectedLinkIds,
        })
        .subscribe({
          next: (report) => {
            this.router.navigate(['/reports', report.id]);
          },
          error: (err) => {
            console.error('Ошибка создания отчёта:', err);
            alert('Не удалось создать отчёт. Попробуйте позже.');
          },
        });
    }
  }
}
