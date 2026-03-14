import { Component } from '@angular/core';
import { CopyButton } from '../../../shared/components/copy-button/copy-button';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-blok2-asm3',
  imports: [CopyButton,TranslocoModule],
  templateUrl: './blok2-asm3.html',
  styleUrl: './blok2-asm3.css'
})
export class Blok2Asm3 {

 protected scrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }
}
