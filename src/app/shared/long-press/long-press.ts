import { Directive, EventEmitter, HostListener, Output, Input } from '@angular/core';

const LONG_PRESS_THRESHOLD = 500;

@Directive({
  selector: '[longPress]',
  standalone: true
})
export class LongPressDirective {
  @Output() longPress = new EventEmitter<MouseEvent | TouchEvent>();
  @Input() preventDefaultOnLongPress: boolean = true;

  private touchTimeout: ReturnType<typeof setTimeout> | null = null;
  private longPressActive: boolean = false;
  private startX: number = 0;
  private startY: number = 0;

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPressStart(event: MouseEvent | TouchEvent): void {
    this.longPressActive = false;

    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
    }

    if (event instanceof MouseEvent && event.button === 2) return;

    if (event instanceof TouchEvent) {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    }

    this.touchTimeout = setTimeout(() => {
      this.longPressActive = true;
      this.longPress.emit(event);

      if (this.preventDefaultOnLongPress && event.cancelable) {
        event.preventDefault();
      }
    }, LONG_PRESS_THRESHOLD);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    const xDiff = Math.abs(event.touches[0].clientX - this.startX);
    const yDiff = Math.abs(event.touches[0].clientY - this.startY);

    if (xDiff > 10 || yDiff > 10) {
      if (this.touchTimeout) {
        clearTimeout(this.touchTimeout);
        this.touchTimeout = null;
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('touchend')
  @HostListener('mouseleave')
  @HostListener('touchcancel')
  onPressEnd(event: MouseEvent | null = null): void {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = null;
    }

    if (this.longPressActive && event instanceof MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.longPressActive = false;
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    if (this.longPressActive) {
      event.preventDefault();
    }
  }
}