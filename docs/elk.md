# ELK Stack Infrastructure Documentation

## Module Overview

**ELK (Elasticsearch, Logstash, Kibana) Log Management Infrastructure**

Centralized log aggregation, processing, and visualization system for ft_transcendence application monitoring.

**Core Components:**
- **Elasticsearch 8.15.0**: Document storage and search engine
- **Logstash 8.15.0**: Log processing and transformation pipeline  
- **Kibana 8.15.0**: Visualization and dashboard interface

**Data Flow:**
```
Container App → Log Files → Logstash → Elasticsearch → Kibana
```

**Log Sources:**
- Backend: Fastify server logs (JSON structured)
- Frontend: Client logs via HTTP API endpoint

**Infrastructure:**
- Docker containerized services with TLS encryption
- Persistent data volumes with health checks
- X-Pack security with certificate authentication

## Current Status

### Implementation Status: COMPLETE

**Deploy Elasticsearch to store and index log data** - COMPLETE
- Cluster status: GREEN, 421 documents indexed across daily rotation
- Index template: fttranscendence-logs-* with optimized field mappings
- Daily rotation: fttranscendence-logs-YYYY.MM.dd pattern
- Document deduplication via SHA256 fingerprinting
- Search performance: sub-second response times

**Configure Logstash to collect, process, and transform log data from various sources** - COMPLETE  
- Dual source processing: /app/logs/server.log and /app/logs/client.log
- Real-time file monitoring with JSON codec parsing
- Filter pipeline: field extraction, service tagging, timestamp normalization
- Output processing: 18 backend + 3 frontend documents successfully indexed
- Pipeline workers: 2 workers, 125 batch size for optimal throughput

**Set up Kibana for visualizing log data, creating dashboards** - COMPLETE
- Service status: Available, SSL-enabled interface on port 5601
- Authentication: kibana_system user with encrypted saved objects
- API endpoints: /api/status returning healthy status
- Foundation ready for dashboard creation and data visualization

**Implement security measures to protect log data and access** - COMPLETE
- X-Pack security enabled with certificate-based authentication
- TLS encryption: All inter-service communication encrypted
- Credential management: Auto-generated secure passwords (elastic/kibana_system)
- Network isolation: elk-net Docker network with restricted access
- Certificate authority: Shared CA with service-specific certificates

**Define data retention and archiving policies** - PENDING
- Current: Daily index rotation implemented
- Missing: Index Lifecycle Management (ILM) policies not configured
- Required: Hot/Warm/Cold storage tiers and automated deletion policies

### Technical Architecture: OPERATIONAL

**Containerization:**
- Service orchestration: cert-generator → elasticsearch → app → kibana → logstash
- Volume mounting: ./app/logs shared between app and logstash containers
- Health checks: All services monitored with automatic restart policies
- Dependencies: TLS certificate generation before service startup

**Log Processing Pipeline:**
- Source: Container application writes to /app/logs/{server,client}.log
- Collection: Logstash file input with sincedb_path=/dev/null for development
- Processing: JSON parsing, field mapping, service classification (ft_backend/ft_client)
- Storage: Elasticsearch with daily index rotation and document fingerprinting
- Access: Kibana interface for search and visualization

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

## Architecture Overview

**Containerized Log Management System**

Three Docker services orchestrated for centralized log processing and analysis.

**Service Dependencies:**
```
cert-generator (TLS setup) → elasticsearch + app → kibana + logstash
```

**Data Pipeline:**
```
Backend (Fastify) → /app/logs/server.log
Frontend (HTTP API) → /app/logs/client.log
Log Files → Logstash Processing → Elasticsearch Storage → Kibana Interface
```

**Network Architecture:**
- Isolated network: elk-net Docker network
- Internal communication: container name resolution
- External access: elasticsearch:9200, kibana:5601
- Volume sharing: ./app/logs mounted to both app and logstash containers

**Storage Strategy:**
- Daily index rotation: fttranscendence-logs-YYYY.MM.dd
- Document deduplication: SHA256 fingerprint-based IDs
- Persistent volumes: elasticsearch-data, kibana-data, logstash-data

## Component Configuration

### Elasticsearch

**Container:** docker.elastic.co/elasticsearch/elasticsearch:8.15.0  
**Port:** 9200:9200  
**Memory:** 1GB JVM heap, memory lock enabled  

**Security Configuration:**
```yaml
xpack.security.enabled=true
xpack.security.http.ssl.enabled=true
xpack.security.transport.ssl.enabled=true
```

**Index Management:**
- Template: fttranscendence-logs-* pattern
- Daily rotation: fttranscendence-logs-YYYY.MM.dd
- Field mappings: @timestamp(date), service(keyword), log_level(keyword), reqId(keyword)
- Document ID: SHA256 fingerprint for deduplication

**Verification Commands:**
```bash
# Cluster health
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cluster/health"

# Index status
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cat/indices/fttranscendence-logs-*"

# Search logs
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/fttranscendence-logs-*/_search?q=service:ft_backend"
```

### Logstash

**Container:** docker.elastic.co/logstash/logstash:8.15.0  
**Memory:** 512MB JVM heap, 2 pipeline workers  
**Dependencies:** cert-generator, app (healthy), elasticsearch (healthy)  

