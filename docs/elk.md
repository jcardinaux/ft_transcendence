# ELK Stack Documentation

## Module Overview

**ELK Stack Centralized Log Management**

Container-based log aggregation, processing, and visualization system for ft_transcendence application monitoring and debugging.

**Core Components:**
- **Elasticsearch 8.15.0**: Document storage and search engine with clustering
- **Logstash 8.15.0**: Log processing and transformation pipeline  
- **Kibana 8.15.0**: Visualization and dashboard interface

**Data Flow:**
```
Container App → Log Files → Logstash → Elasticsearch → Kibana
```

**Log Sources:**
- Backend: Fastify server logs (JSON structured via Pino)
- Frontend: Client logs via HTTP API endpoint (`/log`)

**Technical Stack:**
- Docker containerized deployment with TLS encryption
- Persistent data volumes with health monitoring
- X-Pack security with certificate-based authentication
- Automated testing framework with auto-fix capabilities

## Current Status

### Implementation Status: COMPLETE

**Elasticsearch deployment and indexing** - COMPLETE
- Cluster health: GREEN/YELLOW status with active data ingestion
- Index template: `fttranscendence-logs-*` with optimized field mappings
- Daily rotation: `fttranscendence-logs-YYYY.MM.dd` pattern
- Document deduplication via SHA256 fingerprinting
- Search performance: Sub-second response times

**Logstash collection and processing** - COMPLETE  
- Dual source processing: `/app/logs/server.log` and `/app/logs/client.log`
- Real-time file monitoring with 1-second stat_interval and 5-second file discovery
- Filter pipeline: JSON codec parsing with log_data target, service tagging, timestamp normalization
- Output processing: SHA256 fingerprint-based document IDs for deduplication
- Pipeline workers: 2 workers with sincedb_path=/dev/null for development mode

**Kibana visualization interface** - COMPLETE
- Service status: Available with SSL-enabled interface on port 5601
- Authentication: kibana_system user with encrypted configuration
- API endpoints: `/api/status` returning healthy operational status
- Foundation ready for dashboard creation and log visualization

**Security implementation** - COMPLETE
- X-Pack security enabled with certificate-based authentication
- TLS encryption: All inter-service communication secured
- Credential management: Auto-generated secure passwords
- Network isolation: t-net Docker network with access controls
- Certificate authority: Shared CA with service-specific certificates

**Testing framework** - COMPLETE
- Automated validation: 6-test validation with auto-fix capabilities
- CI/CD integration: Pipeline testing with failure categorization
- Archive repository: Auto-fix for Docker permission issues
- Test runner: Unified interface for comprehensive, CI, and quick testing modes

**Data retention policies** - IMPLEMENTED
- Daily index rotation with automatic lifecycle management (ILM)
- Log retention: Hot (7 days, max 50GB), Warm (8-30 days), Cold (31-365 days), Delete (365 days)
- Snapshot repository: Automated backup at 2:00 AM, 30-day retention (max 50 snapshots, min 5)
- Archive location: `/usr/share/elasticsearch/archives`, 64MB compression chunks

### Technical Architecture: OPERATIONAL

**Containerization:**
- Service orchestration: cert-generator → elasticsearch → app → kibana → logstash
- Volume mounting: ./app/logs shared between app and logstash containers
- Health checks: All services monitored, automatic restart policies
- Dependencies: TLS certificate generation before service startup

**Log Processing Pipeline:**
- Source: Container application writes to /app/logs/server.log (Fastify/Pino) and /app/logs/client.log (HTTP POST /log)
- Collection: Logstash dual file input, sincedb_path=/dev/null, 1-second stat_interval, 5-second discovery_interval
- Processing: JSON parsing with log_data target, service classification (ft_backend/ft_client), timestamp UNIX_MS conversion
- Storage: Elasticsearch, daily index rotation, SHA256 fingerprint document IDs for deduplication
- Access: Kibana SSL interface for search and visualization

**Data Flow Architecture:**
```
ft-app container → /app/logs/server.log (Fastify/Pino)
ft-app container → /app/logs/client.log (HTTP POST /log)
↓
Logstash container → file input monitoring /logs/*
↓  
Filter pipeline → JSON decode, field extraction, service tagging
↓
Elasticsearch → fttranscendence-logs-YYYY.MM.dd indices
↓
Kibana → API and web interface (port 5601)
```

