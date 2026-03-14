import { CommonModule, } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CopyButton } from '../../../shared/components/copy-button/copy-button';
import { TranslocoModule } from '@jsverse/transloco'; 


@Component({
  selector: 'app-blok-1',
  standalone: true,
  imports: [CommonModule,RouterModule,CopyButton,TranslocoModule],
  templateUrl: './blok-1.html',
})
export class Blok1 {

}