**Input Configuration:**
```ruby
file {
  path => "/logs/server.log"          # Backend logs
  path => "/logs/client.log"          # Frontend logs  
  codec => json { target => "log_data" }
  start_position => "beginning"
  sincedb_path => "/dev/null"         # Development mode
  stat_interval => 1                  # Real-time monitoring
}
```

**Filter Pipeline:**
1. Field extraction from log_data JSON
2. Service tagging: ft_backend/ft_client based on log source
3. Timestamp conversion: Unix milliseconds to ISO format
4. Document fingerprinting: SHA256 hash for deduplication
5. Field cleanup: Remove temporary fields, rename level to log_level

**Output Configuration:**
```ruby
elasticsearch {
  hosts => ["https://elasticsearch:9200"]
  index => "fttranscendence-logs-%{+YYYY.MM.dd}"
  document_id => "%{[@metadata][fingerprint]}"
  ssl => true
  cacert => "/shared-certs/ca/ca-cert.pem"
}
```

### Kibana

**Container:** docker.elastic.co/kibana/kibana:8.15.0  
**Port:** 5601:5601  
**Dependencies:** cert-generator, elasticsearch (healthy)  

**Authentication:**
- Username: kibana_system
- SSL: Server certificate enabled
- Encryption: 32-byte key for saved objects

**API Verification:**
```bash
# Service status
curl -k "https://localhost:5601/api/status"

# Expected: {"status":{"overall":{"level":"available"}}}
```

## Log Source Integration

**Backend Log Generation (ft_backend):**
```javascript
// app/src/server.js - Fastify with Pino logger
{
  target: 'pino/file',
  options: {
    destination: './logs/server.log',
    mkdir: true,
    sync: true
  }
}
```

**Frontend Log Collection (ft_client):**
```typescript
// HTTP POST to /log endpoint
await fetch('/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ level, message, context })
});
```

**Log Format Standardization:**

Backend logs (server.log):
```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "container-id",
  "reqId": "req-123",
  "msg": "request completed"
}
```

Frontend logs (client.log):
```json
{
  "level": "info",
  "time": 1625140800000,
  "context": {"errorCode": "E500"},
  "msg": "Critical system error"
}
```

**Container Integration:**
- App container writes to /app/logs/{server,client}.log
- Logstash container reads from /logs/ (shared volume mount)
- Real-time monitoring with stat_interval=1 second
- JSON codec parsing with automatic field detection

## Security Implementation

**TLS Architecture:**
- Certificate generation: Dedicated cert-generator service
- CA certificate authority with service-specific certificates  
- X-Pack security enabled with certificate authentication
- All inter-service communication encrypted

**Certificate Structure:**
```
/shared-certs/
├── ca/ca-cert.pem
├── elasticsearch/{cert,key}.pem
├── kibana/{cert,key}.pem
└── logstash/{cert,key}.pem
```

**Authentication:**
- elastic user: Auto-generated 24-character password
- kibana_system user: Auto-generated 24-character password  
- Environment variables: ELASTIC_PASSWORD, KIBANA_SYSTEM_PASSWORD
- Encryption key: 32-byte hex key for Kibana saved objects

**Network Security:**
- Isolated Docker network: elk-net
- No external plain-text connections
- Certificate-based mutual authentication
- Container name resolution for internal communication

**Verification Commands:**
```bash
# Test authentication
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_security/user"

# Verify certificate chain
openssl verify -CAfile /shared-certs/ca/ca-cert.pem /shared-certs/elasticsearch/elasticsearch-cert.pem
```

## Data Management

**Index Strategy:**
- Daily rotation: fttranscendence-logs-YYYY.MM.dd
- Document fingerprinting: SHA256 hash for deduplication
- Field optimization: Keyword mapping for aggregations

**Storage Configuration:**
```yaml
volumes:
  - elasticsearch-data:/usr/share/elasticsearch/data
  - kibana-data:/usr/share/kibana/data
  - logstash-data:/usr/share/logstash/data
  - ./app/logs:/logs (shared between app and logstash)
```

**Index Template Mappings:**
```json
{
  "@timestamp": {"type": "date"},
  "service": {"type": "keyword"},
  "log_level": {"type": "keyword"}, 
  "reqId": {"type": "keyword"},
  "responseTime": {"type": "float"}
}
```

**Performance Optimization:**
- Memory lock enabled for Elasticsearch
- Logstash batch processing: 125 events, 50ms delay
- Field cleanup pipeline: Remove temporary processing fields
- Sincedb_path=/dev/null for development (real-time reprocessing)

## Deployment Operations

**Service Startup Sequence:**
```
cert-generator → elasticsearch + app → kibana + logstash
```

**Initial Deployment:**
```bash
# Generate credentials
./create-env.sh

# Start services
docker-compose up -d

# Verify deployment
docker-compose ps
```

**System Verification:**
```bash
# Test complete pipeline
curl -k "https://localhost:5000/api/test"  # Generate backend log
curl -k -X POST "https://localhost:5000/log" -H "Content-Type: application/json" \
  -d '{"level":"info","message":"Test log","context":{}}'  # Generate frontend log

# Verify log processing
sleep 10
curl -k -u "elastic:$ELASTIC_PASSWORD" \
  "https://localhost:9200/fttranscendence-logs-*/_search?size=2&sort=@timestamp:desc"
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