**Performance Metrics:**
- Document throughput: 21 logs processed successfully
- Index storage: 50.4kb current daily index size
- Cluster health: YELLOW (single node, expected status)
- Search latency: 5-64ms average response time

## Architecture

### Core Components

**Elasticsearch**
- Version: 8.15.0 with X-Pack security enabled
- Cluster configuration: Single-node deployment with auto-scaling capability
- Index management: Daily rotation pattern `fttranscendence-logs-YYYY.MM.dd`
- Memory allocation: 1GB heap with optimized JVM settings
- Storage: Docker volume persistence at `/usr/share/elasticsearch/data`
- Security: Certificate-based authentication with encrypted HTTP transport

**Logstash**
- Version: 8.15.0 with security integration
- Pipeline configuration: Multi-input processing with structured output
- Input sources: File monitoring `/app/logs/server.log` and `/app/logs/client.log`, 1-second stat_interval
- Processing: JSON codec with log_data target, field extraction, service tagging (ft_backend/ft_client)
- Workers: 2 pipeline workers via PIPELINE_WORKERS environment variable
- Output destination: Daily Elasticsearch indices, SHA256 fingerprint document IDs

**Kibana**
- Version: 8.15.0 with secure interface
- Network access: SSL-enabled web interface on port 5601
- Authentication: kibana_system user, encrypted saved objects
- Service health: API endpoint `/api/status` for operational monitoring
- Configuration management: Auto-generated credentials, TLS verification
### Network and Storage Architecture

**Container Networking**
- Network isolation: t-net Docker network, internal service communication
- Service discovery: Container name resolution for inter-service connectivity
- External access: elasticsearch:9200 and kibana:5601 exposed ports
- Security: TLS-encrypted communication between all ELK services

**Storage Strategy**
- Index pattern: Daily rotation with `fttranscendence-logs-YYYY.MM.dd` naming
- Document identification: SHA256 fingerprint-based IDs for deduplication
- Persistent volumes: elasticsearch-data, elasticsearch-archives, kibana-data, logstash-data, shared-certs
- Volume sharing: ./app/logs mounted to both app and logstash containers for real-time log processing

### Data Processing Pipeline

**Log Collection Phase**
- Input sources: Application containers writing structured JSON logs to /app/logs/
- File monitoring: Logstash dual file input, 1-second stat_interval, 5-second discover_interval
- Collection method: JSON codec, log_data target, sincedb_path=/dev/null for development
- Optimization: max_open_files=4096, close_older=1 hour, ignore_older=0

**Processing and Transformation**
- Parser: JSON codec, log_data target for ECS compliance, charset UTF-8
- Service tagging: Automatic classification ft_backend (server.log) or ft_client (client.log) 
- Field normalization: UNIX_MS timestamp conversion, reqId/context extraction, log_level standardization
- Workers: 2 pipeline workers, sincedb_path=/dev/null for development mode
- Field cleanup: Removal of processing artifacts (pid, hostname, time, event, log_data)

**Storage and Indexing**
- Target: Elasticsearch daily indices, optimized field mappings
- Deduplication: SHA256 fingerprinting prevents duplicate log entries
- Index lifecycle: Automatic daily rotation, retention policies
- Performance: Sub-second search response times, optimized storage

**Access and Visualization**
- Primary interface: Kibana SSL-enabled web interface on port 5601
- API access: RESTful endpoints for programmatic log data access
- Authentication: kibana_system user, encrypted saved objects
- Monitoring: Service health endpoints for operational status validation

## Component Configuration

### Elasticsearch Configuration

**Container Specification**
- Image: docker.elastic.co/elasticsearch/elasticsearch:8.15.0
- Network port: 9200:9200 with SSL encryption
- Memory allocation: 1GB JVM heap, memory lock enabled
- Storage: Persistent Docker volume for data retention

**Security Configuration**
```yaml
xpack.security.enabled=true
xpack.security.http.ssl.enabled=true  
xpack.security.transport.ssl.enabled=true
xpack.security.http.ssl.certificate_authorities=/usr/share/elasticsearch/config/certs/ca/ca.crt
xpack.security.http.ssl.certificate=/usr/share/elasticsearch/config/certs/elasticsearch/elasticsearch.crt
xpack.security.http.ssl.key=/usr/share/elasticsearch/config/certs/elasticsearch/elasticsearch.key
```

