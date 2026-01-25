import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; 
import { lastValueFrom } from 'rxjs'; 
import { FormsModule } from '@angular/forms'; 
import { LongPressDirective } from '../../../shared/long-press/long-press';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  status?: string;
  message?: string;
  data: T; 
  timestamp?: string;
}

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
  imports: [CommonModule, FormsModule, LongPressDirective],
  templateUrl: './blocks.html',
  styleUrl: './blocks.css'
})
export class Blocks implements OnInit, AfterViewChecked { 

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false; 
  private isSaving: boolean = false;

  private blocksApiUrl = `${environment.apiUrl}/api/v1/block`; 

  public blocks: Block[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null; 
  
  isCreateBlokModalOpen: boolean = false;
  novyBlok: NewBlock = { name: '', maxPoints: 0, requiredPoints: 0 };

  editingBlokId: number | null = null;
  editingField: keyof Block | null = null;
  editingValue: string | number | null = '';

  isDeleteConfirmModalOpen: boolean = false;
  blokToDelete: Block | null = null;
  deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';
  
  ngOnInit(): void {
    this.fetchBloky();
  }

  async fetchBloky(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    const apiUrl = `${this.blocksApiUrl}?sort=id,asc`;
    
    try {
      const data = await lastValueFrom(this.http.get<Block[]>(apiUrl));
      this.blocks = data;
      this.blocks.sort((a, b) => a.id - b.id);
    } catch (err: any) {
      console.error('Nepodarilo sa načítať bloky:', err);
      this.error = 'Nepodarilo sa načítať bloky z API.';
      this.blocks = [];
    } finally {
      this.isLoading = false;
    }
  }

  onCreateBlokClick(): void {
    this.novyBlok = { name: '', maxPoints: 0, requiredPoints: 0 };
    this.error = null;
    this.message = null;
    this.isCreateBlokModalOpen = true;
  }
  onCloseBlokModal(): void {
    this.isCreateBlokModalOpen = false;
  }
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCloseBlokModal();
      this.onCloseDeleteConfirmModal(); 
    }
  }

  async onSubmitNovyBlok(): Promise<void> {
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
      const response = await lastValueFrom(this.http.post<ApiResponse<Block[]>>(this.blocksApiUrl, dataToSend));
      const createdBloky = response.data; 
      if (createdBloky && createdBloky.length > 0) {
        this.message = `Blok '${createdBloky[0].name}' bol úspešne vytvorený.`;
        this.onCloseBlokModal();
        await this.fetchBloky();
      } else {
        this.error = 'Vytvorenie bloku zlyhalo.';
      }
    } catch (err: any) { 
      this.error = "Chyba: Nepodarilo sa vytvoriť blok.";
    } finally {
      this.isLoading = false;
    }
  }
  onDeleteBlokClick(blok: Block): void {
      this.blokToDelete = blok;
      this.deleteConfirmationInput = '';
      this.error = null;
      this.message = null;
      this.isDeleteConfirmModalOpen = true;
  }

  onCloseDeleteConfirmModal(): void {
      this.isDeleteConfirmModalOpen = false;
      this.blokToDelete = null;
      this.deleteConfirmationInput = '';
      this.error = null; 
  }

  async onConfirmDelete(): Promise<void> {
      if (!this.blokToDelete) return;
      if (this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
      
      const blokId = this.blokToDelete.id;
      this.isLoading = true;
      this.error = null;
      this.onCloseDeleteConfirmModal();

      try {
        await lastValueFrom(this.http.delete<ApiResponse<any>>(`${this.blocksApiUrl}/${blokId}`));
        this.blocks = this.blocks.filter(b => b.id !== blokId);
        this.message = `Blok bol úspešne vymazaný.`;
      } catch (err: any) {
        this.error = `Chyba: Nepodarilo sa vymazať blok.`;
      } finally {
        this.isLoading = false;
      }
  }
  isEditing(id: number, field: string): boolean {
    return this.editingBlokId === id && this.editingField === field;
  }

  onCellEdit(blok: Block, field: keyof Block): void {
    if (this.isSaving) return;
    
    this.error = null;
    this.message = null;
    this.editingBlokId = blok.id;
    this.editingField = field;
    this.editingValue = blok[field] as string | number;
    
    this.shouldFocus = true; 
    this.cdr.detectChanges(); 
  }

  async onCellSave(blok: Block): Promise<void> {
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

    let newValue: any = String(rawValue).trim();
    if (fieldToSave === 'maxPoints' || fieldToSave === 'requiredPoints') {
        const num = parseFloat(newValue);
        newValue = !isNaN(num) ? num : newValue;
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
    this.isLoading = true;
    
    let pendingErrorMessage: string | null = null;

    try {
      const response = await lastValueFrom(this.http.put<ApiResponse<Block>>(`${this.blocksApiUrl}/${idToSave}`, updatePayload));
      const updatedBlok = response.data;

      let success = true;
      if (fieldToSave === 'maxPoints' || fieldToSave === 'requiredPoints') {
          if (Number(updatedBlok[fieldToSave]) !== Number(updatePayload[fieldToSave])) success = false;
      } else if (fieldToSave === 'name') {
          if (updatedBlok.name !== updatePayload.name) success = false;
      }

      if (success) {
          this.blocks = this.blocks.map(b => b.id === updatedBlok.id ? updatedBlok : b);
          this.message = `Blok aktualizovaný.`;
          this.error = null;
      } else {
          pendingErrorMessage = "Chyba: Aktualizácia zlyhala (hodnota nebola povolená).";
      }

    } catch (err: any) {
      pendingErrorMessage = `Chyba: Aktualizácia bloku zlyhala.`;
    } finally {
      this.editingBlokId = null;
      this.editingField = null;

      await this.fetchBloky();

      if (pendingErrorMessage) {
          this.error = pendingErrorMessage;
          this.message = null;
      }

      this.isLoading = false;
      this.isSaving = false;
    }
  }

  ngAfterViewChecked(): void {
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