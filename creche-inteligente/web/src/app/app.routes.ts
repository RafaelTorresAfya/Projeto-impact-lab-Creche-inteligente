import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa.component').then((m) => m.MapaComponent),
      },
      {
        path: 'unidades-escolares',
        loadComponent: () =>
          import('./pages/unidades-escolares/unidades-escolares.component').then(
            (m) => m.UnidadesEscolaresComponent,
          ),
      },
      {
        path: 'inscricoes-resumo',
        loadComponent: () =>
          import('./pages/inscricoes-resumo/inscricoes-resumo.component').then(
            (m) => m.InscricoesResumoComponent,
          ),
      },
      {
        path: 'vagas-ofertadas',
        loadComponent: () =>
          import('./pages/vagas-ofertadas/vagas-ofertadas.component').then(
            (m) => m.VagasOfertadasComponent,
          ),
      },
      {
        path: 'planejamento-vagas',
        loadComponent: () =>
          import('./pages/planejamento-vagas/planejamento-vagas.component').then(
            (m) => m.PlanejamentoVagasComponent,
          ),
      },
      {
        path: 'planejamento-vagas/novo',
        loadComponent: () =>
          import('./pages/planejamento-vagas/planejamento-vagas-form.component').then(
            (m) => m.PlanejamentoVagasFormComponent,
          ),
      },
      {
        path: 'planejamento-vagas/:id/editar',
        loadComponent: () =>
          import('./pages/planejamento-vagas/planejamento-vagas-form.component').then(
            (m) => m.PlanejamentoVagasFormComponent,
          ),
      },
      {
        path: 'convocacoes',
        loadComponent: () =>
          import('./pages/convocacoes/convocacoes.component').then((m) => m.ConvocacoesComponent),
      },
      {
        path: 'convocacoes/novo',
        loadComponent: () =>
          import('./pages/convocacoes/convocacoes-form.component').then(
            (m) => m.ConvocacoesFormComponent,
          ),
      },
      {
        path: 'convocacoes/:id/editar',
        loadComponent: () =>
          import('./pages/convocacoes/convocacoes-form.component').then(
            (m) => m.ConvocacoesFormComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
