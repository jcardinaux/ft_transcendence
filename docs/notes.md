# Docker Infrastructure Documentation - ft_transcendence

## Overview

Notes: Pong game website with real-time multiplayer capabilities, user management, and logging infrastructure.

## Project Requirements Alignment

Based on the ft_transcendence subject (Version 16.1), infrastructure requirements:

- **Mandatory HTTPS**: All communications must use HTTPS/WSS protocols
- **Single Container Deployment**: Everything launched with single command line
- **Fastify + Node.js Backend**: Framework module implementation
- **SQLite Database**: Backend data persistence
- **Typescript Frontend**: With Tailwind CSS toolkit
- **ELK Stack Integration**: Infrastructure setup for log management (DevOps major module)

## Current Container Architecture

### Multi-Service Docker Compose Stack

The current implementation consists of four containerized services:

1. **Application Container** (`ft-app`)
   - **Base Image**: `node:20` (multi-stage build with slim runtime)
   - **Framework**: Fastify with Node.js backend
   - **Frontend**: TypeScript with Tailwind CSS
   - **Database**: SQLite for data persistence
   - **Security**: Non-root user execution, HTTPS enforcement
   - **Port Mapping**: 5000:5000
   - **Health Monitoring**: HTTP health checks on `/api/test`

2. **Elasticsearch Container** (`elk-elasticsearch`)
   - **Version**: 8.15.0
   - **Configuration**: Single-node cluster with security enabled
   - **Memory**: 1GB heap allocation
   - **Security**: Basic license with authentication
   - **Port Mapping**: 9200:9200

3. **Kibana Container** (`elk-kibana`)
   - **Version**: 8.15.0
   - **Integration**: Connected to Elasticsearch with system user
   - **Security**: Encrypted saved objects with custom key
   - **Port Mapping**: 5601:5601

4. **Logstash Container** (`elk-logstash`)
   - **Version**: 8.15.0
   - **Function**: Log processing pipeline from application to Elasticsearch
   - **Configuration**: Custom pipeline with 2 worker threads
   - **Port Mapping**: 5044:5044

### Network Architecture

- **Network Type**: Bridge network (`elk-net`)
- **Service Discovery**: Internal DNS resolution between containers
- **Security**: Isolated network namespace with controlled port exposure

### Volume Management

**Named Volumes:**
- `elasticsearch-data`: Persistent search index storage
- `kibana-data`: Dashboard and configuration persistence
- `logstash-data`: Pipeline state and buffer storage

**Bind Mounts:**
- `./app/logs:/app/logs`: Application log files
- `./elk/*/scripts:/scripts`: Health check and initialization scripts
- `./elk/logstash/pipeline:/usr/share/logstash/pipeline`: Log processing configuration

## HTTPS Configuration

### SSL Certificate Management

**Prerequisite**: OpenSSL must be available in the container environment.

#### Certificate Generation Command:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 \
  -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"
```

#### Certificate Parameters:

- `-x509`: Generates self-signed certificate
- `-newkey rsa:2048`: Creates new 2048-bit RSA private key
- `-nodes`: No password encryption on private key
- `-keyout server.key`: Private key output filename
- `-out server.crt`: Certificate output filename
- `-days 365`: Certificate validity period (1 year)
- `-subj`: Certificate subject information (organization data)

#### Certificate Deployment:

Certificates must be positioned in the application directory structure:
```
app/certs/
├── server.crt    (Public certificate - 644 permissions)
└── server.key    (Private key - 600 permissions)
```

### Automated Certificate Generation

#### Current Certificate Status:
**⚠️ IMPORTANT**: Certificates are currently generated manually outside the containerization process.

**Current Location**: `/app/certs/server.key` and `/app/certs/server.crt` exist in the filesystem but are not integrated into Docker build process.

#### Integration Required in Dockerfile:

```dockerfile
# Install OpenSSL if not present
RUN apt-get update && apt-get install -y openssl

# Create certificate directory
RUN mkdir -p /app/certs

# Generate SSL certificates automatically during build
RUN openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /app/certs/server.key \
    -out /app/certs/server.crt \
    -days 365 \
    -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"

