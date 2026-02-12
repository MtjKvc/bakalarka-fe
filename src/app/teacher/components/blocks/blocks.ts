import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LongPressDirective } from '../../../shared/directives/long-press.directive';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';
import { ApiResponse } from '../../../shared/models/interfaces';

interface Block {
  id: number;
  name: string;
  lessons?: number;
  maxPoints: number;
  requiredPoints: number;
}

type NewBlock = Omit<Block, 'id'>;

@Component({
  selector: 'app-blocks',
  standalone: true,
  imports: [CommonModule, FormsModule, LongPressDirective, CloseOnEscDirective],
  templateUrl: './blocks.html',
  styleUrl: './blocks.css'
})
export class Blocks implements OnInit, AfterViewChecked {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);

  @ViewChildren('editInput') private editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false;
  private isSaving: boolean = false;

  private blocksApiUrl = `${environment.apiUrl}/api/v1/block`;

  public blocks: Block[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null;

  public isCreateBlokModalOpen: boolean = false;
  public novyBlok: NewBlock = { name: '', maxPoints: 0, requiredPoints: 0 };

  public editingBlokId: number | null = null;
  public editingField: keyof Block | null = null;
  public editingValue: string | number | null = '';

  public isDeleteConfirmModalOpen: boolean = false;
  public blokToDelete: Block | null = null;
  public deleteConfirmationInput: string = '';
  public readonly deleteConfirmText: string = 'CONFIRM';

  public ngOnInit(): void {
    this.logger.log('Blocks initialized');
    this.fetchBloky();
  }

  private async fetchBloky(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    const apiUrl = `${this.blocksApiUrl}?sort=id,asc`;

    try {
      const data = await lastValueFrom(this.http.get<Block[]>(apiUrl));
      this.blocks = data || [];
      this.blocks.sort((a, b) => a.id - b.id);
      this.logger.log(`Fetched ${this.blocks.length} blocks`);
    } catch (err: unknown) {
      this.logger.error('Nepodarilo sa načítať bloky:', err);
      this.error = 'Nepodarilo sa načítať bloky z API.';
      this.blocks = [];
    } finally {
      this.isLoading = false;
    }
  }

  public onCreateBlokClick(): void {
    this.novyBlok = { name: '', maxPoints: 0, requiredPoints: 0 };
    this.error = null;
    this.message = null;
    this.isCreateBlokModalOpen = true;
  }

  public onCloseBlokModal(): void {
    this.isCreateBlokModalOpen = false;
  }

  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCloseBlokModal();
      this.onCloseDeleteConfirmModal();
    }
  }

  public async onSubmitNovyBlok(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.message = null;

    const blokObj = {
      name: this.novyBlok.name.trim(),
      maxPoints: Number(this.novyBlok.maxPoints) || 0,
      requiredPoints: Number(this.novyBlok.requiredPoints) || 0
    };
    const dataToSend = { blocks: [blokObj] };

    try {
      const response = await lastValueFrom(this.http.post<Block[] | Block>(this.blocksApiUrl, dataToSend));
      
      let createdBlock: Block | undefined;

      if (Array.isArray(response)) {
        createdBlock = response.length > 0 ? response[0] : undefined;
      } else {
        createdBlock = response as Block;
      }

      if (createdBlock) {
        this.logger.log('New block created', createdBlock);
        this.message = `Blok bol úspešne vytvorený.`;
        this.onCloseBlokModal();
        await this.fetchBloky();
      } else {
        this.error = 'Vytvorenie bloku zlyhalo.';
      }
    } catch (err: unknown) {
      this.logger.error("Chyba: Nepodarilo sa vytvoriť blok.", err);
      this.error = "Chyba: Nepodarilo sa vytvoriť blok.";
    } finally {
      this.isLoading = false;
    }
  }

  public onDeleteBlokClick(blok: Block): void {
    this.blokToDelete = blok;
    this.deleteConfirmationInput = '';
    this.error = null;
    this.message = null;
    this.isDeleteConfirmModalOpen = true;
  }

  public onCloseDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.blokToDelete = null;
    this.deleteConfirmationInput = '';
    this.error = null;
  }

  public async onConfirmDelete(): Promise<void> {
    if (!this.blokToDelete) return;
    if (this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;

    const blokId = this.blokToDelete.id;
    this.isLoading = true;
    this.error = null;
    this.onCloseDeleteConfirmModal();

    try {
      await lastValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.blocksApiUrl}/${blokId}`));
      this.logger.warn(`Block deleted: ID ${blokId}`);
      this.blocks = this.blocks.filter(b => b.id !== blokId);
      this.message = `Blok bol úspešne vymazaný.`;
    } catch (err: unknown) {
      this.logger.error(`Delete block ${blokId} failed`, err);
      this.error = `Chyba: Nepodarilo sa vymazať blok.`;
    } finally {
      this.isLoading = false;
    }
  }

  public isEditing(id: number, field: string): boolean {
    return this.editingBlokId === id && this.editingField === field;
  }

  public onCellEdit(blok: Block, field: keyof Block): void {
    if (this.isSaving) return;

    this.error = null;
    this.message = null;
    this.editingBlokId = blok.id;
    this.editingField = field;
    this.editingValue = blok[field] as string | number;

    this.shouldFocus = true;
    this.cdr.detectChanges();
  }

  public async onCellSave(blok: Block): Promise<void> {
    this.shouldFocus = false;
    if (this.isSaving) return;
    if (this.editingBlokId === null || this.editingField === null) return;

    const idToSave = this.editingBlokId;
    const fieldToSave = this.editingField as keyof Block;
    const rawValue = this.editingValue;

    if (String(blok[fieldToSave]) === String(rawValue).trim()) {
      this.editingBlokId = null;
      this.editingField = null;
      return;
    }

    let newValue: string | number = String(rawValue).trim();
    if (fieldToSave === 'maxPoints' || fieldToSave === 'requiredPoints') {
      const num = parseFloat(newValue);
      newValue = !isNaN(num) ? num : 0;
    }

    const blokToUpdate = this.blocks.find(b => b.id === idToSave);
    if (!blokToUpdate) return;

    const updatePayload = {
      name: blokToUpdate.name,
      maxPoints: Number(blokToUpdate.maxPoints) || 0,
      requiredPoints: Number(blokToUpdate.requiredPoints) || 0,
      [fieldToSave]: newValue
    };

    if (fieldToSave !== 'name') {
      updatePayload.name = String(blokToUpdate.name).trim();
    }

    this.isSaving = true;

    try {
      await lastValueFrom(this.http.put<Block>(`${this.blocksApiUrl}/${idToSave}`, updatePayload));
      this.message = `Blok aktualizovaný.`;
      this.error = null;
    } catch (err: unknown) {
      this.logger.error('Cell save failed', err);
      this.error = `Chyba: Aktualizácia bloku zlyhala.`;
      this.message = null;
    } finally {
      this.editingBlokId = null;
      this.editingField = null;
      await this.fetchBloky();
      this.isLoading = false;
      this.isSaving = false;
    }
  }

  public ngAfterViewChecked(): void {
    if (!this.shouldFocus || !this.editInputsRef || this.editInputsRef.length === 0) return;

    const inputElement = this.editInputsRef.first.nativeElement;

    if (inputElement) {
      this.shouldFocus = false;
      let attempts = 0;
      const intervalId = setInterval(() => {
        attempts++;
        inputElement.focus();
        if (inputElement instanceof HTMLInputElement) inputElement.select();
        if (document.activeElement === inputElement || attempts >= 20) clearInterval(intervalId);
      }, 10);
    }
  }
}