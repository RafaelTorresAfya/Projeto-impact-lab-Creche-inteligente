import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConvocacoesService } from '../../services/convocacoes.service';
import { UnidadesEscolaresService } from '../../services/unidades-escolares.service';
import { UnidadeEscolar } from '../../core/interfaces/unidade-escolar.interface';

@Component({
  selector: 'app-convocacoes-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './convocacoes-form.component.html',
  styleUrl: './convocacoes-form.component.css',
})
export class ConvocacoesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ConvocacoesService);
  private unidadesService = inject(UnidadesEscolaresService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  unidades = signal<UnidadeEscolar[]>([]);
  idEdicao: number | null = null;
  salvando = signal(false);

  grupamentos = ['Berçário', 'Maternal I', 'Maternal II'];
  statusOpcoes = ['AGUARDANDO_CONVOCACAO', 'CONVOCADO', 'CONFIRMADO', 'MATRICULADO', 'DESISTIU', 'EXPIRADO'];

  form = this.fb.group({
    codigo_unidade: ['', Validators.required],
    nome_responsavel: ['', Validators.required],
    nome_crianca: ['', Validators.required],
    contato: ['', Validators.required],
    ano: [new Date().getFullYear(), Validators.required],
    grupamento: ['', Validators.required],
    status: ['AGUARDANDO_CONVOCACAO', Validators.required],
    data_convocacao: [''],
    prazo_resposta: [''],
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
        next: (c) => this.form.patchValue(c),
      });
    }
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
        this.snackBar.open('Convocação salva com sucesso.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/convocacoes']);
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
    this.router.navigate(['/convocacoes']);
  }
}
