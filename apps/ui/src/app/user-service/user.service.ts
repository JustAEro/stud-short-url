import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { UserDto } from '@stud-short-url/common';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private readonly httpClient: HttpClient) {}

  getUsers() {
    const users$ = this.httpClient.get<UserDto[]>('/api/v1/users');

    return users$;
  }

  getUser(id: UserDto['id']) {
    const user$ = this.httpClient.get<UserDto>(`/api/v1/users/${id}`);

    return user$;
  }
}
