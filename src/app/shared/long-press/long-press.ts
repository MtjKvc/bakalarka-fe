import { Directive, EventEmitter, HostListener, Output, Input } from '@angular/core';

const LONG_PRESS_THRESHOLD = 500; 

@Directive({
    selector: '[longPress]',
    standalone: true
})
export class LongPressDirective {
    @Output() longPress = new EventEmitter<MouseEvent | TouchEvent>();
    @Input() preventDefaultOnLongPress: boolean = true;

    private touchTimeout: any;
    private longPressActive: boolean = false;

    @HostListener('mousedown', ['$event'])
    @HostListener('touchstart', ['$event'])
    onPressStart(event: MouseEvent | TouchEvent): void {
        this.longPressActive = false;
        
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
        }

        if (event instanceof MouseEvent && event.button === 2) return; 

        if (event instanceof TouchEvent) {
             event.preventDefault(); 
        }

        this.touchTimeout = setTimeout(() => {
            this.longPressActive = true;
            this.longPress.emit(event);

            if (this.preventDefaultOnLongPress) {
                if (event instanceof MouseEvent) {
                    event.preventDefault();
                } 

            }
        }, LONG_PRESS_THRESHOLD);
    }


    @HostListener('mouseup', ['$event'])
    @HostListener('touchend')
    @HostListener('mouseleave')
    @HostListener('touchcancel')
    onPressEnd(event: MouseEvent | null = null): void {
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
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