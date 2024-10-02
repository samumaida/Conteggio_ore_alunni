import { Component } from '@angular/core';
import { FirestoreService } from '../firestore.service'; // Assicurati che il percorso sia corretto
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ChangeDetectorRef } from '@angular/core';


export interface Bambino {
  id: string; // Assicurati che l'ID sia presente
  nome: string;
  oreTotali: number;
  oreFatte: number;
  modifiedNome: string;
  modifiedOreTotali: number | null;
  isNameModified: boolean;
  userId: string; // L'ID utente
}



@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  userId: string | null = null;
  bambini: Bambino[] = [];
  oreDaAggiungere: { [key: string]: number | null | string } = {};
  oreDaDedurre: { [key: string]: number | null | string } = {}; // Aggiungi questa riga

  constructor(private firestoreService: FirestoreService, private afAuth: AngularFireAuth, private router: Router, private firestore: AngularFirestore, private cd: ChangeDetectorRef) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        console.log('User ID:', this.userId); // Log dell'ID utente
        this.loadBambini(); // Carica i bambini una volta che l'utente è autenticato
      } else {
        console.log('Nessun utente autenticato');
        this.userId = null;
      }
    });
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('bambini',this.bambini)
    }, 1000 )

    this.afAuth.authState.subscribe(user => {
      if (user) {
        console.log('Utente autenticato:', user.uid);
        this.loadBambini(); // Carica i dati dell'utente
      } else {
        console.log('Nessun utente autenticato, reindirizzamento a login');
        this.router.navigate(['/login']);
      }
    });
  }


  logout() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  loadBambini() {
    if (this.userId) {
        this.firestoreService.getData<Bambino>('alunni').subscribe(data => {
            // Mappa i dati per includere l'ID senza sovrascrittura
            this.bambini = data
                .filter(bambino => bambino.userId === this.userId)
                .map(bambino => {
                    // Presupponendo che `data` abbia un campo `id`, 
                    // puoi restituire un nuovo oggetto senza sovrascrivere l'ID.
                    const { id, ...rest } = bambino; // Estrai l'id e il resto delle proprietà
                    return { id, ...rest }; // Restituisci l'oggetto senza conflitto
                });

            console.log('Dati recuperati:', this.bambini);
        }, error => {
            console.error('Errore nel recupero dei dati:', error);
        });
    } else {
        console.error('Errore: nessun utente autenticato');
    }
}

