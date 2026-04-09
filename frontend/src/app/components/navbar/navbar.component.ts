import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <span class="spacer">Blog App</span>
      <button mat-button routerLink="/blog-list" routerLinkActive="active">Read Blogs</button>
      <button mat-button routerLink="/blog-form" routerLinkActive="active">Create Blog</button>
      <button mat-button routerLink="/profile" routerLinkActive="active">Profile</button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
      font-weight: 500;
    }
    button {
      margin: 0 0.5rem;
    }
  `]
})
export class NavbarComponent {}
