import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables, ChartType } from 'chart.js';
import {
  ShortLinkDto,
  ShortLinkWithPermissionsDto,
  UpdateShortLinkDto,
} from '@stud-short-url/common';
import { HeaderComponent } from '../header/header.component';
import { LucideAngularModule } from 'lucide-angular';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog.component';
import { PermissionsFormComponent } from './permissions-form.component';
import { QrDialogComponent } from '../qr-dialog/qr-dialog.component';

Chart.register(...registerables);

@Component({
  selector: 'app-short-link-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderComponent,
    LucideAngularModule,
    PermissionsFormComponent,
  ],
  template: `
    <app-header></app-header>
    <div class="container">
      <div
        style="display: flex; justify-content: space-between; align-items: start;"
      >
        <button class="back-btn" (click)="goBack()">← Назад</button>
        <div style="display: flex; flex-direction: column;">
          <p style="margin-top: 10px;">
            <strong
              >Создатель:
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong
            >{{ creatorLogin }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Режим доступа: &nbsp;&nbsp;&nbsp;</strong
            >{{ getRoleAlias(role) }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Дата создания: &nbsp;&nbsp;&nbsp;&nbsp;</strong
            >{{ link.createdAt | date : 'dd-MM-YYYY HH:mm:ss' }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Дата изменения: &nbsp;</strong
            >{{ link.updatedAt | date : 'dd-MM-YYYY HH:mm:ss' }}
          </p>
        </div>
      </div>

      <h1>
        Данные короткой ссылки
        <div
          style="display: flex; align-items: baseline; justify-content: center; gap: 10px;"
        >
          <a class="copy-link" href="{{ origin + '/' + link.shortKey }}">
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

          <lucide-icon
            name="qr-code"
            class="qr-code-btn"
            (click)="openQrDialog()"
          >
          </lucide-icon>

          @if (role === 'admin') {
          <button class="delete-btn" (click)="confirmDelete()">
            <lucide-icon name="trash"></lucide-icon>
          </button>
          }
        </div>
      </h1>

      <form [formGroup]="shortLinkForm" (ngSubmit)="onUpdate()">
        <div class="form-group">
          <label for="longUrl">Целевая ссылка</label>
          <input
            id="longUrl"
            type="url"
            formControlName="longUrl"
            [readonly]="role === 'viewer'"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Описание (Опционально)</label>
          <input
            id="description"
            type="text"
            formControlName="description"
            [readonly]="role === 'viewer'"
          />
        </div>

        @if (role === 'admin' || role === 'editor') {
        <button
          type="submit"
          class="update-btn"
          [disabled]="shortLinkForm.pristine || shortLinkForm.invalid"
        >
          Изменить
        </button>
        }
      </form>

      <div class="stats-section">
        <h2 style="text-align: center;">Статистика</h2>

        <div class="filters">
          <div style="display: flex; align-items: baseline; gap: 10px;">
            <label for="timeScale">Гранулярность:</label>
            <select
              id="timeScale"
              class="sort-select"
              [(ngModel)]="timeScale"
              (change)="fetchStatistics()"
            >
              <option value="hour">Час</option>
              <option value="day">День</option>
              <option value="month">Месяц</option>
            </select>
          </div>

          <div style="display: flex; align-items: baseline; gap: 10px;">
            <label for="chartType">Тип графика:</label>
            <select
              id="chartType"
              class="sort-select"
              [(ngModel)]="chartType"
              (change)="updateChartType()"
            >
              <option value="bar">Столбчатый</option>
              <option value="line">Линейный</option>
            </select>
          </div>
        </div>

        <canvas id="statsChart"></canvas>
      </div>

      <div *ngIf="role === 'admin'">
        <h2 style="text-align: center;">Управление правами</h2>
        <div style="display: flex; justify-content: center;">
          <app-permissions-form
            [linkId]="link.id"
            (accessDenied)="onAccessDenied()"
          ></app-permissions-form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        background-color: #ffffff;
      }

      .back-btn {
        display: inline-block;
        margin-top: 4px;
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

      input {
        width: 98%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
      }

      .update-btn {
        display: block;
        width: 100%;
        padding: 0.7rem;
        background-color: #007bff;
        color: white;
        font-size: 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }

      .update-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }

      .stats-section {
        margin-top: 2rem;
      }

      .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      canvas {
        width: 100%;
        height: 300px;
      }

      ::ng-deep .success-toast {
        --mdc-snackbar-container-color: #007bff;
        color: white;
      }

      .copy-short-link-button {
        border: none;
        background-color: white;
        cursor: pointer;
      }

      .copy-link {
        text-decoration: none;
        color: #007bff;
        margin-left: 30px;
      }

      .delete-btn {
        border: none;
        background-color: transparent;
        cursor: pointer;
        color: red;
      }

      .sort-select {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
      }

      .qr-code-btn {
        cursor: pointer;
      }
    `,
  ],
})
export class ShortLinkPageComponent implements OnInit {
  shortLinkForm!: FormGroup;
  timeScale = 'hour';
  chartType: ChartType = 'line';
  chart!: Chart;
  origin = window.location.origin;
  link!: ShortLinkDto;
  role: 'viewer' | 'editor' | 'admin' = 'viewer';
  creatorLogin = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) {
      return;
    }

    // Инициализация формы
    this.shortLinkForm = this.fb.group({
      longUrl: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(http|https):\/\/[^\s$.?#].[^\s]*$/),
        ],
      ],
      description: [''],
    });

    // Загрузка данных короткой ссылки
    this.http
      .get<ShortLinkWithPermissionsDto>(
        `/api/v1/short-links/no-stats/${shortLinkId}`
      )
      .subscribe((link) => {
        this.link = link;
        this.role = link.role;
        this.creatorLogin = link.user.login;

        this.shortLinkForm.patchValue({
          longUrl: link.longLink,
          description: link.description,
        });
      });

    this.initializeChart();
    this.fetchStatistics();
  }

  confirmDelete() {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteShortLink();
      }
    });
  }

  deleteShortLink() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) return;

    this.http.delete(`/api/v1/short-links/${shortLinkId}`).subscribe(() => {
      this.snackBar.open('Ссылка удалена', '', {
        duration: 2000,
        panelClass: ['delete-toast'],
      });
      this.router.navigate(['/']);
    });
  }

  goBack() {
    this.router.navigate(['../']);
  }

  onUpdate() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) return;

    const updateRequestBody: UpdateShortLinkDto = {
      longLink: this.shortLinkForm.value.longUrl,
      description: this.shortLinkForm.value.description,
    };

    this.http
      .put<ShortLinkDto>(
        `/api/v1/short-links/${shortLinkId}`,
        updateRequestBody
      )
      .subscribe((link) => {
        this.link = link;

        this.shortLinkForm.patchValue({
          longUrl: link.longLink,
          description: link.description,
        });

        this.shortLinkForm.markAsPristine();
      });
  }

  fetchStatistics() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) return;

    this.http
      .get(`/api/v1/link-stat/${shortLinkId}/stats`, {
        params: { timeScale: this.timeScale },
      })
      .subscribe((data: any) => {
        this.updateChart(data);
      });
  }

  initializeChart() {
    const ctx = document.getElementById('statsChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: {
        labels: [],
        datasets: [
          {
            label: 'Количество переходов',
            data: [],
            borderColor: '#007bff',
            backgroundColor: '#007bff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  }

  updateChart(data: { labels: string[]; values: number[] }) {
    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.values;
    this.chart.update();
  }

  updateChartType() {
    this.chart.destroy();
    this.initializeChart();
    this.fetchStatistics();
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

  permissionAccessDenied = false;

  onAccessDenied(): void {
    this.permissionAccessDenied = true;
  }

  getRoleAlias(role: 'viewer' | 'editor' | 'admin'): string {
    switch (role) {
      case 'viewer':
        return 'Просмотр';
      case 'editor':
        return 'Редактирование';
      case 'admin':
        return 'Администрирование';
    }
  }

  openQrDialog() {
    this.dialog.open(QrDialogComponent, {
      data: { shortLink: this.origin + '/' + this.link.shortKey },
    });
  }
}
