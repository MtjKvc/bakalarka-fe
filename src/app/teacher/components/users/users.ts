import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LongPressDirective } from '../../../shared/long-press/long-press';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc';

interface User {
    id: number;
    fullName: string;
    email: string;
    roleEnum: string;
}

interface Exercise {
    id: number;
    firstSessionDate: string;
    startTime: string;
    roomEnum: string;
}

interface UserExerciseAssignment {
    id: number;
    user: User;
    exercise: Exercise;
}

interface NewUserForm {
    fullName: string;
    email: string;
    roleEnum: string;
}

interface UpdateUserPayload {
    fullName: string;
    email: string;
    roleEnum: string;
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

    @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
    private shouldFocus: boolean = false;
    private isSaving: boolean = false;

    private usersApiUrl = `${environment.apiUrl}/api/v1/user`;
    private rolesApiUrl = `${environment.apiUrl}/api/v1/enum/role`;
    private passwordApiUrl = `${environment.apiUrl}/api/v1/user/password`;

    private exercisesApiUrl = `${environment.apiUrl}/api/v1/exercise`;
    private userExerciseApiUrl = `${environment.apiUrl}/api/v1/user-exercise`;
    public users: User[] = [];
    public availableRoles: string[] = [];

    public isExerciseModalOpen: boolean = false;
    public selectedUserForExercises: User | null = null;

    public userAssignments: UserExerciseAssignment[] = [];
    public availableExercises: Exercise[] = [];
    public selectedExerciseIdToAdd: number | null = null;

    private dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

    public isLoading: boolean = false;
    public error: string | null = null;
    public message: string | null = null;

    public isCreateModalOpen: boolean = false;
    public newUser: NewUserForm = { fullName: '', email: '', roleEnum: '' };

    editingId: number | null = null;
    editingField: EditableField | null = null;
    editingValue: string = '';

    isDeleteConfirmModalOpen: boolean = false;
    userToDelete: User | null = null;
    deleteConfirmationInput: string = '';
    readonly deleteConfirmText: string = 'CONFIRM';

    public isRemoveExerciseConfirmOpen: boolean = false;
    public assignmentToRemove: UserExerciseAssignment | null = null;

    ngOnInit(): void {
        this.logger.log('UsersComponent initialized');
        this.loadData();
    }

    async loadData(): Promise<void> {
        this.isLoading = true; this.error = null;
        try {
            const [usersData, rolesData] = await Promise.all([
                lastValueFrom(this.http.get<User[]>(this.usersApiUrl)),
                lastValueFrom(this.http.get<string[]>(this.rolesApiUrl))
            ]);

            this.users = usersData || [];
            this.users.sort((a, b) => a.id - b.id);
            this.availableRoles = rolesData || [];
            this.logger.log(`Loaded ${this.users.length} users and ${this.availableRoles.length} roles`);
            this.cdr.detectChanges();
        } catch (err: unknown) {
            this.logger.error('Failed to load users data', err);
            this.error = 'Nepodarilo sa načítať dáta používateľov.';
        } finally {
            this.isLoading = false;
        }
    }

