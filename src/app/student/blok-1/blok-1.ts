import { CommonModule, } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CopyButton } from '../../shared/copy-button/copy-button';


@Component({
  selector: 'app-blok-1',
  standalone: true,
  imports: [CommonModule,RouterModule,CopyButton],
  templateUrl: './blok-1.html',
  styleUrl: './blok-1.css'
})
export class Blok1 {

}
