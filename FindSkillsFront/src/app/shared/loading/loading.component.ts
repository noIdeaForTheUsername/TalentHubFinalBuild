import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  // Accept either a string or an object returned from server (e.g. { message, error, statusCode })
  error = input<any | undefined>();
  // optional loading input: when true shows spinner; if undefined, parent can omit and show/hide component instead
  loading = input<boolean | undefined>();

  // Return the preferred user-facing message for the error
  getDisplayError(): string | undefined {
    const e = this.error();
    if (!e) return undefined;
    if (typeof e === 'string') return e;
    if (typeof e === 'object') {
      if (e.message) return e.message;
      if (e.error) return e.error;
      // sometimes backend returns { error: { message: '...' } }
      if (e.error && typeof e.error === 'object' && e.error.message) return e.error.message;
    }
    try {
      return JSON.stringify(e);
    } catch (ex) {
      return String(e);
    }
  }
}
