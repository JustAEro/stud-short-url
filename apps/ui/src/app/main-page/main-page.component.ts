import { Component } from '@angular/core';
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
  constructor(private readonly userService: UserService) {}

  users = derivedAsync(() => this.userService.getUsers());

  userId = "92269160-7a94-43ed-b531-0a4dba79e928";

  user = derivedAsync(() => this.userService.getUser(this.userId));
}
