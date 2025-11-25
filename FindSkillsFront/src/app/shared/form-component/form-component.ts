import { Component, Input, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './form-component.html',
  styleUrls: ['./form-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
