import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { CreateReportBodyDto, ShortLinkDto } from '@stud-short-url/common';
import { ShortLinkSelectorComponent } from '../report-page/short-link-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    ShortLinkSelectorComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <app-header></app-header>
    <div class="container">
      <h1>Создание отчета</h1>

      <form [formGroup]="reportForm" (ngSubmit)="onSubmit()" class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Название отчета</mat-label>
          <input matInput formControlName="name" placeholder="Введите название отчета">
        </mat-form-field>

        <app-short-link-selector
          [selectedLinkIds]="selectedLinkIdsSet"
          (selectionChange)="onSelectionChange($event)"
          [searchTerm]="reportForm.get('searchQuery')?.value"
          [sortBy]="reportForm.get('sortBy')?.value"
          [sortOrder]="reportForm.get('sortOrder')?.value"
        ></app-short-link-selector>

        <button
          mat-raised-button
          color="primary"
          type="submit"
          class="submit-button"
          [disabled]="reportForm.get('name')?.invalid || selectedLinkIds.length === 0 || loading"
        >
          <span *ngIf="!loading">Создать отчет</span>
          <mat-spinner *ngIf="loading" diameter="20" strokeWidth="2"></mat-spinner>
        </button>
      </form>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
    }

    h1 {
      text-align: center;
      margin-bottom: 24px;
      font-size: 24px;
      font-weight: 500;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .submit-button {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
    }

    .submit-button:disabled {
      background-color: #e0e0e0;
      color: rgba(0, 0, 0, 0.38);
    }

    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class CreateReportPageComponent {
  reportForm: FormGroup;
  selectedLinkIds: string[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.reportForm = this.fb.group({
      name: ['', [Validators.required]],
      searchQuery: [''],
      sortBy: ['updatedAt'],
      sortOrder: ['desc'],
    });
  }

  onSelectionChange(selectedIds: Set<string>) {
    this.selectedLinkIds = [...selectedIds];
  }

  onSubmit() {
    if (this.reportForm.invalid || this.selectedLinkIds.length === 0) {
      this.snackBar.open('Введите название и выберите ссылки', 'Закрыть', {
        duration: 3000
      });
      return;
    }

    this.loading = true;

    const reportData: CreateReportBodyDto = {
      name: this.reportForm.value.name,
      shortLinkIds: this.selectedLinkIds,
    };

    this.http.post('/api/v1/reports', reportData).subscribe({
      next: (response: any) => {
        this.snackBar.open('Отчет успешно создан', 'Закрыть', {
          duration: 3000
        });
        this.router.navigate(['/reports', response.id]);
      },
      error: (error) => {
        console.error('Ошибка при создании отчета:', error);
        this.snackBar.open('Ошибка при создании отчета', 'Закрыть', {
          duration: 3000
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  get selectedLinkIdsSet(): Set<string> {
    return new Set(this.selectedLinkIds);
  }
}
