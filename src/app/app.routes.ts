import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard'; 

export const routes: Routes = [
  {
    path: 'student',
    loadComponent: () =>
      import('./student/student').then(m => m.Student),
    children: [
      {
        path: 'blok-1',
        loadComponent: () =>
          import('./student/blok-1/blok-1').then(m => m.Blok1),
      },
      {
        path: 'blok-2',
        loadComponent: () =>
          import('./student/blok-2/blok-2').then(m => m.Blok2),
      },
      {
        path: 'blok-3',
        loadComponent: () =>
          import('./student/blok-3/blok-3').then(m => m.Blok3),
      },
      {
        path: 'rules',
        loadComponent: () =>
          import('./student/rules/rules').then(m => m.Rules),
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('./student/question/question').then(m => m.Question),
      },
      {
        path: 'first-exercise',
        loadComponent: () =>
          import('./student/first-exercise/first-exercise').then(m => m.FirstExercise),
      },
      {
        path: 'manuals',
        loadComponent: () =>
          import('./student/manuals/manuals').then(m => m.Manuals),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./student/contacts/contacts').then(m => m.Contacts),
      },
      {
        path: 'blok1-epsilon',
        loadComponent: () =>
          import('./student/blok1-epsilon/blok1-epsilon').then(m => m.Blok1Epsilon),

      },
      {
        path: 'blok2-asm1',
        loadComponent: () =>
          import('./student/blok2-asm1/blok2-asm1').then(m => m.Blok2Asm1),

      },
      {
        path: 'blok2-asm2',
        loadComponent: () =>
          import('./student/blok2-asm2/blok2-asm2').then(m => m.Blok2Asm2),

      },
      {
        path: 'blok2-asm3',
        loadComponent: () =>
          import('./student/blok2-asm3/blok2-asm3').then(m => m.Blok2Asm3),

      },
      {
        path: 'blok2-asm4',
        loadComponent: () =>
          import('./student/blok2-asm4/blok2-asm4').then(m => m.Blok2Asm4),

      },
      {
        path: 'blok2-asm5',
        loadComponent: () =>
          import('./student/blok2-asm5/blok2-asm5').then(m => m.Blok2Asm5),

      },
      {
        path: 'blok2-asm6',
        loadComponent: () =>
          import('./student/blok2-asm6/blok2-asm6').then(m => m.Blok2Asm6),

      },
      {
        path: 'blok2-asm7',
        loadComponent: () =>
          import('./student/blok2-asm7/blok2-asm7').then(m => m.Blok2Asm7),

      },
      {
        path: 'blok2-asm8',
        loadComponent: () =>
          import('./student/blok2-asm8/blok2-asm8').then(m => m.Blok2Asm8),

      },
      {
        path: 'blok2-asm9',
        loadComponent: () =>
          import('./student/blok2-asm9/blok2-asm9').then(m => m.Blok2Asm9),

      },
      {
        path: 'blok2-asm10',
        loadComponent: () =>
          import('./student/blok2-asm10/blok2-asm10').then(m => m.Blok2Asm10),

      },
      {
        path: 'blok2-asm11',
        loadComponent: () =>
          import('./student/blok2-asm11/blok2-asm11').then(m => m.Blok2Asm11),

      },
      {
        path: 'blok2-asm12',
        loadComponent: () =>
          import('./student/blok2-asm12/blok2-asm12').then(m => m.Blok2Asm12),

      },
      {
        path: 'blok2-asm13',
        loadComponent: () =>
          import('./student/blok2-asm13/blok2-asm13').then(m => m.Blok2Asm13),

      },
        {
        path: 'frontpage',
        loadComponent: () =>
          import('./student/frontpage/frontpage').then(m => m.Frontpage),

      },
    ],
  },
  {
    path: 'teacher',
    loadComponent: () =>
      import('./teacher/teacher').then(m => m.Teacher),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then(m => m.Login),
  },
  {
    path: '',
    redirectTo: 'student/frontpage',
    pathMatch: 'full',
  },
];

