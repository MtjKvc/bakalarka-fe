import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  log(message: string, ...args: any[]) {
    if (!environment.production) {
      const time = new Date().toLocaleTimeString();
      console.log(`%c[${time}] [INFO]:`, 'color: #007acc; font-weight: bold;', message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    const time = new Date().toLocaleTimeString();
    console.error(`%c[${time}] [ERROR]:`, 'color: #ff4d4d; font-weight: bold;', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    if (!environment.production) {
      const time = new Date().toLocaleTimeString();
      console.warn(`%c[${time}] [WARN]:`, 'color: #ffaa00; font-weight: bold;', message, ...args);
    }
  }
}