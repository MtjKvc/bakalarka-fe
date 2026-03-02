
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { RouterModule, } from '@angular/router';

@Component({
  selector: 'app-student',
  imports: [RouterModule, CommonModule],
  templateUrl: './student.html',
  styleUrl: './student.css'
})
export class Student implements AfterViewInit, OnDestroy{
  @ViewChild('canvasDigitalRain') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private width!: number;
  private height!: number;
  private columns!: number;
  private drops!: number[];
  private fontSize = 16;
  private characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';

  private fps = 15;
  private fpsInterval = 1000 / this.fps;
  private lastDrawTime = 0;

  public menuOpen = false;

  private animationId: number = 0;

  public toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  public ngAfterViewInit() {
    this.initCanvas();
    this.animate(0);
  }

  public ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  @HostListener('window:resize')
  public onResize() {
    this.initCanvas();
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;

    this.columns = Math.floor(this.width / this.fontSize);
    this.drops = Array(this.columns).fill(1);
  }

  private animate(currentTime: number) {
    this.animationId = requestAnimationFrame((time) => this.animate(time));
    const elapsed = currentTime - this.lastDrawTime;
    if (elapsed < this.fpsInterval) return;
    this.lastDrawTime = currentTime - (elapsed % this.fpsInterval);
    if (!this.ctx) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    this.ctx.font = `${this.fontSize}px monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const text = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;

      this.ctx.fillText(text, x, y);

      if (y > this.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }

      this.drops[i]++;
    }
  }
}
