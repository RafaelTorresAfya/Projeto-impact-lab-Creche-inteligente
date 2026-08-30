import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-familia-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './familia-shell.component.html',
  styleUrl: './familia-shell.component.scss',
})
export class FamiliaShellComponent {}
