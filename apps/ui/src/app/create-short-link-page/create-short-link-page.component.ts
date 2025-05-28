import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { CreateShortLinkDto, ShortLinkDto } from '@stud-short-url/common';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-create-short-link',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="container">
      <button class="back-btn" (click)="goBack()">← Назад</button>
      <h1>Создать новую короткую ссылку</h1>
      <form [formGroup]="shortLinkForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="longUrl">Целевая ссылка</label>
          <input
            id="longUrl"
            type="url"
            formControlName="longUrl"
            placeholder="Введите целевую ссылку"
            required
          />
          <div class="error" *ngIf="shortLinkForm.get('longUrl')?.invalid && shortLinkForm.get('longUrl')?.touched">
            Целевая ссылка необходима и должна быть валидной (http или https).
          </div>
        </div>

        <div class="form-group">
          <label for="description">Описание (Опционально)</label>
          <input
            id="description"
            type="text"
            formControlName="description"
            placeholder="Введите описание ссылки (например, для чего ссылка будет использоваться)"
          />
        </div>

        <button type="submit" class="create-btn" [disabled]="shortLinkForm.invalid">Создать</button>
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

      input {
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
        background-color: #007bff;
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
    `,
  ],
})
export class CreateShortLinkPageComponent {
  shortLinkForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.shortLinkForm = this.fb.group({
      longUrl: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^\s$.?#].[^\s]*$/)]],
      description: [''],
    });
  }

  goBack() {
    this.router.navigate(['../']); // Возвращает пользователя на предыдущий роут
  }

  onSubmit() {
    if (this.shortLinkForm.valid) {
      const { longUrl, description } = this.shortLinkForm.value;

      const login = this.authService.getUserLogin();

      if (login) {
        const requestBody: CreateShortLinkDto = {
          login,
          description,
          longLink: longUrl,
        }

        this.http
          .post<ShortLinkDto>('/api/v1/short-links', requestBody)
          .subscribe({
            next: (response) => {
              // console.log('Short link created:', response);
              this.router.navigate(['/short-links', response.shortKey]);
            },
            error: (error) => {
              console.error('Error creating short link:', error);
            },
          });
      }
    }
  }
}