async creaNuovoAlunno() {
  if (!this.userId) {
      console.error('Errore: l\'utente non è autenticato');
      return;
  }

  const nomeBambino = 'Nuovo Bambino'; // Nome predefinito

  // Crea un nuovo bambino senza controllare il nome
  const nuovoBambino: Omit<Bambino, 'id'> = {
      nome: nomeBambino,
      oreTotali: 0,
      oreFatte: 0,
      modifiedNome: '',
      modifiedOreTotali: null,
      isNameModified: false,
      userId: this.userId
  };

  try {
    // Aggiungi il bambino e ottieni il riferimento del documento creato
    const docRef = await this.firestoreService.addData('alunni', nuovoBambino);
    
    // Creazione dell'oggetto bambino con ID
    const bambinoConId: Bambino = { 
        id: docRef.id, // Imposta l'ID del documento creato
        ...nuovoBambino // Mantieni le altre proprietà
    };

    this.bambini.push(bambinoConId); // Aggiungi il nuovo bambino all'array
    console.log('Nuovo bambino creato con ID:', docRef.id);
    
    // Ricarica i dati dei bambini
    this.loadBambini();
} catch (error) {
    console.error('Errore nella creazione del bambino:', error);
}
}

  async onEdit(bambino: Bambino) {
    const bambinoToEdit: Bambino = {
      ...bambino,
      // Aggiungi qui altre proprietà se necessario
    };
  
    await this.saveBambino(bambinoToEdit); // Salva l'oggetto bambino
  }

  async saveBambino(bambino: Bambino) {
    const dataToSave: Partial<Bambino> = {
        id: bambino.id, // Assicurati che l'ID venga incluso qui
        nome: bambino.nome,
        oreFatte: bambino.oreFatte,
        oreTotali: bambino.oreTotali,
        modifiedNome: bambino.modifiedNome,
        modifiedOreTotali: bambino.modifiedOreTotali,
        isNameModified: bambino.isNameModified,
        userId: this.userId ? this.userId : '' // Converte null in stringa vuota
    };

    try {
        if (bambino.id) {
            // Se l'ID è definito, aggiorna il documento
            await this.firestoreService.updateData('alunni', bambino.id, dataToSave);
            console.log('Documento aggiornato con successo con ID:', bambino.id);
        } else {
            // Se l'ID non è definito, crea un nuovo documento
            const newDocRef = await this.firestoreService.addData('alunni', dataToSave);
            bambino.id = newDocRef.id; // Salva l'ID del nuovo documento nel bambino
            console.log('Documento creato con successo con ID:', bambino.id);
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento o creazione del documento: ', error);
    }

    this.loadBambini(); // Ricarica i dati per visualizzare le modifiche
}



async eliminaBambino(bambino: Bambino) {
  // Controlla se l'ID del bambino è valido
  if (!bambino.id) {
      console.error('Errore: ID del bambino non valido');
      return;
  }

  // Chiamata alla funzione di deleteData nel tuo servizio Firestore
  try {
      await this.firestoreService.deleteData('alunni', bambino.id);
      console.log(`Bambino ${bambino.nome} eliminato con successo.`);
      
      // Rimuovi il bambino dall'array locale per aggiornare l'interfaccia
      this.bambini = this.bambini.filter(b => b.id !== bambino.id);
  } catch (error) {
      console.error('Errore durante l\'eliminazione del bambino:', error);
  }
}



  // Altre funzioni come salvaNome, eliminaAlunno, ecc.
  
  async modificaOreTotali(bambino: Bambino) {
      if (bambino.modifiedOreTotali !== null && bambino.modifiedOreTotali !== undefined) {
          const nuovaOreTotali = Number(bambino.modifiedOreTotali);
          
          // Controllo che il valore sia un numero valido
          if (!isNaN(nuovaOreTotali)) {
              if (nuovaOreTotali < bambino.oreFatte) {
                  bambino.oreTotali = nuovaOreTotali;
                  bambino.oreFatte = Math.min(bambino.oreFatte, nuovaOreTotali);
              } else {
                  bambino.oreTotali = nuovaOreTotali;
              }
              bambino.modifiedOreTotali = null; // Resetta dopo il salvataggio
              
              // Salva le modifiche
              await this.saveBambino(bambino);
          } else {
              console.error('Valore non valido per modifiedOreTotali:', bambino.modifiedOreTotali);
          }
      } else {
          console.log('Nessuna modifica delle ore totali da applicare per:', bambino);
      }
  }  

    resetInput(model: { [key: string]: number | null | string }, nomeBambino: string) {
      model[nomeBambino] = ''; // Resetta a stringa vuota
    }

    checkNameChange(bambino: any) {
      bambino.isNameModified = bambino.modifiedNome !== bambino.nome;
    }

    async salvaNome(bambino: Bambino) {
      // Verifica se il nome è stato modificato
      if (bambino.isNameModified) {
        // Crea un oggetto per la modifica
        const bambinoToEdit: Bambino = {
          ...bambino,
          nome: bambino.modifiedNome, // Usa il nuovo nome
          isNameModified: false, // Resetta il flag
        };
        
        await this.onEdit(bambinoToEdit); // Usa onEdit per salvare
      }
    }

  incrementaOre(bambino: Bambino) {
    const ore = Number(this.oreDaAggiungere[bambino.nome]) || 0;
    if (ore > 0) {
      bambino.oreTotali += ore; // Aumenta le ore totali
      this.oreDaAggiungere[bambino.nome] = ''; // Reset dell'input
      this.saveBambino(bambino); // Salva il bambino su Firestore
    }
  }

  
  deduciOre(bambino: Bambino) {
    const ore = Number(this.oreDaDedurre[bambino.nome]) || 0;
    if (ore > 0) {
      bambino.oreFatte += ore; // Aggiungi ore fatte
      this.oreDaDedurre[bambino.nome] = ''; // Reset dopo la deduzione
      this.saveBambino(bambino); // Salva il bambino su Firestore
    }
  }

    checkOreChange(bambino: Bambino) {
      return Number(this.oreDaAggiungere[bambino.nome]) > 0;
    }

    getOreFatteProgresso(bambino: Bambino): number {
      return Math.max(0, (bambino.oreTotali - bambino.oreFatte)) / Math.max(bambino.oreTotali, 1);
    }

    isOreTotaliModified(bambino: Bambino): boolean {
      return bambino.modifiedOreTotali !== null && bambino.modifiedOreTotali !== bambino.oreTotali;
    }

    resetOreFatte(bambino: Bambino) {
      if (confirm(`Sei sicuro di voler resettare le ore fatte per ${bambino.nome}?`)) {
        bambino.oreFatte = 0; // Resetta le ore fatte
        this.saveBambino(bambino); // Salva nel DB
      }
    }
  
    resetOreTotali(bambino: Bambino) {
      if (confirm(`Sei sicuro di voler resettare le ore totali per ${bambino.nome}?`)) {
        bambino.oreTotali = 0; // Resetta le ore totali
        bambino.oreFatte = Math.min(bambino.oreFatte, bambino.oreTotali); // Aggiorna ore fatte
        this.saveBambino(bambino); // Salva nel DB
      }
    }

    getPercentualeMancante(bambino: Bambino): number {
      return Math.round(((bambino.oreTotali - bambino.oreFatte) / Math.max(bambino.oreTotali, 1)) * 100);
    }

  async svuotaCollezioneAlunni() {
    try {
        const alunniSnapshot = await this.firestore.collection('alunni').get().toPromise();
        
        // Controlla se ci sono documenti nella collezione
        if (!alunniSnapshot?.empty) {
            const batch = this.firestore.firestore.batch(); // Usa batch per un'operazione più efficiente
            
            alunniSnapshot?.forEach(doc => {
                // Aggiungi ogni documento al batch di eliminazione
                batch.delete(doc.ref);
            });
            
            // Esegui il batch di eliminazioni
            await batch.commit();
            console.log('Tutti i documenti nella collezione alunni sono stati eliminati.');
        } else {
            console.log('Nessun documento da eliminare nella collezione alunni.');
        }
    } catch (error) {
        console.error('Errore durante lo svuotamento della collezione alunni:', error);
    }
}

}
