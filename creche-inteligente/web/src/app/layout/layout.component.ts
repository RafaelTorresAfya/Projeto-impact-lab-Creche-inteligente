import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

interface ItemMenu {
  rota: string;
  icone: string;
  rotulo: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  private auth = inject(AuthService);

  usuario = this.auth.getUsuario();

  itens: ItemMenu[] = [
    { rota: '/dashboard', icone: 'dashboard', rotulo: 'Dashboard' },
    { rota: '/mapa', icone: 'map', rotulo: 'Mapa' },
    { rota: '/unidades-escolares', icone: 'apartment', rotulo: 'Unidades Escolares' },
    { rota: '/inscricoes-resumo', icone: 'assignment', rotulo: 'Inscrições' },
    { rota: '/vagas-ofertadas', icone: 'event_seat', rotulo: 'Vagas Ofertadas' },
    { rota: '/planejamento-vagas', icone: 'fact_check', rotulo: 'Planejamento de Vagas' },
    { rota: '/convocacoes', icone: 'notifications_active', rotulo: 'Convocações' },
  ];

  sair(): void {
    this.auth.logout();
  }
}