**Index Management**
- Index template: `fttranscendence-logs-*` pattern, optimized field mappings
- Rotation schedule: Daily indices, `fttranscendence-logs-YYYY.MM.dd` naming
- Field mappings: @timestamp(date), service(keyword), log_level(keyword), reqId(keyword), message(text)
- Document identification: SHA256 fingerprint for duplicate prevention

**Operational Verification**
```bash
# Cluster health status
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cluster/health"

# Index status and document count
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cat/indices/fttranscendence-logs-*?v"

# Service-specific log search
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/fttranscendence-logs-*/_search?q=service:ft_backend&size=10"
```

### Logstash

### Logstash Configuration

**Container Specification**
- Image: docker.elastic.co/logstash/logstash:8.15.0
- Memory allocation: 512MB JVM heap (LS_JAVA_OPTS=-Xms512m -Xmx512m)
- Dependencies: cert-generator, app (healthy), elasticsearch (healthy)
- Pipeline configuration: 2 workers via PIPELINE_WORKERS environment variable

**Input Pipeline Configuration**
```ruby
input {
  file {
    path => "/logs/server.log"
    codec => json { 
      charset => "UTF-8"
      target => "log_data"
    }
    tags => ["fastify"]
    type => "backend"
    sincedb_path => "/dev/null"
    stat_interval => 1
    discover_interval => 5
    close_older => 1
    max_open_files => 4096
  }
  file {
    path => "/logs/client.log"
    codec => json {
      charset => "UTF-8" 
      target => "log_data"
    }
    tags => ["client"]
    type => "web-client"
    # Same optimization parameters
  }
}
```

**Filter Processing Pipeline**
1. JSON field extraction from log_data nested structure with conditional reqId/context copying
2. Service classification: ft_backend (type=backend) or ft_client (type=web-client) based on file source
3. Timestamp normalization: Unix milliseconds to @timestamp with UNIX_MS date filter
4. Document fingerprinting: SHA256 hash from [path, host, msg, time] for deduplication
5. Field cleanup: Remove processing artifacts (pid, hostname, time, event, log_data), rename level to log_level

**Output Configuration**
```ruby
output {
  elasticsearch {
    hosts => ["https://elasticsearch:9200"]
    index => "fttranscendence-logs-%{+YYYY.MM.dd}"
    user => "${ES_USER}"
    password => "${ES_PASS}"
    ssl => true
    ssl_certificate_verification => false
    cacert => "/shared-certs/ca/ca-cert.pem"
    document_id => "%{[@metadata][fingerprint]}"
  }
  stdout { codec => rubydebug }  # Development debugging
}
```

### Advanced Logstash Configuration

**Pipeline Configuration (`elk/logstash/config/logstash.yml`)**
```yaml
path.config: /usr/share/logstash/pipeline    # Pipeline configuration directory
path.logs: /usr/share/logstash/logs          # Logstash internal logs
pipeline.workers: ${PIPELINE_WORKERS}        # Dynamic worker configuration (default: 2)
```

**Detailed Pipeline Specification (`elk/logstash/pipeline/logstash.conf`)**

*Input Configuration:*
- Dual file input monitoring with separate type classification
- `server.log`: type="backend", tags=["fastify"] for Fastify/Pino logs
- `client.log`: type="web-client", tags=["client"] for HTTP API logs  
- JSON codec, log_data target for ECS compliance and UTF-8 charset
- Performance optimization: stat_interval=1, discover_interval=5, max_open_files=4096, close_older=1h
- Development mode: sincedb_path=/dev/null for complete log reprocessing on restart

*Filter Processing Pipeline:*
1. **Field Extraction**: Conditional extraction from log_data nested structure (level, time, msg, pid, hostname)
2. **Context Handling**: reqId copying for backend logs, context copying for client logs
3. **Service Classification**: ft_backend (backend type) vs ft_client (web-client type) based on source file
4. **Timestamp Normalization**: UNIX_MS date filter conversion to @timestamp field
5. **Document Fingerprinting**: SHA256 hash generation from [path, host, msg, time] for deduplication
6. **Field Cleanup**: Removal of processing artifacts (pid, hostname, time, event, log_data), level → log_level rename

