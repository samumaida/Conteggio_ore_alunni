import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

interface Bambino {
  id?: string; // Rendi l'id opzionale
  nome: string;
  modifiedNome: string;
  oreFatte: number;
  oreTotali: number;
  modifiedOreTotali: number | null;
  isNameModified: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private firestoreService: FirestoreService, private afAuth: AngularFireAuth) {}

  bambini: Bambino[] = [
    { id: '1', nome: 'Nome', oreTotali: 0, oreFatte: 0, modifiedNome: 'Nome', modifiedOreTotali: null, isNameModified: false },
    // Aggiungi altri bambini se necessario
  ];

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.loadBambini(); // Carica i dati se l'utente è autenticato
      } else {
        console.log('Utente non autenticato');
      }
    });
  }

  oreDaAggiungere: { [key: string]: number | null | string } = {};
  oreDaDedurre: { [key: string]: number | null | string } = {};

  loadBambini() {
    this.firestoreService.getData('alunni').subscribe((data) => {
      this.bambini = data.map((e) => {
        return {
          id: e.id, // Assicurati che e.id contenga l'ID corretto
          ...e,
        } as Bambino;
      });
    });
  }

  creaNuovoAlunno() {
    const nuovoBambino = {
      nome: 'Nuovo Bambino',
      oreTotali: 0,
      oreFatte: 0,
      modifiedNome: '',
      modifiedOreTotali: null,
      isNameModified: false,
    };
  
    this.firestoreService.addData('alunni', nuovoBambino)
      .then(() => {
        console.log('Nuovo alunno creato con successo!');
        this.loadBambini(); // Ricarica la lista per vedere il nuovo alunno
      })
      .catch((error) => console.error('Errore nella creazione del nuovo alunno: ', error));
  }

  eliminaAlunno(id: string) {
    const conferma = confirm('Sei sicuro di voler eliminare questo alunno?');
    if (conferma) {
      this.firestoreService.deleteData('alunni', id)
        .then(() => console.log('Alunno eliminato con successo!'))
        .catch((error) => console.error('Errore nell\'eliminazione dell\'alunno: ', error));
    } else {
      console.log('Eliminazione annullata.');
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

  saveBambino(bambino: Bambino) {
    console.log('Salvando bambino con ID:', bambino.id); // Aggiungi questo log
    const dataToSave = {
      nome: bambino.nome,
      oreFatte: bambino.oreFatte,
      oreTotali: bambino.oreTotali,
      modifiedNome: bambino.modifiedNome,
      modifiedOreTotali: bambino.modifiedOreTotali,
      isNameModified: bambino.isNameModified,
    };
  
    if (bambino.id) {
      this.firestoreService.updateData('alunni', bambino.id, dataToSave)
        .then(() => console.log('Documento aggiornato con successo!'))
        .catch((error) => console.error('Errore nell\'aggiornamento del documento: ', error));
    } else {
      console.error('ID non definito per il bambino:', bambino);
    }
  }

  modificaOreTotali(bambino: Bambino) {
    if (bambino.modifiedOreTotali !== null) {
      const nuovaOreTotali = Number(bambino.modifiedOreTotali);
      if (nuovaOreTotali < bambino.oreFatte) {
        bambino.oreTotali = nuovaOreTotali;
        bambino.oreFatte = Math.min(bambino.oreFatte, nuovaOreTotali);
      } else {
        bambino.oreTotali = nuovaOreTotali;
      }
      bambino.modifiedOreTotali = null; // Resetta dopo il salvataggio
      
      // Salva i cambiamenti
      this.saveBambino(bambino); // Aggiungi questa riga
    }
  }

  resetInput(model: { [key: string]: number | null | string }, nomeBambino: string) {
    model[nomeBambino] = ''; // Resetta a stringa vuota
  }

  checkNameChange(bambino: any) {
    bambino.isNameModified = bambino.modifiedNome !== bambino.nome;
  }

  salvaNome(bambino: any) {
    if (bambino.isNameModified) {
      bambino.nome = bambino.modifiedNome;
      bambino.isNameModified = false; // Disabilita il pulsante dopo il salvataggio
      this.saveBambino(bambino); // Aggiungi questa riga per salvare nel DB
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
      this.saveBambino(bambino); // Salva il bambino nel DB
    }
  }
  
  resetOreTotali(bambino: Bambino) {
    if (confirm(`Sei sicuro di voler resettare le ore totali per ${bambino.nome}?`)) {
      bambino.oreTotali = 0; // Resetta le ore totali
      bambino.oreFatte = Math.min(bambino.oreFatte, bambino.oreTotali); // Aggiorna le ore fatte
      this.saveBambino(bambino); // Salva il bambino nel DB
    }
  }

  getPercentualeMancante(bambino: Bambino): number {
    return Math.round(((bambino.oreTotali - bambino.oreFatte) / Math.max(bambino.oreTotali, 1)) * 100);
  }
}
