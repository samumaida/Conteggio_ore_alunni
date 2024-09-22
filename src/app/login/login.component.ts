import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; // Assicurati di importare il tuo servizio AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = ''; 
  password: string = '';

  constructor(private authService: AuthService) {}

  login() {
    this.authService.login(this.email, this.password);
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}
