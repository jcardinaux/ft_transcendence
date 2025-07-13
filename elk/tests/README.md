# ELK Stack Testing Framework Documentation

## Framework Overview

**Automated Testing for ELK Stack 8.15.0**

Comprehensive validation framework for ft_transcendence ELK Stack deployment with automated problem detection, repair capabilities, and CI/CD integration.

**Core Testing Components:**
- **elk-validation.sh**: 6-test comprehensive validation with auto-fix capabilities
- **elk-ci-pipeline.sh**: CI/CD pipeline testing with critical vs warning categorization
- **elk-test-runner.sh**: Unified test runner with multiple execution modes

**Testing Architecture:**
- Sequential test execution with dependency validation
- Auto-fix logic for Docker permission and configuration issues
- ANSI color-coded output for professional terminal display
- Exit code compliance for CI/CD pipeline integration

## Test Script Specifications

### Primary Validation Script

**elk-validation.sh - Comprehensive System Validation**
- **Purpose**: Complete ELK stack health verification with automated repair
- **Test Count**: 6 sequential tests with auto-fix on tests 3 and 4
- **Execution Model**: Sequential processing, no parallel execution
- **Auto-fix Capability**: Docker permission repair and ILM configuration

**elk-ci-pipeline.sh - CI/CD Integration Testing**
- **Purpose**: Pipeline-ready testing with structured output and failure categorization
- **Test Categories**: CRITICAL (deployment blocking) vs WARNING (non-blocking)
- **Output Format**: Timestamp logging with configurable verbosity
- **Integration**: Supports --fail-on-warnings and --verbose flags

**elk-test-runner.sh - Unified Test Interface**
- **Purpose**: Test execution wrapper with prerequisite validation
- **Execution Modes**: comprehensive, ci, ci-strict, quick
- **Prerequisites**: Environment validation and service availability checks
- **Interface**: Simplified command-line interface for all test scenarios

## Test Execution Sequence

### Sequential Test Processing

**Test execution follows strict sequential order - no parallel processing**

**elk-validation.sh Test Sequence:**
1. **Elasticsearch Cluster Health** - Cluster status validation via `/_cluster/health` endpoint
2. **Index Lifecycle Management** - ILM policy configuration verification via `/_ilm/policy`
3. **Archive Repository Configuration** - Snapshot repository validation with Docker permission auto-fix
4. **Index Status Validation** - Log indices health verification with ILM alias auto-fix
5. **Logstash Pipeline Processing** - Log processing validation via container log analysis
6. **Kibana Service Availability** - API health verification via `/api/status` endpoint

### Auto-Fix Implementation Logic

**Auto-fix capability implemented only for tests 3 and 4:**

```bash
run_test_with_autofix() {
    test_function_name=$1
    fix_function_name=$2
    
    if ! $test_function_name; then
        echo "Auto-fix attempt: $fix_function_name"
        $fix_function_name
        $test_function_name  # Re-test after fix
    fi
}
```

**Auto-fix Enabled Tests:**
- **TEST 3**: `fix_archive_repository()` - Docker permission repair for snapshot repository
- **TEST 4**: `fix_ilm_alias()` - ILM write index and rollover alias creation

- **Tests 1, 2, 5, 6**: Increment failure counter, continue sequential execution (no auto-fix)
- **Tests 3, 4**: Execute auto-fix functions, re-run test validation, continue sequence

**Manual Intervention Required Tests:**
- **TEST 1, 2, 5, 6**: Service failures require manual diagnosis

## Technical Problem Resolution

### Archive Repository Docker Permission Issue

**Root Cause Analysis:**
Docker container permission limitations prevent proper archive directory setup during ELK stack deployment initialization.

**Symptom Identification:**
- Repository missing exception in Elasticsearch API responses
- Incorrect filesystem permissions (root:root instead of elasticsearch:elasticsearch ownership)
- Snapshot and backup functionality unavailable for data retention policies
- API endpoint `/_snapshot/ft_archive_repo` returns repository not found errors

**Auto-Fix Implementation Process:**
1. **Repository Status Query**: `GET /_snapshot/ft_archive_repo` endpoint validation
2. **Response Analysis**: Validate JSON response for `"type":"fs"` and `"location"` fields
3. **Permission Repair**: Execute `fix_archive_repository()` Docker permission correction
4. **Verification Re-test**: Re-run repository test to confirm successful repair