# Set proper permissions
RUN chmod 600 /app/certs/server.key && chmod 644 /app/certs/server.crt
```

#### Docker Compose Integration:

Currently certificates are available through the filesystem but should be managed through container volumes:

```yaml
version: '3.8'
services:
  app:
    build: .
    volumes:
      - ./app/logs:/app/logs
      # Remove manual certificate binding once automated in Dockerfile
    ports:
      - "5000:5000"  # Current implementation
      - "443:443"    # HTTPS production deployment
    environment:
      - NODE_ENV=production
```

## Deployment Procedures

### Pre-Deployment Checklist

Before launching the container stack:

1. **Verify OpenSSL Installation**:
   ```bash
   openssl version
   ```

2. **Check Certificate Existence**:
   ```bash
   ls -la app/certs/
   ```

3. **Generate Missing Certificates**:
   ```bash
   mkdir -p app/certs
   cd app/certs
   openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 \
     -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"
   ```

4. **Set Correct File Permissions**:
   ```bash
   chmod 600 app/certs/server.key
   chmod 644 app/certs/server.crt
   ```

5. **Validate Environment Variables**:
   ```bash
   # Ensure .env file exists with required variables
   test -f app/.env || echo "Missing .env file"
   ```

### Single Command Deployment

As per ft_transcendence requirements, the entire infrastructure launches with:

```bash
docker compose up -d
```

Commands executed:
- Builds the application container with multi-stage optimization
- Starts ELK stack with proper service dependencies
- Establishes secure internal networking
- Mounts persistent volumes for data retention
- Health monitoring across all services

## Current Implementation Status

### Completed Infrastructure Components

**Container Architecture:**
- ✅ Multi-stage Docker build with production optimization
- ✅ Non-root user execution for security compliance
- ✅ Health check implementation across all services
- ✅ Bridge network isolation with controlled port exposure
- ✅ Persistent volume management for data retention

**SSL Certificate Management:**
- ❌ **Current Status**: Certificates are manually generated and stored in `/app/certs/` directory
- ❌ No automated certificate generation in Docker container
- ✅ HTTPS server configuration implemented in Node.js application
- ⚠️ Certificates exist outside containerization process

**Backend API Implementation:**
- ✅ Fastify framework with Node.js runtime (Major module: Backend Framework)
- ✅ SQLite database with complete schema (Minor module: Database)
- ✅ RESTful API structure:
  - **Authentication routes**: `/auth/` (login, registration, user management)
  - **Profile routes**: `/profile/` (user info, 2FA, avatar upload, friends)
  - **Match routes**: `/matches/` (game history, match management)
  - **Frontend routes**: `/` (static files, logging endpoint)
- ✅ JWT authentication middleware with automatic token verification
- ✅ Swagger API documentation at `/docs`
- ✅ WebSocket infrastructure for real-time communication
- ✅ HTTPS enforcement with SSL certificate integration
- ✅ Logging system with dual-target Pino configuration

**Database Schema (SQLite):**
- ✅ **users** table: Complete user management (id, username, email, password, display_name, avatar, totp_secret, twofa_enabled, last_seen)
- ✅ **friends** table: Friend relationships with unique constraints
- ✅ **matches** table: Game history tracking (player1_id, player2_id, winner_id, score, date)

**Security Implementation:**
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication system with expiration
- ✅ Input validation and structured API schemas
- ✅ Environment variable management with .env files
- ✅ 2FA implementation with QR code generation and TOTP validation
- ✅ Protected routes with JWT middleware
- ❌ **Missing**: XSS protection implementation
- ❌ **Missing**: SQL injection protection validation
- ❌ **Missing**: CSRF protection

**Frontend Implementation:**
- ✅ TypeScript base code compliance (mandatory requirement)
- ✅ Tailwind CSS integration (Minor module: Frontend Framework)
- ✅ Single-page application architecture
- ✅ Browser compatibility (Mozilla Firefox latest stable)
- ❌ **CRITICAL**: No Pong game implementation - only basic demo interface
- ✅ Logging system integration between frontend and backend
- ✅ API testing interface with error handling

**DevOps Infrastructure:**
- ✅ ELK Stack deployment (Major module: Infrastructure setup for log management)
- ✅ Elasticsearch 8.15.0 with security enabled
- ✅ Kibana dashboard interface
- ✅ Logstash pipeline for application log processing
- ✅ Automated log rotation and retention
- ✅ Environment variable generation script (`create-env.sh`)

### Module Implementation Analysis

**Completed Major Modules (3/7 minimum required):**
1. ✅ **Backend Framework** (Fastify + Node.js) - Fully implemented with API
2. ✅ **Infrastructure Setup** (ELK Stack) - Complete logging infrastructure
3. 🔄 **Two-Factor Authentication and JWT** - JWT fully implemented, 2FA backend ready but integration incomplete

**Completed Minor Modules (2 minor = 1 major):**
1. ✅ **Frontend Framework** (Tailwind CSS) - Implemented with TypeScript
2. ✅ **Database Backend** (SQLite) - Complete schema with relationships

**In Progress Modules:**
- 🔄 **Standard User Management** - Backend APIs complete, frontend interface missing
- 🔄 **User and Game Stats Dashboards** - Backend endpoints implemented, no frontend dashboard

**Missing Critical Components:**

### Core Game Implementation (MANDATORY - 0% Complete)
- ❌ **Pong game mechanics and physics**
- ❌ **Tournament system with matchmaking**
- ❌ **Real-time multiplayer gameplay**
- ❌ **Player registration system for tournaments**
- ❌ **Game interface and controls**

### Additional Major Modules Required (Need 4 more for minimum 7)
- ❌ **Remote Players** (WebSocket infrastructure exists but game logic missing)
- ❌ **Live Chat** (WebSocket infrastructure exists but chat logic missing)
- ❌ **AI Opponent** (No implementation)
- ❌ **Server-Side Pong** (Basic API structure exists but game logic missing)

### Technical Implementation Gaps

**Frontend Critical Deficiencies:**
- ❌ No game interface implementation
- ❌ No user authentication forms
- ❌ No profile management interface
- ❌ No friend system UI
- ❌ No tournament interface
- ❌ No real-time communication implementation

**Backend Missing Features:**
- ❌ Tournament management system
- ❌ Real-time game state management
- ❌ Matchmaking logic
- ❌ Game session handling
- ❌ WebSocket game communication protocols

**Security Enhancements Required:**
- ❌ XSS protection implementation
- ❌ CSRF token system
- ❌ Rate limiting implementation
- ❌ Input sanitization validation
- ❌ API route access control refinement

### Certificate Management Issues

**Current SSL Implementation:**
- ⚠️ Certificates manually generated outside Docker environment
- ⚠️ No automated certificate rotation
- ⚠️ Certificates not integrated into containerization process
- ⚠️ Missing certificate validation in deployment pipeline

**Required Certificate Fixes:**
1. Integrate certificate generation into Dockerfile
2. Implement certificate validation in health checks
3. Add certificate rotation automation
4. Ensure proper certificate permissions in container

### Next Development Priorities

**Immediate (CRITICAL - Project Foundation):**
1. **Core Pong Game Implementation** - Frontend game interface with Canvas/WebGL
2. **Tournament System** - Game session management and player matchmaking
3. **User Authentication Frontend** - Login/registration forms and JWT integration
4. **Certificate Automation** - Integrate SSL generation into Docker container

**Short-term (Module Completion for 7 Major Requirement):**
1. **Remote Players** - Real-time multiplayer via WebSocket with game state synchronization
2. **Live Chat** - Real-time messaging system with WebSocket communication
3. **Complete User Management** - Profile interface, friend system, and user dashboard
4. **AI Opponent** - Game AI implementation with strategic decision making

**Medium-term (Enhancement and Additional Modules):**
1. **Server-Side Pong** - Complete game logic migration to backend with API endpoints
2. **User Stats Dashboard** - Frontend implementation for game statistics and history
3. **Game Customization** - Settings interface for game variations and power-ups
4. **Enhanced Security** - XSS protection, CSRF tokens, and input sanitization

**Technical Infrastructure Improvements:**
1. **Certificate Management** - Automated generation and rotation in containerization
2. **Monitoring Integration** - Prometheus/Grafana implementation for system metrics
3. **Performance Optimization** - Frontend game optimization and backend response times
4. **Production Readiness** - Load testing, error handling, and deployment automation

### Critical Path Analysis

**Mandatory Requirements (Must Complete for Project Viability):**
- Pong game implementation (core requirement)
- Tournament system (mandatory feature)
- User registration for tournaments (mandatory feature)
- HTTPS security implementation (mandatory security)

**Module Requirements (Need 7 Major Modules):**
- Currently: 3 Major completed + 1 Major equivalent from 2 Minor = 4 Major total
- **Required: 3 additional Major modules minimum**
- **Recommended path**: Remote Players + Live Chat + AI Opponent
- **Alternative path**: Standard User Management + Additional Game + Multiplayer

### Implementation Readiness Assessment

**High Readiness (Backend APIs Available):**
- User Management Frontend (APIs complete)
- Friend System Interface (APIs complete)
- Match History Dashboard (APIs complete)
- 2FA Integration (Backend complete)

**Medium Readiness (Infrastructure Available):**
- Live Chat (WebSocket infrastructure ready)
- Remote Players (WebSocket infrastructure ready)
- Real-time Game Communication (WebSocket ready)

**Low Readiness (Requires Full Development):**
- Pong Game Logic (no implementation)
- Tournament System (no implementation)
- AI Opponent (no implementation)
- Game Physics Engine (no implementation)

## Troubleshooting

### Common Issues

**Error**: `ENOENT: no such file or directory, open './certs/server.key'`
- **Solution**: Verify certificates are generated in the correct directory structure

**Error**: `Error: Cannot find module 'https'`
- **Solution**: Verify Node.js supports HTTPS module (should be native)

**Error**: `EACCES: permission denied`
- **Solution**: Correct certificate file permissions using chmod commands

**Error**: `Container health check failing`
- **Solution**: Verify application is responding on health check endpoint (`/api/test`) and HTTPS is configured with valid certificates

**Error**: `Elasticsearch cluster startup timeout`
- **Solution**: Increase memory allocation or wait for service initialization (current: 1GB heap)

**Error**: `SSL certificate not found during container startup`
- **Solution**: Ensure certificates are generated during Docker build process or copy existing certificates into container

**Error**: `WebSocket connection refused`
- **Solution**: Verify WebSocket route is configured and JWT token is valid for authentication

### Certificate Regeneration Procedure

For certificate regeneration (e.g., after expiration):

```bash
# Backup existing certificates
mv app/certs/server.key app/certs/server.key.old
mv app/certs/server.crt app/certs/server.crt.old

