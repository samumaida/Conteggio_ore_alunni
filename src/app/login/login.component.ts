// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Importa il Router per il reindirizzamento
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username: string = ''; 
  password: string = '';

  constructor(private authService: AuthService, private afAuth: AngularFireAuth, private router: Router) { }

  login() {
    this.authService.login(this.username, this.password)
      .then(success => {
        if (success) {
          // Naviga alla pagina Home se il login ha avuto successo
          this.router.navigate(['/home']);
        } else {
          console.error('Login fallito');
        }
      });
  }

  register() {
    this.authService.register(this.username, this.password);
  }
}