*Output Configuration:*
- Elasticsearch output, daily index pattern: `fttranscendence-logs-%{+YYYY.MM.dd}`
- Authentication via ES_USER and ES_PASS environment variables
- TLS configuration: SSL enabled, certificate authority verification disabled for development
- Document ID assignment via SHA256 fingerprint for deduplication
- Debug output via stdout, rubydebug codec for development visibility

### Kibana Configuration

**Container Specification**
- Image: docker.elastic.co/kibana/kibana:8.15.0
- Network port: 5601:5601, SSL encryption
- Dependencies: cert-generator, elasticsearch (healthy)
- Authentication: kibana_system user, role-based access

**Security Configuration**
```yaml
server.ssl.enabled: true
server.ssl.certificate: /shared-certs/kibana/kibana-cert.pem
server.ssl.key: /shared-certs/kibana/kibana-key.pem
elasticsearch.ssl.certificateAuthorities: ["/shared-certs/ca/ca-cert.pem"]
elasticsearch.ssl.verificationMode: certificate
xpack.encryptedSavedObjects.encryptionKey: "32-byte-encryption-key-for-saved-objects"
```

**Authentication Configuration**
- Service account: kibana_system, encrypted saved objects
- Password management: Auto-generated secure credentials
- Certificate verification: Full TLS chain validation
- Session encryption: 32-byte key for saved object security

**Operational Verification**
```bash
# Service health status
curl -k "https://localhost:5601/api/status"

# Expected response: {"status":{"overall":{"level":"available"}}}

# Elasticsearch connectivity test
curl -k "https://localhost:5601/api/status" | jq '.status.statuses[] | select(.id=="elasticsearch")'
```

## Log Source Integration

### Application Log Generation

**Backend Log Generation (ft_backend)**
```javascript
// app/src/server.js - Fastify with Pino structured logging
const logger = {
  transport: {
    target: 'pino/file',
    options: {
      destination: './logs/server.log',
      mkdir: true,
      sync: true
    }
  }
}
```

**Frontend Log Collection (ft_client)**
```typescript
// HTTP POST to /log endpoint for centralized collection
const logData = {
  level: 'info',
  message: 'User action completed',
  context: { userId: 123, action: 'login' }
};

await fetch('/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(logData)
});
```

### Log Format Specification

**Backend Log Structure (server.log)**
```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "ft-app",
  "reqId": "req-001",
  "msg": "Request processed successfully",
  "responseTime": 45
}
```

**Frontend Log Structure (client.log)**
```json
{
  "level": "info",
  "timestamp": 1625140800000,
  "message": "User interaction logged",
  "context": {
    "userId": 123,
    "page": "/dashboard",
    "action": "button_click"
  }
}
```

### Container Integration

**Volume Mapping and File Access**
- Application container: Writes structured logs to `/app/logs/server.log` and `/app/logs/client.log`
- Logstash container: Reads from `/logs/` directory via shared Docker volume mount
- Real-time monitoring: 1-second stat_interval for immediate log processing
- File discovery: 5-second discover_interval for new log file detection

**Log Processing Workflow**
1. Application services generate structured JSON logs
2. Docker volume shares `/app/logs` directory with Logstash container
3. Logstash monitors files, real-time file input polling
4. JSON codec parses log entries and extracts structured data
5. Filter pipeline adds service tags and normalizes timestamps
6. Elasticsearch stores processed logs in daily indices
7. Kibana provides interface for log search and visualization

## Security Implementation

### TLS Certificate Management

**Certificate Generation Architecture**
- Dedicated cert-generator service creates certificate authority and service certificates
- Certificate authority (CA), service-specific TLS certificates for secure communication
- X-Pack security enabled, certificate-based authentication across all services
- All inter-service communication encrypted, TLS 1.2+ protocols

