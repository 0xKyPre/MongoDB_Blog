import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogEntriesService } from '../../services/blog-entries.service';
import { BlogEntry } from '../../models/blog-entry.model';
import { Comment } from '../../models/comment.model';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss']
})
export class BlogDetailComponent implements OnInit {
  entry: BlogEntry | null = null;
  loading = true;
  error: string | null = null;
  commentText = '';
  commentAuthor = '';

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogEntriesService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadEntry(id);
    }
  }

  private async loadEntry(id: string): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.cdr.markForCheck();
      this.entry = await this.blogService.getEntryById(id);
      console.log('Loaded entry:', this.entry);
    } catch (err) {
      this.error = 'Failed to load blog entry';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async submitComment(): Promise<void> {
    if (!this.entry || !this.commentText.trim() || !this.commentAuthor.trim()) {
      return;
    }

    try {
      const comment: Comment = {
        author: this.commentAuthor,
        text: this.commentText
      };
      await this.blogService.addComment(this.entry._id!, comment);
      this.commentText = '';
      this.commentAuthor = '';
      await this.loadEntry(this.entry._id!);
    } catch (err) {
      console.error('Failed to submit comment', err);
    }
  }

  getAuthorName(): string {
    if (!this.entry) return '';
    const author = this.entry.author;
    return author.name
      ? `${author.name.firstname} ${author.name.lastname}`
      : author.username;
  }

  formatDate(date?: Date): string {
    return date ? new Date(date).toLocaleDateString() : 'Unknown';
  }
}
