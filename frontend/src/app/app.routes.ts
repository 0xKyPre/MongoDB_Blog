import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BlogListComponent } from './components/blog-list/blog-list.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { BlogFormComponent } from './components/blog-form/blog-form.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'blog-list',
    component: BlogListComponent
  },
  {
    path: 'blog/:id',
    component: BlogDetailComponent
  },
  {
    path: 'blog-form',
    component: BlogFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'blog-form/:id',
    component: BlogFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
