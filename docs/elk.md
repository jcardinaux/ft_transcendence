# ELK Stack Infrastructure Documentation

## Module Overview

**Major module: Infrastructure Setup with ELK (Elasticsearch, Logstash, Kibana) for Log Management.**

The objective of this major module is to establish a robust infrastructure for log management and analysis using the ELK stack (Elasticsearch, Logstash, Kibana). Key features and goals include:

- Deploy Elasticsearch to efficiently store and index log data, ensuring it is easily searchable and accessible.
- Configure Logstash to collect, process, and transform log data from various sources, sending it to Elasticsearch.
- Set up Kibana for visualizing log data, creating dashboards, and generating insights from log events.
- Define data retention and archiving policies to manage log data storage effectively.
- Implement security measures to protect log data and access to the ELK stack components.

This major module aims to establish a powerful log management and analysis system using the ELK stack, enabling effective troubleshooting, monitoring, and insights into the system's operation and performance.

## Current Status

### Completed Implementation

**Deploy Elasticsearch to efficiently store and index log data, ensuring it is easily searchable and accessible** - COMPLETED
- Elasticsearch 8.15.0 deployed with Docker containerization
- Index template configured for fttranscendence-logs with optimized field mappings
- Daily index rotation pattern implemented (fttranscendence-logs-YYYY.MM.dd)
- Health monitoring and cluster status checks operational
- Document deduplication via SHA256 fingerprinting implemented

**Configure Logstash to collect, process, and transform log data from various sources, sending it to Elasticsearch** - COMPLETED
- Logstash 8.15.0 pipeline configured for dual log source processing
- Real-time monitoring of server.log (backend) and client.log (frontend)
- JSON codec parsing with ECS-compliant field targeting
- Comprehensive filter pipeline for data transformation and enrichment
- Service tagging and timestamp normalization implemented
- Authenticated output to Elasticsearch with proper indexing

**Set up Kibana for visualizing log data, creating dashboards, and generating insights from log events** - COMPLETED
- Kibana 8.15.0 deployed with secure authentication
- kibana_system user configuration with encrypted saved objects
- Health monitoring and API status checks implemented
- Foundation ready for dashboard creation and log visualization

**Implement security measures to protect log data and access to the ELK stack components** - COMPLETED
- X-Pack security enabled with basic license
- Password-based authentication for elastic and kibana_system users
- Automated secure password generation script (create-env.sh)
- Environment variable-based credential management
- Isolated Docker network (elk-net) for service communication
- 32-byte encryption key for Kibana saved objects

### In Progress

**Define data retention and archiving policies to manage log data storage effectively** - IN PROGRESS
- Basic daily index rotation implemented
- Recommended retention schedule documented (Hot: 7 days, Warm: 8-30 days, Cold: 31-365 days)
- Status: Documentation complete, automated retention policies pending implementation
- Next Steps: Configure Index Lifecycle Management (ILM) policies in Elasticsearch

**Dashboard Creation and Log Visualization** - IN PROGRESS
- Index patterns and field mappings prepared
- Query examples and dashboard recommendations documented
- Status: Infrastructure ready, visual dashboards pending creation
- Next Steps: Create System Overview, Performance, and Security dashboards in Kibana

### Technical Architecture Status

**Infrastructure**: COMPLETE
- Docker Compose orchestration with health checks
- Persistent volume management
- Network isolation and service dependencies

**Log Sources Integration**: COMPLETE
- Dual logging system (backend Fastify/Pino + frontend TypeScript)
- HTTP-based client log transmission
- Structured JSON log format standardization

**Data Processing Pipeline**: COMPLETE
- End-to-end log flow: Application → Log Files → Logstash → Elasticsearch → Kibana
- Real-time ingestion with optimized performance settings
- Field extraction, enrichment, and cleanup

**Security Foundation**: COMPLETE
- Authentication and authorization framework
- Secure credential management
- Development environment security baseline

### Deployment Readiness

**Development Environment**: READY
- Complete ELK stack operational
- Log ingestion and processing functional
- Basic monitoring and health checks active

