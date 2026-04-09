import { Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ImageModalService } from '../../../core/utils/image-modal.service';

@Component({
  selector: 'app-first-exercise',
  imports: [TranslocoModule, ],
  templateUrl: './first-exercise.html',
})
export class FirstExercise {
public modalService = inject(ImageModalService);
}
