import { Directive, EventEmitter, HostListener, Output, Input } from '@angular/core';

const LONG_PRESS_THRESHOLD = 500; 

@Directive({
    selector: '[longPress]',
    standalone: true
})
export class LongPressDirective {
    @Output() longPress = new EventEmitter<MouseEvent | TouchEvent>();
    @Input() preventDefaultOnLongPress: boolean = true; // Nový Input na kontrolu

    private touchTimeout: any;
    private longPressActive: boolean = false;

    // --- Myš a Dotykové udalosti pre spustenie ---
    @HostListener('mousedown', ['$event'])
    @HostListener('touchstart', ['$event'])
    onPressStart(event: MouseEvent | TouchEvent): void {
        this.longPressActive = false;
        
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
        }

        // Zabráni spusteniu LongPress pri pravom kliknutí myšou
        if (event instanceof MouseEvent && event.button === 2) return; 

        // !!! NOVÁ LOGIKA PRE PREVENCII KONTEXTOVÉHO MENU NA DOTYKOVÝCH ZARIADENIACH !!!
        if (event instanceof TouchEvent) {
             // Zabraňuje prekliku na 'click' a potenciálne zobrazeniu menu
             event.preventDefault(); 
        }

        this.touchTimeout = setTimeout(() => {
            this.longPressActive = true;
            this.longPress.emit(event);
            
            // Po úspešnom Long Press zabránime ďalšej akcii
            if (this.preventDefaultOnLongPress) {
                if (event instanceof MouseEvent) {
                    event.preventDefault();
                } 
                // Pre TouchEvent sme preventDefault volali už pri štarte
            }
        }, LONG_PRESS_THRESHOLD);
    }

    // --- Myš a Dotykové udalosti pre ukončenie ---
    @HostListener('mouseup', ['$event']) // Pridaný $event
    @HostListener('touchend')
    @HostListener('mouseleave')
    @HostListener('touchcancel')
    onPressEnd(event: MouseEvent | null = null): void { // Pridaný $event s default null
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
        }
        
        // Ak Long Press bol aktívny, potlačíme prípadný 'click' event
        if (this.longPressActive && event instanceof MouseEvent) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.longPressActive = false;
    }
    
    // --- Potlačenie kontextového menu pre pravé tlačidlo myši ---
    @HostListener('contextmenu', ['$event'])
    onContextMenu(event: MouseEvent) {
        if (this.longPressActive) {
            event.preventDefault();
        }
    }
}