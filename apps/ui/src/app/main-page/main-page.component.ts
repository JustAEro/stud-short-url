import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { derivedAsync } from 'ngxtension/derived-async';
import { UserService } from '../user-service/user.service';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
})
export class MainPageComponent {
  constructor(
    private readonly userService: UserService,
  ) {}

  userId = input.required<string>();

  user = derivedAsync(() => this.userService.getUser(this.userId()))
}
