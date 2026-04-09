import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/users';
  private loginUrl = 'http://localhost:5000/queries/users/login';

  constructor(private http: HttpClient) {}

  async getAllUsers(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(this.apiUrl));
  }

  async getUserById(id: string): Promise<User> {
    return firstValueFrom(this.http.get<User>(`${this.apiUrl}/${id}`));
  }

  async createUser(user: User): Promise<User> {
    return firstValueFrom(this.http.post<User>(this.apiUrl, user));
  }

  async login(username: string, password: string): Promise<{ found: boolean; user?: User }> {
    return firstValueFrom(
      this.http.get<{ found: boolean; user?: User }>(
        `${this.loginUrl}?username=${username}&password=${password}`
      )
    );
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return firstValueFrom(this.http.put<User>(`${this.apiUrl}/${id}`, user));
  }

  async deleteUser(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
