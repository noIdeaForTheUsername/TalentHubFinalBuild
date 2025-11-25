import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '../shared/header/header.component';
import { CardButton } from '../shared/card-button/card-button';
import { AuthService } from '../accounts/auth-service/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [MatCardModule, HeaderComponent, CardButton],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  authService = inject(AuthService);
}
