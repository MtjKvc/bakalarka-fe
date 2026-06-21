import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageModalService {
  selectedImg = signal<string | null>(null);

  open(src: string) {
    this.selectedImg.set(src);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.selectedImg.set(null);
    document.body.style.overflow = 'auto';
  }
}