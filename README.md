# ft_transcendence

Pong web application with multiplayer capabilities, user management, and ELK stack logging infrastructure.


## Prerequisites


- Docker and Docker Compose
- Make (command-line build tool)
- 8GB RAM minimum for ELK stack
- Ports 5000, 5601, 9200 available

## Quick Start

```bash
make        # Initialize and start all services
```

**Service Endpoints**:
- Application: https://localhost:5000
- Elasticsearch: https://localhost:9200  
- Kibana: https://localhost:5601
- API Documentation: https://localhost:5000/docs

## Implementation Status

**Completed Major Modules (3/7 required)**:
- **Backend Framework**: ✅ Fastify + Node.js with HTTPS, JWT middleware, WebSocket support
- **Infrastructure Setup for Log Management**: ✅ Complete ELK Stack (Elasticsearch, Kibana, Logstash)
- **Two-Factor Authentication and JWT**: ✅ Backend implementation with TOTP, QR codes, authenticator integration

**Completed Minor Modules (2 count as +1 Major)**:
- **Database Backend**: ✅ SQLite with user management, authentication, and match history schemas
- **Frontend Framework**: ✅ TypeScript + Tailwind CSS build system and SPA architecture

**Current Status: 4/7 Major modules complete** *(3 Major + 1 from 2 Minor)*

## Critical Missing Components

**❌ CORE GAME (0% Complete)**:
- Pong game mechanics and physics
- Tournament system with user registration and matchmaking
- Game interface with canvas/WebGL graphics
- Score tracking and game history

**❌ Frontend Implementation (Placeholder pages only)**:
- User authentication forms
- Profile management interface
- Tournament registration and management
- Game interface and controls

**❌ Major Modules Required (3 more needed for completion)**:
Choose 3 from:
- **Remote Players**: WebSocket infrastructure exists, need multiplayer game logic
- **Live Chat**: WebSocket infrastructure exists, need chat implementation
- **AI Opponent**: Need game AI and opponent logic
- **Server-Side Pong**: Replace basic Pong with server-side implementation + API
- **Standard User Management**: Need tournament user management across tournaments
- **Remote Authentication**: OAuth/external auth integration
- **Multiplayer**: Support for >2 players in same game
- **Add Another Game**: Second game with history and matchmaking
- **Blockchain Tournament Scores**: Store tournament results on blockchain
- **Advanced 3D Techniques**: 3D graphics implementation
- **WAF/ModSecurity + HashiCorp Vault**: Advanced security implementation
- **Backend as Microservices**: Microservice architecture redesign

## Architecture

**Stack**: Node.js, Fastify, TypeScript, SQLite, Tailwind CSS, ELK Stack
**Deployment**: Docker Compose multi-service architecture
**Security**: HTTPS enforcement, JWT authentication, bcrypt password hashing
**Logging**: Dual-stream system (server.log/client.log) with ELK integration

## Development

**Local Development**:
```bash
cd app
npm install
npm run dev    # Development with hot reload
```

**Container Management**:
```bash
make up        # Start all services
make down      # Stop services  
make clean     # Remove containers and volumes
make logs      # View service logs
make test      # Health check all services
```

=======
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

### Cluster 3: Gameplay e Interattività (Totale: 1 Modulo Major)

Questo modulo migliorano l'esperienza di gioco e la rendono più sociale.

* **Major module: Remote players**
    * **Perché**: Permette a due giocatori di sfidarsi da computer diversi. Questa è una funzionalità chiave per un gioco online e introduce l'uso dei WebSockets, una tecnologia fondamentale per la comunicazione in tempo reale.

### cluster 4: DevOps (Totale: 1 modulo major)

implementazione di un docker compose più coplesso con un sistema di logging

* **Major module: ELK**
    * **Perché**: sappiamo già come implementare lo stack elk

Ora abbiamo raggiunto i **6 Moduli Major**.

