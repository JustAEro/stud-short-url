import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ReportWithPermissionsDto,
  UpdateReportBodyDto,
} from '@stud-short-url/common';
import { ShortLinkSelectorComponent } from './short-link-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

interface EditReportForm {
  name: FormControl<string>;
  shortLinkIds: FormControl<string[]>;
}

@Component({
  standalone: true,
  selector: 'app-edit-report',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ShortLinkSelectorComponent,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="container">
      <mat-card class="card">
        <form
          *ngIf="canEdit && form"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          class="form"
        >
          <div class="form-group">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Название отчета</mat-label>
              <input
                matInput
                id="report-name"
                type="text"
                formControlName="name"
                placeholder="Введите название отчёта"
              />
            </mat-form-field>
            <div
              *ngIf="form.controls.name.invalid && form.controls.name.touched"
              class="error"
            >
              Название обязательно
            </div>
          </div>

          <div class="form-group">
            <label>Ссылки в отчете</label>

            <app-short-link-selector
              [selectedLinkIds]="selectedLinkIds"
              (selectionChange)="onLinkSelectionChanged($event)"
            ></app-short-link-selector>

            <div
              *ngIf="
                form.controls.shortLinkIds.invalid &&
                form.controls.shortLinkIds.touched
              "
              class="error"
            >
              Необходимо выбрать хотя бы одну ссылку
            </div>
          </div>

          <div class="button-row">
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="loading || form.invalid"
            >
              Обновить
            </button>
            <button
              *ngIf="isAdmin"
              mat-raised-button
              color="warn"
              type="button"
              (click)="onDelete()"
            >
              Удалить
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
        justify-content: center;
        padding: 16px;
      }

      .card {
        width: 100%;
        max-width: 800px;
        padding: 24px;
        background: transparent;
        box-shadow: none;
      }

      .form {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-weight: 500;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }

      .full-width {
        width: 100%;
      }

      .error {
        color: #f44336;
        font-size: 12px;
        margin-top: -16px;
      }

      .button-row {
        display: flex;
        gap: 100px;
        justify-content: center;
        margin-top: 16px;
      }

      .link-selector-container {
        display: flex;
        justify-content: center;
        margin-top: 8px;
      }
    `,
  ],
})
export class EditReportComponent implements OnInit {
  @Input() report!: ReportWithPermissionsDto;

  @Output() reportUpdateRequested = new EventEmitter<UpdateReportBodyDto>();
  @Output() reportDeleteRequested = new EventEmitter<void>();

  form!: FormGroup<EditReportForm>;
  loading = false;
  canEdit = false;
  isAdmin = false;

  selectedLinkIds = new Set<string>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initReport();
  }

  private initReport(): void {
    const ids = this.report.shortLinks.map(({ shortLink }) => shortLink.id);
    this.selectedLinkIds = new Set(ids);

    this.form = this.fb.nonNullable.group<EditReportForm>({
      name: this.fb.nonNullable.control(this.report.name, Validators.required),
      shortLinkIds: this.fb.nonNullable.control(ids, Validators.required),
    });

    this.canEdit =
      this.report.role === 'editor' || this.report.role === 'admin';
    this.isAdmin = this.report.role === 'admin';
  }

  onLinkSelectionChanged(selectedSet: Set<string>): void {
    const ids = Array.from(selectedSet);
    this.selectedLinkIds = selectedSet;
    this.form.patchValue({ shortLinkIds: ids });
  }

  onSubmit(): void {
    this.loading = true;

    const dto: UpdateReportBodyDto = {
      name: this.form.value.name!,
      shortLinkIds: this.form.value.shortLinkIds!,
      timeScale: this.report.timeScale,
      chartType: this.report.chartType,
      periodType: this.report.periodType,
      customStart: this.report.customStart,
      customEnd: this.report.customEnd,
    };

    this.reportUpdateRequested.emit(dto);
  }

  onDelete(): void {
    this.reportDeleteRequested.emit();
  }
}