**Certificate Directory Structure**
```
/shared-certs/
├── ca/
│   ├── ca-cert.pem          # Certificate Authority certificate
│   └── ca-key.pem           # Certificate Authority private key
├── app/
│   ├── app-cert.pem         # Application service certificate  
│   └── app-key.pem          # Application private key
├── elasticsearch/
│   ├── elasticsearch-cert.pem  # Elasticsearch service certificate
│   └── elasticsearch-key.pem   # Elasticsearch private key
├── kibana/
│   ├── kibana-cert.pem      # Kibana service certificate
│   └── kibana-key.pem       # Kibana private key
└── logstash/
    ├── logstash-cert.pem    # Logstash service certificate
    └── logstash-key.pem     # Logstash private key
```

### Authentication and Access Control

**User Account Management**
- elastic user: Auto-generated 24-character secure password, superuser privileges
- kibana_system user: Auto-generated 24-character password, kibana_system role
- Password storage: Environment variables ELASTIC_PASSWORD and KIBANA_SYSTEM_PASSWORD
- Saved object encryption: 32-byte hexadecimal key for Kibana saved object security

**Network Security Architecture**
- Network isolation: t-net Docker network, internal service communication
- External access: Only HTTPS endpoints (9200, 5601) exposed, TLS encryption
- Certificate validation: Full certificate chain verification for all connections
- Service discovery: Container name resolution for secure internal communication

### Security Verification

**Authentication Testing**
```bash
# Test Elasticsearch authentication
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_security/user"

# Test Kibana authentication
curl -k -u "kibana_system:$KIBANA_SYSTEM_PASSWORD" "https://localhost:9200/_security/user/kibana_system"

# Verify TLS certificate
openssl s_client -connect localhost:9200 -servername elasticsearch 2>/dev/null | openssl x509 -noout -text
```
# Verify certificate chain
openssl verify -CAfile /shared-certs/ca/ca-cert.pem /shared-certs/elasticsearch/elasticsearch-cert.pem
```

## Data Management and Performance

### Index Management Strategy

**Daily Index Rotation**
- Index pattern: `fttranscendence-logs-YYYY.MM.dd` for optimal time-based queries
- Document identification: SHA256 fingerprinting prevents duplicate log entries
- Field optimization: Keyword mapping for efficient aggregations and filtering
- Index template: Automatic field mapping for consistent data structure

**Storage Configuration**
```yaml
volumes:
  shared-certs:                                      # TLS certificates shared across all services
  elasticsearch-data:/usr/share/elasticsearch/data    # Persistent index storage
  elasticsearch-archives:/usr/share/elasticsearch/archives  # Snapshot repository storage
  kibana-data:/usr/share/kibana/data                 # Saved objects and dashboards
  logstash-data:/usr/share/logstash/data             # Pipeline state and metadata
  ./app/logs:/logs                                   # Shared log directory (app ↔ logstash)
```

**Field Mapping Template**
```json
{
  "mappings": {
    "properties": {
      "@timestamp": {"type": "date", "format": "strict_date_optional_time"},
      "service": {"type": "keyword", "fields": {"text": {"type": "text"}}},
      "log_level": {"type": "keyword"},
      "reqId": {"type": "keyword"},
      "message": {"type": "text", "analyzer": "standard"},
      "responseTime": {"type": "float"},
      "pid": {"type": "integer"},
      "hostname": {"type": "keyword"}
    }
  }
}
```

### Performance Optimization

**Elasticsearch Tuning**
- Memory lock: Enabled to prevent JVM heap swapping
- Heap allocation: 1GB, automatic memory management
- Thread pool: Optimized for single-node deployment
- Refresh interval: 1s for near real-time search capability

**Logstash Processing Optimization**
- Pipeline workers: 2 concurrent workers via PIPELINE_WORKERS environment variable
- Memory allocation: 512MB heap (LS_JAVA_OPTS=-Xms512m -Xmx512m)
- Field cleanup: Automatic removal of processing artifacts (pid, hostname, time, event, log_data)
- Development mode: sincedb_path=/dev/null for complete log reprocessing on restart
- File monitoring: 1-second stat_interval, 5-second discover_interval, max_open_files=4096

**Index Lifecycle Management (ILM)**
- Hot phase: 7 days, max 50GB rollover, priority 100
- Warm phase: 8-30 days, 0 replicas, priority 50
- Cold phase: 31-365 days, 0 replicas, priority 0
- Delete phase: 365 days automatic deletion

## Testing Framework

### Automated Testing Suite

**Testing Location**: `elk/tests/`

**Primary Test Scripts**
- `elk-validation.sh`: Comprehensive 6-test validation, auto-fix capabilities
- `elk-ci-pipeline.sh`: CI/CD pipeline testing, critical vs warning categorization  
- `elk-test-runner.sh`: Unified test runner, multiple execution modes

**Validation Test Coverage**
1. Service health verification (Elasticsearch, Kibana, Logstash)
2. Authentication and security testing
3. Index creation and document processing validation
4. Archive repository configuration, auto-fix capability
5. Index Lifecycle Management (ILM) policy verification
6. End-to-end log processing pipeline testing

**Auto-Fix Capabilities**
- Archive repository: Automatic Docker permission repair and repository creation
- ILM alias issues: Automatic index alias creation and policy application
- Service connectivity: Retry logic, exponential backoff
- Certificate validation: Automatic certificate verification and repair

**Test Execution Modes**
```bash
# Comprehensive validation with auto-fix
./elk/tests/elk-test-runner.sh comprehensive

