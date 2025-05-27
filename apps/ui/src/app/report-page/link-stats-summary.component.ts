import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LinkDetailedStatsDto } from '@stud-short-url/common';

@Component({
  standalone: true,
  selector: 'app-link-stats-summary',
  imports: [CommonModule],
  styles: [`
    .summary-section {
      margin-bottom: 16px;
    }

    .summary-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px; /* как SizedBox(height: 8) */
    }

    .summary-description {
      margin-bottom: 16px;
      color: #6c757d;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 12px 16px;
      margin: 4px 0; /* vertical margin 4px, как margin vertical:4 в Flutter */
      background: #fff;
    }

    .stat-card-title {
      font-weight: 500;
      display: flex;
      align-items: center;
    }

    .stat-icon {
      margin-right: 8px;
      color: #1976d2;
      font-size: 18px;
    }

    .stat-card-value {
      font-weight: bold;
      font-size: 16px;
    }

    .stat-entry {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Добавим отступ снизу для каждого статистического раздела, как SizedBox(height: 16) в Flutter */
    .stats-block {
      margin-bottom: 16px;
    }
  `],
  template: `
    <div class="summary-section">

      <div class="summary-title">{{ title }}</div>
      <div *ngIf="description" class="summary-description">{{ description }}</div>

      <div class="stat-card stats-block">
        <div class="stat-entry">
          <span class="stat-card-title">
            <span class="stat-icon">📊</span> Всего переходов
          </span>
          <span class="stat-card-value">{{ stats.total }}</span>
        </div>
      </div>

      <div class="summary-title stats-block">По устройствам</div>
      <div *ngFor="let item of stats.byDevice" class="stat-card">
        <div class="stat-entry">
          <span class="stat-card-title">
            <span class="stat-icon">📊</span> {{ item.deviceType }}
          </span>
          <span class="stat-card-value">{{ item._count._all }}</span>
        </div>
      </div>

      <div class="summary-title stats-block">По браузерам</div>
      <div *ngFor="let item of stats.byBrowser" class="stat-card">
        <div class="stat-entry">
          <span class="stat-card-title">
            <span class="stat-icon">📊</span> {{ item.browser }}
          </span>
          <span class="stat-card-value">{{ item._count._all }}</span>
        </div>
      </div>

      <div class="summary-title stats-block">По источникам переходов</div>
      <div *ngFor="let item of stats.byReferrer" class="stat-card">
        <div class="stat-entry">
          <span class="stat-card-title">
            <span class="stat-icon">📊</span> {{ item.referrer || 'Прямой переход' }}
          </span>
          <span class="stat-card-value">{{ item._count._all }}</span>
        </div>
      </div>

    </div>
  `,
})
export class LinkStatsSummaryComponent {
  @Input() stats!: LinkDetailedStatsDto;
  @Input() title = '';
  @Input() description?: string;
}