**Technical Implementation:**
```bash
test_snapshot_repository() {
    # Repository validation logic
    curl -s -k -u "elastic:$ELASTIC_PASSWORD" \
        "https://localhost:9200/_snapshot/ft_archive_repo"
}

fix_archive_repository() {
    # Docker permission repair and repository recreation
    docker exec elk-elasticsearch bash -c "
        rm -rf /usr/share/elasticsearch/archive_data/*
        chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/archive_data
    "
    # Repository recreation with correct permissions
}
```

**Execution Flow:**
```
test_snapshot_repository() → FAIL (permission denied)
    ↓
fix_archive_repository() → Docker permission correction
    ↓
test_snapshot_repository() → PASS (repository accessible)
```

### Index Lifecycle Management Configuration Issue

**Technical Issue:**
ILM policy configuration requires write index creation with rollover alias for daily log rotation functionality.

**Problem Detection:**
- Missing `fttranscendence-logs-policy` in `/_ilm/policy` endpoint response
- Write index alias not configured for daily rotation pattern
- Log ingestion fails due to missing index template application

**Auto-Fix Implementation:**
```bash
fix_ilm_alias() {
    # Create write index with proper alias configuration
    curl -X PUT "https://localhost:9200/fttranscendence-logs-000001" \
        -k -u "elastic:$ELASTIC_PASSWORD" \
        -H "Content-Type: application/json" \
        -d '{
            "aliases": {
                "fttranscendence-logs": {
                    "is_write_index": true
                }
            }
        }'
}
```

**Logstash Processing Validation**

**Detection Methodology:**
- Container log monitoring for processing indicators: `@timestamp`, `ft_backend`, `fastify`
- 20-line log tail analysis to prevent JSON fragment parsing errors
- Real-time processing validation without synthetic log generation

**Technical Implementation:**
```bash
test_logstash_pipeline() {
    docker logs elk-logstash 2>&1 | tail -20 | grep -E "@timestamp|ft_backend|fastify"
}
```

**Processing Validation Criteria:**
- `@timestamp` field presence indicating structured log parsing
- `ft_backend` service classification for backend log processing
- `fastify` framework identifier for Pino logger integration
- `Pipeline started successfully` message for pipeline initialization
- 20-line tail analysis to avoid JSON fragment parsing errors

## Test Script Technical Specifications

### elk-validation.sh - Comprehensive Validation Framework

**Primary Purpose**: Complete ELK stack health verification with automated repair

**Test Execution Sequence (Sequential Processing):**
1. **Elasticsearch Cluster Health** - `/_cluster/health` API validation (GREEN/YELLOW status acceptance)
2. **ILM Policy Configuration** - `fttranscendence-logs-policy` validation via `/_ilm/policy/fttranscendence-logs-policy` endpoint
3. **Archive Repository Validation** - `ft_archive_repo` configuration test with Docker permission auto-fix
4. **Index Status Verification** - `fttranscendence-logs-*` indices validation with write index auto-creation
5. **Logstash Pipeline Processing** - Container log analysis for processing indicators (`@timestamp`, `ft_backend`, `fastify`)
6. **Kibana Service Availability** - `/api/status` endpoint health verification for `"level":"available"` response

**Auto-Fix Implementation Details:**
- **TEST 3 Auto-Fix**: `fix_archive_repository()` - Docker `chown` permission correction and repository recreation
- **TEST 4 Auto-Fix**: `fix_ilm_alias()` - Write index creation with `is_write_index: true` alias configuration
- **Re-test Logic**: 2-second stabilization delay followed by test re-execution after auto-fix application

**Test Execution Characteristics:**
- **Sequential Processing**: All 6 tests execute in order regardless of individual failures
- **Failure Accumulation**: Failed test counter increments, decrements on successful auto-fix
- **Exit Code Logic**: Final exit status 0 (success) or 1 (failure) based on total failure count after all test completion

### elk-ci-pipeline.sh - CI/CD Integration Testing Framework

**Primary Purpose**: Pipeline-ready testing with structured output and configurable failure categorization

