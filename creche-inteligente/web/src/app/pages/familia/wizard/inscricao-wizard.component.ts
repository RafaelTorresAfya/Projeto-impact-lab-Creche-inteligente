import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InscricaoFamiliaService } from '../../../services/inscricao-familia.service';
import { cpfValidator } from '../../../core/validators/cpf.validator';
import { UnidadeRecomendada } from '../../../core/interfaces/inscricao-familia.interface';

const BAIRROS = [
  'Bangu', 'Realengo', 'Padre Miguel', 'Campo Grande', 'Santa Cruz', 'Guaratiba',
  'Jacarepaguá', 'Barra da Tijuca', 'Recreio dos Bandeirantes', 'Madureira', 'Cascadura',
  'Irajá', 'Anchieta', 'Penha', 'Bonsucesso', 'Ilha do Governador', 'Méier', 'Del Castilho',
  'Vila Isabel', 'Tijuca', 'São Cristóvão', 'Centro', 'Cidade Nova', 'Botafogo', 'Copacabana',
  'Santa Teresa',
];

const TIPOS_ENDERECO = [
  { valor: 'residencia', rotulo: 'Residência da criança' },
  { valor: 'trabalho', rotulo: 'Trabalho do responsável' },
  { valor: 'estudo', rotulo: 'Estudo do responsável' },
  { valor: 'apoio', rotulo: 'Rede de apoio' },
  { valor: 'irmao', rotulo: 'Escola de irmão' },
];

const CRITERIOS = [
  { chave: 'violencia', fonte: 'documento', label: 'Criança em situação de violência ou com medida protetiva' },
  { chave: 'acolhimento', fonte: 'documento', label: 'Criança em acolhimento institucional ou sob guarda' },
  { chave: 'deficiencia', fonte: 'documento', label: 'Deficiência, TEA ou atraso global do desenvolvimento' },
  { chave: 'cadunico', fonte: 'automatica', label: 'CadÚnico ativo' },
  { chave: 'bolsa', fonte: 'automatica', label: 'Bolsa Família' },
  { chave: 'renda', fonte: 'declarada', label: 'Renda per capita de até meio salário mínimo' },
  { chave: 'monoparental', fonte: 'declarada', label: 'Família monoparental' },
  { chave: 'trabalho', fonte: 'documento', label: 'Responsável em trabalho formal, estudo ou qualificação' },
  { chave: 'irmao', fonte: 'automatica', label: 'Irmão já matriculado na unidade pretendida' },
];

@Component({
  selector: 'app-inscricao-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './inscricao-wizard.component.html',
  styleUrl: './inscricao-wizard.component.scss',
})
export class InscricaoWizardComponent {
  private fb = inject(FormBuilder);
  private service = inject(InscricaoFamiliaService);

  readonly bairros = BAIRROS;
  readonly tiposEndereco = TIPOS_ENDERECO;
  readonly criterios = CRITERIOS;

  passo = signal(0);
  passos = ['A criança', 'Endereços', 'Unidades', 'Comprovações', 'Contato', 'Revisão'];

  carregando = signal(false);
  erro = signal<string | null>(null);
  idInscricao = signal<number | null>(null);
  recomendacoes = signal<UnidadeRecomendada[]>([]);
  escolhasSelecionadas = signal<string[]>([]);
  pontuacaoTotal = signal(0);
  indiceAlcance = signal<{ total: number; faixa: string } | null>(null);
  protocoloGerado = signal<string | null>(null);

  criancaForm = this.fb.group({
    responsavel_cpf: ['', [Validators.required, cpfValidator()]],
    nome: ['', [Validators.required, Validators.minLength(4)]],
    cpf: [''],
    nascimento: ['', Validators.required],
    sexo: ['NAO_INFORMADO'],
    pcd: [false],
  });

  enderecosForm = this.fb.group({
    enderecos: this.fb.array([this.criarEndereco('residencia', 'alta')]),
  });

  foraForm = this.fb.group({
    ativo: [false],
    motivo: [''],
  });

  criteriosEstado: Record<string, boolean> = {};
  rendaValor: number | null = null;
  pessoasDomicilio: number | null = null;
  documentosEstado: Record<string, { status: string; confianca: number } | undefined> = {};

  contatoForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(4)]],
    cpf: ['', [Validators.required, cpfValidator()]],
    parentesco: ['', Validators.required],
    telefone: ['', Validators.required],
    whatsapp_ativo: [true],
    arroba_whatsapp: [''],
    arroba_status: ['nao_verificado'],
    email: [''],
    nome2: ['', [Validators.required, Validators.minLength(4)]],
    telefone2: ['', Validators.required],
    parentesco2: ['', Validators.required],
    canal_preferido: ['whatsapp'],
  });
  assistido = false;

  lgpdAceite = false;
  prazoAceite = false;

  get enderecosArray(): FormArray {
    return this.enderecosForm.get('enderecos') as FormArray;
  }

  private criarEndereco(tipo: string, prioridade: string) {
    return this.fb.group({
      tipo: [tipo, Validators.required],
      prioridade: [prioridade, Validators.required],
      bairro: ['', Validators.required],
      logradouro: [''],
      numero: [''],
      dias_semana: [5],
    });
  }

  adicionarEndereco(): void {
    if (this.enderecosArray.length >= 3) return;
    const usadas = this.enderecosArray.controls.map((c) => c.get('prioridade')?.value);
    const livre = ['alta', 'media', 'baixa'].find((p) => !usadas.includes(p)) || 'media';
    this.enderecosArray.push(this.criarEndereco('trabalho', livre));
  }

  removerEndereco(i: number): void {
    if (i === 0) return;
    this.enderecosArray.removeAt(i);
  }

  // ---- Passo 1: criança ----
  enviarCrianca(): void {
    if (this.criancaForm.invalid) {
      this.criancaForm.markAllAsTouched();
      return;
    }
    const v = this.criancaForm.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .criarRascunho(v.responsavel_cpf!, {
        nome: v.nome!,
        cpf: v.cpf || undefined,
        nascimento: v.nascimento!,
        sexo: v.sexo as any,
        pcd: !!v.pcd,
      })
      .subscribe({
        next: (res) => {
          this.idInscricao.set(res.id_inscricao);
          this.carregando.set(false);
          this.passo.set(1);
        },
        error: (err) => {
          this.carregando.set(false);
          this.erro.set(err?.error?.error || 'Não foi possível salvar os dados da criança.');
        },
      });
  }

  // ---- Passo 2: endereços ----
  enviarEnderecos(): void {
    if (this.enderecosForm.invalid) {
      this.enderecosForm.markAllAsTouched();
      return;
    }
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .atualizarEnderecos(this.idInscricao()!, responsavel_cpf, this.enderecosArray.value)
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.passo.set(2);
          this.carregarRecomendacoes();
        },
        error: (err) => {
          this.carregando.set(false);
          this.erro.set(err?.error?.error || 'Não foi possível salvar os endereços.');
        },
      });
  }

  // ---- Passo 3: unidades ----
  carregarRecomendacoes(): void {
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    this.carregando.set(true);
    this.service.recomendarUnidades(this.idInscricao()!, responsavel_cpf).subscribe({
      next: (lista) => {
        this.carregando.set(false);
        this.recomendacoes.set(lista);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.error || 'Não foi possível calcular as recomendações.');
      },
    });
  }

  alternarEscolha(codigo: string): void {
    const atual = this.escolhasSelecionadas();
    if (atual.includes(codigo)) {
      this.escolhasSelecionadas.set(atual.filter((c) => c !== codigo));
    } else if (atual.length < 3) {
      this.escolhasSelecionadas.set([...atual, codigo]);
    }
  }

  enviarEscolhas(): void {
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    const fora = this.foraForm.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .atualizarEscolhas(this.idInscricao()!, responsavel_cpf, this.escolhasSelecionadas(), {
        ativo: !!fora.ativo,
        motivo: fora.motivo || '',
      })
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.passo.set(3);
        },
        error: (err) => {
          this.carregando.set(false);
          this.erro.set(err?.error?.error || 'Não foi possível salvar as unidades escolhidas.');
        },
      });
  }

  // ---- Passo 4: comprovações ----
  consultarBasesAutomaticas(): void {
    this.salvarCriterios(true);
  }

  toggleCriterio(chave: string): void {
    this.criteriosEstado[chave] = !this.criteriosEstado[chave];
    this.salvarCriterios(false);
  }

  simularUploadDocumento(chave: string, arquivo: File | null): void {
    if (!arquivo) return;
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    this.service
      .simularDocumento(this.idInscricao()!, responsavel_cpf, chave, arquivo.name, arquivo.size)
      .subscribe({
        next: (res) => {
          this.documentosEstado[chave] = { status: res.status, confianca: res.confianca };
          this.pontuacaoTotal.set(res.pontuacao_total);
        },
        error: (err) => this.erro.set(err?.error?.error || 'Não foi possível processar o documento.'),
      });
  }

  private salvarCriterios(executarConsulta: boolean): void {
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    const criterios: Record<string, { on: boolean }> = {};
    for (const c of this.criterios) {
      criterios[c.chave] = { on: !!this.criteriosEstado[c.chave] };
    }
    this.carregando.set(true);
    this.service
      .atualizarCriterios(this.idInscricao()!, responsavel_cpf, {
        executar_consulta_automatica: executarConsulta,
        criterios,
        renda_valor: this.rendaValor || undefined,
        pessoas_domicilio: this.pessoasDomicilio || undefined,
      })
      .subscribe({
        next: (res) => {
          this.carregando.set(false);
          this.pontuacaoTotal.set(res.pontuacao_total);
          if (res.consulta_automatica) {
            this.criteriosEstado['cadunico'] = res.consulta_automatica.cadunico;
            this.criteriosEstado['bolsa'] = res.consulta_automatica.bolsa;
          }
        },
        error: (err) => {
          this.carregando.set(false);
          this.erro.set(err?.error?.error || 'Não foi possível salvar as comprovações.');
        },
      });
  }

  avancarParaContato(): void {
    this.passo.set(4);
  }

  // ---- Passo 5: contato ----
  enviarContato(): void {
    if (this.contatoForm.invalid) {
      this.contatoForm.markAllAsTouched();
      return;
    }
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    const v = this.contatoForm.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .atualizarContato(
        this.idInscricao()!,
        responsavel_cpf,
        {
          nome: v.nome!,
          cpf: v.cpf!,
          parentesco: v.parentesco!,
          telefone: v.telefone!,
          whatsapp_ativo: !!v.whatsapp_ativo,
          arroba_whatsapp: v.arroba_whatsapp || undefined,
          arroba_status: v.arroba_status as any,
          email: v.email || undefined,
          nome2: v.nome2!,
          telefone2: v.telefone2!,
          parentesco2: v.parentesco2!,
          canal_preferido: v.canal_preferido as any,
        },
        this.assistido,
      )
      .subscribe({
        next: (res) => {
          this.carregando.set(false);
          this.indiceAlcance.set(res.indice_alcance);
          this.passo.set(5);
        },
        error: (err) => {
          this.carregando.set(false);
          this.erro.set(err?.error?.error || 'Não foi possível salvar o contato.');
        },
      });
  }

  // ---- Passo 6: revisão e envio ----
  concluirInscricao(): void {
    if (!this.lgpdAceite || !this.prazoAceite) {
      this.erro.set('É preciso aceitar os termos de privacidade e o prazo de convocação.');
      return;
    }
    const responsavel_cpf = this.criancaForm.value.responsavel_cpf!;
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .enviarInscricao(this.idInscricao()!, responsavel_cpf, this.lgpdAceite, this.prazoAceite)
      .subscribe({
        next: (res) => {
          this.carregando.set(false);
          this.protocoloGerado.set(res.protocolo);
          this.pontuacaoTotal.set(res.pontuacao_total);
        },
        error: (err) => {
          this.carregando.set(false);
          this.erro.set(err?.error?.error || 'Não foi possível concluir a inscrição.');
        },
      });
  }

  irParaPasso(i: number): void {
    if (i <= this.passo() || this.protocoloGerado()) this.passo.set(i);
  }
}
