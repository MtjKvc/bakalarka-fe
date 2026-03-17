import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, debounceTime, lastValueFrom, Subject, Subscription, switchMap, tap } from 'rxjs';
import { FormsModule, NgForm } from '@angular/forms';
import { LongPressDirective } from '../../../shared/directives/long-press.directive';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';
import { ApiResponse, Exercise, UserDTO } from '../../../shared/models/interfaces';


interface UserForm {
    fullName: string;
    email: string;
    roleEnum: string;
}

interface UserExerciseAssignment {
    id: number;
    user: UserDTO;
    exercise: Exercise;
}

type EditableField = 'fullName' | 'email';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, LongPressDirective, CloseOnEscDirective],
    templateUrl: './users.html',
    styleUrl: './users.css'
})
export class UsersComponent implements OnInit, AfterViewChecked {

    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private logger = inject(LoggerService);

    @ViewChildren('editInput') private editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;

    @ViewChild('userForm') userForm!: NgForm;
    private shouldFocus: boolean = false;
    private isSaving: boolean = false;

    private usersApiUrl = `${environment.apiUrl}/api/v1/user`;
    private rolesApiUrl = `${environment.apiUrl}/api/v1/enum/role`;
    private passwordApiUrl = `${environment.apiUrl}/api/v1/user/password`;

    private exercisesApiUrl = `${environment.apiUrl}/api/v1/exercise`;
    private userExerciseApiUrl = `${environment.apiUrl}/api/v1/user-exercise`;
    public users: UserDTO[] = [];
    public availableRoles: string[] = [];

    public searchName: string = '';
    public searchEmail: string = '';
    public searchId: string = '';
    public sortField: string = 'id';
    public sortDirection: 'asc' | 'desc' = 'asc';

    private searchSubject = new Subject<void>();
    private searchSubscription?: Subscription;

    public isExerciseModalOpen: boolean = false;
    public selectedUserForExercises: UserDTO | null = null;

    public userAssignments: UserExerciseAssignment[] = [];
    public availableExercises: Exercise[] = [];
    public selectedExerciseIdToAdd: number | null = null;

    private dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

    public isLoading: boolean = false;
    public error: string | null = null;
    public message: string | null = null;

    public isCreateModalOpen: boolean = false;
    public newUser: UserForm = { fullName: '', email: '', roleEnum: '' };

    public editingId: number | null = null;
    public editingField: EditableField | null = null;
    public editingValue: string = '';

    public isDeleteConfirmModalOpen: boolean = false;
    public userToDelete: UserDTO | null = null;
    public deleteConfirmationInput: string = '';
    public readonly deleteConfirmText: string = 'CONFIRM';

    public isRemoveExerciseConfirmOpen: boolean = false;
    public assignmentToRemove: UserExerciseAssignment | null = null;

    @ViewChild('errorContainer') set errorContent(content: ElementRef) {
        if (content) {
            content.nativeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
            content.nativeElement.focus({ preventScroll: true });
        }
    }

    public ngOnInit(): void {
this.logger.log('UsersComponent initialized');
        this.loadRoles();

        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            tap(() => {
                this.isLoading = true;
                this.error = null;
            }),
            switchMap(() => {
                let params = new HttpParams();
                if (this.searchId.trim()) params = params.set('id', this.searchId.trim());
                if (this.searchEmail.trim()) params = params.set('email', this.searchEmail.trim());
                if (this.searchName.trim()) params = params.set('fullName', this.searchName.trim());

                params = params.set('sort', `${this.sortField},${this.sortDirection}`);

                return this.http.get<UserDTO[]>(this.usersApiUrl, { params }).pipe(
                    catchError((err) => {
                        this.logger.error('Failed to load users', err);
                        this.error = "Nepodarilo sa načítať dáta.";
                        return [];
                    })
                );
            })
        ).subscribe(data => {
            this.users = data || [];
            this.isLoading = false;
            this.cdr.detectChanges();
        });

        this.triggerSearch();
    }

    public ngOnDestroy(): void {
        this.searchSubscription?.unsubscribe();
        this.searchSubject.complete();
    }

    public triggerSearch(): void {
        this.searchSubject.next();
    }

    public onSearchInputChange(): void {
        this.triggerSearch();
    }

    public onSort(field: string): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.triggerSearch();
    }

