import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CopyButton } from '../../../shared/components/copy-button/copy-button';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-blok2-asm1',
  imports: [CommonModule,CopyButton,TranslocoModule],
  templateUrl: './blok2-asm1.html',
})
export class Blok2Asm1 {

}
