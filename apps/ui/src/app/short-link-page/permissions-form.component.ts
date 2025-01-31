import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [ReactiveFormsModule, CommonModule],
  standalone: true,
  selector: 'app-permissions-form',
  template: `
    <div class="permissions-container">
      <h3>Пользователи с правами редактирования</h3>
      <ul>
        <li *ngFor="let user of users">
          {{ user.login }}
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
        <button
          class="add-btn"
          type="submit"
          [disabled]="permissionForm.invalid"
        >
          Добавить
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
        width: 80%;
      }
      li {
        display: grid;
        grid-template-columns: 1fr auto; /* Логин и кнопка удаления на одной строке */
        margin-bottom: 10px; /* Расстояние между строками */
        align-items: center; /* Выравнивание элементов по центру */
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
        flex-direction: column;
        align-items: center;
        margin-top: 15px;
        width: 100%;
      }
      .input-field {
        width: 80%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin-bottom: 10px;
      }
      .add-btn {
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
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
  users: { id: string; login: string }[] = [];
  permissionForm!: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.permissionForm = this.fb.group({
      login: ['', Validators.required],
    });
    this.loadPermissions();
  }

  loadPermissions() {
    this.http
      .get<{ id: string; login: string }[]>(
        `/api/v1/edit-permission/${this.linkId}`
      )
      .subscribe((users) => (this.users = users));
  }

  addPermission() {
    if (!this.permissionForm.valid) return;

    const login = this.permissionForm.value.login;

    this.http
      .post(`/api/v1/edit-permission/add/${this.linkId}`, { login })
      .subscribe(() => {
        this.loadPermissions();
        this.permissionForm.reset();
      });
  }

  removePermission(login: string) {
    this.http
      .delete(`/api/v1/edit-permission/remove/${this.linkId}/login/${login}`)
      .subscribe(() => this.loadPermissions());
  }
}
