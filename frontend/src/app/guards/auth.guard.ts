import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = sessionStorage.getItem('currentUser');
  if (user) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
