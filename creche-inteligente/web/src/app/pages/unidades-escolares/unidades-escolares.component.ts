import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UnidadesEscolaresService } from '../../services/unidades-escolares.service';
import { UnidadeEscolar } from '../../core/interfaces/unidade-escolar.interface';

@Component({
  selector: 'app-unidades-escolares',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './unidades-escolares.component.html',
  styleUrl: './unidades-escolares.component.css',
})
export class UnidadesEscolaresComponent implements OnInit {
  private service = inject(UnidadesEscolaresService);

  colunas = ['codigo_unidade', 'nome', 'tipo', 'id_cre', 'bairro', 'logradouro'];
  unidades = signal<UnidadeEscolar[]>([]);
  carregando = signal(false);

  busca = '';
  cre = '';
  tipo = '';

  cres = ['1ª CRE', '2ª CRE', '3ª CRE', '4ª CRE', '5ª CRE', '6ª CRE', '7ª CRE', '8ª CRE', '9ª CRE', '10ª CRE', '11ª CRE'];
  tipos = ['Creche', 'EDI', 'EM com creche'];

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.carregando.set(true);
    this.service.listar({ busca: this.busca, cre: this.cre, tipo: this.tipo }).subscribe({
      next: (data) => {
        this.unidades.set(data);
        this.carregando.set(false);
      },
      error: () => {
        // Dado mockado temporário — TROCAR quando GET /api/unidades-escolares estiver de pé.
        this.unidades.set([
          {
            codigo_unidade: '001',
            nome: 'EDI Vila Esperança (exemplo)',
            tipo: 'EDI',
            id_cre: '5ª CRE',
            cod_territ: 'T001',
            logradouro: 'Rua das Flores, 100',
            bairro: 'Realengo',
            cep: '21710-000',
          },
        ]);
        this.carregando.set(false);
      },
    });
  }
}
