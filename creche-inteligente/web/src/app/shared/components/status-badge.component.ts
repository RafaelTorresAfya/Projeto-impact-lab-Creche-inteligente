import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface StatusInfo {
  cor: string;
  icone: string;
  texto: string;
}

const MAPA_STATUS: Record<string, StatusInfo> = {
  AGUARDANDO_CONVOCACAO: { cor: '#898781', icone: 'schedule', texto: 'Aguardando convocação' },
  CONVOCADO: { cor: '#eda100', icone: 'campaign', texto: 'Convocado' },
  CONFIRMADO: { cor: '#1baf7a', icone: 'thumb_up', texto: 'Confirmado' },
  MATRICULADO: { cor: '#0ca30c', icone: 'check_circle', texto: 'Matriculado' },
  DESISTIU: { cor: '#52514e', icone: 'cancel', texto: 'Desistiu' },
  EXPIRADO: { cor: '#d03b3b', icone: 'error', texto: 'Prazo expirado' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="badge" [style.background]="corFundo()" [style.color]="info().cor">
      <mat-icon>{{ info().icone }}</mat-icon>
      {{ info().texto }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 10px 2px 6px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  private statusSig = signal<string>('AGUARDANDO_CONVOCACAO');

  @Input() set status(value: string) {
    this.statusSig.set(value);
  }

  info = computed<StatusInfo>(() => MAPA_STATUS[this.statusSig()] ?? MAPA_STATUS['AGUARDANDO_CONVOCACAO']);
  corFundo = computed(() => this.info().cor + '22');
}
