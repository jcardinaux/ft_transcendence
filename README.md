# ft_transcendence
last  42 project, a pong web app

## modules

- Major module: Implement Two-Factor Authentication (2FA) and JWT. ```DONE```
- Major module: use fastify as backend . ```USING IT``` ```HTTPS IMPLEMENTED```
- Major module: Standard user management, authentication and users across tournaments. ON ```WORKING```
- Major module: Major module: Remote players. ```NOT STARTED```
- Major module: Live Chat. ```NOT STARTED```

- Minor module: Use a database for the backend -and more. ```USING IT```
- Minor module: Use a framework or toolkit to build the front-end. ```NOT STARTED```
- Minor module: Game customization options. ```NOT STARTED```
- Minor module: User and Game Stats Dashboards ```NOT STARTED``` ```FORSE NE CONVIENE UN'ALTRO``` 

## to start backend on your local environment

```
npm run dev
```

è il primo avvio?? lancia il comando :
```
 npm i
```
questo leggerà il package.json ed installerà tutti i paccketti necessari

### attenzione
a modificarlo ci sono tutte le versioni!!!! se un pacchetto non vine utilizzato disinstallarlo con 
```
npm uninstall <nome pacchetto>
```

## API INFO

la documentazioni relativa alle api si trova su http://localhost:5000/docs.
Il file request.http simula delle chiamate curl e dipenda dall'estensione https://marketplace.visualstudio.com/items?itemName=humao.rest-client (cerca REST client)


---

## Panoramica della Soluzione

Per completare il progetto nel minor tempo possibile, la strategia migliore è scegliere un gruppo di moduli che siano tecnicamente coerenti e che si costruiscano l'uno sull'altro. In questo modo, le tecnologie che impari per un modulo ti saranno utili anche per il successivo, riducendo i tempi di apprendimento e sviluppo.

La mia proposta si basa sull'idea di unificare lo stack tecnologico attorno a **Node.js, TypeScript e Fastify**, poiché questa combinazione è potente, moderna e ti permette di usare lo stesso linguaggio (TypeScript/JavaScript) sia per il frontend che per il backend.

---

## Strategia Generale per la Massima Efficienza

* **Unificare lo Stack Tecnologico**: Il progetto ti dà la possibilità di rimpiazzare il backend PHP con un framework Node.js. Farlo subito ti farà risparmiare un'enorme quantità di tempo, evitando di dover gestire due ecosistemi completamente diversi (PHP e TypeScript/Node.js).
* **Costruire in Funzione dei Moduli**: Invece di completare la parte obbligatoria con le tecnologie di base per poi modificarla, costruiremo fin da subito la base del progetto utilizzando le tecnologie dei moduli che sceglieremo.
* **Scegliere Moduli Sinergici**: Selezioneremo moduli che condividono tecnologie o concetti simili. Ad esempio, i moduli "Remote Players" e "Live Chat" possono entrambi utilizzare WebSockets, quindi implementare uno ti renderà più facile implementare l'altro.

---

## Selezione dei Moduli: Il Percorso più Rapido (7 Moduli Major)

Per raggiungere il 100% del progetto, sono necessari 7 moduli principali (o una combinazione di principali e minori, dove 2 minori valgono 1 principale). Ecco una selezione pensata per la massima efficienza e coerenza tecnica.

### Cluster 1: Il Cuore Tecnologico (Totale: 2 Moduli Major)

Questi moduli definiscono la nostra base tecnica. Sceglierli subito ci dà una direzione chiara fin dall'inizio.

* **Major module: Use a framework to build the backend**
    * **Tecnologia**: Fastify con Node.js.
    * **Perché**: Questo è il modulo più importante per la nostra strategia. Sostituisce PHP e ci permette di usare JavaScript/TypeScript per tutto, rendendo lo sviluppo più rapido e coerente.
* **Minor module: Use a database for the backend**
    * **Tecnologia**: SQLite.
    * **Perché**: È un requisito per molti altri moduli (come la gestione utenti). SQLite è leggero, facile da configurare (è un semplice file) e perfetto per questo progetto.
* **Minor module: Use a framework or toolkit to build the front-end**
    * **Tecnologia**: Tailwind CSS con TypeScript.
    * **Perché**: Tailwind CSS è un framework di CSS "utility-first" che permette di creare interfacce molto velocemente senza scrivere CSS personalizzato. Si integra perfettamente con TypeScript.

Abbiamo già collezionato 1 modulo Major e 2 Minor, che equivalgono a **2 Moduli Major**.

### Cluster 2: Gestione Utenti e Sicurezza (Totale: 2 Moduli Major)

Ora che abbiamo un backend e un database, possiamo costruire le funzionalità per l'utente.

* **Major module: Standard user management, authentication...**
    * **Perché**: Questo modulo è un'evoluzione naturale del nostro backend. Aggiunge registrazione, login, profili utente, avatar e una lista amici. È una funzionalità fondamentale per quasi ogni sito web moderno.
* **Major module: Implement Two-Factor Authentication (2FA) and JWT**
    * **Perché**: Si integra perfettamente con il modulo di gestione utenti appena creato. JWT (JSON Web Tokens) è lo standard moderno per gestire le sessioni in una Single-Page Application (SPA), e l'aggiunta del 2FA è un passo logico successivo per la sicurezza.

A questo punto siamo a **4 Moduli Major**.

### Cluster 3: Gameplay e Interattività (Totale: 2 Moduli Major)

Questi moduli migliorano l'esperienza di gioco e la rendono più sociale.

