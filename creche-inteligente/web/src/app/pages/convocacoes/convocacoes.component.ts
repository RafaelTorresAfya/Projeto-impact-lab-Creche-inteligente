import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConvocacoesService } from '../../services/convocacoes.service';
import { Convocacao } from '../../core/interfaces/convocacao.interface';

@Component({
  selector: 'app-convocacoes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
  ],
  templateUrl: './convocacoes.component.html',
  styleUrl: './convocacoes.component.css',
})
export class ConvocacoesComponent implements OnInit {
  private service = inject(ConvocacoesService);
  private snackBar = inject(MatSnackBar);

  colunas = ['nome_crianca', 'nome_responsavel', 'nome_unidade', 'grupamento', 'status', 'prazo_resposta', 'acoes'];
  itens = signal<Convocacao[]>([]);
  alertas = signal<Convocacao[]>([]);
  carregando = signal(false);

  statusFiltro = '';
  statusOpcoes = ['AGUARDANDO_CONVOCACAO', 'CONVOCADO', 'CONFIRMADO', 'MATRICULADO', 'DESISTIU', 'EXPIRADO'];

  itensFiltrados = computed(() =>
    this.statusFiltro ? this.itens().filter((i) => i.status === this.statusFiltro) : this.itens(),
  );

  idsComAlerta = computed(() => new Set(this.alertas().map((a) => a.id_convocacao)));

  ngOnInit(): void {
    this.buscar();
    this.buscarAlertas();
  }

  buscar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (data) => {
        this.itens.set(data);
        this.carregando.set(false);
      },
      error: () => {
        // Dado mockado temporário — TROCAR quando GET /api/convocacoes estiver de pé.
        this.itens.set([
          {
            id_convocacao: 1,
            codigo_unidade: '001',
            nome_unidade: 'EDI Vila Esperança (exemplo)',
            nome_responsavel: 'Maria da Silva',
            nome_crianca: 'João Silva',
            contato: '(21) 99999-0000',
            ano: 2026,
            grupamento: 'Berçário',
            status: 'CONVOCADO',
            prazo_resposta: '2026-09-02',
          },
        ]);
        this.carregando.set(false);
      },
    });
  }

  buscarAlertas(): void {
    this.service.alertasPrazo().subscribe({
      next: (data) => this.alertas.set(data),
      error: () => this.alertas.set([]),
    });
  }

  remover(item: Convocacao): void {
    if (!item.id_convocacao) return;
    if (!confirm(`Remover a convocação de ${item.nome_crianca}?`)) return;
    this.service.remover(item.id_convocacao).subscribe({
      next: () => {
        this.snackBar.open('Convocação removida.', 'Fechar', { duration: 3000 });
        this.buscar();
      },
      error: () => this.snackBar.open('Não foi possível remover (API indisponível).', 'Fechar', { duration: 3000 }),
    });
  }
}
