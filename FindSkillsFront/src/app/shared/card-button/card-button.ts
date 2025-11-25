import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card-button',
  standalone: true,
  imports: [RouterLink, MatCardModule],
  templateUrl: './card-button.html',
  styleUrls: ['./card-button.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardButton {
  routerLink = input<string | undefined>();
  title = input.required<string>();
  description = input.required<string>();
}
