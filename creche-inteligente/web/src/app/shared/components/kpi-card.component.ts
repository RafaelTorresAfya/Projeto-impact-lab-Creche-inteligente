import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card class="kpi-card">
      <mat-icon class="kpi-icon">{{ icon }}</mat-icon>
      <div class="kpi-body">
        <span class="kpi-value">{{ value }}</span>
        <span class="kpi-label">{{ label }}</span>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .kpi-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        min-width: 220px;
      }
      .kpi-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--color-primary);
      }
      .kpi-body {
        display: flex;
        flex-direction: column;
      }
      .kpi-value {
        font-size: 28px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
      }
      .kpi-label {
        font-size: 13px;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() icon = 'insights';
}
