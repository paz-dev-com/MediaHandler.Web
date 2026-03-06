import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `<div class="flex align-items-center justify-content-center" style="height:100vh">
    <p>Completing sign-in...</p>
  </div>`,
})
export class AuthCallbackComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.handleCallback();
      await this.router.navigate(['/']);
    } catch {
      await this.router.navigate(['/']);
    }
  }
}
