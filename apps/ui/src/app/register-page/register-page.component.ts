import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true,
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });

    this.registerForm
      .get('confirmPassword')
      ?.setValidators(this.matchPassword.bind(this));
  }

  private matchPassword(control: any): { [key: string]: boolean } | null {
    if (this.registerForm.get('password')?.value !== control.value) {
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const { email, password } = this.registerForm.value;
    // console.log('Registering user:', { email, password });
    // Добавьте вызов сервиса для регистрации

    this.authService.register({login: email, password});
  }
}
