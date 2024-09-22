import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then(() => {
        this.router.navigate(['/home']); // Reindirizza alla home dopo il login
      })
      .catch(error => {
        console.error('Login error:', error);
      });
  }

  loginWithGoogle() {
    console.log('Attempting to login with Google...');
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.afAuth.signInWithPopup(provider).then(() => {
      this.router.navigate(['/home']);
    })
    .catch(error => {
      console.error('Google login error:', error);
    });
  }

  logout() {
    return this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']); // Reindirizza alla pagina di login dopo il logout
    });
  }
}