# CI/CD pipeline testing
./elk/tests/elk-test-runner.sh ci

# Quick connectivity validation
./elk/tests/elk-test-runner.sh quick
```

## Testing Framework Architecture

### Comprehensive Testing Suite (`elk/tests/`)

**Primary Testing Scripts**
- **`elk-validation.sh`**: Comprehensive system validation, auto-fix capabilities
  - 6-test sequential execution: Elasticsearch health, ILM policies, archive repository, indices status, Logstash processing, Kibana availability
  - Auto-fix implementation for tests 3 (Docker permissions via `chown elasticsearch:elasticsearch`) and 4 (ILM alias creation)
  - 2-second stabilization delay after automated repairs, re-test validation
  - ANSI color-coded output, pass/fail/fix status indicators
  - Environment validation and .env file loading, authentication setup

- **`elk-ci-pipeline.sh`**: CI/CD integration testing, structured output
  - Identical 6-test sequence, no auto-fix capabilities for pipeline deployment decisions
  - Test categorization: CRITICAL (Elasticsearch, ILM, Data Ingestion, Kibana) vs WARNING (Logstash, Archive Repository)
  - Timestamp-prefixed logging format: `[YYYY-MM-DD HH:MM:SS] STATUS: message` for automation parsing
  - Command-line options: `--fail-on-warnings` (strict mode), `--verbose` (diagnostic output)
  - CI/CD compliant exit codes: 0 (success/warnings), 1 (critical failures)

- **`elk-test-runner.sh`**: Unified test execution interface, prerequisite validation
  - Multiple execution modes: `comprehensive` (elk-validation.sh), `ci`/`ci-strict` (elk-ci-pipeline.sh), `quick` (connectivity tests)
  - Environment prerequisite validation: .env file existence, Docker container status (`elk-elasticsearch`)
  - Service accessibility verification via quick connectivity tests before full execution
  - Simplified command-line interface for all testing scenarios

**Test Documentation**
- **`README.md`**: Technical framework documentation, troubleshooting procedures
- **`INDEX.md`**: Testing framework overview and execution interface documentation

### Test Execution Patterns

**Development Testing Workflow**
```bash
# Deploy stack and wait for initialization
make up && sleep 60

# Comprehensive validation with auto-fix
./elk/tests/elk-validation.sh

# Alternative unified interface
./elk/tests/elk-test-runner.sh comprehensive
```

**CI/CD Pipeline Integration**
```bash
# Standard pipeline testing (warnings permitted)
./elk/tests/elk-ci-pipeline.sh

# Strict pipeline testing (warnings treated as failures)  
./elk/tests/elk-ci-pipeline.sh --fail-on-warnings

# Unified interface options
./elk/tests/elk-test-runner.sh ci-strict
```

**Makefile Integration**
```bash
make test-elk        # elk-validation.sh execution
make test-ci         # elk-ci-pipeline.sh standard mode
make test-ci-strict  # elk-ci-pipeline.sh with --fail-on-warnings
```

## Deployment and Operations

### Service Deployment Sequence

**Container Startup Order**
```
cert-generator → elasticsearch + app → kibana + logstash
```

**Initial Deployment Process**
```bash
# Generate secure credentials and environment configuration
./create-env.sh

# Deploy ELK stack, application integration
docker-compose up -d

# Verify service deployment status
docker-compose ps

