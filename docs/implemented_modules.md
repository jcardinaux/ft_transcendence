# ft_transcendence – Moduli Implementati

Questo documento riepiloga **tutti i moduli del subject ufficiale** che risultano già implementati nel progetto. Per ogni modulo riportiamo:

- estratto dei **requisiti** dal subject (Versione 18.0, vedi `docs/en_subject.md`);
- **componenti** e file che soddisfano tali requisiti;
- eventuali note di utilizzo o di estensione futura.

> 🔎 Obiettivo: fornire una mappa chiara per la correzione e per i controlli approfonditi che seguiranno.

---

## Aggiornamenti del 03/12/2025 – Fix

1. **Cambio password completo**  
	- UI Win98: aggiunto form dedicato in `app/public/html/userWindow.html` gestito da `userProgram.ts`, con validazioni su old/new password e toast di feedback.  
	- Backend: `profile.js:changePassword` ora esegue `bcrypt.hash` e controlla `response.changes`, eliminando il salvataggio in chiaro.

2. **Logout esplicito nella SPA**  
	- Nuovo bottone in `desktopPage.html` + handler in `desktopPage.ts` che rimuove il JWT, chiude il WebSocket (`stopPresenceSocket`) e redirige a `/welcome`.

3. **Statistiche profilo / `GET /api/profile/stats`**  
	- Endpoint implementato in `profile.js:getUserStats` + schema `statsOpts`.  
	- `statsProgram.ts` ora chiama davvero l’API, usando i dati server-side anziché calcoli locali.

4. **Client WebSocket & presenza realtime**  
	- `presenceSocket.ts` apre `wss://.../ws/:token`, rilancia eventi `friends-refresh` su payload `presence`/`friendship`.  
	- `desktopPage.ts` avvia/chiude il socket insieme alla sessione utente.

5. **Visualizzazione stato online degli amici**  
	- `showUsersProgram.ts` refetcha `/api/profile/getFriends` (cache-busting + `Cache-Control: no-store`) e passa `is_online`/`last_seen` alle card.  
	- `usersListCard.ts` mostra badge verde/grigio con ultimo accesso, aggiornato sia dopo un’azione locale sia in ascolto dell’evento globale.

6. **Backend Framework completato**  
	- `webSocketController` importa correttamente `jsonwebtoken` e le rotte WebSocket sono registrate tramite `webSocketRoutes` in `server.js`, soddisfacendo il modulo “Backend Framework”.

7. **Amicizie bidirezionali + sync immediato**  
	- `/addFriend` / `/deleteFriend` scrivono/cancellano entrambe le direzioni in transazione SQLite, inviano un payload WS `friendship` e la UI invalida la cache locale. Nessun reload necessario per vedere il nuovo amico.

8. **Nota sugli endpoint amministrativi**  
	- `DELETE /api/auth/user/:id` e `DELETE /api/matches/deleteMatch/:id` restano strumenti manutentivi non esposti alla SPA; documentati come utility interne in attesa di una UI admin dedicata.

---

## Major Modules

### 1. Backend Framework (Fastify + Node.js)
**Stato**: ✅ verificato (Fastify + WebSocket registrati e funzionanti).
**Requisito subject**: usare Fastify come framework backend ufficiale con Node.js.

**Implementazione principale**
- `app/src/server.js` avvia Fastify 5 con HTTPS (chiavi da `app/certs`), CORS globale, Swagger/OpenAPI (`@fastify/swagger` + UI), static serving per la SPA, decorator `db` e middleware JWT (`verifyJWT`).
- I moduli di routing `src/routes/{auth,profile,match,frontend}.js` sono registrati con prefissi `/api/*`, sfruttando gli schemi JSON per la validazione.
- Deploy con singolo comando: `docker-compose.yml` builda `app`, `elasticsearch`, `kibana`, `logstash` dopo aver eseguito `create-env.sh` che popola `.env` e `app/.env`. L'immagine `app/Dockerfile` esegue build TS/Tailwind, crea user non-root e copia lo script `docker-utils/get-certs.sh` per recuperare i certificati runtime.
- @fastify/websocket è registrato nel bootstrap (`await app.register(WebSocket)`); la rotta `/ws/:token` è ora montata tramite `webSocketRoutes` e protegge la connessione verificando il JWT.
- Il controller WS (`controllers/webSocket.js`) aggiorna `last_seen`, inserisce il socket in `onlineUsers` e **broadcasta eventi** `presence` (online/offline) a tutti i client aperti.

**Verifiche del 03/12/2025**
- ✅ HTTPS forzato dal server Fastify: `httpOption` carica `certs/server.key` & `server.crt`, e l'app esegue sempre in modalità TLS (anche Healthcheck usa `curl -fsSk https://...`).
- ✅ Swagger raggiungibile all'endpoint `/docs` con configurazione bearer token, confermato dallo schema in `server.js` righe 59-84.
- ✅ Docker flow: `create-env.sh` genera le credenziali ELK + JWT; `docker-compose.yml` usa questi valori per tutti i servizi.
- ✅ WebSocket: controller (`app/src/controllers/webSocket.js`) importa `jsonwebtoken`, aggiorna `last_seen` e invia broadcast presenza; la SPA apre il socket tramite `presenceSocket.ts` e riceve gli eventi.

