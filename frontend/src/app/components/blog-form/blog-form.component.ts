import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogEntriesService } from '../../services/blog-entries.service';
import { UserService } from '../../services/user.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { BlogEntry, ContentBlock } from '../../models/blog-entry.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-blog-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog-form.component.html',
  styleUrls: ['./blog-form.component.scss']
})
export class BlogFormComponent implements OnInit {
  form: Partial<BlogEntry> = { content: [], categories: [] };
  categoriesString = '';
  users: User[] = [];
  loading = false;
  submitError: string | null = null;
  isEdit = false;
  contentBlocks: ContentBlock[] = [];
  imageError: string | null = null;

  constructor(
    private blogService: BlogEntriesService,
    private userService: UserService,
    private imageUploadService: ImageUploadService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadEntry(id);
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      this.users = await this.userService.getAllUsers();
    } catch (err) {
      console.error('Failed to load users', err);
    }
  }

  private async loadEntry(id: string): Promise<void> {
    try {
      const entry = await this.blogService.getEntryById(id);
      this.form = { ...entry };
      this.contentBlocks = entry.content || [];
      this.categoriesString = Array.isArray(entry.categories) ? entry.categories.join(', ') : '';
      this.isEdit = true;
      this.cdr.markForCheck();
    } catch (err) {
      this.submitError = 'Failed to load entry';
      this.cdr.markForCheck();
    }
  }

  addContentBlock(type: 'text' | 'link' | 'image'): void {
    this.contentBlocks.push({ type, data: '' });
  }

  removeContentBlock(index: number): void {
    this.contentBlocks.splice(index, 1);
  }

  async onImagefileSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const validation = this.imageUploadService.validateImageFile(file);
    if (!validation.valid) {
      this.imageError = validation.error || 'Invalid image';
      this.cdr.markForCheck();
      return;
    }

    try {
      const base64 = await this.imageUploadService.fileToBase64(file);
      this.contentBlocks[index].data = base64;
      this.imageError = null;
      this.cdr.markForCheck();
      console.log('Image compressed and loaded:', {
        originalSize: file.size,
        compressedSize: base64.length
      });
      input.value = '';
    } catch (err) {
      this.imageError = 'Failed to upload image';
      this.cdr.markForCheck();
    }
  }

  async submitForm(): Promise<void> {
    if (!this.form.title) {
      this.submitError = 'Title is required';
      return;
    }

    try {
      this.loading = true;
      this.submitError = null;
      this.form.content = this.contentBlocks;
      this.form.categories = this.categoriesString
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      if (this.isEdit && this.form._id) {
        await this.blogService.updateEntry(this.form._id, this.form);
      } else {
        await this.blogService.createEntry(this.form as BlogEntry);
      }
      await this.router.navigate(['/blog-list']);
    } catch (err) {
      this.submitError = 'Failed to save entry';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
    }
  }
}
