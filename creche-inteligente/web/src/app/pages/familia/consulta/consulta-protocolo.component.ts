import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConsultaProtocoloService } from '../../../services/consulta-protocolo.service';
import { StatusInscricao } from '../../../core/interfaces/inscricao-familia.interface';

@Component({
  selector: 'app-consulta-protocolo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './consulta-protocolo.component.html',
  styleUrl: './consulta-protocolo.component.scss',
})
export class ConsultaProtocoloComponent {
  private fb = inject(FormBuilder);
  private service = inject(ConsultaProtocoloService);

  form = this.fb.group({
    protocolo: ['', Validators.required],
    cpf: ['', Validators.required],
  });

  carregando = signal(false);
  erro = signal<string | null>(null);
  status = signal<StatusInscricao | null>(null);
  motivoRecusa = '';

  consultar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { protocolo, cpf } = this.form.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);
    this.service.consultar(protocolo!, cpf!).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.status.set(res);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.error || 'Não encontramos inscrição com esse protocolo e CPF.');
      },
    });
  }

  aceitar(): void {
    const { protocolo, cpf } = this.form.getRawValue();
    this.carregando.set(true);
    this.service.aceitar(protocolo!, cpf!).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.status.set(res);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.error || 'Não foi possível confirmar.');
      },
    });
  }

  recusar(): void {
    const { protocolo, cpf } = this.form.getRawValue();
    this.carregando.set(true);
    this.service.recusar(protocolo!, cpf!, this.motivoRecusa).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.status.set(res);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.error || 'Não foi possível registrar a recusa.');
      },
    });
  }
}
