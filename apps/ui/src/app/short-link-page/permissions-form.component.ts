import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, of, throwError } from 'rxjs';

@Component({
  imports: [ReactiveFormsModule, CommonModule],
  standalone: true,
  selector: 'app-permissions-form',
  template: `
    <div class="permissions-container">
      <h3>Пользователи с правами доступа</h3>
      <ul>
        <li *ngFor="let user of users">
          {{ user.login }}
          <select
            [value]="user.role"
            (change)="onRoleChange(user.login, $event)"
          >
            <option value="viewer">Просмотр</option>
            <option value="editor">Редактирование</option>
            <option value="admin">Администрирование</option>
          </select>
          <button class="remove-btn" (click)="removePermission(user.login)">
            Удалить
          </button>
        </li>
      </ul>

      <form
        class="permission-form"
        [formGroup]="permissionForm"
        (ngSubmit)="addPermission()"
      >
        <input
          class="input-field"
          type="text"
          formControlName="login"
          placeholder="Логин пользователя"
        />
        <select formControlName="role" class="input-field-select">
          <option value="viewer">Просмотр</option>
          <option value="editor">Редактирование</option>
          <option value="admin">Администрирование</option>
        </select>
        <button
          class="add-btn"
          type="submit"
          [disabled]="permissionForm.invalid"
        >
          Добавить пользователя
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .permissions-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-top: 20px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
        width: 350px;
      }
      h3 {
        text-align: center;
        margin-bottom: 15px;
        color: #333;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center; /* Центрируем все строки */
      }
      li {
        display: flex;
        align-items: center;
        justify-content: center; /* Центрирование содержимого */
        gap: 10px;

        /* Удаляем фон и тень */
        background: transparent;
        box-shadow: none;
        border: none;
        padding: 8px 0;
        margin-bottom: 10px;
      }

      li select {
        flex-shrink: 0;
        padding: 6px 8px;
        border: 1px solid #ccc;
        border-radius: 6px;
        background: white;
        font-size: 14px;
        min-width: 160px;
      }
      .input-field-select {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        min-width: 160px;
      }
      .user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .remove-btn {
        background-color: #ff4d4d;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
      }
      .remove-btn:hover {
        background-color: #cc0000;
      }
      .permission-form {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-top: 15px;
        width: 100%;
        gap: 10px;
        flex-wrap: wrap; /* чтобы не ломалось на маленьких экранах */
      }
      .input-field {
        width: 45%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        /* Убираем margin-bottom */
      }
      .add-btn {
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 20px;
        width: 80%;
        transition: background 0.3s;
      }
      .add-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .add-btn:hover:not(:disabled) {
        background-color: #45a049;
      }
    `,
  ],
})
export class PermissionsFormComponent implements OnInit {
  @Input() linkId!: string;
  users: { id: string; login: string; role: 'viewer' | 'editor' | 'admin' }[] =
    [];
  permissionForm!: FormGroup;

  @Output() accessDenied = new EventEmitter<void>();

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.permissionForm = this.fb.group({
      login: ['', Validators.required],
      role: ['viewer', Validators.required],
    });
    this.loadPermissions();
  }

  loadPermissions() {
    this.http
      .get<
        { id: string; login: string; role: 'viewer' | 'editor' | 'admin' }[]
      >(`/api/v1/edit-permission/${this.linkId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 403) {
            this.accessDenied.emit();

            return of([]); // возвращаем пустой список, чтобы не прервать поток
          }

          return throwError(() => error);
        })
      )
      .subscribe((users) => (this.users = users));
  }

  addPermission() {
    if (!this.permissionForm.valid) return;

    const { login, role } = this.permissionForm.value;

    this.http
      .post(`/api/v1/edit-permission/add/${this.linkId}`, { login, role })
      .subscribe(() => {
        this.loadPermissions();
        this.permissionForm.reset({ role: 'viewer' });
      });
  }

  onRoleChange(login: string, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value as
      | 'viewer'
      | 'editor'
      | 'admin';

    this.http
      .patch(`/api/v1/edit-permission/update/${this.linkId}`, {
        login,
        role: newRole,
      })
      .subscribe(() => this.loadPermissions());
  }

  removePermission(login: string) {
    this.http
      .delete(`/api/v1/edit-permission/remove/${this.linkId}/login/${login}`)
      .subscribe(() => this.loadPermissions());
  }
}