### Cluster 5: Dati e Personalizzazione (Totale: 1 Modulo Major)

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
    * ELK
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
3.  **Remote Players**: Implementa i WebSockets su Fastify per gestire la comunicazione in tempo reale per il gioco.
4.  **ELK**: integrazione di un sistema di logging per l'applicazione.
5.  **Dashboard e Personalizzazione**: Crea le pagine per le statistiche e aggiungi la logica per le opzioni di gioco personalizzate.

### Fase 4: Sicurezza e Rifinitura

1.  Assicurati di aver implementato tutte le misure di sicurezza obbligatorie (hashing delle password, protezione da SQL injection/XSS, HTTPS).

---

**ELK Stack Validation**:
```bash
make test-elk     # Comprehensive ELK validation
make monitor      # Real-time ELK monitoring
```

## API Documentation

REST API documentation available at https://localhost:5000/docs (Swagger UI)

**Available Endpoints** (verified implementation):
- `/auth/login` - JWT authentication with 2FA support
- `/auth/register` - User registration with bcrypt hashing
- `/profile/info` - User profile data (JWT protected)
- `/profile/generate2FA` - TOTP secret generation with QR code
- `/profile/verify2FA` - TOTP verification and activation
- `/profile/avatar` - Avatar upload (multipart)
- `/profile/friends/*` - Friend system management
- `/matches/*` - Game history and match tracking
- `/log` - Frontend logging endpoint
- `/ws/:token` - WebSocket connection (JWT token auth)

## Project Structure

```
app/
├── src/                    # Backend source (Fastify server, routes, controllers)
├── public/                 # Frontend assets (TypeScript, HTML, CSS)
├── database/               # SQLite database and schemas
├── logs/                   # Application logs (server.log, client.log)
└── certs/                  # SSL certificates for HTTPS

elk/                        # ELK Stack configuration
├── elasticsearch/          # Elasticsearch config and scripts
├── kibana/                 # Kibana dashboards and initialization  
└── logstash/              # Log processing pipeline
```

## Security Implementation

**Authentication**: JWT tokens, bcrypt password hashing, 2FA with TOTP
**Transport**: HTTPS enforcement with SSL certificates
**Container**: Non-root user execution, isolated network namespace
**Database**: SQLite with prepared statements

**Environment Configuration**:
- JWT secret: 256-bit cryptographically secure random key (generated via `openssl rand -base64 32`)
- ELK credentials: 96-bit random passwords for Elasticsearch/Kibana authentication
- NODE_ENV: Automatically set to `development` (default) or `production` (when explicitly set)
- Environment files generated via `./create-env.sh` (called by `make up`)

**Database Schema** (verified SQLite implementation):
- `users` table: id, username, display_name, password, email, avatar, totp_secret, twofa_enabled, last_seen
- `friends` table: user_id, friend_id relationships with unique constraints
- `matches` table: player1_id, player2_id, winner_id, score, date tracking

**Missing Security Features** (fact-checked):
- XSS protection implementation
- CSRF token system  
- Rate limiting middleware
- Input sanitization validation

## Next Development Priorities

**Immediate (Project Foundation)**:
1. Core Pong game implementation with Canvas/WebGL
2. Tournament system with player matchmaking
3. User authentication frontend forms
4. Game interface and controls

**Short-term (Module Completion)**:
1. Remote Players - Real-time multiplayer via WebSocket
2. Live Chat - Messaging system with WebSocket
3. AI Opponent - Game AI with strategic decision making
4. Complete User Management frontend interface

## Resources

**Framework Documentation**:
- [Fastify Framework](https://www.youtube.com/watch?v=btGtOue1oDA&t=177s) - Framework overview and lifecycle
- [Fastify Official Docs](https://fastify.dev/) - Complete API reference
- [Docker Compose](https://docs.docker.com/compose/) - Container orchestration

**Development Tools**:
- [REST Client Extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) - For testing API endpoints in `src/request.http`

**Technical Prerequisites**:
- Node.js (version 20.x or higher)
- npm (version 10.x or higher)
- Docker (version 24.x or higher)
- Docker Compose (version 2.x or higher)
