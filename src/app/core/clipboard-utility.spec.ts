import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardUtilityService {

  // Kľúčové: Nemá žiadny stav ani Observable!

  // Prijíma element na kopírovanie a callback funkciu, ktorá sa spustí po úspechu
  copyText(element: HTMLElement, onSuccessCallback: () => void): void {
    const text = element.innerText.trim();
    
    // Zdieľaná logika: Iba samotné kopírovanie
    navigator.clipboard.writeText(text).then(() => {
      onSuccessCallback(); // ZAVOLÁ FUNKCIU, ktorá nastaví lokálny stav v komponente
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}