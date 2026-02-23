import { Component, OnInit, inject, ViewChildren, QueryList, ElementRef, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule, NgForm } from '@angular/forms';
import { LongPressDirective } from '../../../shared/directives/long-press.directive';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';
import { ApiResponse } from '../../../shared/models/interfaces';

interface BlockSimple { id: number; name: string; }
interface Assignment { id: number; block: BlockSimple | null; name: string; maxPoints: number; }
interface NewAssignmentForm { blockId: number | null; name: string; maxPoints: number; }
interface UpdateAssignmentPayload { blockId: number; name: string; maxPoints: number; }
type EditableField = 'name' | 'maxPoints';
type SortDirection = 'asc' | 'desc';

@Component({
    selector: 'app-assignments',
    standalone: true,
    imports: [CommonModule, FormsModule, LongPressDirective, CloseOnEscDirective],
    templateUrl: './assignments.html',
})
export class AssignmentsComponent implements OnInit {

    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private logger = inject(LoggerService);

    @ViewChildren('editInput') private editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;

    @ViewChild('assignmentForm') assignmentForm!: NgForm;

    private isSaving: boolean = false;
    private assignmentsApiUrl = `${environment.apiUrl}/api/v1/assignment`;
    private blocksApiUrl = `${environment.apiUrl}/api/v1/block`;

    public assignments: Assignment[] = [];
    public availableBlocks: BlockSimple[] = [];
    public isLoading: boolean = false;
    public error: string | null = null;
    public message: string | null = null;

    public filterBlockId: number | null = null;
    public filterAssignmentId: number | null = null;

    public sortField: string = 'name';
    public sortDirection: SortDirection = 'asc';

    public isCreateModalOpen: boolean = false;
    public newAssignment: NewAssignmentForm = { blockId: null, name: '', maxPoints: 0 };

    public editingId: number | null = null;
    public editingField: EditableField | null = null;
    public editingValue: string | number | null = '';

    public isDeleteConfirmModalOpen: boolean = false;
    public assignToDelete: Assignment | null = null;
    public deleteConfirmationInput: string = '';
    readonly deleteConfirmText: string = 'CONFIRM';

    public ngOnInit(): void {
        this.logger.log('AssignmentsComponent initialized');
        this.loadData();
    }