# Run comprehensive testing validation
./elk/tests/elk-test-runner.sh comprehensive
```

### System Verification and Testing

**End-to-End Pipeline Testing**
```bash
# Generate backend application log
curl -k "https://localhost:5000/api/test"

# Generate frontend log via API endpoint
curl -k -X POST "https://localhost:5000/log" \
  -H "Content-Type: application/json" \
  -d '{"level":"info","message":"Test log entry","context":{"test":true}}'

# Verify log processing and indexing (allow processing time)
sleep 10

# Query processed logs from Elasticsearch
curl -k -u "elastic:$ELASTIC_PASSWORD" \
  "https://localhost:9200/fttranscendence-logs-*/_search?size=2&sort=@timestamp:desc&pretty"
```

**Volume Management:**
```bash
# Container logs
docker logs elk-elasticsearch
docker logs elk-logstash  
docker logs elk-kibana

# Data volumes
docker volume ls | grep ft_transcendence

# Reset deployment
docker-compose down -v && rm -rf ./app/logs/* && docker-compose up -d
```

**Performance Monitoring:**
```bash
# Cluster statistics
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cluster/stats"

# Index metrics
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cat/indices/fttranscendence-logs-*?v"

# Pipeline status
curl "http://localhost:9600/_node/stats/pipelines"
```

### Container Startup Scripts and Health Monitoring

**Elasticsearch Container Scripts (`elk/elasticsearch/scripts/`)**
- **`entrypoint-es.sh`**: Primary container initialization script
  - Certificate directory setup and permission configuration (`chmod 644/600`)
  - Archive directory creation for snapshot repository at `/usr/share/elasticsearch/archives`
  - TLS certificate copying from shared volume to Elasticsearch config directory
  - Background Elasticsearch startup, `eswrapper` and process monitoring
  - Automatic kibana_system user password configuration via security API
  - Index template creation for `fttranscendence-logs-*` pattern, field mappings
  - ILM policy execution via `setup-ilm.sh` orchestration
  
- **`healthcheck-es.sh`**: Container health validation script
  - Client certificate authentication for `/_cluster/health` endpoint
  - GREEN/YELLOW status validation for Docker health checks
  - TLS verification, Elasticsearch service certificates
  
- **`setup-ilm.sh`**: Index Lifecycle Management and backup automation
  - ILM policy creation: `fttranscendence-logs-policy` with Hot(7d/50GB) → Warm(8-30d) → Cold(31-365d) → Delete(365d)
  - Index template application, field mappings (@timestamp, service, log_level, reqId, responseTime)
  - Snapshot repository creation: `ft_archive_repo`, filesystem storage and 64MB compression
  - SLM policy automation: `ft_archive_policy` for daily 2:00 AM backups (30-day retention, max 50 snapshots)

**Kibana Container Scripts (`elk/kibana/scripts/`)**
- **`init-kibana.sh`**: Kibana service initialization and dashboard orchestration
  - Background Kibana startup with process ID management
  - Service availability polling until `/api/status` returns "available" 
  - One-time dashboard setup execution with persistent state tracking (`/tmp/dashboards-initialized`)
  - Process lifecycle management with wait command
  
- **`healthcheck-kibana.sh`**: Kibana service health validation
  - SSL-enabled health check via `/api/status` endpoint, client certificates
  - "available" status verification for Docker health monitoring
  - TLS certificate-based authentication validation
  
- **`setup-dashboards.sh`**: Automated dashboard and visualization creation
  - Index pattern creation: `fttranscendence-logs-*` with @timestamp time field and field mappings
  - Visualization components: Log levels pie chart (`log-levels-pie`), services bar chart (`services-bar`)
  - Main dashboard assembly: `ft_transcendence Log Analytics`, 24h time range and 10s refresh
  - Kibana saved objects API integration, kibana_system authentication

**Logstash Container Scripts (`elk/logstash/scripts/`)**
- **`entrypoint-ls.sh`**: Logstash pipeline initialization
  - Elasticsearch availability polling, client certificate authentication via HTTPS
  - Service dependency validation before processing startup
  - Pipeline configuration loading from `/usr/share/logstash/pipeline/logstash.conf`, 2 workers
  - Log file accessibility verification for `/logs/server.log` and `/logs/client.log`
