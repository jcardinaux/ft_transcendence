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
