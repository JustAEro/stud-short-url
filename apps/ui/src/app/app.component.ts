import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {common} from '@stud-short-url/common'

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    console.log(common())
  }
  title = 'ui';
}
