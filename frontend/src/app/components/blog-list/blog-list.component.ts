import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogEntriesService } from '../../services/blog-entries.service';
import { BlogEntry } from '../../models/blog-entry.model';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss']
})
export class BlogListComponent implements OnInit {
  entries: BlogEntry[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private blogService: BlogEntriesService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadEntries();
  }

  private async loadEntries(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.cdr.markForCheck();
      this.entries = await this.blogService.getAllEntries();
      console.log('Loaded entries:', this.entries);
    } catch (err) {
      this.error = 'Failed to load blog entries';
      console.error('Error loading entries:', err);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  getAuthorName(entry: BlogEntry): string {
    const author = entry.author;
    return author.name
      ? `${author.name.firstname} ${author.name.lastname}`
      : author.username;
  }

  formatDate(date?: Date): string {
    return date ? new Date(date).toLocaleDateString() : 'Unknown';
  }
}
