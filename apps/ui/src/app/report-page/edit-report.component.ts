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

interface EditReportForm {
  name: FormControl<string>;
  shortLinkIds: FormControl<string[]>;
}

@Component({
  standalone: true,
  selector: 'app-edit-report',
  imports: [CommonModule, ReactiveFormsModule, ShortLinkSelectorComponent],
  template: `
    <div class="container">
      <form
        *ngIf="canEdit && form"
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="form"
      >
        <div class="form-group">
          <label for="report-name">Название отчёта</label>
          <input
            id="report-name"
            type="text"
            formControlName="name"
            placeholder="Введите название отчёта"
          />
          <div
            *ngIf="form.controls.name.invalid && form.controls.name.touched"
            class="error"
          >
            Название обязательно
          </div>
        </div>

        <div class="form-group">
          <label>Ссылки в отчёте</label>
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
            type="submit"
            class="btn primary"
            [disabled]="loading || form.invalid"
          >
            Сохранить
          </button>
          <button
            *ngIf="isAdmin"
            type="button"
            class="btn danger"
            (click)="onDelete()"
          >
            Удалить отчёт
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 1.5rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-weight: 600;
      }

      .form-group input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
        font-size: 1rem;
      }

      .error {
        color: #dc2626;
        font-size: 0.875rem;
      }

      .button-row {
        display: flex;
        gap: 1rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        font-size: 1rem;
      }

      .btn.primary {
        background-color: #3b82f6;
        color: white;
      }

      .btn.primary:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
      }

      .btn.danger {
        background-color: #ef4444;
        color: white;
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
