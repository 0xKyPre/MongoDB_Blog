import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlogEntriesService } from '../../services/blog-entries.service';
import { User } from '../../models/user.model';
import { BlogEntry } from '../../models/blog-entry.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  currentUser: User | null = null;
  userEntries: BlogEntry[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private blogService: BlogEntriesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const stored = sessionStorage.getItem('currentUser');
    this.currentUser = stored ? JSON.parse(stored) : null;
  }

  async ngOnInit(): Promise<void> {
    if (!this.currentUser) {
      await this.router.navigate(['/login']);
      return;
    }
    await this.loadUserEntries();
  }

  private async loadUserEntries(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.cdr.markForCheck();
      this.userEntries = await this.blogService.getEntriesByAuthor(
        this.currentUser!.username
      );
      console.log('Loaded user entries:', this.userEntries);
    } catch (err) {
      this.error = 'Failed to load your entries';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }

  formatDate(date?: Date): string {
    return date ? new Date(date).toLocaleDateString() : 'Unknown';
  }
}