**Production Readiness**: PARTIAL
- Complete: Core infrastructure, security foundation, data processing
- Pending: ILM policies, production dashboards, advanced monitoring, SSL/TLS implementation

---

## Architecture Overview

The ELK stack implementation consists of three containerized services orchestrated by Docker Compose, providing comprehensive log aggregation, processing, and visualization capabilities for the ft_transcendence application.

### System Components

1. **Elasticsearch 8.15.0**: Document store and search engine for log data
2. **Logstash 8.15.0**: Log processing pipeline for data transformation and routing
3. **Kibana 8.15.0**: Visualization and analytics platform
4. **Dual Log Sources**: Backend server logs and frontend client logs

### Data Flow Architecture

```
Application Layer:
├── Backend (Fastify + Pino) → server.log
└── Frontend (TypeScript) → HTTP POST → client.log

Processing Pipeline:
Log Files → Logstash → Elasticsearch → Kibana Dashboards
```

## Elasticsearch Configuration

### Container Specifications

- **Image**: `docker.elastic.co/elasticsearch/elasticsearch:8.15.0`
- **Container**: `elk-elasticsearch`
- **Port**: `9200:9200`
- **Network**: `elk-net`

### Security Configuration

```yaml
environment:
  - xpack.security.enabled=true
  - xpack.security.http.ssl.enabled=false
  - xpack.security.transport.ssl.enabled=false
  - xpack.license.self_generated.type=basic
```

**Security Features:**
- X-Pack security enabled with basic license
- HTTP and transport SSL disabled for development environment
- Password-based authentication for elastic and kibana_system users
- Configurable passwords via environment variables

### Performance Tuning

```yaml
environment:
  - ES_JAVA_OPTS=-Xms1g -Xmx1g
  - bootstrap.memory_lock=true
ulimits:
  memlock:
    soft: -1
    hard: -1
```

**Memory Management:**
- JVM heap size set to 1GB (adjustable based on system resources)
- Memory lock enabled to prevent swapping
- Unlimited memory lock limits for optimal performance

### Index Template Configuration

Automatic index template creation via entrypoint script:

```json
{
  "index_patterns": ["fttranscendence-logs-*"],
  "template": {
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "log_level": { "type": "keyword" },
        "service": { "type": "keyword" },
        "reqId": { "type": "keyword" },
        "responseTime": { "type": "float" }
      }
    }
  }
}
```

**Index Management:**
- Daily index rotation pattern: `fttranscendence-logs-YYYY.MM.dd`
- Optimized field mappings for common log attributes
- Keyword fields for aggregations and filtering
- Date field for time-based queries

### Health Monitoring

Health check configuration:
```bash
curl -s -u "elastic:$ELASTIC_PASSWORD" "http://localhost:9200/_cluster/health" | grep -qE '"status":"green|yellow"'
```

**Health Check Parameters:**
- Interval: 10 seconds
- Timeout: 10 seconds
- Retries: 30
- Acceptable states: green or yellow cluster status

## Logstash Configuration

### Container Specifications

- **Image**: `docker.elastic.co/logstash/logstash:8.15.0`
- **Container**: `elk-logstash`
- **Port**: `5044:5044`
- **Dependencies**: Elasticsearch service health

### Input Configuration

Dual file input sources for comprehensive log collection:

```ruby
input {
  file {
    path => "/logs/server.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
    codec => json { 
      charset => "UTF-8"
      target => "log_data"
    }
    tags => ["fastify"]
    type => "backend"
    ignore_older => 0
    stat_interval => 1
    discover_interval => 5
    close_older => 1
    max_open_files => 4096
  }
  
  file {
    path => "/logs/client.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
    codec => json { 
      charset => "UTF-8"
      target => "log_data"
    }
    tags => ["client"]
    type => "web-client"
    ignore_older => 0
    stat_interval => 1
    discover_interval => 5
    close_older => 1
    max_open_files => 4096
  }
}
```

