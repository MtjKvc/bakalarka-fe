import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; 
import { lastValueFrom } from 'rxjs'; 
import { FormsModule } from '@angular/forms'; 
import { LongPressDirective } from '../../../shared/long-press/long-press';

// Rozhranie pre obálku API odpovede (podľa vašej implementácie)
interface ApiResponse<T> {
  status?: string;
  message?: string;
  data: T; 
  timestamp?: string;
}

// Rozhranie pre dátový model bloku
interface Block {
    id: number; 
    name: string;
    lessons?: number; 
    maxPoints: number;
    requiredPoints: number;
}

// Typ pre nový blok (bez ID)
type NewBlock = Omit<Block, 'id'>;


@Component({
  selector: 'app-blocks',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule,
    LongPressDirective // <-- PRIDANÁ DIREKTÍVA
  ],
  templateUrl: './blocks.html',
  styleUrl: './blocks.css'
})
export class Blocks implements OnInit, AfterViewChecked { 

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false; 

  private blocksApiUrl = 'http://localhost:8080/api/v1/block'; 

  // --- STAV PRE ZOBRAZENIE DAT ---
  public blocks: Block[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null; 
  // ---------------------------------
  
  // --- STAV PRE MODÁLNE OKNO (CREATE) ---
  isCreateBlokModalOpen: boolean = false;
  novyBlok: NewBlock = { name: '', maxPoints: 0, requiredPoints: 0 };
  // --------------------------------------

  // --- STAV PRE INLINE EDITÁCIU ---
  editingBlokId: number | null = null;
  editingField: keyof Block | null = null;
  editingValue: string | number = '';
  // ---------------------------------

  // --- STAV PRE POTVRDZOVACÍ MODÁL (DELETE) ---
  isDeleteConfirmModalOpen: boolean = false;
  blokToDelete: Block | null = null;
  deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';
  // --------------------------------------------
  
  ngOnInit(): void {
    this.fetchBloky();
  }
  
  // ZOSILNENÁ LOGIKA ZAOSTRYENIA (FOCUS) - POUŽÍVAJÚCA POLLING
  ngAfterViewChecked(): void {
      if (!this.shouldFocus || !this.editInputsRef || this.editInputsRef.length === 0) {
          return;
      }
      
      const inputElement = this.editInputsRef.first.nativeElement;
      
      if (inputElement) {
          this.shouldFocus = false; 

          let attempts = 0;
          const maxAttempts = 50; 
          const intervalTime = 10; 

          const intervalId = setInterval(() => {
              attempts++;

              inputElement.focus();
              inputElement.select();
              
              const isFocused = document.activeElement === inputElement;
              
              if (isFocused || attempts >= maxAttempts) {
                  clearInterval(intervalId); 
                  
                  if (isFocused) {
                      console.log('FOCUS/SELECT SUCCESS po opakovaných pokusoch.');
                  } else {
                      console.warn('FOCUS/SELECT FAIL po vyčerpaní pokusov.');
                  }
                  
                  this.cdr.detectChanges(); 
              }
          }, intervalTime);
      }
  }

  // Načítanie existujúcich blokov
  async fetchBloky(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.message = null;
    const apiUrl = `${this.blocksApiUrl}?sort=id,asc`;
    
    try {
      const data = await lastValueFrom(this.http.get<Block[]>(apiUrl));
      this.blocks = data;
      console.log('Načítané dáta pre bloky:', this.blocks);
    } catch (err: any) {
      console.error('Nepodarilo sa načítať bloky:', err);
      this.error = 'Nepodarilo sa načítať bloky z API. Skontrolujte, či je server spustený.';
      this.blocks = [];
    } finally {
      this.isLoading = false;
    }
  }

  // --- Funkcie pre modálne okno (Create) ---
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
      this.onCloseDeleteConfirmModal(); // Aj pre delete modal
    }
  }

  // Odoslanie POST požiadavky na vytvorenie bloku
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
    const apiUrl = this.blocksApiUrl;

    try {
      const response = await lastValueFrom(this.http.post<ApiResponse<Block[]>>(apiUrl, dataToSend));
      
      const createdBloky = response.data; 
      if (createdBloky && createdBloky.length > 0) {
        this.blocks = [...this.blocks, createdBloky[0]];
        this.message = `Blok '${createdBloky[0].name}' bol úspešne vytvorený.`;
        this.onCloseBlokModal();
      } else {
        console.error('Server vrátil úspech, ale bez dát:', response);
        this.error = 'Vytvorenie bloku bolo úspešné, ale server nevrátil dáta na zobrazenie.';
      }
    } catch (err: any) { 
      console.error('Nastala chyba pri vytváraní bloku:', err); 
      if (err.status === 400) {
          this.error = 'Chyba 400: Problém s formátom požiadavky (Bad Request).';
      } else if (err.status === 422) {
        this.error = 'Chyba 422: Dáta sú neplatné (napr. prázdny názov).';
      } else if (err.status === 403) {
          this.error = 'Chyba 403: Nemáte oprávnenie (Forbidden).';
      } else {
        this.error = `Nepodarilo sa vytvoriť blok (Chyba: ${err.status}).`;
      }
    } finally {
      this.isLoading = false;
    }
  }
  // -----------------------------------------------------------------------


  // --- Funkcie pre DELETE s potvrdením ---
  
  // VÝCHODISKOVÝ BOD: Otvorí nový modál a pripraví dáta
  onDeleteBlokClick(blok: Block): void {
      this.blokToDelete = blok;
      this.deleteConfirmationInput = '';
      this.error = null;
      this.message = null;
      this.isDeleteConfirmModalOpen = true;
  }

  // Zruší operáciu mazania
  onCloseDeleteConfirmModal(): void {
      this.isDeleteConfirmModalOpen = false;
      this.blokToDelete = null;
      this.deleteConfirmationInput = '';
      this.error = null; // Vyčistíme chybu po zavretí modálu
  }

  // Hlavná logika mazania, ktorá sa volá z modálu
  async onConfirmDelete(): Promise<void> {
      if (!this.blokToDelete) return;

      // KONTROLA TEXTU: Iba ak sa text zhoduje
      if (this.deleteConfirmationInput.trim() !== this.deleteConfirmText) {
          // Nastavíme chybu, ale NIKDY nezavrieme modál, kým sa nepodarí alebo kým ho user nezruší
          this.error = `Pre vymazanie musíte napísať presne slovo '${this.deleteConfirmText}'.`;
          return;
      }
      
      const blokId = this.blokToDelete.id;
      const blokName = this.blokToDelete.name;
      
      this.isLoading = true;
      this.error = null;
      this.message = null;

      // Vypneme modál pre lepší UX PRED odoslaním
      this.onCloseDeleteConfirmModal();

      try {
        await lastValueFrom(this.http.delete<ApiResponse<any>>(`${this.blocksApiUrl}/${blokId}`));
        
        console.log(`Blok ID: ${blokId} úspešne vymazaný.`);
        this.blocks = this.blocks.filter(b => b.id !== blokId);
        this.message = `Blok '${blokName}' bol úspešne vymazaný.`;
      } catch (err: any) {
        console.error('Nastala chyba pri mazaní bloku:', err);
        this.error = `Nepodarilo sa vymazať blok (Chyba: ${err.status}).`;
      } finally {
        this.isLoading = false;
      }
  }
  // ---------------------------------------------------


  // --- Funkcie pre Inline Editáciu ---
  isEditing(id: number, field: string): boolean {
    return this.editingBlokId === id && this.editingField === field;
  }

  // Pôvodne onCellDblClick, teraz volané DblClickom A Long Pressom
  onCellEdit(blok: Block, field: keyof Block): void {
    // 1. Ak už niečo upravujeme, najprv to uložíme
    if (this.editingBlokId !== null && this.editingField !== null) {
      const currentBlok = this.blocks.find(b => b.id === this.editingBlokId);
      if (currentBlok) {
        // Používame setTimeout(0), aby sa uloženie dokončilo asynchrónne pred spustením novej editácie
        setTimeout(() => this.onCellSave(currentBlok), 0);
      }
    }
    
    // 2. Reset správ a nastavenie nového stavu editácie
    this.error = null;
    this.message = null;
    this.editingBlokId = blok.id;
    this.editingField = field;
    this.editingValue = blok[field] || (field.includes('Points') ? 0 : '');
    
    // 3. NASTAVÍME FLAG, KTORÝ SPUSTÍ FOCUS V ngAfterViewChecked (s Pollingom)
    this.shouldFocus = true; 
    this.cdr.detectChanges(); 
  }

  async onCellSave(blok: Block): Promise<void> {
    this.shouldFocus = false;
    
    if (this.editingBlokId === null || this.editingField === null) {
      return;
    }

    const idToSave = this.editingBlokId;
    const fieldToSave = this.editingField as keyof Block;
    let newValue: string | number = this.editingValue;

    // Konverzia číselných polí
    if (fieldToSave === 'maxPoints' || fieldToSave === 'requiredPoints') {
        newValue = parseFloat(String(newValue)) || 0;
    } else {
        newValue = String(newValue).trim();
    }
    
    const blokToUpdate = this.blocks.find(b => b.id === idToSave);
    if (!blokToUpdate) return; 

    // Ak sa hodnota nezmenila, neposielame request
    if (blokToUpdate[fieldToSave] === newValue) {
      console.log('Žiadna zmena, neukladám.');
      this.editingBlokId = null;
      this.editingField = null;
      this.editingValue = '';
      return;
    }
    
    // Vytvoríme payload
    const updatePayload = {
        name: blokToUpdate.name, 
        maxPoints: Number(blokToUpdate.maxPoints) || 0,
        requiredPoints: Number(blokToUpdate.requiredPoints) || 0,
        [fieldToSave]: newValue
    };
    
    if (fieldToSave !== 'name') {
        updatePayload.name = String(blokToUpdate.name).trim();
    }
    
    // Vypneme editovací mód PRED odoslaním (lepšia UX)
    this.editingBlokId = null;
    this.editingField = null;
    this.editingValue = '';

    this.isLoading = true;
    this.error = null;
    this.message = null;
    const apiUrl = `${this.blocksApiUrl}/${idToSave}`;

    try {
      const response = await lastValueFrom(this.http.put<ApiResponse<Block>>(apiUrl, updatePayload));
      const updatedBlok = response.data;
      
      if (!updatedBlok || updatedBlok.id == null) {
        throw new Error('Server vrátil neplatné dáta bloku po aktualizácii.');
      }

      this.blocks = this.blocks.map(b => {
        return b.id === updatedBlok.id ? updatedBlok : b;
      });
      this.message = `Blok '${updatedBlok.name}' bol úspešne aktualizovaný.`;

    } catch (err: any) {
      console.error('Chyba pri aktualizácii bloku:', err);
      this.error = `Aktualizácia bloku zlyhala. (Chyba: ${err.status || 'Neznáma'})`;
      await this.fetchBloky(); 
    } finally {
      this.isLoading = false;
    }
  }
}