    getDayName(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr.split('T')[0]);
        if (isNaN(date.getTime())) return dateStr;
        return this.dayNames[date.getDay()];
    }

    async onOpenExerciseModal(user: User): Promise<void> {
        this.logger.log('Opening exercise modal for user', user.id);
        this.selectedUserForExercises = user;
        this.isExerciseModalOpen = true;
        this.selectedExerciseIdToAdd = null;
        this.error = null;
        this.message = null;
        this.isLoading = true;

        try {
            const [allExercises, allAssignments] = await Promise.all([
                lastValueFrom(this.http.get<Exercise[]>(this.exercisesApiUrl)),
                lastValueFrom(this.http.get<UserExerciseAssignment[]>(this.userExerciseApiUrl))
            ]);

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

    onCloseExerciseModal(): void {
        this.isExerciseModalOpen = false;
        this.selectedUserForExercises = null;
        this.userAssignments = [];
        this.availableExercises = [];
        this.error = null;
    }

    async onAssignExercise(): Promise<void> {
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
            await lastValueFrom(this.http.post(this.userExerciseApiUrl, payload));

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

    onOpenRemoveConfirm(assignment: UserExerciseAssignment): void {
        this.assignmentToRemove = assignment;
        this.isRemoveExerciseConfirmOpen = true;
        this.error = null;
    }

    onCloseRemoveConfirm(): void {
        this.isRemoveExerciseConfirmOpen = false;
        this.assignmentToRemove = null;
    }

    async onConfirmRemoveExercise(): Promise<void> {
        if (!this.selectedUserForExercises || !this.assignmentToRemove) return;

        this.isLoading = true;
        this.error = null;

        try {
            this.logger.log('Removing exercise assignment', this.assignmentToRemove.id);
            await lastValueFrom(this.http.delete(`${this.userExerciseApiUrl}/${this.assignmentToRemove.id}`));

            this.onCloseRemoveConfirm();

            await this.onOpenExerciseModal(this.selectedUserForExercises);

            this.message = "Cvičenie bolo úspešne odobraté.";

        } catch (err: unknown) {
            this.logger.error('Error removing exercise assignment', err);
            this.error = "Chyba pri odoberaní cvičenia.";
            this.onCloseRemoveConfirm();
        } finally {
            this.isLoading = false;
        }
    }

    async onResetPassword(user: User): Promise<void> {
        if (!confirm(`Naozaj chcete vygenerovať nové heslo pre používateľa "${user.fullName}" a poslať ho na email ${user.email}?`)) {
            return;
        }
        this.isLoading = true; this.message = null; this.error = null;
        try {
            this.logger.log('Requesting password reset for user', user.id);
            await lastValueFrom(this.http.put(`${this.passwordApiUrl}/${user.id}`, {}));
            this.message = `Požiadavka na reset hesla pre ${user.email} bola úspešne odoslaná.`;
        } catch (err: unknown) {
            this.logger.error('Error resetting password', err);
            this.error = "Chyba pri resetovaní hesla.";
        } finally {
            this.isLoading = false;
        }
    }

    async onRoleChange(user: User, newRole: string): Promise<void> {
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

    async updateUser(id: number, payload: UpdateUserPayload, onSuccess: () => void, successMsg: string, onError?: () => void) {
        this.isLoading = true; this.error = null; this.message = null;
        try {
            this.logger.log('Updating user', { id, payload });
            await lastValueFrom(this.http.put(`${this.usersApiUrl}/${id}`, payload));
            onSuccess();
            this.message = successMsg;
        } catch (err: unknown) {
            this.logger.error('Error updating user', err);
            this.error = "Chyba pri aktualizácii používateľa.";
            if (onError) onError();
            else await this.loadData();
        } finally { this.isLoading = false; }
    }

    onCreateUserClick(): void {
        this.newUser = { fullName: '', email: '', roleEnum: '' };
        this.isCreateModalOpen = true;
        this.error = null; this.message = null;
    }
    onCloseModal(): void { this.isCreateModalOpen = false; }

    async onSubmitNewUser(): Promise<void> {
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
            await lastValueFrom(this.http.post(this.usersApiUrl, payload));
            this.message = `Používateľ vytvorený.`;
            this.onCloseModal();
            await this.loadData();
        } catch (err: unknown) {
            this.logger.error('Error creating user', err);
            this.error = "Chyba pri vytváraní používateľa.";
        } finally {
            this.isLoading = false;
        }
    }

    onDeleteUserClick(user: User): void {
        this.userToDelete = user;
        this.deleteConfirmationInput = '';
        this.isDeleteConfirmModalOpen = true;
        this.error = null; this.message = null;
    }
    onCloseDeleteConfirmModal(): void {
        this.isDeleteConfirmModalOpen = false;
        this.userToDelete = null;
        this.deleteConfirmationInput = '';
    }
    async onConfirmDelete(): Promise<void> {
        if (!this.userToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
        this.isLoading = true;
        const idToDelete = this.userToDelete.id;
        this.onCloseDeleteConfirmModal();

        try {
            this.logger.log('Deleting user', idToDelete);
            await lastValueFrom(this.http.delete(`${this.usersApiUrl}/${idToDelete}`));
            this.users = this.users.filter(u => u.id !== idToDelete);
            this.message = `Používateľ vymazaný.`;
        } catch (err: unknown) {
            this.logger.error('Error deleting user', err);
            this.error = "Chyba: Nepodarilo sa vymazať používateľa.";
        } finally {
            this.isLoading = false;
        }
    }

    isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }

    onCellEdit(user: User, field: EditableField): void {
        if (this.isSaving) return;
        this.editingId = user.id;
        this.editingField = field;
        this.editingValue = user[field];
        this.shouldFocus = true;
        this.cdr.detectChanges();
    }

    async onCellSave(user: User): Promise<void> {
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
        const payload: UpdateUserPayload = {
            fullName: user.fullName,
            email: user.email,
            roleEnum: user.roleEnum
        };

        if (this.editingField === 'fullName') payload.fullName = newValue;
        if (this.editingField === 'email') payload.email = newValue;

        try {
            this.logger.log('Saving cell edit', { userId: user.id, field: this.editingField, newValue });
            await lastValueFrom(this.http.put(`${this.usersApiUrl}/${user.id}`, payload));
            if (this.editingField === 'fullName') user.fullName = newValue;
            if (this.editingField === 'email') user.email = newValue;
            this.message = `Údaje aktualizované.`;
        } catch (err: any) {
            this.logger.error('Error saving cell edit', err);
            this.error = "Chyba pri aktualizácii.";
            await this.loadData();
        } finally {
            this.editingId = null; this.editingField = null;
            this.isLoading = false; this.isSaving = false;
        }
    }

    ngAfterViewChecked(): void {
        if (this.shouldFocus && this.editInputsRef.first) {
            this.shouldFocus = false;
            setTimeout(() => this.editInputsRef.first.nativeElement.focus(), 10);
        }
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.onCloseModal();
            this.onCloseDeleteConfirmModal();
            this.onCloseExerciseModal();
            this.onCloseRemoveConfirm();
        }
    }
}