**Test Execution Model:**
- Identical 6-test sequence as elk-validation.sh but **without auto-fix capabilities**
- Structured timestamp logging for automation parsing and monitoring: `[YYYY-MM-DD HH:MM:SS]` prefix format
- Test categorization: CRITICAL (deployment blocking) vs WARNING (non-blocking) for pipeline decision making

**Test Classification:**
- **CRITICAL Tests**: Elasticsearch Health, ILM Policies, Data Ingestion, Kibana Availability (tests 1, 2, 3, 4)
- **WARNING Tests**: Logstash Processing, Archive Repository (tests 5, 6)
- **Exit Logic**: CRITICAL failures = exit 1, WARNING failures = exit 0 (unless --fail-on-warnings)

**Command Line Interface:**
```bash
# Standard execution mode (warnings permitted)
./elk-ci-pipeline.sh

# Strict execution mode (warnings treated as failures)
./elk-ci-pipeline.sh --fail-on-warnings

# Verbose diagnostic output mode
./elk-ci-pipeline.sh --verbose
```

**Exit Code Specification:**
- **Exit 0**: All tests pass OR warnings only in standard mode
- **Exit 1**: Critical test failures OR warnings present in strict mode (--fail-on-warnings)

**CI/CD Integration Features:**
- Timestamp prefixed output for log aggregation: `[2025-07-13 14:30:25] PASS: Elasticsearch cluster status: GREEN`
- Machine-readable test result formatting for automation parsing
- Configurable failure sensitivity for different pipeline stages (development vs production)

### elk-test-runner.sh
Test runner utility providing unified interface for all test modes.

**Execution modes:**
- `comprehensive` - Runs elk-validation.sh with auto-fix
- `ci` - Runs elk-ci-pipeline.sh in standard mode
- `ci-strict` - Runs elk-ci-pipeline.sh with --fail-on-warnings
- `quick` - Basic connectivity validation only

## Execution

### elk-test-runner.sh - Unified Test Execution Interface

**Primary Purpose**: Simplified test execution wrapper with prerequisite validation and multiple execution modes

**Technical Implementation:**
- Script validation: Checks for `.env` file and running ELK containers before execution
- Environment loading: Sources environment variables for authentication
- Service verification: Pre-test validation of Elasticsearch, Kibana, and Logstash accessibility

**Execution Mode Specifications:**
```bash
# Comprehensive validation with auto-fix capabilities
./elk/tests/elk-test-runner.sh comprehensive

# CI/CD pipeline testing (no auto-fix)
./elk/tests/elk-test-runner.sh ci

# Strict CI/CD mode (warnings treated as failures)
./elk/tests/elk-test-runner.sh ci-strict

# Quick connectivity validation
./elk/tests/elk-test-runner.sh quick
```

**Internal Script Mapping:**
- `comprehensive` mode: Executes `elk-validation.sh` with full auto-fix capabilities
- `ci` mode: Executes `elk-ci-pipeline.sh` in standard mode (warnings permitted)
- `ci-strict` mode: Executes `elk-ci-pipeline.sh --fail-on-warnings` (strict failure mode)
- `quick` mode: Direct connectivity tests without full validation suite

**Prerequisite Validation Logic:**
- Environment file verification: Confirms `.env` file existence for authentication credentials
- Container status check: Validates `elk-elasticsearch` container is running via `docker ps`
- Service accessibility: Quick health checks for core ELK services before full test execution

## Deployment Integration Examples

### Development Environment Testing

**Local Development Validation:**
```bash
# Deploy ELK stack with application
make up

# Allow service initialization time
sleep 60

# Execute comprehensive validation with auto-fix
./elk/tests/elk-validation.sh
```

### CI/CD Pipeline Integration

**Automated Pipeline Testing:**
```bash
# Deploy ELK stack
make up

# Wait for Elasticsearch cluster availability
until curl -k -s https://localhost:9200/_cluster/health | grep -q "yellow\|green"; do 
    sleep 10
done

# Execute strict CI/CD validation
./elk/tests/elk-ci-pipeline.sh --fail-on-warnings
```

### Production Environment Validation

**Production Readiness Verification:**
```bash
# Execute comprehensive validation with auto-fix
./elk/tests/elk-validation.sh

# Allow auto-fix stabilization time
sleep 30

# Verify with verbose CI/CD testing
./elk/tests/elk-ci-pipeline.sh --verbose
```

