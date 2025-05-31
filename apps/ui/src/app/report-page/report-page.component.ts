import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  FullReportDto,
  LinkStatReportDto,
  ReportModelDto,
  ReportWithPermissionsDto,
  UpdateReportBodyDto,
} from '@stud-short-url/common';
import { HeaderComponent } from '../header/header.component';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from './delete-report-confirmation-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ReportPermissionsFormComponent } from './report-permissions-form.component';
import { EditReportComponent } from './edit-report.component';
import { LinkStatsSummaryComponent } from './link-stats-summary.component';

Chart.register(...registerables);

@Component({
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    LucideAngularModule,
    MatMenuModule,
    MatButtonModule,
    FormsModule,
    ReportPermissionsFormComponent,
    EditReportComponent,
    LinkStatsSummaryComponent,
  ],
  selector: 'app-report-page',
  template: `
    <app-header></app-header>
    <div class="container" *ngIf="report">
      <div
        style="display: flex; justify-content: space-between; align-items: start;"
      >
        <button class="back-btn" (click)="goBack()">← Назад</button>
        <div style="display: flex; flex-direction: column;">
          <p style="margin-top: 10px;">
            <strong
              >Создатель:
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong
            >{{ report.creatorUser.login }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Режим доступа: &nbsp;&nbsp;&nbsp;</strong
            >{{ getRoleAlias(report.role) }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Дата создания: &nbsp;&nbsp;&nbsp;&nbsp;</strong
            >{{ report.createdAt | date : 'dd-MM-YYYY HH:mm:ss' }}
          </p>
          <p style="margin-top: 10px;">
            <strong>Дата изменения: &nbsp;</strong
            >{{ report.updatedAt | date : 'dd-MM-YYYY HH:mm:ss' }}
          </p>
        </div>
      </div>

      <div
        style="display: flex; direction: row; justify-content: center; align-items: center; gap: 20px;"
      >
        <h1>Данные отчета {{ report.name }}</h1>
        <div
          style="display: flex; align-items: baseline; justify-content: center; gap: 10px;"
        >
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportReport('csv')">
              <span>Экспорт в CSV</span>
            </button>
            <button mat-menu-item (click)="exportReport('xlsx')">
              <span>Экспорт в XLSX</span>
            </button>
          </mat-menu>

          <button class="export-report-button" [matMenuTriggerFor]="exportMenu">
            <lucide-icon
              class="export-report-button_icon"
              name="arrow-down-to-line"
            ></lucide-icon>
          </button>

          @if (report.role === 'admin') {
          <button class="delete-btn" (click)="confirmDelete()">
            <lucide-icon name="trash"></lucide-icon>
          </button>
          }
        </div>
      </div>

      <div class="edit-section" *ngIf="report.role !== 'viewer'">
        <h2 style="text-align: center;">Редактировать отчёт</h2>
        <app-edit-report
          [report]="report"
          (reportUpdateRequested)="onReportUpdate($event)"
          (reportDeleteRequested)="confirmDelete()"
        ></app-edit-report>
      </div>

      <div class="stats-section">
        <h2 style="text-align: center;">Статистика</h2>

        <div class="filters">
          <div class="filters-row">
            <div class="filter-group">
              <label for="timeScale">Гранулярность:</label>
              <select
                id="timeScale"
                class="sort-select"
                [(ngModel)]="editableTimeScale"
                [disabled]="report.role === 'viewer'"
              >
                <option value="hour">Час</option>
                <option value="day">День</option>
                <option value="month">Месяц</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="chartType">Тип графика:</label>
              <select
                id="chartType"
                class="sort-select"
                [(ngModel)]="editableChartType"
                [disabled]="report.role === 'viewer'"
              >
                <option value="bar">Столбчатый</option>
                <option value="line">Линейный</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="period">Период:</label>
              <select
                id="period"
                class="sort-select"
                [(ngModel)]="editablePeriod"
                [disabled]="report.role === 'viewer'"
              >
                <option value="last24h">Последние 24 часа</option>
                <option value="last7d">Последние 7 дней</option>
                <option value="last30d">Последние 30 дней</option>
                <option value="last365d">Последние 365 дней</option>
                <option value="allTime">За все время</option>
                <option value="custom">Произвольный период</option>
              </select>
            </div>
          </div>

          <div
            class="filters-row"
            *ngIf="editablePeriod === 'custom' || hasChanges()"
          >
            <div class="filter-group" *ngIf="editablePeriod === 'custom'">
              <label>С:</label>
              <input
                type="datetime-local"
                [(ngModel)]="customStartDate"
                [disabled]="report.role === 'viewer'"
              />
              <label>По:</label>
              <input
                type="datetime-local"
                [(ngModel)]="customEndDate"
                [disabled]="report.role === 'viewer'"
              />
            </div>

            <div
              class="filter-group"
              *ngIf="hasChanges() && report.role !== 'viewer'"
            >
              <button (click)="applyChanges()" class="save-cancel-btn">
                Сохранить
              </button>
              <button (click)="cancelChanges()" class="save-cancel-btn">
                Отменить
              </button>
            </div>
          </div>
        </div>

        <canvas #chartCanvas></canvas>

        <div *ngIf="fullReportDto">
          <app-link-stats-summary
            [stats]="fullReportDto.aggregate"
            title=""
          ></app-link-stats-summary>

          <ng-container *ngFor="let linkStat of fullReportDto.linksStats">
            <app-link-stats-summary
              [stats]="linkStat"
              [title]="titleFromLinkStat(linkStat)"
            ></app-link-stats-summary>
          </ng-container>
        </div>
      </div>

      <div *ngIf="this.report.role === 'admin'">
        <h2 style="text-align: center;">Управление правами</h2>
        <div style="display: flex; justify-content: center;">
          <app-report-permissions-form
            [reportId]="this.report.id"
            (accessDenied)="onAccessDenied()"
          ></app-report-permissions-form>
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
        height: 36px;
      }

      .back-btn:hover {
        background-color: #e2e6ea;
      }

      .export-report-button {
        border: none;
        background-color: white;
        cursor: pointer;
      }

      .delete-btn {
        border: none;
        background-color: transparent;
        cursor: pointer;
        color: red;
      }

      h1 {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .stats-section {
        margin-top: 2rem;
      }

      .filters {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .sort-select {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
      }

      canvas {
        width: 100%;
        height: 300px;
      }

      input[type='datetime-local'] {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 0.9rem;
        height: 36px; /* та же высота, что и у .back-btn */
        box-sizing: border-box;
      }

      .save-cancel-btn {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: #f5f5f5;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        height: 36px;
      }

      .save-cancel-btn:hover {
        background-color: #e2e6ea;
      }
    `,
  ],
})
export class ReportPageComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;
  chartType: 'bar' | 'line' = 'line';
  timeScale: 'day' | 'hour' | 'month' = 'day';
  editableTimeScale = this.timeScale;
  editableChartType = this.chartType;
  editablePeriod:
    | 'last24h'
    | 'last7d'
    | 'last30d'
    | 'last365d'
    | 'allTime'
    | 'custom' = 'allTime';
  customStartDate: string | undefined = undefined;
  customEndDate: string | undefined = undefined;

  report!: ReportWithPermissionsDto;
  fullReportDto!: FullReportDto;

  aggregateDevicesStats!: Record<string, number>;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http
      .get<ReportWithPermissionsDto>(`/api/v1/reports/${id}`)
      .subscribe((report) => {
        this.report = report;

        // Инициализация значений селектов на основе отчета
        this.timeScale = report.timeScale;
        this.chartType = report.chartType;
        this.editableTimeScale = report.timeScale;
        this.editableChartType = report.chartType;
        this.editablePeriod = report.periodType;
        this.customStartDate = this.toDatetimeLocalString(report.customStart);
        this.customEndDate = this.toDatetimeLocalString(report.customEnd);

        this.cdr.detectChanges();
        this.initializeChart();
        this.fetchStatistics();

        // Загрузка fullReportDto после загрузки report
        this.loadFullReport(report.id);
      });
  }

  private loadFullReport(id: string) {
    this.http
      .get<FullReportDto>(`/api/v1/reports/${id}/stats`, {
        params: { timezoneOffsetInMinutes: 0 },
      })
      .subscribe({
        next: (fullReport) => {
          this.fullReportDto = fullReport;

          this.cdr.detectChanges();
          // Здесь можно выполнить дополнительные действия с fullReportDto
          // например, инициализировать что-то или вызвать обновление UI
        },
        error: (err) => {
          console.error('Ошибка при загрузке полного отчёта:', err);
          // Можно показать уведомление об ошибке, если нужно
        },
      });
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  hasChanges(): boolean {
    // Преобразует строку datetime-local (например, "2025-05-27T15:00") в ISO-строку (например, "2025-05-27T15:00:00.000Z")
    const toISO = (localDateTime?: string) => {
      if (!localDateTime) return undefined;
      const date = new Date(localDateTime);
      return date.toISOString();
    };

    const currentCustomStartISO = toISO(this.customStartDate);
    const currentCustomEndISO = toISO(this.customEndDate);

    return (
      this.editableTimeScale !== this.timeScale ||
      this.editableChartType !== this.chartType ||
      this.editablePeriod !== this.report.periodType ||
      (this.editablePeriod === 'custom' &&
        (currentCustomStartISO !== this.report.customStart ||
          currentCustomEndISO !== this.report.customEnd))
    );
  }

  applyChanges() {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (!reportId) return;

    const body: UpdateReportBodyDto = {
      name: this.report.name,
      shortLinkIds: this.report.shortLinks.map((l) => l.shortLink.id),
      timeScale: this.editableTimeScale,
      chartType: this.editableChartType,
      periodType: this.editablePeriod,
      customStart:
        this.editablePeriod === 'custom' && this.customStartDate
          ? this.fromDatetimeLocalString(this.customStartDate)
          : undefined,
      customEnd:
        this.editablePeriod === 'custom' && this.customEndDate
          ? this.fromDatetimeLocalString(this.customEndDate)
          : undefined,
    };

    this.http
      .put<ReportModelDto>(`/api/v1/reports/${reportId}`, body)
      .subscribe({
        next: (updatedReport) => {
          // Обновляем локальные значения
          this.timeScale = updatedReport.timeScale;
          this.chartType = updatedReport.chartType;
          this.editableTimeScale = updatedReport.timeScale;
          this.editableChartType = updatedReport.chartType;
          this.editablePeriod = updatedReport.periodType;
          this.customStartDate = this.toDatetimeLocalString(
            updatedReport.customStart
          );
          this.customEndDate = this.toDatetimeLocalString(
            updatedReport.customEnd
          );

          this.cdr.detectChanges();

          // можно обновить графики:
          this.updateChartType();
        },
        error: (err) => {
          console.error('Ошибка при сохранении отчета:', err);
        },
      });

    this.http
      .get<ReportWithPermissionsDto>(`/api/v1/reports/${reportId}`)
      .subscribe((report) => {
        this.report = report;

        this.cdr.detectChanges();
      });
  }

  cancelChanges() {
    this.editableTimeScale = this.timeScale;
    this.editableChartType = this.chartType;
    this.editablePeriod = this.report.periodType;
    this.customStartDate = this.toDatetimeLocalString(this.report.customStart);
    this.customEndDate = this.toDatetimeLocalString(this.report.customEnd);

    this.cdr.detectChanges();
  }

  fetchStatistics() {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (!reportId) return;

    this.http
      .get<FullReportDto>(`/api/v1/reports/${reportId}/stats`, {
        params: { timezoneOffsetInMinutes: 0 },
      })
      .subscribe((data) => {
        //this.fullReportDto = data;
        this.updateChart(data);
      });
  }

  initializeChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

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

  generateColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const hue = (360 / count) * i;
      colors.push(`hsla(${hue}, 60%, 50%, 1.0)`);
    }
    return colors;
  }

  updateChart(data: FullReportDto) {
    this.chart.data.labels = data.linksStats[0].labels;

    const colors = this.generateColors(data.linksStats.length);

    this.chart.data.datasets = data.linksStats.map((stat, i) => ({
      label: stat.description || stat.shortKey,
      data: stat.values,
      borderColor: colors[i],
      backgroundColor: colors[i],
      borderWidth: 2,
    }));

    this.chart.update();
  }

  updateChartType() {
    this.chart.destroy();
    this.initializeChart();
    this.fetchStatistics();
  }

  destroyChart() {
    if (this.chart) {
      this.chart.destroy();
    }
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

  goBack() {
    this.router.navigate(['/reports']);
  }

  onReportUpdate(dto: UpdateReportBodyDto) {
    this.http
      .put<ReportModelDto>(`/api/v1/reports/${this.report.id}`, dto)
      .subscribe({
        next: (updated) => {
          this.http
            .get<ReportWithPermissionsDto>(`/api/v1/reports/${updated.id}`)
            .subscribe((report) => {
              this.report = report;

              this.cdr.detectChanges();
            });

          this.fetchStatistics();
        },
        error: () => {
          this.snackBar.open('Ошибка при обновлении отчёта', '', {
            duration: 3000,
          });
        },
      });
  }

  confirmDelete() {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteReport();
      }
    });
  }

  deleteReport() {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (!reportId) return;

    this.http.delete(`/api/v1/reports/${reportId}`).subscribe(() => {
      this.snackBar.open('Отчет удален', '', {
        duration: 2000,
        panelClass: ['delete-toast'],
      });
      this.router.navigate(['/reports']);
    });
  }

  exportReport(format: 'csv' | 'xlsx') {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (!reportId) return;

    this.http
      .get(
        `/api/v1/reports/${reportId}/export?format=${format}&timezoneOffsetInMinutes=${0}`,
        {
          responseType: 'blob',
          observe: 'response',
        }
      )
      .subscribe((response) => {
        const blob = response.body!;
        const contentDisposition = response.headers.get('Content-Disposition');

        let filename = `report.${format}`; // fallback по умолчанию

        if (contentDisposition) {
          const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1]);
          }
        }

        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
      });
  }

  private toDatetimeLocalString(
    date: Date | string | undefined
  ): string | undefined {
    if (!date) return undefined;
    const d = typeof date === 'string' ? new Date(date) : date;

    // Преобразуем дату в локальный ISO без суффикса Z
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  }

  private fromDatetimeLocalString(
    value: string | undefined
  ): string | undefined {
    if (!value) return undefined;
    // value - локальное время без временной зоны, создаём дату и конвертируем в ISO с часовым поясом (UTC)
    const date = new Date(value);
    return date.toISOString();
  }

  permissionAccessDenied = false;

  onAccessDenied(): void {
    this.permissionAccessDenied = true;
  }

  titleFromLinkStat(linkStat: LinkStatReportDto): string {
    return `Статистика по ссылке: ${linkStat.description || linkStat.shortKey}`;
  }
}
