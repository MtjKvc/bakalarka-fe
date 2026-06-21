import { Component, signal, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ImageModalComponent } from './shared/components/image-modal/image-modal';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, ImageModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('ap-portal');

  constructor(
    private metaService: Meta,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Architektúry počítačov');

    this.metaService.addTags([
      { name: 'supervisor', content: 'Ing. Juraj Slačka, PhD.' },
      { name: 'instructor', content: 'Ing. Juraj Slačka, PhD.' },
      { 
        name: 'description', 
        content: 'Základné koncepcie počítačov, Moorov zákon, reprezentácia údajov, procesory, pamäte a operačné systémy. Garant: Ing. Juraj Slačka, PhD.' 
      },
      { 
        name: 'keywords', 
        content: 'architektúra počítačov, Moorov zákon, procesory, RAM, SSD, CISC, RISC, DMA, cloud computing, operačné systémy, urk, fei, stu, web predmetu architektúra počítačov' 
      },
      { name: 'robots', content: 'index, follow' },
      
      { property: 'og:title', content: 'Architektúry počítačov - Informácie o predmete' },
      { property: 'og:description', content: 'Stručná osnova predmetu: Od základných logických operácií až po cloud computing a systémy reálneho času.' }
    ]);
  }
}