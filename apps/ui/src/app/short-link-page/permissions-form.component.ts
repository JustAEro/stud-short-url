import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, of, throwError } from 'rxjs';

@Component({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],

  standalone: true,
  selector: 'app-permissions-form',
  template: `
    <div class="permissions-container">
      <h3 class="title">Пользователи с правами доступа</h3>

      <ul class="user-list">
        <li *ngFor="let user of users" class="user-row">
          <span class="user-login">{{ user.login }}</span>

          <!-- <mat-icon
            [ngSwitch]="user.role"
            class="user-role-icon"
            matTooltip="{{ user.role }}"
          >
            <ng-container *ngSwitchCase="'admin'"
              >admin_panel_settings</ng-container
            >
            <ng-container *ngSwitchCase="'editor'">edit</ng-container>
            <ng-container *ngSwitchDefault>visibility</ng-container>
          </mat-icon> -->

          <mat-form-field appearance="outline" class="user-role-select">
            <mat-select
              [value]="user.role"
              (selectionChange)="onRoleChange(user.login, $event)"
              style="min-width: 230px;"
            >
              <mat-select-trigger>
                <div style="min-width: 300px;">
                  <mat-icon style="vertical-align: middle; margin-right: 6px;">
                    {{
                      user.role === 'admin'
                        ? 'admin_panel_settings'
                        : user.role === 'editor'
                        ? 'edit'
                        : 'visibility'
                    }}
                  </mat-icon>
                  {{
                    user.role === 'admin'
                      ? 'Администрирование'
                      : user.role === 'editor'
                      ? 'Редактирование'
                      : 'Просмотр'
                  }}
                </div>
              </mat-select-trigger>

              <mat-option value="viewer">
                <mat-icon>visibility</mat-icon> Просмотр
              </mat-option>
              <mat-option value="editor">
                <mat-icon>edit</mat-icon> Редактирование
              </mat-option>
              <mat-option value="admin">
                <mat-icon>admin_panel_settings</mat-icon> Администрирование
              </mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-icon-button
            color="warn"
            (click)="removePermission(user.login)"
            matTooltip="Удалить пользователя"
          >
            <mat-icon>remove_circle</mat-icon>
          </button>
        </li>
      </ul>

      <form
        [formGroup]="permissionForm"
        (ngSubmit)="addPermission()"
        class="permission-form"
      >
        <mat-form-field appearance="outline" class="form-item">
          <mat-label>Логин пользователя</mat-label>
          <input matInput formControlName="login" placeholder="Введите логин" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-item">
          <mat-label>Роль</mat-label>
          <mat-select formControlName="role">
            <mat-select-trigger>
              <mat-icon style="vertical-align: middle; margin-right: 6px;">
                {{
                  permissionForm.get('role')?.value === 'admin'
                    ? 'admin_panel_settings'
                    : permissionForm.get('role')?.value === 'editor'
                    ? 'edit'
                    : 'visibility'
                }}
              </mat-icon>
              {{
                permissionForm.get('role')?.value === 'admin'
                  ? 'Администрирование'
                  : permissionForm.get('role')?.value === 'editor'
                  ? 'Редактирование'
                  : 'Просмотр'
              }}
            </mat-select-trigger>

            <mat-option value="viewer">
              <mat-icon>visibility</mat-icon> Просмотр
            </mat-option>
            <mat-option value="editor">
              <mat-icon>edit</mat-icon> Редактирование
            </mat-option>
            <mat-option value="admin">
              <mat-icon>admin_panel_settings</mat-icon> Администрирование
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="form-actions">
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="permissionForm.invalid"
          >
            Добавить
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .permissions-container {
        display: flex;
        flex-direction: column;
        padding: 24px;
        padding-top: 5px;
        border-radius: 16px;
        max-width: 500px;
        margin-bottom: 24px;
        margin-top: 0px;
        margin-right: auto;
        margin-left: auto;
        background: transparent;
        box-shadow: none;
      }

      .title {
        margin-top: 0;
        margin-bottom: 24px;
        font-size: 22px;
        font-weight: 600;
        text-align: center;
      }

      .user-list {
        list-style: none;
        padding: 0;
        margin: 0 0 24px 0;
      }

      .user-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 8px 0;
        flex-wrap: wrap;
      }

      .user-login {
        flex: 1 1 auto;
        font-weight: 500;
      }

      .user-role-icon {
        color: #616161;
      }

      .user-role-select {
        margin-top: 20px;
        min-width: 270px;
      }

      .permission-form {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: space-between;
      }

      .form-item {
        flex: 1 1 300px;
        min-width: 200px;
      }

      .form-actions {
        flex-basis: 100%;
        display: flex;
        justify-content: center;
      }

      ::ng-deep .mat-form-field {
        min-height: unset;
      }

      @media (max-width: 600px) {
        .user-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 8px 0;
          flex-wrap: wrap;
        }

        .user-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 70px;
        }

        // .permission-form {
        //   flex-direction: column;
        //   gap: 8px; /* Уменьшить промежутки */
        // }

        // .form-item {
        //   width: 100%;
        //   max-width: 400px;
        //   margin: 0 auto;
        // }

        // .mat-form-field {
        //   margin: 4px 0; /* Уменьшить внутренние отступы */
        // }
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

  onRoleChange(login: string, event: MatSelectChange) {
    const newRole = event.value as 'viewer' | 'editor' | 'admin';
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
