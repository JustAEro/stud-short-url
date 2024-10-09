import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import {common} from '@stud-short-url/common'
import { MainPageComponent } from './main-page/main-page.component';

@Component({
  standalone: true,
  imports: [RouterModule, HeaderComponent, MainPageComponent],
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
