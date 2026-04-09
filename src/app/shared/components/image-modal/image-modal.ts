import { Component, HostListener } from '@angular/core';
import { ImageModalService } from '../../../core/utils/image-modal.service';


@Component({
  selector: 'app-image-modal',
  imports: [],
  templateUrl: './image-modal.html'
})
export class ImageModalComponent {
  isZoomed = false;
  zoomOrigin = '50% 50%'; // Predvolený stred

  constructor(public modalService: ImageModalService) {}

  toggleZoom(event: MouseEvent) {
    event.stopPropagation();
    
    if (!this.isZoomed) {
      const img = event.currentTarget as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      
      // Vypočítame percentuálnu pozíciu kliknutia v rámci obrázka
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      
      this.zoomOrigin = `${x}% ${y}%`;
      this.isZoomed = true;
    } else {
      this.isZoomed = false;
    }
  }

  close() {
    this.isZoomed = false;
    this.modalService.close();
  }

  @HostListener('document:keydown.escape')
  handleEscape() { this.close(); }
}