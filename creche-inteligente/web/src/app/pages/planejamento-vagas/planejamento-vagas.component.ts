import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanejamentoVagasService } from '../../services/planejamento-vagas.service';
import { PlanejamentoVaga } from '../../core/interfaces/planejamento-vaga.interface';

@Component({
  selector: 'app-planejamento-vagas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './planejamento-vagas.component.html',
  styleUrl: './planejamento-vagas.component.css',
})
export class PlanejamentoVagasComponent implements OnInit {
  private service = inject(PlanejamentoVagasService);
  private snackBar = inject(MatSnackBar);

  colunas = ['ano', 'codigo_unidade', 'nome_unidade', 'grupamento', 'turno', 'vagas_planejadas', 'acoes'];
  itens = signal<PlanejamentoVaga[]>([]);
  carregando = signal(false);

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (data) => {
        this.itens.set(data);
        this.carregando.set(false);
      },
      error: () => {
        // Dado mockado temporário — TROCAR quando GET /api/planejamento-vagas estiver de pé.
        this.itens.set([
          {
            id_planejamento: 1,
            ano: 2026,
            codigo_unidade: '001',
            nome_unidade: 'EDI Vila Esperança (exemplo)',
            grupamento: 'Berçário',
            turno: 'Integral',
            vagas_planejadas: 50,
          },
        ]);
        this.carregando.set(false);
      },
    });
  }

  remover(item: PlanejamentoVaga): void {
    if (!item.id_planejamento) return;
    if (!confirm(`Remover o planejamento de ${item.nome_unidade ?? item.codigo_unidade}?`)) return;
    this.service.remover(item.id_planejamento).subscribe({
      next: () => {
        this.snackBar.open('Planejamento removido.', 'Fechar', { duration: 3000 });
        this.buscar();
      },
      error: () => this.snackBar.open('Não foi possível remover (API indisponível).', 'Fechar', { duration: 3000 }),
    });
  }
}
