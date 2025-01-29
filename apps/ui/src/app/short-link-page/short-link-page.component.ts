import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { ShortLinkDto } from '@stud-short-url/common';
import { HeaderComponent } from '../header/header.component';

Chart.register(...registerables);

@Component({
  selector: 'app-short-link-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="container">
      <button class="back-btn" (click)="goBack()">← Назад</button>
      <h1>Данные короткой ссылки</h1>

      <form [formGroup]="shortLinkForm" (ngSubmit)="onUpdate()">
        <div class="form-group">
          <label for="longUrl">Целевая ссылка</label>
          <input
            id="longUrl"
            type="url"
            formControlName="longUrl"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Описание (Опционально)</label>
          <input
            id="description"
            type="text"
            formControlName="description"
          />
        </div>

        <button type="submit" class="update-btn" [disabled]="shortLinkForm.pristine || shortLinkForm.invalid">
          Изменить
        </button>
      </form>

      <div class="stats-section">
        <h2>Статистика</h2>
        <label for="timeScale">Гранулярность:</label>
        <select id="timeScale" [(ngModel)]="timeScale" (change)="fetchStatistics()">
          <option value="hour">Час</option>
          <option value="day">День</option>
          <option value="month">Месяц</option>
        </select>
        <canvas id="statsChart"></canvas>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        // border: 1px solid #e9ecef;
        // border-radius: 8px;
        // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

      input {
        width: 100%;
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

      canvas {
        width: 100%;
        height: 300px;
      }
    `,
  ],
})
export class ShortLinkPageComponent implements OnInit {
  shortLinkForm!: FormGroup;
  timeScale = 'hour';
  chart!: Chart;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) {
      return;
    }

    // Инициализация формы
    this.shortLinkForm = this.fb.group({
      longUrl: ['', Validators.required],
      description: [''],
    });

    // Загрузка данных короткой ссылки
    this.http.get<ShortLinkDto>(`/api/v1/short-links/${shortLinkId}`).subscribe((link) => {
      this.shortLinkForm.patchValue({
        longUrl: link.longLink,
        description: link.description,
      });
    });

    this.initializeChart();
    this.fetchStatistics();
  }

  goBack() {
    this.router.navigate(['../']);
  }

  onUpdate() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) return;

    this.http
      .put(`/api/short-links/${shortLinkId}`, this.shortLinkForm.value)
      .subscribe(() => {
        alert('Link updated successfully');
        this.shortLinkForm.markAsPristine();
      });
  }

  fetchStatistics() {
    const shortLinkId = this.route.snapshot.paramMap.get('id');
    if (!shortLinkId) return;

    this.http
      .get(`/api/v1/link-stat/${shortLinkId}/stats`, { params: { timeScale: this.timeScale } })
      .subscribe((data: any) => {
        this.updateChart(data);
      });
  }

  initializeChart() {
    const ctx = document.getElementById('statsChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Количество переходов',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 1)',
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
}
