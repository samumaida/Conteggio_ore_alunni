import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as CryptoJS from 'crypto-js';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/compat';

interface UserData {
  username: string;
  password: string; // Questo dovrebbe essere hashato nel database
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Osserva lo stato dell'utente autenticato
  authState: Observable<any>;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    // Ottieni lo stato di autenticazione dell'utente
    this.authState = this.afAuth.authState;
    this.setAuthPersistence()
  }

  private async setAuthPersistence() {
    try {
      // Usa il metodo setPersistence senza importare firebase
      await this.afAuth.setPersistence('local'); // Imposta la persistenza su LOCAL
      console.log('Persistenza dell\'autenticazione impostata su LOCAL.');
    } catch (error) {
      console.error('Errore impostando la persistenza:', error);
    }
  }

  async login(username: string, password: string) {
    try {
      const usersRef = this.firestore.collection('utenti', ref => ref.where('username', '==', username));
      const snapshot = await usersRef.get().toPromise();
  
      if (!snapshot || snapshot.empty) {
        console.error('Username non trovato');
        return false; // Ritorna false se l'username non esiste
      }
  
      const userData = snapshot.docs[0].data() as UserData;
  
      // Crea l'email fittizia basata sul nome utente
      const email = username + '@example.com';
  
      // Esegui l'autenticazione con Firebase utilizzando l'email fittizia
      await this.afAuth.signInWithEmailAndPassword(email, password);
  
      console.log('Login riuscito');
  
      // Aggiungi un timeout prima di reindirizzare
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 500); // Ritardo di 500 millisecondi
  
      return true; // Ritorna true se il login è andato a buon fine
    } catch (error) {
      console.error('Errore durante il login: ', error);
      return false; // Ritorna false in caso di errore
    }
  }
  

  async register(username: string, password: string) {
    if (!username || !password) {
      console.error('Username o password non possono essere vuoti');
      return;
    }
  
    const hashedPassword = CryptoJS.SHA256(password).toString();
  
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(username + '@example.com', password); // Usa un'email fittizia
      const user = userCredential.user;
      if (!user) {
        console.error('Registrazione fallita, nessun utente restituito.');
        return;
      }
      
      const uid = user.uid;
      await this.firestore.collection('utenti').doc(uid).set({
        username: username,
        password: hashedPassword,
      });
  
      console.log('Registrazione avvenuta con successo');
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Errore durante la registrazione: ', error);
    }
  }
  

  // Metodo di logout
  logout(): void {
    this.afAuth.signOut().then(() => {
      console.log('Logout effettuato');
      this.router.navigate(['/login']);
    });
  }

  // Metodo per ottenere lo stato dell'utente autenticato
  getAuthState(): Observable<any> {
    return this.authState;
  }
}
