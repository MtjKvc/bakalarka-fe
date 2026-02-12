import { Component, inject, Input } from '@angular/core';
import { ClipboardUtilityService } from '../../../core/utils/clipboard-utility.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-copy-button',
  imports: [CommonModule],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.css',
  host: {
    'class': 'inline-block' 
  },
})
export class CopyButton {
  @Input({ required: true }) public sourceElement!: HTMLElement; 
  
  public copied: boolean = false; 

  private clipboardService = inject(ClipboardUtilityService);

 public  handleCopyClick() {
    if (this.copied) return; 

    const handleSuccess = () => {
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    };

    this.clipboardService.copyText(this.sourceElement, handleSuccess);
  }

}
