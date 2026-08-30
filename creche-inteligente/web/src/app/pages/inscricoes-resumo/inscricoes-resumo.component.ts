import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InscricoesResumoService } from '../../services/inscricoes-resumo.service';
import { InscricaoResumo } from '../../core/interfaces/inscricao-resumo.interface';

@Component({
  selector: 'app-inscricoes-resumo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './inscricoes-resumo.component.html',
  styleUrl: './inscricoes-resumo.component.css',
})
export class InscricoesResumoComponent implements OnInit {
  private service = inject(InscricoesResumoService);

  colunas = ['ano', 'codigo_unidade', 'grupamento', 'horario', 'situacao', 'qtd_inscricoes', 'qtd_criancas_distintas'];
  itens = signal<InscricaoResumo[]>([]);
  carregando = signal(false);

  anos = [2021, 2022, 2023, 2024, 2025];
  situacoes = ['Lista de espera', 'Confirmado', 'Matriculado', 'Desistiu'];

  ano: number | '' = 2025;
  codigoUnidade = '';
  situacao = '';

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.carregando.set(true);
    this.service
      .listar({ ano: this.ano || undefined, codigo_unidade: this.codigoUnidade || undefined, situacao: this.situacao || undefined })
      .subscribe({
        next: (data) => {
          this.itens.set(data);
          this.carregando.set(false);
        },
        error: () => {
          // Dado mockado temporário — TROCAR quando GET /api/inscricoes-resumo estiver de pé.
          this.itens.set([
            {
              ano: 2025,
              codigo_unidade: '001',
              grupamento: 'Berçário',
              horario: 'Integral',
              situacao: 'Lista de espera',
              qtd_inscricoes: 45,
              qtd_criancas_distintas: 40,
              opcao_media: 1.3,
            },
          ]);
          this.carregando.set(false);
        },
      });
  }
}
