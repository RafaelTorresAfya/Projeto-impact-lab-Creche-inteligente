import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { KpiCardComponent } from '../../shared/components/kpi-card.component';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardKpis } from '../../core/interfaces/dashboard-kpis.interface';
import { CATEGORICAL, INK } from '../../shared/palette';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    KpiCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  anos = [2021, 2022, 2023, 2024, 2025];
  cres = ['1ª CRE', '2ª CRE', '3ª CRE', '4ª CRE', '5ª CRE', '6ª CRE', '7ª CRE', '8ª CRE', '9ª CRE', '10ª CRE', '11ª CRE'];

  anoSelecionado = signal<number>(2025);
  creSelecionada = signal<string>('');
  carregando = signal(false);
  erro = signal(false);
  kpis = signal<DashboardKpis | null>(null);

  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: {
      x: { title: { display: true, text: 'Ano' } },
      y: { title: { display: true, text: 'Quantidade' }, beginAtZero: true },
    },
  };

  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Descompasso (fila − vagas)' }, beginAtZero: true },
      y: { title: { display: false, text: '' } },
    },
  };

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.dashboardService
      .getKpis({ ano: this.anoSelecionado(), cre: this.creSelecionada() || undefined })
      .subscribe({
        next: (data) => {
          this.kpis.set(data);
          this.montarGraficos(data);
          this.carregando.set(false);
        },
        error: () => {
          // API pode ainda não estar de pé — usa dado mockado temporário para não travar a demo.
          const mock = this.mockKpis();
          this.kpis.set(mock);
          this.montarGraficos(mock);
          this.carregando.set(false);
          this.erro.set(true);
        },
      });
  }

  private montarGraficos(data: DashboardKpis): void {
    this.lineChartData = {
      labels: data.serie_historica.map((s) => String(s.ano)),
      datasets: [
        {
          label: 'Total de inscrições',
          data: data.serie_historica.map((s) => s.total_inscricoes),
          borderColor: CATEGORICAL[0],
          backgroundColor: CATEGORICAL[0],
          tension: 0.25,
        },
        {
          label: 'Lista de espera',
          data: data.serie_historica.map((s) => s.qtd_lista_espera),
          borderColor: CATEGORICAL[1],
          backgroundColor: CATEGORICAL[1],
          tension: 0.25,
        },
      ],
    };

    const ranking = [...data.ranking_unidades].sort((a, b) => b.descompasso - a.descompasso).slice(0, 10);
    this.barChartData = {
      labels: ranking.map((r) => r.nome),
      datasets: [
        {
          label: 'Descompasso',
          data: ranking.map((r) => r.descompasso),
          backgroundColor: CATEGORICAL[0],
        },
      ],
    };
  }

  // Dado mockado temporário — TROCAR quando GET /api/dashboard/kpis estiver disponível.
  private mockKpis(): DashboardKpis {
    return {
      total_inscricoes: 4820,
      pct_lista_espera: 0.34,
      pct_confirmado: 0.51,
      ranking_unidades: [
        { codigo_unidade: '001', nome: 'EDI Vila Esperança', qtd_lista_espera: 210, alunos_matriculados: 90, descompasso: 120 },
        { codigo_unidade: '002', nome: 'Creche Municipal Girassol', qtd_lista_espera: 180, alunos_matriculados: 100, descompasso: 80 },
        { codigo_unidade: '003', nome: 'EDI Arco-Íris', qtd_lista_espera: 150, alunos_matriculados: 95, descompasso: 55 },
        { codigo_unidade: '004', nome: 'Creche Cantinho Feliz', qtd_lista_espera: 120, alunos_matriculados: 80, descompasso: 40 },
        { codigo_unidade: '005', nome: 'EDI Pequeno Príncipe', qtd_lista_espera: 100, alunos_matriculados: 90, descompasso: 10 },
      ],
      serie_historica: [
        { ano: 2021, total_inscricoes: 3800, qtd_lista_espera: 1400 },
        { ano: 2022, total_inscricoes: 4000, qtd_lista_espera: 1500 },
        { ano: 2023, total_inscricoes: 4300, qtd_lista_espera: 1550 },
        { ano: 2024, total_inscricoes: 4600, qtd_lista_espera: 1620 },
        { ano: 2025, total_inscricoes: 4820, qtd_lista_espera: 1640 },
      ],
    };
  }
}
