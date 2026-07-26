import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  // Auth Routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  
  // Dashboard and core tracking features (wrapped in layout)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'carbon',
        loadComponent: () => import('./features/carbon/carbon.component').then(m => m.CarbonComponent)
      },
      {
        path: 'goals',
        loadComponent: () => import('./features/goals/goals.component').then(m => m.GoalsComponent)
      },
      {
        path: 'ai',
        loadComponent: () => import('./features/ai/ai.component').then(m => m.AiComponent)
      },
      {
        path: 'challenges',
        loadComponent: () => import('./features/challenges/challenges.component').then(m => m.ChallengesComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  
  // Fallback Route
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
