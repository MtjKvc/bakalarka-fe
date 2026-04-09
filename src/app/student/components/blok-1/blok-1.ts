import { CommonModule, } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CopyButton } from '../../../shared/components/copy-button/copy-button';
import { TranslocoModule } from '@jsverse/transloco'; 
import { ImageModalService } from '../../../core/utils/image-modal.service';



@Component({
  selector: 'app-blok-1',
  standalone: true,
  imports: [CommonModule,RouterModule,CopyButton,TranslocoModule],
  templateUrl: './blok-1.html',
})
export class Blok1 {
public modalService = inject(ImageModalService);
}
