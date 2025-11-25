import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../shared/header/header.component';
import { FormComponent } from '../../shared/form-component/form-component';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth-service/auth.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, HeaderComponent, RouterLink, LoadingComponent, FormComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register implements OnInit {
  form!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public authService = inject(AuthService);

  // Error message methods
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';

    switch (fieldName) {
      case 'login':
        if (control.hasError('required')) return 'Login jest wymagany.';
        if (control.hasError('minlength')) return 'Login musi mieć co najmniej 3 znaki.';
        break;
      case 'password':
        if (control.hasError('required')) return 'Hasło jest wymagane.';
        if (control.hasError('minlength')) return 'Hasło musi mieć co najmniej 8 znaków.';
        break;
      case 'confirmPassword':
        if (control.hasError('required')) return 'Proszę potwierdzić hasło.';
        if (control.hasError('passwordMismatch')) return 'Hasła nie są zgodne.';
        break;
      case 'schoolType':
        if (control.hasError('required')) return 'Wybierz typ szkoły.';
        break;
      case 'schoolClass':
        if (control.hasError('required')) return 'Klasa/rok nauki jest wymagany.';
        if (control.hasError('invalid')) return 'Podaj poprawną klasę / rok nauki.';
        if (control.hasError('outOfRange')) return `Klasa/rok nauki musi być między 1 a ${this.getMaxClass()}.`;
        break;
      case 'city':
        if (control.hasError('required')) return 'Miejscowość jest wymagana.';
        break;
    }
    return '';
  }

  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  constructor() {}

  ngOnInit() {
    // If already logged in, redirect to own profile
    if (this.authService.loggedIn()) {
      const id = this.authService.userId();
      if (id) this.router.navigate(['/profiles', id]);
    }


    this.form = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, this.passwordMatchValidator.bind(this)]],
      schoolType: ['', Validators.required],
      schoolClass: ['', [Validators.required, this.schoolClassValidator.bind(this)]],
      city: ['', Validators.required],
      favSubjects: [''],
      about: ['']
    });
    
    // revalidate on update
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity();
    });
    this.form.get('schoolType')?.valueChanges.subscribe(() => {
      this.form.get('schoolClass')?.updateValueAndValidity();
    });
  }

  getMaxClass(): number {
    const schoolType = this.form?.get('schoolType')?.value;
    if (schoolType === 'primary') return 8;
    if (schoolType === 'secondary') return 5;
    if (schoolType === 'university') return 6;
    return 8;
  }

  schoolClassValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const val = Number(control.value);
    if (Number.isNaN(val) || val < 1) return { invalid: true };
    const max = this.getMaxClass();
    if (val > max) return { outOfRange: { max } };
    return null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = this.form?.get('password')?.value;
    const confirmPassword = control.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  submit() {
    if (this.form.valid) {
      const values = this.form.value;
      // Prepare DTO for registration
      const dto = {
        login: values.login,
        password: values.password,
        schoolType: values.schoolType,
        schoolClass: Number(values.schoolClass),
        city: values.city,
        favoriteSubjects: values.favSubjects || '',
        bio: values.about || ''
      };

      this.authService.register(dto).subscribe({
        next: () => {
          this.router.navigate(['/']);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
