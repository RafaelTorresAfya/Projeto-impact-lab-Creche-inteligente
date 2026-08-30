import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { PlanejamentoVagasService } from '../../services/planejamento-vagas.service';
import { UnidadesEscolaresService } from '../../services/unidades-escolares.service';
import { InscricoesResumoService } from '../../services/inscricoes-resumo.service';
import { UnidadeEscolar } from '../../core/interfaces/unidade-escolar.interface';
import { InscricaoResumo } from '../../core/interfaces/inscricao-resumo.interface';

@Component({
  selector: 'app-planejamento-vagas-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './planejamento-vagas-form.component.html',
  styleUrl: './planejamento-vagas-form.component.css',
})
export class PlanejamentoVagasFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(PlanejamentoVagasService);
  private unidadesService = inject(UnidadesEscolaresService);
  private inscricoesService = inject(InscricoesResumoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  anos = [2024, 2025, 2026, 2027];
  grupamentos = ['Berçário', 'Maternal I', 'Maternal II'];
  turnos = ['Integral', 'Parcial - Manhã', 'Parcial - Tarde'];

  unidades = signal<UnidadeEscolar[]>([]);
  idEdicao: number | null = null;
  salvando = signal(false);

  filaAnoAnterior = signal<InscricaoResumo[] | null>(null);
  buscandoFila = signal(false);
  totalFilaAnoAnterior = signal<number | null>(null);

  form = this.fb.group({
    ano: [2026, Validators.required],
    codigo_unidade: ['', Validators.required],
    grupamento: ['', Validators.required],
    turno: ['', Validators.required],
    vagas_planejadas: [0, [Validators.required, Validators.min(0)]],
    observacao: [''],
  });

  ngOnInit(): void {
    this.unidadesService.listar().subscribe({
      next: (u) => this.unidades.set(u),
      error: () =>
        this.unidades.set([
          {
            codigo_unidade: '001',
            nome: 'EDI Vila Esperança (exemplo)',
            tipo: 'EDI',
            id_cre: '5ª CRE',
            cod_territ: 'T001',
            logradouro: '',
            bairro: '',
            cep: '',
          },
        ]),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idEdicao = Number(idParam);
      this.service.obter(this.idEdicao).subscribe({
        next: (p) => this.form.patchValue(p),
      });
    }

    // Sempre que unidade ou ano mudarem, busca a fila do ano anterior para apoiar a decisão.
    this.form.valueChanges.pipe(debounceTime(150)).subscribe(() => this.buscarFilaAnoAnterior());
    this.buscarFilaAnoAnterior();
  }

  private buscarFilaAnoAnterior(): void {
    const { ano, codigo_unidade } = this.form.getRawValue();
    if (!ano || !codigo_unidade) {
      this.filaAnoAnterior.set(null);
      this.totalFilaAnoAnterior.set(null);
      return;
    }
    this.buscandoFila.set(true);
    this.inscricoesService
      .listar({ ano: ano - 1, codigo_unidade, situacao: 'Lista de espera' })
      .subscribe({
        next: (itens) => {
          this.filaAnoAnterior.set(itens);
          this.totalFilaAnoAnterior.set(itens.reduce((acc, i) => acc + i.qtd_inscricoes, 0));
          this.buscandoFila.set(false);
        },
        error: () => {
          // Dado mockado temporário — TROCAR quando GET /api/inscricoes-resumo estiver de pé.
          const mock: InscricaoResumo[] = [
            {
              ano: ano - 1,
              codigo_unidade,
              grupamento: 'Berçário',
              horario: 'Integral',
              situacao: 'Lista de espera',
              qtd_inscricoes: 38,
              qtd_criancas_distintas: 35,
              opcao_media: 1.2,
            },
          ];
          this.filaAnoAnterior.set(mock);
          this.totalFilaAnoAnterior.set(38);
          this.buscandoFila.set(false);
        },
      });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const payload = this.form.getRawValue() as any;
    const obs$ = this.idEdicao
      ? this.service.atualizar(this.idEdicao, payload)
      : this.service.criar(payload);

    obs$.subscribe({
      next: () => {
        this.snackBar.open('Planejamento salvo com sucesso.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/planejamento-vagas']);
      },
      error: () => {
        this.salvando.set(false);
        this.snackBar.open('Não foi possível salvar (API indisponível no momento).', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/planejamento-vagas']);
  }
}
