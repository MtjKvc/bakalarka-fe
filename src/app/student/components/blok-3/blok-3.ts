import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClipboardUtilityService } from '../../../core/utils/clipboard-utility.service';
import { CopyButton } from '../../../shared/components/copy-button/copy-button';
import { TranslocoModule } from '@jsverse/transloco';
import { ImageModalService } from '../../../core/utils/image-modal.service';

@Component({
  selector: 'app-blok-3',
  imports: [CopyButton,TranslocoModule],
  templateUrl: './blok-3.html',
  styleUrl: './blok-3.css'
})
export class Blok3 {
public modalService = inject(ImageModalService);
}