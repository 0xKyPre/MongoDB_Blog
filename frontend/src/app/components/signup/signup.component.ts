import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  form: Partial<User> = {
    name: { firstname: '', lastname: '' }
  };
  password = '';
  confirmPassword = '';
  error: string | null = null;
  loading = false;

  constructor(private userService: UserService, private router: Router, private cdr: ChangeDetectorRef) {}

  async onSignup(): Promise<void> {
    if (
      !this.form.username ||
      !this.form.email ||
      !this.form.name?.firstname ||
      !this.form.name?.lastname ||
      !this.password
    ) {
      this.error = 'All fields are required';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      this.cdr.markForCheck();
      const newUser: User = {
        username: this.form.username,
        name: this.form.name,
        email: this.form.email!,
        password: this.password
      };
      await this.userService.createUser(newUser);
      await this.router.navigate(['/login']);
    } catch (err: any) {
      this.error = err?.error?.error || 'Signup failed. Please try again.';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
