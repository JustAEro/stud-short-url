import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  standalone: true,
  imports: [QRCodeModule],
  selector: 'app-qr-dialog',
  template: `
    <div class="mat-dialog-content">
      <qrcode [qrdata]="data.shortLink" [width]="512"></qrcode>
    </div>
  `,
  styles: [
    `
      .mat-dialog-content {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `,
  ],
})
export class QrDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { shortLink: string }) {}
}