* **Major module: Remote players**
    * **Perché**: Permette a due giocatori di sfidarsi da computer diversi. Questa è una funzionalità chiave per un gioco online e introduce l'uso dei WebSockets, una tecnologia fondamentale per la comunicazione in tempo reale.
* **Major module: Live Chat**
    * **Perché**: Aggiunge una chat al sito. La grande sinergia qui è che utilizza la stessa tecnologia del modulo "Remote players" (WebSockets). Una volta impostata la comunicazione in tempo reale per il gioco, estenderla per una chat sarà molto più semplice.

Ora abbiamo raggiunto i **6 Moduli Major**.

### Cluster 4: Dati e Personalizzazione (Totale: 1 Modulo Major)

Questi due moduli minori sono relativamente semplici da implementare una volta che la struttura principale è pronta.

* **Minor module: User and Game Stats Dashboards**
    * **Perché**: Mostra le statistiche dell'utente (vittorie, sconfitte, ecc.). Poiché stiamo già salvando i dati delle partite e degli utenti nel nostro database SQLite, creare delle pagine che mostrino queste informazioni è un lavoro prevalentemente di frontend.
* **Minor module: Game customization options**
    * **Perché**: Aggiunge opzioni come power-up o mappe diverse. Questo modulo non richiede nuove tecnologie complesse, ma si concentra sulla logica del gioco stesso. È un modo divertente per arricchire l'esperienza senza dover imparare un nuovo framework.

Con questi 2 moduli Minor, raggiungiamo l'equivalente di **7 Moduli Major**.

---

## Riepilogo del Percorso Proposto

Ecco la lista completa per raggiungere il 100%:

* **Major (x4)**:
    * Backend Framework (Fastify/Node.js)
    * Standard User Management
    * 2FA and JWT
    * Remote Players
    * Live Chat
* **Minor (x4, valgono 2 Major)**:
    * Database (SQLite)
    * Frontend Toolkit (Tailwind CSS)
    * User/Game Stats Dashboards
    * Game Customization Options

---

## Piano d'Azione Passo-Passo

### Fase 1: Setup Iniziale (Docker & Stack)

1.  Crea il tuo **Dockerfile** per eseguire un ambiente Node.js.
2.  Inizializza un progetto Node.js con TypeScript.
3.  Installa e configura **Fastify** per il backend e **Tailwind CSS** per il frontend.
4.  Crea una pagina "Hello World" per assicurarti che tutto funzioni.

### Fase 2: Realizzazione della Parte Obbligatoria

1.  Implementa il gioco **Pong base** (due giocatori sullo stesso computer) usando TypeScript per la logica e l'HTML/Canvas per la visualizzazione.
2.  Crea il sistema di torneo semplice con l'inserimento degli alias, salvandoli temporaneamente in memoria o già nel database SQLite.

### Fase 3: Sviluppo dei Moduli

Implementa in ordine:

1.  **Gestione Utenti Standard**: Crea le tabelle nel database SQLite, le rotte API su Fastify per registrazione/login e le pagine frontend.
2.  **JWT e 2FA**: Proteggi le tue API con JWT e aggiungi il flusso per la configurazione del 2FA.
3.  **Remote Players e Chat**: Implementa i WebSockets su Fastify per gestire la comunicazione in tempo reale sia per il gioco che per la chat.
4.  **Dashboard e Personalizzazione**: Crea le pagine per le statistiche e aggiungi la logica per le opzioni di gioco personalizzate.

### Fase 4: Sicurezza e Rifinitura

1.  Assicurati di aver implementato tutte le misure di sicurezza obbligatorie (hashing delle password, protezione da SQL injection/XSS, HTTPS).

---




### appunti su fastify

fast overview https://www.youtube.com/watch?v=btGtOue1oDA&t=177s

life cycle e hook

```
   ┌────────────────────────┐
   │     Richiesta Arriva   │
   └────────────────────────┘
              │
              ▼
      ┌─────────────────┐
      │  **onRequest**  │ (Prima di tutto)
      └─────────────────┘
              │
              ▼
         ┌───────────┐
         │   Routing │
         └───────────┘
              │
              ▼
      ┌─────────────────┐
      │ **preParsing**  │ (Prima di leggere il corpo)
      └─────────────────┘
              │
              ▼
         ┌───────────┐
         │ Leggo il  │
         │   Corpo   │
         └───────────┘
              │
              ▼
      ┌─────────────────┐
      │**preValidation** (Prima di validare i dati) │
      └─────────────────┘
              │
              ▼
         ┌───────────┐
         │ Validazione │
         └───────────┘
              │
              ▼
      ┌─────────────────┐
      │  **preHandler** │ (Prima della logica della rotta)
      └─────────────────┘
              │
              ▼
         ┌───────────┐
         │ La tua Logica  │
         │   (Handler)   │
         └───────────┘
              │
              ▼
      ┌─────────────────┐
      │ **preSerialization** (Prima di convertire in JSON) │
      └─────────────────┘
              │
              ▼
         ┌───────────┐
         │ Converto in │
         │    JSON     │
         └───────────┘
              │
              ▼
      ┌─────────────────┐
      │    **preReply** │ (Poco prima di spedire la risposta)
      └─────────────────┘
              │
              ▼
      ┌─────────────────┐
      │    **onSend** │ (Un attimo prima dell'invio finale)
      └─────────────────┘
              │
              ▼
         ┌───────────┐
         │   Invio la  │
         │  Risposta   │
         └───────────┘
              │
              ▼
      ┌─────────────────┐
      │ **onResponse** │ (Dopo che la risposta è partita)
      └─────────────────┘
              │
              ▼
   ┌────────────────────────┐
   │ Richiesta Completata   │
   └────────────────────────┘

   ```