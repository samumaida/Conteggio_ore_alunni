import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction } from '@angular/fire/compat/firestore'; // Importa AngularFirestore e AngularFirestoreCollection
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { Bambino } from './home/home.page'

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {}

  /**
   * Aggiunge un documento a una collezione
   * @param collection Nome della collezione
   * @param data Dati del documento da aggiungere
   * @returns Promise del documento aggiunto
   */
  addData<T>(collection: string, data: T): Promise<any> {
    return this.firestore.collection(collection).add(data);
}


  /**
   * Ottiene i dati da una collezione con filtri opzionali
   * @param collection Nome della collezione
   * @param queryFn Funzione di query per filtrare i risultati
   * @returns Observable dei dati
   */
  getData<T>(collectionName: string): Observable<T[]> {
    return new Observable(observer => {
        this.firestore.collection(collectionName).snapshotChanges().subscribe(actions => {
            const data = actions.map(action => {
                const id = action.payload.doc.id; // Ottieni l'ID
                const data = action.payload.doc.data() as T;
                return { id, ...data }; // Restituisci un oggetto con ID e dati
            });
            observer.next(data);
        }, error => {
            observer.error(error);
        });
    });
}



  /**
   * Aggiorna un documento in una collezione
   * @param collection Nome della collezione
   * @param id ID del documento da aggiornare
   * @param data Dati aggiornati
   * @returns Promise per l'aggiornamento del documento
   */
  async updateData(collection: string, docId: string, data: Partial<Bambino>) {
    return this.firestore.collection(collection).doc(docId).update(data);
  }

/**
 * Elimina un documento da una collezione
 * @param collection Nome della collezione
 * @param id ID del documento da eliminare
 * @returns Promise per l'eliminazione del documento
 */
  deleteData(collection: string, id: string): Promise<void> {
    // Controlla che l'ID non sia vuoto o undefined
    if (!id || id.trim() === '') {
        console.error('Errore: ID del documento non valido');
        return Promise.reject(new Error('ID del documento non valido')); // Restituisci un errore
    }

    console.log('collection:', collection);
    console.log('id:', id);

    // Procedi con l'eliminazione se l'ID è valido
    return this.firestore.collection(collection).doc(id).delete()
      .then(() => {
          console.log(`Documento con ID ${id} eliminato con successo.`);
      })
      .catch(error => {
          console.error('Errore durante l\'eliminazione del documento:', error);
          throw error; // Propaga l'errore
      });
  }

  /**
   * Ottiene una collezione completa
   * @param collection Nome della collezione
   * @returns Observable dei dati della collezione
   */
  getCollection<T>(collection: string): AngularFirestoreCollection<T> {
    return this.firestore.collection<T>(collection);
  }

  /**
   * Ottiene un documento specifico
   * @param collection Nome della collezione
   * @param id ID del documento
   * @returns Observable del documento
   */
  getDocument<T>(collection: string, id: string): Observable<T | undefined> {
    return this.getCollection<T>(collection).doc(id).valueChanges();
  }

  getDataWithId<T>(collection: string): Observable<T[]> {
    return this.firestore.collection<T>(collection).snapshotChanges().pipe(
      map((actions: DocumentChangeAction<T>[]) => actions.map(a => {
        const data = a.payload.doc.data() as T;
        const id = a.payload.doc.id;
        return { id, ...data }; // Combina i dati con l'ID del documento
      }))
    );
  }
}
