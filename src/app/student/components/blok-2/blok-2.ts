import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ImageModalService } from '../../../core/utils/image-modal.service';

@Component({
  selector: 'app-blok-2',
  imports: [RouterLink,TranslocoModule],
  templateUrl: './blok-2.html',
  styleUrl: './blok-2.css'
})
export class Blok2 {
public modalService = inject(ImageModalService);
}
