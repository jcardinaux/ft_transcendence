# ELK Stack Testing Documentation

## Complete Test Suite for ELK Infrastructure

Comprehensive verification commands for Elasticsearch, Logstash, and Kibana functionality testing.

## Environment Setup

Generate fresh credentials and start services.

```bash
./create-env.sh
docker-compose up -d
```

Wait for service initialization.

```bash
sleep 30 && docker-compose ps
```

Extract generated passwords for testing.

```bash
cat .env | grep -E "ELASTIC_PASSWORD|KIBANA_SYSTEM_PASSWORD"
```

## Elasticsearch Tests

### Cluster Health Verification

Test Elasticsearch cluster availability and status.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/_cluster/health"
```

Expected output: GREEN or YELLOW status with active shards.

### Index Template Verification

Verify index template configuration for log structure.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/_index_template/fttranscendence-logs"
```

Expected output: Template with field mappings for @timestamp, service, log_level, reqId.

### Index Management Testing

List existing indices with document counts.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/_cat/indices/fttranscendence-logs-*?v"
```

Expected output: Daily indices with document counts and storage size.

## Application Log Generation

### Backend Log Generation

Generate backend logs via API endpoint.

```bash
curl -k "https://localhost:5000/api/test"
```

Expected output: JSON response confirming API functionality.

### Frontend Log Generation

Generate frontend logs via HTTP POST endpoint.

```bash
curl -k -X POST "https://localhost:5000/log" -H "Content-Type: application/json" -d '{"level":"info","message":"Test ELK da reset completo","context":{"test":"frontend_logging"}}'
```

Expected output: Status confirmation of log reception.

### Error Level Log Testing

Generate error-level logs for filtering verification.

```bash
curl -k -X POST "https://localhost:5000/log" -H "Content-Type: application/json" -d '{"level":"error","message":"Critical system error","context":{"errorCode":"E500","module":"auth"}}'
```

### Warning Level Log Testing

Generate warning-level logs for log level classification.

```bash
curl -k -X POST "https://localhost:5000/log" -H "Content-Type: application/json" -d '{"level":"warn","message":"Performance warning","context":{"responseTime":2500,"endpoint":"/api/match"}}'
```

## Log File Verification

### Container Log File Inspection

Verify log files exist in container filesystem.

```bash
docker exec elk-logstash ls -la /logs/
```

Expected output: server.log and client.log with recent timestamps.

### Host Log File Verification

Check log files on host filesystem.

```bash
ls -la ./app/logs/
```

Expected output: Log files with increasing sizes after API calls.

### Log Content Verification

Inspect recent log entries for format validation.

```bash
head -3 ./app/logs/client.log
tail -3 ./app/logs/server.log
```

Expected output: Structured JSON log entries with proper field formatting.

## Logstash Pipeline Testing

### Pipeline Status Verification

Check Logstash pipeline initialization and processing status.

```bash
docker logs elk-logstash 2>&1 | grep -E "(pipeline|event|output)" | tail -5
```

Expected output: Pipeline started confirmation with worker counts.

### Processing Delay

Allow time for Logstash to process recent log entries.

```bash
sleep 15
```

## Elasticsearch Data Verification

### Document Search Testing

Search for backend service logs in Elasticsearch.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/fttranscendence-logs-*/_search?q=service:ft_backend&size=1"
```

Expected output: Backend log documents with service field set to ft_backend.

### Frontend Log Verification

Search for frontend service logs in Elasticsearch.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/fttranscendence-logs-*/_search?q=service:ft_client&size=1"
```

Expected output: Frontend log documents with service field set to ft_client.

### Error Log Filtering

Test log level filtering functionality.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/fttranscendence-logs-*/_search?q=log_level:error&size=1&pretty"
```

Expected output: Error-level log entries with proper field mapping.

### Recent Log Retrieval

Retrieve most recent log entries sorted by timestamp.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/fttranscendence-logs-*/_search?size=5&sort=@timestamp:desc&pretty"
```

Expected output: Recent log entries with @timestamp ordering and complete field mapping.

## Kibana Interface Testing

### Service Availability

Test Kibana service availability and health status.

```bash
curl -s -k "https://localhost:5601/api/status"
```

Expected output: Overall service level set to available.

### Authentication Testing

Verify Kibana can authenticate with Elasticsearch.

```bash
curl -k -u "kibana_system:5a26555e657d8d90817c2a0c" "https://localhost:5601/api/status"
```

Expected output: Successful authentication and service status.

## Performance and Metrics

### Cluster Statistics

Retrieve comprehensive cluster performance metrics.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/_cluster/stats"
```

Expected output: Document counts, storage sizes, and cluster metrics.

### Index Performance Metrics

Check individual index performance and storage utilization.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/_cat/indices/fttranscendence-logs-*?v"
```

Expected output: Index health status, document counts, and storage sizes.

### Logstash Pipeline Metrics

Monitor Logstash pipeline processing statistics.

```bash
docker logs elk-logstash | grep "events" | tail -5
```

Expected output: Event processing statistics and pipeline performance data.

## Security Verification

### Authentication Testing

Verify Elasticsearch user authentication functionality.

```bash
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/_security/user"
```

Expected output: User account information and security configuration.

### Certificate Validation

Test TLS certificate chain validation.

```bash
# Verify certificate structure exists
docker exec elk-elasticsearch ls -la /shared-certs/

# Test certificate validation with CA
docker exec elk-elasticsearch openssl verify -CAfile /shared-certs/ca/ca-cert.pem /shared-certs/elasticsearch/elasticsearch-cert.pem
```

Expected output: Certificate directory structure and validation OK confirmation.

## Complete Pipeline Test

### End-to-End Verification

Generate logs and verify complete processing pipeline.

```bash
# Generate test logs
curl -k "https://localhost:5000/api/test"
curl -k -X POST "https://localhost:5000/log" -H "Content-Type: application/json" -d '{"level":"info","message":"Pipeline test","context":{"testId":"e2e-001"}}'

# Wait for processing
sleep 10

# Verify indexing
curl -s -k -u "elastic:60a0b5489760a761ea239262" "https://localhost:9200/fttranscendence-logs-*/_search?q=testId:e2e-001&size=1"
```

Expected output: Test log entry successfully indexed with all fields mapped.

### System Reset Verification

Test complete system reset and reinitialization.

```bash
# Reset system
docker-compose down -v
rm -rf ./app/logs/*
touch ./app/logs/.gitkeep

# Restart and verify
./create-env.sh
docker-compose up -d
sleep 30
curl -k "https://localhost:5000/api/test"
sleep 10

# Get new password and verify indices
ELASTIC_PASS=$(grep ELASTIC_PASSWORD .env | cut -d= -f2)
curl -s -k -u "elastic:$ELASTIC_PASS" "https://localhost:9200/_cat/indices/fttranscendence-logs-*?v"
```

Expected output: Fresh indices created with new log entries after system reset.

## Test Summary

### Verification Checklist

Complete test execution should verify:

- Elasticsearch cluster health and indexing capability
- Logstash pipeline processing and field mapping
- Kibana service availability and authentication
- Log generation from both backend and frontend sources
- Security implementation with TLS and authentication
- Performance metrics and storage utilization
- End-to-end log processing pipeline functionality
- System recovery and reinitialization capability

### Expected Results

All tests should complete successfully with:

- GREEN or YELLOW cluster status
- Document counts increasing after log generation
- Proper field mapping and service classification
- Sub-second search response times
- Successful authentication across all services
- Complete log processing from generation to indexing
