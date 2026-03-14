import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ClipboardUtilityService } from '../../../core/utils/clipboard-utility.service';
import { CopyButton } from '../../../shared/components/copy-button/copy-button';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-blok-3',
  imports: [CopyButton,TranslocoModule],
  templateUrl: './blok-3.html',
  styleUrl: './blok-3.css'
})
export class Blok3 {

}