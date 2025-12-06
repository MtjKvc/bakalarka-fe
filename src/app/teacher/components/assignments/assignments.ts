import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms'; 
import { LongPressDirective } from '../../../shared/long-press/long-press'; 

interface BlockSimple { id: number; name: string; }
interface Assignment { id: number; block: BlockSimple | null; name: string; maxPoints: number; }
interface NewAssignmentForm { blockId: number | null; name: string; maxPoints: number; }
interface UpdateAssignmentPayload { blockId: number; name: string; maxPoints: any; }
type EditableField = 'name' | 'maxPoints';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, LongPressDirective],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css' 
})
export class AssignmentsComponent implements OnInit, AfterViewChecked {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false;
  private isSaving: boolean = false;

  private assignmentsApiUrl = 'http://localhost:8080/api/v1/assignment';
  private blocksApiUrl = 'http://localhost:8080/api/v1/block';

  public assignments: Assignment[] = [];
  public availableBlocks: BlockSimple[] = []; 
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null;

  isCreateModalOpen: boolean = false;
  newAssignment: NewAssignmentForm = { blockId: null, name: '', maxPoints: 0 };

  editingId: number | null = null;
  editingField: EditableField | null = null;
  editingValue: string | number | null = '';

  isDeleteConfirmModalOpen: boolean = false;
  assignToDelete: Assignment | null = null;
  deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    this.error = null; // TOTO MAZALO CHYBU
    try {
        const blocksData = await lastValueFrom(this.http.get<BlockSimple[]>(this.blocksApiUrl));
        this.availableBlocks = blocksData || [];
        const assignmentsData = await lastValueFrom(this.http.get<Assignment[]>(this.assignmentsApiUrl));
        this.assignments = assignmentsData || [];
        this.assignments.sort((a, b) => a.id - b.id);
    } catch (err: any) {
        console.error(err);
        this.error = 'Nepodarilo sa načítať dáta.';
    } finally {
        this.isLoading = false;
    }
  }

  // --- CREATE & DELETE (Bez zmien) ---
  onCreateAssignmentClick(): void {
    this.newAssignment = { blockId: null, name: '', maxPoints: 0 };
    this.error = null; this.message = null; this.isCreateModalOpen = true;
  }
  onCloseModal(): void { this.isCreateModalOpen = false; }
  async onSubmitNewAssignment(): Promise<void> {
    if (!this.newAssignment.blockId) return;
    this.isLoading = true; this.error = null; this.message = null;
    const payload = { assignments: [{ blockId: this.newAssignment.blockId, name: this.newAssignment.name.trim(), maxPoints: Number(this.newAssignment.maxPoints) }] };
    try {
        await lastValueFrom(this.http.post(this.assignmentsApiUrl, payload));
        this.message = `Zadanie vytvorené.`;
        this.onCloseModal();
        await this.loadData();
    } catch (err: any) { this.error = "Chyba: Nepodarilo sa vytvoriť zadanie."; } 
    finally { this.isLoading = false; }
  }
  onDeleteAssignmentClick(assign: Assignment): void { this.assignToDelete = assign; this.deleteConfirmationInput = ''; this.error = null; this.message = null; this.isDeleteConfirmModalOpen = true; }
  onCloseDeleteConfirmModal(): void { this.isDeleteConfirmModalOpen = false; this.assignToDelete = null; this.deleteConfirmationInput = ''; this.error = null; }
  async onConfirmDelete(): Promise<void> {
      if (!this.assignToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
      const id = this.assignToDelete.id; this.isLoading = true; this.error = null; this.onCloseDeleteConfirmModal();
      try {
          await lastValueFrom(this.http.delete(`${this.assignmentsApiUrl}/${id}`));
          this.assignments = this.assignments.filter(a => a.id !== id);
          this.message = `Zadanie vymazané.`;
      } catch (err: any) { this.error = "Chyba: Nepodarilo sa vymazať zadanie."; } 
      finally { this.isLoading = false; }
  }

  // --- BLOCK CHANGE ---
  async onBlockChange(assign: Assignment, newBlockId: number): Promise<void> {
      if (assign.block?.id === newBlockId) return;
      this.isLoading = true; this.error = null; this.message = null;
      const payload = { blockId: Number(newBlockId), name: assign.name, maxPoints: assign.maxPoints };
      try {
          const url = `${this.assignmentsApiUrl}/${assign.id}`;
          const response: any = await lastValueFrom(this.http.put(url, payload));
          const updatedAssign = response.data || response;
          if (updatedAssign && updatedAssign.block && updatedAssign.block.id === payload.blockId) {
             const index = this.assignments.findIndex(a => a.id === assign.id);
             if (index !== -1) this.assignments[index] = { ...this.assignments[index], ...updatedAssign };
             this.message = `Blok zmenený.`;
          } else { throw new Error('Mismatch'); }
      } catch (err: any) { this.error = "Chyba: Nepodarilo sa zmeniť blok."; await this.loadData(); } 
      finally { this.isLoading = false; }
  }

  isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }

  onCellEdit(assign: Assignment, field: EditableField): void {
      if (this.isSaving) return;
      this.error = null; this.message = null;
      this.editingId = assign.id;
      this.editingField = field;
      this.editingValue = assign[field] as string | number;
      this.shouldFocus = true;
      this.cdr.detectChanges();
  }

  async onCellSave(assign: Assignment): Promise<void> {
      this.shouldFocus = false;
      if (this.isSaving) return;
      if (this.editingId === null || this.editingField === null) return;

      const field = this.editingField;
      const val = this.editingValue;
      
      // Check change
      if (String(assign[field]) == String(val).trim()) {
          this.editingId = null; this.editingField = null; return;
      }

      const blockId = assign.block?.id; 
      if (!blockId) {
          this.error = 'Chyba: Zadanie nemá blok.'; this.editingId = null; return;
      }

      const payload: UpdateAssignmentPayload = { blockId: blockId, name: assign.name, maxPoints: assign.maxPoints };
      let newValStr = String(val).trim();

      if (field === 'name') payload.name = newValStr;
      if (field === 'maxPoints') {
          const num = parseFloat(newValStr);
          payload.maxPoints = !isNaN(num) ? num : newValStr;
      }

      this.isSaving = true;
      this.isLoading = true;
      
      // Pomocná premenná na chybovú správu
      let pendingErrorMessage: string | null = null;

      try {
          const url = `${this.assignmentsApiUrl}/${assign.id}`;
          const response: any = await lastValueFrom(this.http.put(url, payload));
          const updatedAssign: Assignment = response.data || response;

          let success = true;
          if (field === 'maxPoints') {
              if (Number(updatedAssign.maxPoints) !== Number(payload.maxPoints)) success = false;
          } else if (field === 'name') {
              if (updatedAssign.name !== payload.name) success = false;
          }

          if (success) {
              const index = this.assignments.findIndex(a => a.id === assign.id);
              if (index !== -1) this.assignments[index] = { ...this.assignments[index], ...updatedAssign };
              this.message = `Zadanie aktualizované.`;
          } else {
              // Nastavíme správu, ale do 'this.error' ju dáme až po loadData
              pendingErrorMessage = "Chyba: Aktualizácia zlyhala (hodnota nebola povolená).";
          }

      } catch (err: any) {
          pendingErrorMessage = "Chyba: Aktualizácia zlyhala (chybné údaje).";
      } finally {
          // 1. Ukončiť edit
          this.editingId = null; 
          this.editingField = null;
          
          // 2. Obnoviť dáta (toto zmaže this.error)
          await this.loadData();

          // 3. Ak nastala chyba, obnovíme ju TERAZ, aby bola viditeľná
          if (pendingErrorMessage) {
              this.error = pendingErrorMessage;
              this.message = null; // Prekryť success message ak tam bola
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

  onBackdropClick(event: MouseEvent): void {
      if (event.target === event.currentTarget) {
          this.onCloseModal();
          this.onCloseDeleteConfirmModal();
      }
  }
}