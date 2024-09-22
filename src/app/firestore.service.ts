import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {}

  // Aggiungi un documento
  async addData(collectionName: string, data: any) {
    return await this.firestore.collection(collectionName).add(data);
  }

  // Recupera dati da una collezione
  getData(collectionName: string): Observable<any[]> {
    return this.firestore.collection(collectionName).valueChanges({ idField: 'id' });
  }

  // Aggiorna un documento
  async updateData(collectionName: string, id: string, data: any) {
    return await this.firestore.collection(collectionName).doc(id).set(data, { merge: true });
  }

  // Elimina un documento
  async deleteData(collectionName: string, id: string) {
    return await this.firestore.collection(collectionName).doc(id).delete();
  }
}
