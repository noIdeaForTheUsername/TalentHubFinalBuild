import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../shared/header/header.component';
import { FormComponent } from '../../shared/form-component/form-component';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth-service/auth.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, HeaderComponent, RouterLink, LoadingComponent, FormComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit {
  protected form: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected authService = inject(AuthService);

  ngOnInit() {
    // If already logged in, redirect to own profile
    if (this.authService.loggedIn()) {
      const id = this.authService.userId();
      if (id) this.router.navigate(['/profiles', id]);
    }
  }

  constructor() {
    this.form = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  protected submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.value;
    this.authService.login({ login: values.login, password: values.password }).subscribe({
      next: () => {
        // Logowanie powiodło się tylko jeśli loggedIn jest true
        if (this.authService.loggedIn()) {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        // Błąd obsługuje serwis (ustawia error signal)
        this.form.markAllAsTouched();
      }
    });
  }

  protected async loginWithPasskey() {
    try {
      await this.authService.loginWithPasskey();
      if (this.authService.loggedIn()) this.router.navigate(["/"]);
    }
    catch (e) {
      window.alert("Logowanie kluczem dostępu nie powiodło się");
    }
  }
}
