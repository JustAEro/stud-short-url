import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-report-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="dialog-container">
      <h2 class="dialog-title">Подтверждение удаления</h2>
      <mat-dialog-content class="dialog-content">
        Вы уверены, что хотите удалить этот отчет?
      </mat-dialog-content>
      <mat-dialog-actions class="dialog-actions">
        <button class="cancel-btn" (click)="dialogRef.close(false)">Отмена</button>
        <button class="delete-btn" (click)="dialogRef.close(true)">Удалить</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        text-align: center;
        padding: 20px;
      }
      .dialog-title {
        font-size: 1.5rem;
        margin-bottom: 10px;
      }
      .dialog-content {
        font-size: 1rem;
        margin-bottom: 20px;
      }
      .dialog-actions {
        display: flex;
        justify-content: space-around;
      }
      .cancel-btn {
        background-color: #ccc;
        color: #333;
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s ease;
      }
      .cancel-btn:hover {
        background-color: #bbb;
      }
      .delete-btn {
        background-color: #d32f2f;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s ease;
      }
      .delete-btn:hover {
        background-color: #b71c1c;
      }
    `,
  ],
})
export class DeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>
  ) {}
}
