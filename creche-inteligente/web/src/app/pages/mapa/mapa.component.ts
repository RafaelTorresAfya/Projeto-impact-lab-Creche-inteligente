import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { environment } from '../../core/environment/environment';
import { UnidadesEscolaresService } from '../../services/unidades-escolares.service';
import { MicroareasService } from '../../services/microareas.service';
import { DominioTerritorialService } from '../../services/dominio-territorial.service';
import { InscricoesResumoService } from '../../services/inscricoes-resumo.service';
import { corSequencial } from '../../shared/palette';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css',
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapaEl', { static: true }) mapaEl!: ElementRef<HTMLDivElement>;

  private unidadesService = inject(UnidadesEscolaresService);
  private microareasService = inject(MicroareasService);
  private dominioService = inject(DominioTerritorialService);
  private inscricoesService = inject(InscricoesResumoService);

  private mapa!: L.Map;
  private camadaUnidades = L.layerGroup();
  private camadaMicroareas = L.layerGroup();
  private camadaDominio = L.layerGroup();

  anos = [2021, 2022, 2023, 2024, 2025];
  anoSelecionado = signal<number>(2025);

  mostrarUnidades = signal(true);
  mostrarMicroareas = signal(true);
  mostrarDominio = signal(false);
  avisoDominio = signal(false);

  ngAfterViewInit(): void {
    this.mapa = L.map(this.mapaEl.nativeElement).setView([-22.9, -43.2], 11);

    // Tiles servidos/cacheados pela própria API (evita chamar tile server externo direto).
    L.tileLayer(`${environment.tilesUrl}/{z}/{x}/{y}.png`, {
      maxZoom: 18,
      attribution: '© Prefeitura do Rio · Creche Inteligente',
    }).addTo(this.mapa);

    this.camadaUnidades.addTo(this.mapa);
    this.camadaMicroareas.addTo(this.mapa);

    this.carregarUnidades();
    this.carregarMicroareasComFila();
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  onToggleUnidades(ligado: boolean): void {
    this.mostrarUnidades.set(ligado);
    if (ligado) {
      this.camadaUnidades.addTo(this.mapa);
    } else {
      this.mapa.removeLayer(this.camadaUnidades);
    }
  }

  onToggleMicroareas(ligado: boolean): void {
    this.mostrarMicroareas.set(ligado);
    if (ligado) {
      this.camadaMicroareas.addTo(this.mapa);
    } else {
      this.mapa.removeLayer(this.camadaMicroareas);
    }
  }

  onToggleDominio(ligado: boolean): void {
    this.mostrarDominio.set(ligado);
    this.avisoDominio.set(ligado);
    if (ligado) {
      if (this.camadaDominio.getLayers().length === 0) {
        this.carregarDominioTerritorial();
      }
      this.camadaDominio.addTo(this.mapa);
    } else {
      this.mapa.removeLayer(this.camadaDominio);
    }
  }

  private carregarUnidades(): void {
    this.unidadesService.geojson().subscribe({
      next: (fc) => this.desenharUnidades(fc),
      error: () => this.desenharUnidades(this.mockGeojsonUnidades()),
    });
  }

  private desenharUnidades(fc: GeoJSON.FeatureCollection): void {
    this.camadaUnidades.clearLayers();
    const camada = L.geoJSON(fc, {
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          color: '#2a78d6',
          weight: 1,
          fillColor: '#2a78d6',
          fillOpacity: 0.85,
        }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties ?? {};
        layer.bindPopup(
          `<strong>${p['nome'] ?? 'Unidade'}</strong><br/>` +
            `Tipo: ${p['tipo'] ?? '-'}<br/>` +
            `CRE: ${p['id_cre'] ?? '-'}`,
        );
      },
    });
    camada.addTo(this.camadaUnidades);
  }

  carregarMicroareasComFila(): void {
    // Cruza microáreas (polígonos) com o total de "Lista de espera" das unidades daquela microárea,
    // usando cod_territ como chave comum — feito no front porque o volume de dados é pequeno.
    this.microareasService.geojson().subscribe({
      next: (fc) => this.montarMicroareas(fc),
      error: () => this.montarMicroareas(this.mockGeojsonMicroareas()),
    });
  }

  private montarMicroareas(fc: GeoJSON.FeatureCollection): void {
    this.unidadesService.listar().subscribe({
      next: (unidades) => this.desenharMicroareas(fc, unidades),
      error: () => this.desenharMicroareas(fc, []),
    });
  }

  private desenharMicroareas(fc: GeoJSON.FeatureCollection, unidades: { codigo_unidade: string; cod_territ: string }[]): void {
    this.inscricoesService.listar({ ano: this.anoSelecionado(), situacao: 'Lista de espera' }).subscribe({
      next: (inscricoes) => {
        const filaPorUnidade = new Map<string, number>();
        for (const i of inscricoes) {
          filaPorUnidade.set(i.codigo_unidade, (filaPorUnidade.get(i.codigo_unidade) ?? 0) + i.qtd_inscricoes);
        }
        const territPorUnidade = new Map(unidades.map((u) => [u.codigo_unidade, u.cod_territ]));
        const filaPorTerritorio = new Map<string, number>();
        for (const [codUnidade, fila] of filaPorUnidade) {
          const territ = territPorUnidade.get(codUnidade);
          if (!territ) continue;
          filaPorTerritorio.set(territ, (filaPorTerritorio.get(territ) ?? 0) + fila);
        }

        const maxFila = Math.max(1, ...Array.from(filaPorTerritorio.values()));

        this.camadaMicroareas.clearLayers();
        const camada = L.geoJSON(fc, {
          style: (feature) => {
            const territ = feature?.properties?.['cod_territ'];
            const fila = filaPorTerritorio.get(territ) ?? 0;
            return {
              color: '#184f95',
              weight: 1,
              fillColor: corSequencial(fila / maxFila),
              fillOpacity: 0.55,
            };
          },
          onEachFeature: (feature, layer) => {
            const territ = feature.properties?.['cod_territ'];
            const fila = filaPorTerritorio.get(territ) ?? 0;
            layer.bindPopup(
              `<strong>Microárea ${territ ?? '-'}</strong><br/>Lista de espera: ${fila}`,
            );
          },
        });
        camada.addTo(this.camadaMicroareas);
      },
    });
  }

  private carregarDominioTerritorial(): void {
    this.dominioService.geojson().subscribe({
      next: (fc) => this.desenharDominio(fc),
      error: () => this.desenharDominio(this.mockGeojsonDominio()),
    });
  }

  private desenharDominio(fc: GeoJSON.FeatureCollection): void {
    const camada = L.geoJSON(fc, {
      style: { color: '#4a3aa7', weight: 1, fillOpacity: 0.1, dashArray: '4' },
      onEachFeature: (feature, layer) => {
        const p = feature.properties ?? {};
        layer.bindPopup(`<strong>${p['nome_territorio'] ?? '-'}</strong><br/>${p['tipo_dominio'] ?? '-'}`);
      },
    });
    camada.addTo(this.camadaDominio);
  }

  // Dado mockado temporário — TROCAR quando /api/unidades-escolares/geojson estiver de pé.
  private mockGeojsonUnidades(): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { nome: 'EDI Vila Esperança (exemplo)', tipo: 'EDI', id_cre: '5ª CRE' },
          geometry: { type: 'Point', coordinates: [-43.36, -22.88] },
        },
        {
          type: 'Feature',
          properties: { nome: 'Creche Girassol (exemplo)', tipo: 'Creche', id_cre: '3ª CRE' },
          geometry: { type: 'Point', coordinates: [-43.22, -22.9] },
        },
      ],
    };
  }

  // Dado mockado temporário — TROCAR quando /api/microareas/geojson estiver de pé.
  private mockGeojsonMicroareas(): GeoJSON.FeatureCollection {
    return { type: 'FeatureCollection', features: [] };
  }

  // Dado mockado temporário — TROCAR quando /api/dominio-territorial/geojson estiver de pé.
  private mockGeojsonDominio(): GeoJSON.FeatureCollection {
    return { type: 'FeatureCollection', features: [] };
  }
}