**TODO**
- Nessuno (valutare l'esposizione su Swagger come miglioramento futuro, non bloccante).

---

### 2. Standard User Management, Authentication & Users Across Tournaments
**Stato**: ✅ verificato dopo i fix del 03/12/2025.
**Requisito subject**: registrazione/login sicuri, gestione display name, aggiornamento profilo, avatar, amici + presenza online, statistiche, cronologia match.

**Implementazione**
- **Registrazione/Login**: `auth.js` usa `bcrypt.hash` in `addUser` e `bcrypt.compare` in `login`, con fallback username/email e 2FA opzionale prima di emettere il JWT.
- **Gestione profilo**: `profile.js` espone update username/display name/password, avatar upload (multipart → `public/avatar`), info utente complete (`allUserInfo`).
- **Amici**: `/addFriend`, `/deleteFriend`, `/getFriends` gestiscono la tabella `friends` in modo **bidirezionale** (l'inserimento e la rimozione aggiornano entrambi gli utenti) e calcolano `is_online` tramite `last_seen` aggiornato dal middleware JWT (server.js riga ~97); ogni variazione invece innesca un evento WebSocket `friendship` che fa rieseguire il refresh della lista.
- **UI gestione account**: `userWindow.html` + `userProgram.ts` coprono avatar, username, nickname **e ora anche change password** (`PUT /api/profile/changePassword`). `desktopPage.html` introduce il bottone “logout” che rimuove il JWT e chiude la sessione WS.
- **Amici & presenza**: `showUsersProgram.ts` popola i `UserListCard` e si sottoscrive all'evento `friends-refresh` inviato dal WebSocket (vedi `presenceSocket.ts`) per aggiornare badge online/offline in tempo reale.
- **Statistiche cronologia**: `saveMatchToDatabase` in `pong.ts` salva ogni match PvP (pong/peow) con `game_name`; `statsProgram.ts` filtra per gioco e ora consuma `/api/profile/stats` per popolare il riepilogo.

**Verifiche del 03/12/2025**
- ✅ Registrazione/login e JWT: tracciati `POST /api/auth/user` e `POST /api/auth/login`, entrambe validate tramite `schemas/auth.js`.
- ✅ Modulo profilo Win98 (`userProgram.ts`) invoca gli endpoint aggiornando UI dopo successo.
- ✅ Avatar fallback + upload (controllato pipeline `uploadAvatar`).
- ✅ Match history e stats mostrano partite distinte per `game_name`.
- ✅ **Password change**: `profile.js:changePassword` ora ri-hasha `newPassword` con `bcrypt.hash` e controlla `response.changes`, restituendo 500 in caso di update fallito.
- ✅ **Presenza online realtime**: `showUsersProgram.ts` popola i `UserListCard` e reagisce agli eventi `friends-refresh` scaturiti da `/ws/:token`, così i badge cambiano non appena un utente apre/chiude la sessione.
- ✅ **Statistiche server-side**: aggiunto `GET /api/profile/stats` (`profile.js:getUserStats` + schema `statsOpts`) per aggregare vittorie/sconfitte: la SPA usa questi dati come fonte primaria e ricade sul calcolo lato client solo come fallback.

**TODO**
- Nessuno (estensioni future: pagina dedicata agli amici o notifiche real-time via WS).

---

### 3. Two-Factor Authentication (2FA) + JWT
**Stato**: ✅ verificato.
**Requisito subject**: introdurre 2FA e usare JWT per autenticazione/autorizzazione.

**Implementazione**
- JWT: `auth.js:login` emette token HS256 (`jwt.sign`) dopo password + eventuale OTP. `server.js` decora `verifyJWT` e lo richiama in ogni schema (`schemas/profile.js` usa `preHandler`).
- 2FA: `profile.js:generate2FA` crea `totp_secret` via `otplib.authenticator`, genera QR con `qrcode`, salva il segreto; `verify2FA` valida il token e setta `twofa_enabled`.
- Frontend: `Application2FA` apre `2FAWindos.html`, consente rigenerazione QR, passo di verifica OTP e messaggi di stato.

**Verifiche del 03/12/2025**
- ✅ `generate2FA` e `verify2FA` protetti da JWT; testati trigger UI -> fetch → risposta 200/401.
- ✅ Login forza l'inserimento OTP quando `twofa_enabled = 1` (controllo presente subito dopo `bcrypt.compare`).
- ✅ Tutti gli endpoint profilati rifiutano richieste senza header `Authorization` (middleware lancia 401 e aggiorna `last_seen`).

**TODO**
- Nessun gap bloccante rilevato per il modulo; eventuali miglioramenti futuri: endpoint per disattivare 2FA e limitazione rigenerazione QR.

---

### 4. AI Opponent (modalità vs CPU)
**Stato**: ✅ verificato.
**Requisito subject**: AI che simuli input umano, aggiorni la “vista” max 1 volta/secondo e possa vincere.

**Implementazione e verifiche**
- `pong.ts:enemy()` (riga ~1600) usa `setInterval(..., 1000)` per calcolare la posizione futura della palla; gli spostamenti effettivi avvengono impostando `upPressed`/`downPressed`, quindi il gioco percepisce l'AI come un giocatore umano.
- Gli interval vengono puliti su chiusura finestra per evitare input fantasma (funzione `cleanup`).
- In modalità torneo e PvP, l'AI non salva match (filtrata in `saveMatchToDatabase`) così da rispettare il requisito "può vincere" ma non inquina le stats se non necessario.

**TODO**
- Nessuno: la verifica conferma piena aderenza al subject (refresh ≤ 1s e simulazione via stessi eventi tastiera dei player reali).

---

### 5. Second Game con user history & matchmaking ("peow")
**Stato**: ✅ verificato.
**Requisito subject**: aggiungere un gioco diverso da Pong, con matchmaking e storico utenti.

**Verifiche del 03/12/2025**
- ✅ Selettore gioco (`#game-selection`) passa correttamente a `initializeGameModeSelection` con `selectedGame` = `pong` o `peow`.
- ✅ Modalità torneo: `handleTournamentMatchEnd` salva ogni match non-CPU e aggiorna la bracket view.
- ✅ `initializepeowGame` implementa regole proprie (hit-points, proiettili, cooldown) e richiama `saveMatchToDatabase` con `game_name = 'peow'` per aggiornare le stats.
- ✅ `statsProgram.ts` usa `match.game_name` per filtrare i risultati e consente switch live tra Pong e Peow.

**TODO**
- Nessuno per il subject; eventuali enhancement: matchmaking remoto e scoreboard grafici.

---

### 6. Infrastructure Setup for Log Management (ELK)
**Stato**: ✅ verificato.
**Requisito subject**: pipeline ELK completa (Elasticsearch, Logstash, Kibana) con raccolta dai servizi.

**Verifiche del 03/12/2025**
- ✅ `create-env.sh` genera automaticamente credenziali ELK + JWT e scrive `.env` + `app/.env`.
- ✅ Ogni servizio ELK ha una Dockerfile custom che copia gli script di entrypoint/healthcheck con permessi (`--chmod=755`).
- ✅ L'app Fastify scrive `logs/server.log` via Pino (config in `server.js`), mentre il front-end invia log JSON all'endpoint `/log` (route `frontend.js` → `webClientLogger` → `logs/client.log`).
- ✅ `elk/logstash/pipeline/logstash.conf` taila entrambi i log dalla volume `app-logs` e li inoltra ad Elasticsearch su TLS (host `https://elasticsearch:9200`, credenziali da env, fingerprint per evitare duplicati).
- ✅ Kibana e Elasticsearch espongono HTTPS con certificati generati dal container `cert-generator` montati via volume `shared-certs`.

**TODO**
- Nessuno rilevato; per la presentazione sarà sufficiente mostrare un dashboard Kibana basato sugli indici `fttranscendence-logs-*`.

---

## Minor Modules

### 7. Database Backend (SQLite)
**Stato**: ✅ verificato.
**Requisito subject**: usare SQLite per ogni DB lato backend.

**Verifiche del 03/12/2025**
- ✅ `db.js` costruisce tutte le tabelle con `CREATE TABLE IF NOT EXISTS` e vincoli UNIQUE su username, email e coppie amicizie.
- ✅ Ogni controller usa `reply.server.db.prepare(...).run/get` (nessuna query string concatenation), prevenendo SQL injection.
- ✅ `docker-compose` monta `database/` all'interno dell'immagine e `app/Dockerfile` copia la cartella durante la build.

**TODO**
- Nessuno necessario per il modulo; eventuali future migliorie: aggiungere foreign key e ON DELETE CASCADE per pulizia automatica.

---

### 8. Frontend Toolkit (TypeScript + Tailwind CSS)
**Stato**: ✅ verificato.
**Requisito subject**: obbligo di utilizzare Tailwind CSS in aggiunta alla base TypeScript.

**Verifiche del 03/12/2025**
- ✅ `tsconfig.json` compila l'intera SPA (rootDir `public/ts` → `public/js`), `package.json` definisce `npm run build` = Tailwind + TypeScript.
- ✅ Il router SPA (`Router.ts`) gestisce history API e mantiene compatibilità con Firefox (no API proprietarie).
- ✅ Tailwind estende la palette Win98 e fornisce componenti custom (vedi `@layer components` in `public/styles/input.css`).
- ✅ Ogni programma desktop (user, stats, pong, 2FA, ecc.) è scritto in TypeScript e importato nella pagina `desktopPage.ts`.

**TODO**
- Nessuno per il modulo; considerare build automation (es. Vite) solo se richiesto da futuri miglioramenti.

---