## Technical Troubleshooting Procedures

### Archive Repository Diagnostic Commands

**Repository Status Diagnosis:**
```bash
# Query all configured snapshot repositories
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_snapshot"

# Validate specific archive repository configuration
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_snapshot/ft_archive_repo"
```

**Docker Permission Repair:**
```bash
# Docker container permission correction
docker exec elk-elasticsearch bash -c "
    mkdir -p /usr/share/elasticsearch/archive_data
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/archive_data
    chmod 755 /usr/share/elasticsearch/archive_data
"
```

**Repository Recreation After Permission Fix:**
```bash
# Remove corrupted repository configuration
curl -X DELETE "https://localhost:9200/_snapshot/ft_archive_repo" \
    -k -u "elastic:$ELASTIC_PASSWORD"

# Recreate repository with correct filesystem path
curl -X PUT "https://localhost:9200/_snapshot/ft_archive_repo?verify=false" \
    -k -u "elastic:$ELASTIC_PASSWORD" \
    -H "Content-Type: application/json" \
    -d '{
        "type": "fs",
        "settings": {
            "location": "/usr/share/elasticsearch/archives",
            "compress": true,
            "chunk_size": "1gb",
            "readonly": false
        }
    }'
```

### Logstash Pipeline Processing Validation

**Container Log Analysis:**
```bash
# Monitor recent Logstash processing activity
docker logs elk-logstash --tail 20

# Search for processing indicators
docker logs elk-logstash 2>&1 | grep -E "@timestamp|Pipeline started successfully|JSON output"
```

**Expected Processing Indicators:**
- `@timestamp` fields in processed log entries
- `Pipeline started successfully` during initialization
- JSON-formatted output indicating structured log processing
- Service classification tags (ft_backend, ft_client)

### Index Lifecycle Management Diagnostic

**ILM Policy Status Verification:**
```bash
# Query configured ILM policies
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_ilm/policy"

# Check specific policy configuration
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_ilm/policy/fttranscendence-logs-policy"
```

**Write Index Status Validation:**
```bash
# Verify write index alias configuration
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_alias/fttranscendence-logs"

# Check daily index status
curl -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cat/indices/fttranscendence-logs-*?v"
```
# Restart: docker-compose restart logstash
```

### Index Management
```bash
# Check indices
curl -k -u "elastic:PASSWORD" "https://localhost:9200/_cat/indices?v"

# Check ILM policies
curl -k -u "elastic:PASSWORD" "https://localhost:9200/_ilm/policy"

# Create write index
curl -X PUT "https://localhost:9200/fttranscendence-logs-000001" -k -u "elastic:PASSWORD" -H "Content-Type: application/json" -d '{"aliases":{"fttranscendence-logs":{"is_write_index":true}}}'
```

## Configuration

### Timing
- Minimum wait: 30 seconds after `make up`
- Recommended wait: 60 seconds for full initialization
- Auto-fix delay: 2 seconds between fix and re-test
- CI timeout: 5 minutes maximum per validation

### Resources
- Memory: 4GB minimum for ELK Stack
- Disk: 2GB for logs and snapshots
- Network: Ports 9200, 5601, 5044 accessible

### Monitoring
```bash
# Real-time cluster health
make monitor

# Manual monitoring
watch -n 5 'curl -k -s -u "elastic:PASSWORD" "https://localhost:9200/_cluster/health"'

# Component logs
docker-compose logs -f elasticsearch
docker-compose logs -f logstash
docker-compose logs -f kibana
```

## Security
- Passwords auto-generated in `.env`
- TLS certificates auto-generated
- HTTPS only for Elasticsearch and Kibana
- Docker network isolation

## Maintenance

### Tasks
- Weekly: Run full validation
- Monthly: Verify backup functionality
- Quarterly: Update ELK Stack version

### Log Retention
- Hot: 7 days (high performance)
- Warm: 8-30 days (reduced performance)
- Cold: 31-90 days (compressed)
- Archive: 90-365 days (snapshots)
- Delete: After 365 days

## Development

### Adding Tests
1. Create `test_component_feature()` function
2. Implement `fix_component_feature()` if applicable
3. Add to main execution flow with `run_test_with_autofix()`
4. Update test counter
