import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(private userService: UserService, private router: Router) {}

  async onLogin(): Promise<void> {
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Username and password are required';
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      const result = await this.userService.login(this.username, this.password);

      if (result.found && result.user) {
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        await this.router.navigate(['/blog-form']);
      } else {
        this.error = 'Invalid username or password';
      }
    } catch (err) {
      this.error = 'Login failed. Please try again.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