**Input Features:**
- Real-time log monitoring with 1-second stat intervals
- JSON codec for structured log parsing
- ECS-compliant field targeting to resolve warnings
- Optimized file handling for high-throughput scenarios
- Separate tagging for backend and frontend log streams

### Filter Pipeline

Comprehensive data transformation and enrichment:

```ruby
filter {
  # Extract fields from log_data if present
  if [log_data] {
    mutate {
      add_field => { 
        "level" => "%{[log_data][level]}"
        "time" => "%{[log_data][time]}"
        "msg" => "%{[log_data][msg]}"
        "pid" => "%{[log_data][pid]}"
        "hostname" => "%{[log_data][hostname]}"
      }
    }
    
    # Backend-specific fields
    if [log_data][reqId] {
      mutate { add_field => { "reqId" => "%{[log_data][reqId]}" } }
    }
    
    # Frontend-specific fields
    if [log_data][context] {
      mutate { add_field => { "context" => "%{[log_data][context]}" } }
    }
  }

  # Timestamp normalization
  date {
    match => ["time", "UNIX_MS"]
    target => "@timestamp"
  }

  # Service identification
  if [type] == "web-client" {
    mutate { add_field => { "service" => "ft_client" } }
  } else {
    mutate { add_field => { "service" => "ft_backend" } }
  }

  # Document fingerprinting for deduplication
  fingerprint {
    source => ["path", "host", "msg", "time"]
    target => "[@metadata][fingerprint]"
    method => "SHA256"
  }

  # Field cleanup and normalization
  mutate {
    remove_field => ["pid", "hostname", "time", "event", "log_data"]
    rename => { "level" => "log_level" }
  }
}
```

**Filter Capabilities:**
- Automatic field extraction from nested JSON structures
- Conditional processing based on log source type
- Timestamp conversion from Unix milliseconds to ISO format
- Service tagging for cross-system correlation
- SHA256 fingerprinting for document deduplication
- Field cleanup to optimize storage and query performance

### Output Configuration

Elasticsearch integration with authentication:

```ruby
output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "fttranscendence-logs-%{+YYYY.MM.dd}"
    user => "${ES_USER}"
    password => "${ES_PASS}"
    ssl => false
    document_id => "%{[@metadata][fingerprint]}"
  }
  
  stdout { codec => rubydebug }
}
```

**Output Features:**
- Daily index rotation for efficient data management
- Authenticated connections using environment variables
- Document ID based on content fingerprint for upsert operations
- Debug output for development monitoring

### Performance Configuration

```yaml
environment:
  - LS_JAVA_OPTS=-Xms512m -Xmx512m
  - PIPELINE_WORKERS=2
```

**Resource Allocation:**
- JVM heap: 512MB (optimized for moderate log volume)
- Pipeline workers: 2 (configurable based on CPU cores)
- Restart policy: unless-stopped for high availability

## Kibana Configuration

### Container Specifications

- **Image**: `docker.elastic.co/kibana/kibana:8.15.0`
- **Container**: `elk-kibana`
- **Port**: `5601:5601`
- **Dependencies**: Elasticsearch service health

### Authentication Configuration

```yaml
environment:
  - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  - ELASTICSEARCH_USERNAME=kibana_system
  - ELASTICSEARCH_PASSWORD=${KIBANA_SYSTEM_PASSWORD}
  - XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY=${KIBANA_ENCRYPTION_KEY}
```

**Security Settings:**
- Dedicated kibana_system user for service authentication
- Encrypted saved objects with configurable encryption key
- Secure connection to Elasticsearch cluster

### Health Monitoring

```bash
curl -s "http://localhost:5601/api/status" | grep -q '"overall":{"level":"available"'
```

**Availability Checks:**
- API status endpoint monitoring
- 10-second interval health checks
- Service dependency verification

## Log Source Integration

### Backend Log Generation

The application backend uses Fastify with Pino logger configured for dual output:

```javascript
const app = fastify({
  logger: {
    level: 'debug',
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: { colorize: true },
          level: 'debug'
        },
        {
          target: 'pino/file',
          options: {
            destination: './logs/server.log',
            mkdir: true,
            sync: true
          },
          level: 'debug'
        }
      ]
    }
  }
});
```