# Generate new certificates
openssl req -x509 -newkey rsa:2048 -nodes -keyout app/certs/server.key -out app/certs/server.crt -days 365 \
  -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"

# Restart containers
docker compose restart app
```

### Development Commands

**Container Management:**
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app
docker compose logs -f elasticsearch

# Restart specific service
docker compose restart app

# Rebuild and restart
docker compose up -d --build app

# Stop all services
docker compose down

# Remove volumes (destructive)
docker compose down -v
```

**Health Status Verification:**
```bash
# Check container health
docker compose ps

# Test application endpoint
curl -fsSk https://localhost:5000/api/test

# Check Elasticsearch
curl -u elastic:changeme http://localhost:9200/_cluster/health

# Access Kibana
open http://localhost:5601
```

## Security Considerations

**Certificate Management:**
- Self-signed certificates are suitable for development environment only
- For production deployment, use certificates signed by recognized Certificate Authority
- Never commit private keys to repository (add `*.key` to `.gitignore`)
- Implement proper certificate rotation procedures

**Container Security:**
- Non-root user execution prevents privilege escalation
- Isolated network namespace limits attack surface
- Health checks ensure service availability monitoring
- Environment variables isolated in `.env` files

**Data Protection:**
- Database files protected through volume permissions
- Log files accessible only to application user
- Elasticsearch security enabled with authentication
- Persistent volumes encrypted at rest (system-dependent)

