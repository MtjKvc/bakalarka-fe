import { Component, Input } from '@angular/core';
import { ClipboardUtilityService } from '../../core/clipboard-utility';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-copy-button',
  imports: [CommonModule],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.css',
  host: {
    // Aplikuje triedy na <app-copy-button> element
    'class': 'inline-block' 
  },
})
export class CopyButton {
// KROK 1: Prijímame referenciu na element, ktorý sa má kopírovať
  // Všimni si, že je to typu ElementRef<HTMLElement> alebo jednoducho HTMLElement
  @Input({ required: true }) sourceElement!: HTMLElement; 
  
  copied: boolean = false; 

  constructor(private clipboardService: ClipboardUtilityService) { }

  handleCopyClick() {
    if (this.copied) return; 
    
    // Kľúčové: Kopírujeme priamo z odovzdaného elementu (sourceElement)
    // Tvoja služba musí kopírovať text z neho.

    const handleSuccess = () => {
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    };

    // Voláme zdieľanú logiku - element je sourceElement
    // Predpokladáme, že tvoja služba vie pracovať s elementom, ktorý má viac riadkov.
    this.clipboardService.copyText(this.sourceElement, handleSuccess);
  }

}
