import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  public config: any;

  load() {
    // THIS IS SET IN INDEX.HTML
    this.config = (window as any).__APP_CONFIG__;
  }
}
