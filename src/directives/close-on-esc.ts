import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appCloseOnEsc]',
  standalone: true 
})
export class CloseOnEscDirective {

  @Output() appCloseOnEsc = new EventEmitter<void>();

  constructor() { }
  @HostListener('document:keydown.escape')
onKeydownHandler() {
    this.appCloseOnEsc.emit();
  }
}