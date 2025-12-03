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

### Completed Major Modules (6/6)
- **Backend Framework**: Fastify + Node.js con HTTPS, Swagger, WebSocket e middleware JWT (`app/src/server.js`).
- **Standard User Management**: Registrazione/login, gestione profilo (avatar, username, display name **e cambio password direttamente dalla UI**), lista amici con presenza realtime via WebSocket, cronologia tornei e logout desktop (`controllers/auth.js`, `controllers/profile.js`, `public/ts/components/userProgram.ts`, `public/ts/pages/desktopPage.ts`).
- **Two-Factor Authentication e JWT**: TOTP con `otplib`, QR code, verifica OTP prima dell’attivazione.
- **AI Opponent**: logica CPU in `public/ts/components/pong.ts` con refresh ogni 1s e input simulato.
- **Second Game (“peow”)**: sistema di matchmaking condiviso, salvataggio partite e dashboard statistiche.
- **ELK Stack**: Elasticsearch, Logstash, Kibana con certificati dedicati, ILM policy e test automatici (`elk/tests/`).

### Completed Minor Modules (2/2)
- **Database Backend**: SQLite (`app/database/db.js`) con tabelle utenti, amici, match e prepared statement in tutti i controller.
- **Frontend Toolkit**: SPA Win98 in TypeScript + Tailwind, pipeline `watch-css`/`watch-ts` e build Docker.

**Totale**: 6 moduli major + 2 minor (equivalenti a 1 major aggiuntivo) → requisito dei 7 major soddisfatto.

## Runtime & Verification Checklist

- `make up` → avvio completo stack (app + ELK). Se fallisce, eseguire `docker compose down` e riprovare dopo `docker volume prune` mirato.
- `./elk/tests/elk-validation.sh` → convalida automatica dell’infrastruttura log con auto-fix per repository snapshot/alias ILM.
- QA manuale SPA: build frontend (`npm run build`) e verifica pagine (login, desktop, giochi, statistiche).
- Backup verifica: `curl -k -u "elastic:$ELASTIC_PASSWORD" https://localhost:9200/_snapshot/ft_archive_repo?pretty` per confermare configurazione archivio.

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

### Setup locale senza Docker (PowerShell)

Per automatizzare i passaggi di setup (creazione `.env`, certificati, `npm install`) è disponibile `scripts/setup-local.ps1`.

```powershell
pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1             # solo setup
pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -StartDev   # setup + npm run dev
pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -BuildAssets -StartProd
```

Opzioni utili:
- `-ForceEnv`, `-ForceCerts`, `-ForceInstall` per rigenerare rispettivamente `.env`, certificati o `node_modules`.
- `-BuildAssets` esegue `npm run build` prima dell'avvio.
- `-StartDev` (watcher) o `-StartProd` (solo Fastify) per avviare immediatamente l'app.

**Container Management**:
```bash
make up        # Start all services
make down      # Stop services  
make clean     # Remove containers and volumes
make logs      # View service logs
make test      # Health check all services
```

## API Info

La documentazione REST è disponibile su https://localhost:5000/docs (Swagger UI). Il file `app/src/request.http` contiene esempi di richieste e si integra con l’estensione VS Code [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client).

## Validation & Monitoring

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
- `/profile/stats` - Aggregated matches/wins/losses per game (JWT protected)
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

**Security Hardening Opportunities** (ancora da valutare):
- Protezioni XSS lato frontend/backend.
- Meccanismo CSRF token per richieste mutative.
- Rate limiting middleware per endpoint pubblici.
- Sanitizzazione/validazione avanzata degli input.

## Operational Follow-ups

- **Runtime QA**: rieseguire `make up` e testare la SPA per confermare behavior dopo ogni modifica.
- **Documentazione**: sincronizzare eventuali aggiornamenti futuri (es. nuove dashboard Kibana) in `docs/` e nel README.
- **Hardening**: valutare le attività elencate sopra (XSS/CSRF/rate limiting) in base ai requisiti addizionali eventualmente richiesti dalla correzione.

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
