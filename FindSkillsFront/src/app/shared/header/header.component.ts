import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from '../../accounts/auth-service/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loggedIn = this.authService.loggedIn;
  userId = this.authService.userId;

  navigateToAccount() {
    if (this.authService.loggedIn() && this.authService.userId()) {
      this.router.navigate(['/profiles', this.authService.userId()]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}

