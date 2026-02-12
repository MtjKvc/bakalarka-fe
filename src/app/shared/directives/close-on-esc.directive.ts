import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appCloseOnEsc]',
  standalone: true 
})
export class CloseOnEscDirective {

  @Output() public appCloseOnEsc = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
public onKeydownHandler() {
    this.appCloseOnEsc.emit();
  }
}