**Backend Logging Features:**
- Structured JSON output to server.log
- Request-scoped logging with correlation IDs
- Automatic log level filtering
- Synchronous file writing for immediate visibility

### Frontend Log Collection

Client-side logging implementation:

```typescript
export async function clientLog(
  level: LogLevel,
  message: string,
  context: Record<string, any> = {}
): Promise<void> {
  try {
    await fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, context })
    });
  } catch (err) {
    console.error('Log sending failed:', err);
  }
}
```

**Frontend Logging Features:**
- HTTP-based log transmission to backend
- Asynchronous operation to prevent UI blocking
- Structured context data support
- Error handling for network failures

### Log Format Standardization

**Backend Log Structure** (server.log):
```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "server-01",
  "reqId": "req-123",
  "msg": "API request processed",
  "responseTime": 45.6
}
```

**Frontend Log Structure** (client.log):
```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "server-01",
  "context": {
    "userAction": "button-click",
    "componentId": "main-nav",
    "sessionId": "sess-456"
  },
  "msg": "User interaction logged"
}
```

## Security Implementation

### Authentication and Authorization

1. **Elasticsearch Security**:
   - X-Pack security enabled with basic license
   - Password-based authentication for system users
   - Role-based access control for service accounts

2. **Environment Variable Security**:
   ```bash
   ELASTIC_PASSWORD=<generated-password>
   KIBANA_SYSTEM_PASSWORD=<generated-password>
   KIBANA_ENCRYPTION_KEY=<32-character-key>
   ```

3. **Network Security**:
   - Isolated Docker network (elk-net)
   - No external SSL/TLS in development environment
   - Port restrictions to necessary services only

### Password Management

Automated password generation script:
```bash
#!/bin/bash
ELASTIC_PASSWORD=$(openssl rand -hex 12)
KIBANA_SYSTEM_PASSWORD=$(openssl rand -hex 12)
KIBANA_ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "ELASTIC_PASSWORD=$ELASTIC_PASSWORD" > .env
echo "KIBANA_SYSTEM_PASSWORD=$KIBANA_SYSTEM_PASSWORD" >> .env
echo "KIBANA_ENCRYPTION_KEY=$KIBANA_ENCRYPTION_KEY" >> .env
```

**Security Features:**
- Cryptographically secure random password generation
- Automatic environment file creation
- 12-byte passwords for user accounts
- 32-byte encryption key for Kibana saved objects

## Data Retention and Storage

### Index Management Strategy

1. **Daily Index Rotation**:
   - Pattern: `fttranscendence-logs-YYYY.MM.dd`
   - Automatic creation based on date
   - Simplified retention policy implementation

2. **Storage Optimization**:
   - Document deduplication via SHA256 fingerprinting
   - Field cleanup to reduce storage overhead
   - Keyword mapping for efficient aggregations

3. **Volume Management**:
   ```yaml
   volumes:
     - elasticsearch-data:/usr/share/elasticsearch/data
     - kibana-data:/usr/share/kibana/data
     - logstash-data:/usr/share/logstash/data
   ```

### Archiving Policies

**Recommended Retention Schedule**:
- **Hot data**: Last 7 days (immediate access)
- **Warm data**: 8-30 days (reduced replicas)
- **Cold data**: 31-365 days (compressed storage)
- **Delete**: Data older than 1 year

## Monitoring and Alerting

### Health Check Implementation

1. **Elasticsearch Health**:
   ```bash
   curl -s -u "elastic:$ELASTIC_PASSWORD" "http://localhost:9200/_cluster/health"
   ```

2. **Kibana Availability**:
   ```bash
   curl -s "http://localhost:5601/api/status"
   ```

3. **Log Ingestion Monitoring**:
   - Document count per index
   - Ingestion rate metrics
   - Error log frequency analysis

### Performance Metrics

**Key Performance Indicators**:
- Log ingestion rate (events per second)
- Search query response time
- Index size growth rate
- Resource utilization (CPU, memory, disk)