## Performance Optimization

**Container Resource Allocation:**
- Elasticsearch: 1GB heap allocation (adjustable via ES_JAVA_OPTS)
- Logstash: 512MB heap allocation (adjustable via LS_JAVA_OPTS)
- Application: Node.js memory management via container limits

**Build Optimization:**
- Multi-stage Docker build reduces final image size
- npm install with --omit=dev for production dependencies only
- Static asset compilation during build phase
- Layer caching optimization for faster rebuilds

**Network Performance:**
- Bridge network: container communication
- Service discovery eliminates external DNS lookups
- Health checks prevent traffic to unhealthy containers
- Port exposure limited to required services only

## Technical Analysis: app/Dockerfile

### Multi-Stage Docker Build Architecture

Multi-stage Docker build pattern optimized for production deployment, security, and performance. Two distinct stages with specific responsibilities.

### Stage 1: Builder (Development Environment)

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app ./
RUN npm run build
```

**Base Image Selection:**
- **`node:20`**: Full Node.js 20 runtime with complete toolchain
- **Purpose**: Development environment with all build dependencies
- **Size**: ~1GB (includes npm, build tools, Python, compilers)

**Build Process Analysis:**
1. **Dependency Installation**: `npm install` fetches all dependencies (including devDependencies)
2. **Layer Optimization**: `package*.json` copied separately for Docker cache efficiency
3. **Source Code Copy**: Complete application source copied after dependency installation
4. **Build Execution**: `npm run build` compiles TypeScript to JavaScript and processes Tailwind CSS

**Build Artifacts Generated:**
- `/app/public/js/main.js` - Compiled TypeScript application
- `/app/public/js/main.js.map` - Source map for debugging
- `/app/public/styles/output.css` - Processed Tailwind CSS
- `node_modules/` - All dependencies (production + development)

### Stage 2: Runtime (Production Environment)

```dockerfile
FROM node:20-slim AS runtime
WORKDIR /app
```

**Base Image Optimization:**
- **`node:20-slim`**: Minimal Node.js runtime without build tools
- **Size Reduction**: ~300MB (vs 1GB full image)
- **Security**: Reduced attack surface with minimal package footprint

### Selective File Transfer Strategy

```dockerfile
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/database ./database
COPY --from=builder /app/certs ./certs
COPY --from=builder /app/tailwind.config.js .
COPY --from=builder /app/tsconfig.json .
COPY --from=builder /app/.env .env
```

**Transfer Analysis:**
- **`package*.json`**: Dependency manifests for runtime verification
- **`node_modules/`**: Complete dependency tree (will be optimized next)
- **`public/`**: Compiled frontend assets (JS, CSS, HTML, images)
- **`src/`**: Backend source code (Fastify server, routes, controllers)
- **`database/`**: SQLite database file and schema
- **`certs/`**: SSL certificates for HTTPS enforcement
- **Configuration files**: Tailwind and TypeScript configs for runtime
- **Environment**: Production environment variables

### Production Dependency Optimization

```dockerfile
RUN npm install --omit=dev
```

**Optimization Strategy:**
- **`--omit=dev`**: Removes development dependencies (TypeScript compiler, build tools)
- **Size Reduction**: ~40-60% reduction in node_modules size
- **Security**: Eliminates unnecessary packages that could introduce vulnerabilities
- **Performance**: Faster container startup with fewer modules to load

### Logging Infrastructure Setup

```dockerfile
RUN mkdir -p /app/logs && touch /app/logs/server.log /app/logs/client.log
RUN chmod 666 /app/logs/*.log
```

**Logging Strategy:**
- **Directory Creation**: Log directory exists at container start
- **File Initialization**: Creates log files to prevent write errors
- **Permission Setting**: `666` read/write access for application and bind mounts
- **Integration**: Supports bind mount to host filesystem for log persistence

### System Dependencies Installation

```dockerfile
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

**Health Check Requirements:**
- **`curl`**: Required for Docker health check implementation
- **Package Cache Cleanup**: `rm -rf /var/lib/apt/lists/*` reduces image size
- **Minimal Installation**: Only essential packages added to slim image

### Security Implementation

```dockerfile
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser /app
USER appuser
```

**Security Measures:**
- **Non-Root Execution**: Application runs as unprivileged user
- **User Creation**: `appuser` with no password and no shell access
- **File Ownership**: All application files owned by application user
- **Privilege Separation**: Prevents container breakout and privilege escalation
- **Compliance**: Follows container security best practices

### Network Configuration

```dockerfile
EXPOSE 5000
```

**Port Strategy:**
- **Single Port**: Application handles both HTTP and HTTPS on port 5000
- **Internal Routing**: Fastify server manages protocol switching internally
- **Security**: No unnecessary port exposure

### Application Startup

```dockerfile
CMD ["npm", "start"]
```

**Startup Configuration:**
- **Process Manager**: Uses npm start script for application launch
- **Command Format**: Exec form prevents shell wrapping for better signal handling
- **Environment**: Inherits all environment variables from .env file

### Build Optimization Strategies

**Layer Caching:**
1. **Dependencies First**: `package*.json` copied before source code
2. **Build Separation**: Build artifacts generated in separate stage
3. **Static Content**: Compiled assets transferred without rebuild

**Size Optimization:**
1. **Multi-Stage**: ~70% size reduction (1GB → 300MB)
2. **Dev Dependencies**: Removed in production stage
3. **Package Cache**: APT cache cleaned after curl installation
4. **Minimal Base**: Slim image reduces attack surface

### Security Considerations

**Image Security:**
- **Base Image**: Official Node.js images with security updates
- **Non-Root**: Application process runs without root privileges
- **Minimal Attack Surface**: Only required packages installed
- **File Permissions**: Appropriate ownership and access controls

**SSL Certificate Management:**
- **Certificate Copy**: SSL certificates transferred from builder stage
- **File Permissions**: Certificates maintain appropriate access controls
- **Security Gap**: Certificates should be generated during build process (not transferred)

### Performance Optimizations

**Build Performance:**
- **Layer Caching**: Dependencies cached when source code changes
- **Parallel Operations**: Multi-stage concurrent processing
- **Build Context**: Only necessary files copied to build context

**Runtime Performance:**
- **Minimal Dependencies**: Production-only packages loaded
- **Process Efficiency**: Direct npm start without shell overhead
- **Memory Usage**: Optimized for container resource constraints

### Recommended Improvements

**Security Enhancements:**
1. **Automated Certificate Generation**: Integrate OpenSSL during build
2. **Health Check Integration**: Add HEALTHCHECK directive
3. **Scanner Integration**: Add vulnerability scanning to build pipeline
4. **Secret Management**: Implement Docker secrets for sensitive data

**Performance Optimizations:**
1. **Node.js Optimization**: Add NODE_ENV=production
2. **Memory Limits**: Configure heap size for container limits
3. **Process Manager**: Consider PM2 for production process management
4. **Asset Optimization**: Implement gzip compression for static files

**Operational Improvements:**
1. **Build Arguments**: Add configurable parameters for environment
2. **Version Pinning**: Pin specific package versions for reproducibility
3. **Multi-Architecture**: Support ARM64 for Apple Silicon deployment
4. **Distroless**: Consider distroless images for further size reduction

### Integration with Docker Compose

Dockerfile integrates with Docker Compose stack:

**Service Definition:**
- **Build Context**: References current directory for build
- **Volume Mounts**: Log directory bound to host filesystem
- **Network**: Connected to elk-net for ELK stack communication
- **Health Checks**: Configured to verify HTTPS endpoint functionality

**Environment Integration:**
- **Environment Variables**: Loaded from .env file during build
- **Database Persistence**: SQLite file maintained through container lifecycle
- **Certificate Management**: SSL certificates available for HTTPS server

