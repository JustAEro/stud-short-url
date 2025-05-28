import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { RouterModule } from '@angular/router';
import { ReportDto, ReportsPaginatedDto } from '@stud-short-url/common';
import { HeaderComponent } from '../header/header.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-reports-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    HeaderComponent,
  ],
  template: `
    <app-header></app-header>
    <div class="container">
      <div
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <h2>Отчеты</h2>

        <button class="create-btn" routerLink="/reports/create">
          <lucide-icon name="plus" class="icon"></lucide-icon>
          Создать отчет
        </button>
      </div>

      <div style="display: flex; justify-content: space-between;">
        <div *ngIf="reports.length > 0">
          <label for="sort" style="margin-left: 10px;">Сортировка:</label>
          <div class="sort-container">
            <select
              class="sort-select"
              id="sort"
              [(ngModel)]="sortBy"
              (change)="loadReports()"
            >
              <option value="updatedAt">По дате обновления</option>
              <option value="createdAt">По дате создания</option>
              <option value="name">По названию</option>
            </select>
          </div>
        </div>

        <div *ngIf="reports.length > 0">
          <label for="order" style="margin-left: 10px;"
            >Порядок сортировки:</label
          >
          <div class="sort-container">
            <select
              class="sort-select"
              id="order"
              [(ngModel)]="sortDirection"
              (change)="loadReports()"
            >
              <option value="asc">
                @if (sortBy === "updatedAt" || sortBy === "createdAt") { От
                более давних к менее давним } @else { A-Z }
              </option>
              <option value="desc">
                @if (sortBy === "updatedAt" || sortBy === "createdAt") { От
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
          [(ngModel)]="search"
          (input)="onSearchChange()"
          placeholder="Поиск (введите часть названия отчета) ..."
        />
      </div>

      <ul class="report-list" *ngIf="reports.length > 0; else noReports">
        <li *ngFor="let report of reports" class="report-item">
          <a [routerLink]="['/reports', report.id]"
            ><h3>{{ report.name }}</h3></a
          >
          <p>
            <strong>Дата создания:</strong>
            {{ report.createdAt | date : 'dd-MM-YYYY HH:mm:ss' }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Дата изменения:</strong>
            {{ report.updatedAt | date : 'dd-MM-YYYY HH:mm:ss' }}
          </p>
        </li>
      </ul>

      <ng-template #noReports>
        <p>Отчеты не найдены.</p>
      </ng-template>

      <div class="pagination" *ngIf="reports.length > 0 && totalPages > 1">
        <button
          class="pagination-btn"
          (click)="prevPage()"
          [disabled]="page === 1"
        >
          Назад
        </button>
        <span>Страница</span>
        <select class="sort-select" [(ngModel)]="page" (change)="loadReports()">
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
    </div>
  `,
  styles: [
    `
      .container {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }

      .search-input {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        width: 200px;
        transition: border-color 0.2s ease;
      }

      .search-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
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

      .report-list {
        list-style: none;
        padding: 0;
      }

      .report-item {
        padding: 1rem;
        margin: 0.5rem 0;
        border: 1px solid #ccc;
        border-radius: 8px;
        overflow-wrap: break-word;
      }

      .report-item a {
        text-decoration: none;
        color: #007bff;
      }

      .report-item a:hover {
        text-decoration: underline;
      }

      // .report-list li {
      //   padding: 1rem;
      //   border: 1px solid #ccc;
      //   border-radius: 8px;
      //   margin-bottom: 0.5rem;
      //   cursor: pointer;
      //   transition: background-color 0.2s ease;
      // }

      // .report-list li:hover {
      //   background-color: #f5f5f5;
      // }

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

      .icon {
        width: 1rem;
        margin-top: 4px;
      }
    `,
  ],
})
export class ReportsListPageComponent implements OnInit {
  reports: ReportDto[] = [];
  search = '';
  sortBy = 'updatedAt';
  sortDirection = 'desc';
  page = 1;
  limit = 5;
  totalPages = 1;

  private searchChanged = new Subject<string>();

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.searchChanged.pipe(debounceTime(500)).subscribe(() => {
      this.loadReports();
    });

    this.loadReports();
  }

  get totalPagesArray() {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  onSearchChange() {
    this.page = 1;
    this.searchChanged.next(this.search);
  }

  loadReports() {
    this.http
      .get<ReportsPaginatedDto>(`/api/v1/reports`, {
        params: {
          search: this.search,
          page: this.page,
          limit: this.limit,
          sortBy: this.sortBy,
          sortDirection: this.sortDirection,
        },
      })
      .subscribe((res) => {
        this.reports = res.data;
        this.totalPages = res.totalPages;
        this.page = res.currentPage;
      });
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadReports();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadReports();
    }
  }

  openReport(report: ReportDto) {
    this.router.navigate(['/reports', report.id]);
  }

  createReport() {
    this.router.navigate(['/reports/create']);
  }
}