## Query Examples and Use Cases

### Common Search Patterns

1. **Error Analysis**:
   ```
   log_level:error AND service:ft_backend
   log_level:error AND service:ft_client
   ```

2. **Performance Monitoring**:
   ```
   responseTime:>1000 AND service:ft_backend
   context.loadTime:>500 AND service:ft_client
   ```

3. **User Activity Tracking**:
   ```
   context.userAction:* AND service:ft_client
   reqId:* AND service:ft_backend
   ```

4. **Time-based Analysis**:
   ```
   @timestamp:[now-1h TO now] AND log_level:(warn OR error)
   service:ft_backend AND @timestamp:[now-24h TO now]
   ```

### Dashboard Recommendations

1. **System Overview Dashboard**:
   - Log volume trends by service
   - Error rate over time
   - Top error messages
   - Service availability metrics

2. **Performance Dashboard**:
   - Response time distribution
   - Slow query identification
   - Resource utilization trends
   - Throughput metrics

3. **Security Dashboard**:
   - Failed authentication attempts
   - Unusual access patterns
   - Error spike detection
   - Service health status

## Deployment and Operations

### Initial Setup

1. **Environment Preparation**:
   ```bash
   # Generate environment variables
   ./create-env.sh
   
   # Start ELK stack
   docker-compose up -d
   ```

2. **Service Verification**:
   ```bash
   # Check Elasticsearch
   curl -u "elastic:$ELASTIC_PASSWORD" "http://localhost:9200/_cluster/health"
   
   # Verify Kibana
   curl "http://localhost:5601/api/status"
   
   # Test log ingestion
   docker-compose logs logstash
   ```

3. **Index Pattern Creation**:
   - Navigate to Kibana Management
   - Create index pattern: `fttranscendence-logs-*`
   - Set @timestamp as time field

### Maintenance Procedures

1. **Log Rotation**:
   - Automatic daily index creation
   - Manual cleanup of old indices
   - Storage monitoring and alerts

2. **Performance Optimization**:
   - Regular index optimization
   - Shard rebalancing
   - Resource scaling based on load

3. **Backup Strategy**:
   - Elasticsearch snapshot configuration
   - Volume backup procedures
   - Configuration backup

### Troubleshooting Guide

**Common Issues and Solutions**:

1. **Elasticsearch Connection Failures**:
   - Verify network connectivity
   - Check authentication credentials
   - Review service startup logs

2. **Log Ingestion Problems**:
   - Validate log file permissions
   - Check Logstash pipeline configuration
   - Verify volume mounts

3. **Performance Issues**:
   - Monitor resource utilization
   - Optimize JVM heap settings
   - Review index mapping configuration

## Production Considerations

### Scalability Recommendations

1. **Horizontal Scaling**:
   - Multi-node Elasticsearch cluster
   - Load-balanced Kibana instances
   - Distributed Logstash processors

2. **Resource Planning**:
   - Memory allocation based on log volume
   - Storage capacity planning
   - Network bandwidth requirements

3. **High Availability**:
   - Elasticsearch cluster redundancy
   - Failover mechanisms
   - Data replication strategies

### Security Enhancements

1. **SSL/TLS Implementation**:
   - Certificate-based authentication
   - Encrypted inter-node communication
   - HTTPS for Kibana access

2. **Access Control**:
   - Role-based permissions
   - API key authentication
   - Network access restrictions

3. **Audit Logging**:
   - User activity tracking
   - Configuration change monitoring
   - Security event alerting

## Conclusion

The ELK stack implementation provides a comprehensive log management solution for the ft_transcendence application, offering real-time log ingestion, powerful search capabilities, and flexible visualization options. The dual-log architecture enables separate analysis of backend and frontend activities while maintaining centralized storage and unified access through Kibana dashboards.

The current implementation serves as a solid foundation for development and testing environments, with clear pathways for production deployment and scaling. Regular monitoring, maintenance, and security updates will ensure optimal performance and data integrity as the system evolves.