    public async loadData(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            const blocksData = await lastValueFrom(this.http.get<BlockSimple[]>(this.blocksApiUrl));
            this.availableBlocks = blocksData || [];

            let params = new HttpParams();
            if (this.filterBlockId) params = params.set('blockId', this.filterBlockId);
            if (this.filterAssignmentId) params = params.set('id', this.filterAssignmentId);

            const assignmentsData = await lastValueFrom(this.http.get<Assignment[]>(this.assignmentsApiUrl, { params }));
            this.assignments = assignmentsData || [];

            this.logger.log(`Data loaded: ${this.assignments.length} assignments, ${this.availableBlocks.length} blocks`);
            this.sortData();

        } catch (err: unknown) {
            this.handleError(err, 'Nepodarilo sa načítať dáta.');
        } finally {
            this.isLoading = false;
        }
    }


    public onSort(field: string): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.sortData();
    }

    private sortData(): void {
        if (!this.assignments) return;

        this.assignments.sort((a, b) => {
            let comparison = 0;

            if (this.sortField === 'block') {
                const nameA = a.block?.name?.toLowerCase() || '';
                const nameB = b.block?.name?.toLowerCase() || '';
                comparison = nameA.localeCompare(nameB);
            } else {
                const key = this.sortField as keyof Assignment;
                const valA = a[key];
                const valB = b[key];

                if (typeof valA === 'string' && typeof valB === 'string') {
                    comparison = valA.localeCompare(valB);
                } else if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                }
            }

            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    public onCreateAssignmentClick(): void {
        this.newAssignment = { blockId: null, name: '', maxPoints: 0 };
        this.error = null; this.message = null; this.isCreateModalOpen = true;
    }

    public onCloseModal(): void { this.isCreateModalOpen = false; }

    public async onSubmitNewAssignment(): Promise<void> {
        if (this.assignmentForm.invalid) {
            this.assignmentForm.form.markAllAsTouched();
            return;
        }
        if (!this.newAssignment.blockId) return;
        this.isLoading = true; this.error = null; this.message = null;

        const payload = {
            assignments: [{
                blockId: this.newAssignment.blockId,
                name: this.newAssignment.name.trim(),
                maxPoints: Number(this.newAssignment.maxPoints)
            }]
        };

        try {
            await lastValueFrom(this.http.post<ApiResponse<unknown>>(this.assignmentsApiUrl, payload));
            this.logger.log('New assignment created', payload);
            this.message = `Zadanie vytvorené.`;
            this.onCloseModal();
            await this.loadData();
        } catch (err: unknown) {
            this.handleError(err, 'Chyba: Nepodarilo sa vytvoriť zadanie.');
        } finally {
            this.isLoading = false;
        }
    }


    public onDeleteAssignmentClick(assign: Assignment): void {
        this.assignToDelete = assign;
        this.deleteConfirmationInput = '';
        this.error = null; this.message = null;
        this.isDeleteConfirmModalOpen = true;
    }

    public onCloseDeleteConfirmModal(): void {
        this.isDeleteConfirmModalOpen = false;
        this.assignToDelete = null;
        this.deleteConfirmationInput = '';
        this.error = null;
    }

    public async onConfirmDelete(): Promise<void> {
        if (!this.assignToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
        const id = this.assignToDelete.id;
        this.isLoading = true;
        this.error = null;
        this.onCloseDeleteConfirmModal();

        try {
            await lastValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.assignmentsApiUrl}/${id}`));
            this.logger.warn(`Assignment deleted: ID ${id}`);
            this.assignments = this.assignments.filter(a => a.id !== id);
            this.message = `Zadanie vymazané.`;
        } catch (err: unknown) {
            this.handleError(err, 'Chyba: Nepodarilo sa vymazať zadanie.');
        } finally {
            this.isLoading = false;
        }
    }


    public async onBlockChange(assign: Assignment, newBlockId: number): Promise<void> {
        if (assign.block?.id === newBlockId) return;
        this.isLoading = true; this.error = null; this.message = null;

        const payload: UpdateAssignmentPayload = { blockId: Number(newBlockId), name: assign.name, maxPoints: assign.maxPoints };

        try {
            const url = `${this.assignmentsApiUrl}/${assign.id}`;
            const response = await lastValueFrom(this.http.put<{ data: Assignment }>(url, payload));
            const updatedAssign = response.data || response;

            this.updateLocalAssignment(assign.id, updatedAssign);
            this.message = `Blok zmenený.`;
            this.sortData();
        } catch (err: unknown) {
            this.handleError(err, 'Chyba: Nepodarilo sa zmeniť blok.');
            await this.loadData();
        } finally {
            this.isLoading = false;
        }
    }

    public isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }

    public onCellEdit(assign: Assignment, field: EditableField): void {
        if (this.isSaving) return;
        this.error = null; this.message = null;
        this.editingId = assign.id;
        this.editingField = field;
        this.editingValue = assign[field];

        this.cdr.detectChanges();
        const inputRef = this.editInputsRef.find((item, index) => {
            return !!item.nativeElement.offsetParent;
        });

        if (inputRef) {
            inputRef.nativeElement.focus();
            inputRef.nativeElement.select();
        }
    }

    public async onCellSave(assign: Assignment): Promise<void> {
        if (this.isSaving) return;
        if (this.editingId === null || this.editingField === null) return;

        const field = this.editingField;
        const rawVal = this.editingValue;

        if (String(assign[field]) === String(rawVal).trim()) {
            this.resetEditState();
            return;
        }

        const blockId = assign.block?.id;
        if (!blockId) {
            this.error = 'Chyba: Zadanie nemá blok.';
            this.resetEditState();
            return;
        }

        const payload: UpdateAssignmentPayload = { blockId: blockId, name: assign.name, maxPoints: assign.maxPoints };
        const cleanVal = String(rawVal).trim();

        if (field === 'name') {
            payload.name = cleanVal;
        } else if (field === 'maxPoints') {
            const num = parseFloat(cleanVal);
            if (isNaN(num)) {
                this.error = "Max body musí byť číslo.";
                return;
            }
            payload.maxPoints = num;
        }

        this.isSaving = true;
        this.isLoading = true;

        try {
            const url = `${this.assignmentsApiUrl}/${assign.id}`;
            const response = await lastValueFrom(this.http.put<{ data: Assignment }>(url, payload));
            const updatedAssign = response.data || response;

            this.updateLocalAssignment(assign.id, updatedAssign);
            this.logger.log(`Cell '${field}' updated for ID ${assign.id}`, payload);
            this.message = `Zadanie aktualizované.`;
            this.sortData();

        } catch (err: unknown) {
            this.handleError(err, 'Chyba: Aktualizácia zlyhala.');
            await this.loadData();
        } finally {
            this.resetEditState();
            this.isLoading = false;
            this.isSaving = false;
        }
    }

    private resetEditState() {
        this.editingId = null;
        this.editingField = null;
    }

    private updateLocalAssignment(id: number, updatedData: Partial<Assignment>) {
        const index = this.assignments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.assignments[index] = { ...this.assignments[index], ...updatedData };
        }
    }

    private handleError(err: unknown, defaultMsg: string) {
        this.logger.error(defaultMsg, err);
        if (err instanceof HttpErrorResponse) {
            this.error = `${defaultMsg} (${err.status} ${err.statusText})`;
        } else {
            this.error = defaultMsg;
        }
    }

    public onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.onCloseModal();
            this.onCloseDeleteConfirmModal();
        }
    }
}