private async loadRoles(): Promise<void> {
        try {
            const rolesData = await lastValueFrom(this.http.get<string[]>(this.rolesApiUrl));
            this.availableRoles = rolesData || [];
        } catch (err) {
            this.logger.error('Failed to load roles', err);
        }
    }

    public getDayName(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr.split('T')[0]);
        if (isNaN(date.getTime())) return dateStr;
        return this.dayNames[date.getDay()];
    }

    public async onOpenExerciseModal(user: UserDTO): Promise<void> {
        this.logger.log('Opening exercise modal for user', user.id);
        this.selectedUserForExercises = user;
        this.isExerciseModalOpen = true;
        this.selectedExerciseIdToAdd = null;
        this.error = null;
        this.message = null;
        this.isLoading = true;

        try {
            const [allExercisesResponse, allAssignmentsResponse] = await Promise.all([
                lastValueFrom(this.http.get<Exercise[]>(this.exercisesApiUrl)),
                lastValueFrom(this.http.get<UserExerciseAssignment[]>(this.userExerciseApiUrl))
            ]);

            const allAssignments = allAssignmentsResponse || [];
            const allExercises = allExercisesResponse || [];

            this.userAssignments = (allAssignments || [])
                .filter(assignment => assignment.user && assignment.user.id === user.id)
                .sort((a, b) => (a.exercise?.id || 0) - (b.exercise?.id || 0));

            const assignedExerciseIds = new Set(this.userAssignments.map(a => a.exercise?.id));

            this.availableExercises = (allExercises || [])
                .filter(e => !assignedExerciseIds.has(e.id))
                .sort((a, b) => a.id - b.id);

        } catch (err: unknown) {
            this.logger.error('Failed to load exercises for modal', err);
            this.error = "Nepodarilo sa načítať cvičenia.";
        } finally {
            this.isLoading = false;
        }
    }

    public onCloseExerciseModal(): void {
        this.isExerciseModalOpen = false;
        this.selectedUserForExercises = null;
        this.userAssignments = [];
        this.availableExercises = [];
        this.error = null;
    }

    public async onAssignExercise(): Promise<void> {
        if (!this.selectedUserForExercises || !this.selectedExerciseIdToAdd) return;

        this.isLoading = true;
        this.error = null;

        try {
            const payload = {
                userExercises: [{
                    userId: this.selectedUserForExercises.id,
                    exerciseId: this.selectedExerciseIdToAdd
                }]
            };

            this.logger.log('Assigning exercise', payload);
            await lastValueFrom(this.http.post<ApiResponse<unknown>>(this.userExerciseApiUrl, payload));

            await this.onOpenExerciseModal(this.selectedUserForExercises);

        } catch (err: unknown) {
            this.logger.error('Error assigning exercise', err);
            if (err instanceof HttpErrorResponse) {
                if (err.status === 409) {
                    this.error = "Toto cvičenie už je používateľovi priradené, alebo nastal konflikt dát.";
                } else {
                    this.error = "Chyba pri priraďovaní cvičenia. Skúste znova.";
                }
            }
            await this.onOpenExerciseModal(this.selectedUserForExercises);

        } finally {
            this.isLoading = false;
        }
    }

    public onOpenRemoveConfirm(assignment: UserExerciseAssignment): void {
        this.assignmentToRemove = assignment;
        this.isRemoveExerciseConfirmOpen = true;
        this.error = null;
    }

    public onCloseRemoveConfirm(): void {
        this.isRemoveExerciseConfirmOpen = false;
        this.assignmentToRemove = null;
    }

    public async onConfirmRemoveExercise(): Promise<void> {
        if (!this.selectedUserForExercises || !this.assignmentToRemove) return;

        this.isLoading = true;
        this.error = null;

        try {
            this.logger.log('Removing exercise assignment', this.assignmentToRemove.id);
            await lastValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.userExerciseApiUrl}/${this.assignmentToRemove.id}`));

            this.onCloseRemoveConfirm();

            await this.onOpenExerciseModal(this.selectedUserForExercises);

            this.message = "Cvičenie bolo úspešne odobraté.";
            setTimeout(() => this.message = null, 2000);

        } catch (err: unknown) {
            this.logger.error('Error removing exercise assignment', err);
            this.error = "Chyba pri odoberaní cvičenia.";
            this.onCloseRemoveConfirm();
        } finally {
            this.isLoading = false;
        }
    }

    public async onResetPassword(user: UserDTO): Promise<void> {
        if (!confirm(`Naozaj chcete vygenerovať nové heslo pre používateľa "${user.fullName}" a poslať ho na email ${user.email}?`)) {
            return;
        }
        this.isLoading = true; this.message = null; this.error = null;
        try {
            this.logger.log('Requesting password reset for user', user.id);
            await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.passwordApiUrl}/${user.id}`, {}));
            this.message = `Požiadavka na reset hesla pre ${user.email} bola úspešne odoslaná.`;
            setTimeout(() => this.message = null, 2000);
        } catch (err: unknown) {
            this.logger.error('Error resetting password', err);
            this.error = "Chyba pri resetovaní hesla.";
        } finally {
            this.isLoading = false;
        }
    }

    public async onRoleChange(user: UserDTO, newRole: string): Promise<void> {
        if (user.roleEnum === newRole) return;
        const originalRole = user.roleEnum;
        user.roleEnum = newRole;

        await this.updateUser(user.id, {
            fullName: user.fullName,
            email: user.email,
            roleEnum: newRole
        }, () => { }, `Rola zmenená na ${newRole}.`,
            () => { user.roleEnum = originalRole; });
    }

    private async updateUser(id: number, payload: UserForm, onSuccess: () => void, successMsg: string, onError?: () => void) {
        this.isLoading = true; this.error = null; this.message = null;
        try {
            this.logger.log('Updating user', { id, payload });
            await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.usersApiUrl}/${id}`, payload));
            onSuccess();
            this.message = successMsg;
            setTimeout(() => this.message = null, 2000);
        } catch (err: unknown) {
            this.logger.error('Error updating user', err);
            this.error = "Chyba pri aktualizácii používateľa.";
            if (onError) onError();
            else this.triggerSearch();
        } finally { this.isLoading = false; }
    }

    public onCreateUserClick(): void {
        this.newUser = { fullName: '', email: '', roleEnum: '' };
        this.isCreateModalOpen = true;
        this.error = null; this.message = null;
    }
    public onCloseModal(): void { this.isCreateModalOpen = false; }

    public async onSubmitNewUser(): Promise<void> {
        this.error = null;
        if (this.userForm.invalid) {
            this.userForm.form.markAllAsTouched();
            return;
        }
        if (!this.newUser.fullName || !this.newUser.email || !this.newUser.roleEnum) return;
        this.isLoading = true;

        const payload = {
            users: [{
                fullName: this.newUser.fullName,
                email: this.newUser.email,
                roleEnum: this.newUser.roleEnum
            }]
        };

        try {
            this.logger.log('Creating new user', payload);
            await lastValueFrom(this.http.post<ApiResponse<unknown>>(this.usersApiUrl, payload));
            this.message = `Používateľ vytvorený.`;
            this.onCloseModal();
            this.triggerSearch()
            setTimeout(() => this.message = null, 2000);
        } catch (err: unknown) {
            this.logger.error('Error creating user', err);
            this.error = "Chyba pri vytváraní používateľa.";
        } finally {
            this.isLoading = false;
        }
    }

    public onDeleteUserClick(user: UserDTO): void {
        this.userToDelete = user;
        this.deleteConfirmationInput = '';
        this.isDeleteConfirmModalOpen = true;
        this.error = null; this.message = null;
    }
    public onCloseDeleteConfirmModal(): void {
        this.isDeleteConfirmModalOpen = false;
        this.userToDelete = null;
        this.deleteConfirmationInput = '';
    }
    public async onConfirmDelete(): Promise<void> {
        if (!this.userToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
        this.isLoading = true;
        const idToDelete = this.userToDelete.id;
        this.onCloseDeleteConfirmModal();

        try {
            this.logger.log('Deleting user', idToDelete);
            await lastValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.usersApiUrl}/${idToDelete}`));
            this.users = this.users.filter(u => u.id !== idToDelete);
            this.message = `Používateľ vymazaný.`;
            setTimeout(() => this.message = null, 2000);
        } catch (err: unknown) {
            this.logger.error('Error deleting user', err);
            this.error = "Chyba: Nepodarilo sa vymazať používateľa.";
        } finally {
            this.isLoading = false;
        }
    }

    public isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }

    public onCellEdit(user: UserDTO, field: EditableField): void {
        this.error = null;
        if (this.isSaving) return;
        this.editingId = user.id;
        this.editingField = field;
        this.editingValue = user[field];
        this.shouldFocus = true;
        this.cdr.detectChanges();
    }

    public async onCellSave(user: UserDTO): Promise<void> {
        this.error = null;
        this.shouldFocus = false;
        if (this.isSaving || this.editingId === null || this.editingField === null) return;

        const newValue = String(this.editingValue).trim();
        const oldValue = user[this.editingField];

        if (newValue === oldValue) {
            this.editingId = null;
            this.editingField = null;
            return;
        }

        this.isSaving = true; this.isLoading = true;
        const payload: UserForm = {
            fullName: user.fullName,
            email: user.email,
            roleEnum: user.roleEnum
        };

        if (this.editingField === 'fullName') payload.fullName = newValue;
        if (this.editingField === 'email') payload.email = newValue;

        try {
            this.logger.log('Saving cell edit', { userId: user.id, field: this.editingField, newValue });
            await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.usersApiUrl}/${user.id}`, payload));
            if (this.editingField === 'fullName') user.fullName = newValue;
            if (this.editingField === 'email') user.email = newValue;
            this.message = `Údaje aktualizované.`;
            setTimeout(() => this.message = null, 2000);
        } catch (err: unknown) {
            this.logger.error('Error saving cell edit', err);
            this.error = "Chyba pri aktualizácii.";
            this.triggerSearch()
        } finally {
            this.editingId = null; this.editingField = null;
            this.isLoading = false; this.isSaving = false;
        }
    }

    public ngAfterViewChecked(): void {
        if (this.shouldFocus && this.editInputsRef.first) {
            this.shouldFocus = false;
            setTimeout(() => this.editInputsRef.first.nativeElement.focus(), 10);
        }
    }

    public onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.onCloseModal();
            this.onCloseDeleteConfirmModal();
            this.onCloseExerciseModal();
            this.onCloseRemoveConfirm();
        }
    }
}