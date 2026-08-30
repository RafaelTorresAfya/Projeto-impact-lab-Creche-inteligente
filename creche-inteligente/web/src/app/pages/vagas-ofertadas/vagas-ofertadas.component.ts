import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VagasOfertadasService } from '../../services/vagas-ofertadas.service';
import { VagaOfertada } from '../../core/interfaces/vaga-ofertada.interface';

@Component({
  selector: 'app-vagas-ofertadas',
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
  templateUrl: './vagas-ofertadas.component.html',
  styleUrl: './vagas-ofertadas.component.css',
})
export class VagasOfertadasComponent implements OnInit {
  private service = inject(VagasOfertadasService);

  colunas = ['ano', 'mes_referencia', 'codigo_unidade', 'nome_unidade_bruto', 'fonte', 'turno', 'alunos_matriculados', 'turmas'];
  itens = signal<VagaOfertada[]>([]);
  carregando = signal(false);

  anos = [2021, 2022, 2023, 2024, 2025];
  fontes = ['SME', 'Censo Escolar', 'Planejamento'];

  ano: number | '' = 2025;
  fonte = '';
  codigoUnidade = '';

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.carregando.set(true);
    this.service
      .listar({ ano: this.ano || undefined, fonte: this.fonte || undefined, codigo_unidade: this.codigoUnidade || undefined })
      .subscribe({
        next: (data) => {
          this.itens.set(data);
          this.carregando.set(false);
        },
        error: () => {
          // Dado mockado temporário — TROCAR quando GET /api/vagas-ofertadas estiver de pé.
          this.itens.set([
            {
              ano: 2025,
              mes_referencia: '2025-03',
              codigo_unidade: '001',
              nome_unidade_bruto: 'EDI VILA ESPERANCA',
              fonte: 'SME',
              grupamento: 'Berçário',
              turno: 'Integral',
              alunos_matriculados: 40,
              turmas: 2,
            },
          ]);
          this.carregando.set(false);
        },
      });
  }
}
