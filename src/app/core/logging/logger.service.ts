import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  public log(message: string, ...args: unknown[]) {
    if (!environment.production) {
      const time = new Date().toLocaleTimeString();
      console.log(this._getStyle('INFO'), 'color: #007acc; font-weight: bold;', message, ...args);
    }
  }

  public error(message: string, ...args: unknown[]) {
    const time = new Date().toLocaleTimeString();
    console.error(this._getStyle('ERROR'), 'color: #ff4d4d; font-weight: bold;', message, ...args);
  }

  public warn(message: string, ...args: unknown[]) {
    if (!environment.production) {
      const time = new Date().toLocaleTimeString();
      console.warn(this._getStyle('WARN'), 'color: #ffaa00; font-weight: bold;', message, ...args);
    }
  }

  private _getStyle(level: string): string {
    const time = new Date().toLocaleTimeString();
    return `%c[${time}] [${level}]:`;
  }
}