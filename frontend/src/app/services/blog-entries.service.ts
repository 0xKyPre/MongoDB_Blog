import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BlogEntry } from '../models/blog-entry.model';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class BlogEntriesService {
  private apiUrl = 'http://localhost:5000/entries';

  constructor(private http: HttpClient) {}

  async getAllEntries(): Promise<BlogEntry[]> {
    return firstValueFrom(this.http.get<BlogEntry[]>(this.apiUrl));
  }

  async getEntryById(id: string): Promise<BlogEntry> {
    return firstValueFrom(this.http.get<BlogEntry>(`${this.apiUrl}/${id}`));
  }

  async createEntry(entry: BlogEntry): Promise<BlogEntry> {
    return firstValueFrom(this.http.post<BlogEntry>(this.apiUrl, entry));
  }

  async updateEntry(id: string, entry: Partial<BlogEntry>): Promise<BlogEntry> {
    return firstValueFrom(this.http.put<BlogEntry>(`${this.apiUrl}/${id}`, entry));
  }

  async deleteEntry(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }

  async addComment(entryId: string, comment: Comment): Promise<Comment> {
    return firstValueFrom(
      this.http.post<Comment>(`${this.apiUrl}/${entryId}/comments`, comment)
    );
  }

  async getEntriesByAuthor(username: string): Promise<BlogEntry[]> {
    return firstValueFrom(
      this.http.get<BlogEntry[]>(
        `http://localhost:5000/queries/entries/by-author/${username}`
      )
    );
  }

  async getEntriesWithNoAdditionalFields(): Promise<BlogEntry[]> {
    return firstValueFrom(
      this.http.get<BlogEntry[]>(
        'http://localhost:5000/queries/entries/no-additional-fields'
      )
    );
  }

  async getEntriesWithMultipleImages(): Promise<BlogEntry[]> {
    return firstValueFrom(
      this.http.get<BlogEntry[]>(
        'http://localhost:5000/queries/entries/multiple-images'
      )
    );
  }
}
