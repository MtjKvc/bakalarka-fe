import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClipboardUtilityService {

  copyText(element: HTMLElement, onSuccessCallback: () => void): void {
    const textToCopy = element.textContent || element.innerText; 
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      onSuccessCallback(); 
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}