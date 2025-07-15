#!/bin/bash

# ELK Stack CI/CD Testing
# Validates critical ELK components for automated deployment pipelines
# Categorizes tests as CRITICAL (deployment blocking) vs WARNING (non-blocking)
# Supports --fail-on-warnings and --verbose flags for pipeline flexibility

set -e

# Configuration flags
FAIL_ON_WARNINGS=false
VERBOSE=false

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Parse command line arguments for CI/CD flexibility
while [[ $# -gt 0 ]]; do
    case $1 in
        --fail-on-warnings)
            FAIL_ON_WARNINGS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "ERROR: Unknown option $1"
            echo "Usage: $0 [--fail-on-warnings] [--verbose]"
            exit 1
            ;;
    esac
done

# Logging functions for CI/CD compliance
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

verbose_log() {
    if [ "$VERBOSE" = true ]; then
        log "${BLUE}VERBOSE${NC}: $1"
    fi
}

success_log() {
    log "${GREEN}PASS${NC}: $1"
}

warning_log() {
    log "${YELLOW}WARN${NC}: $1"
}

error_log() {
    log "${RED}FAIL${NC}: $1"
}

# Environment validation for CI/CD pipeline
load_environment() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
        verbose_log "Environment variables loaded successfully"
        return 0
    else
        error_log ".env file not found - pipeline configuration missing"
        exit 1
    fi
}

# CI/CD test counters
critical_failures=0
warning_count=0

# CRITICAL TEST 1: Elasticsearch Cluster Health
test_elasticsearch_health() {
    log "CRITICAL TEST: Elasticsearch cluster health validation"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_cluster/health" 2>/dev/null || echo "CONNECTION_FAILED")
    
    if echo "$response" | grep -q '"status":"green"'; then
        success_log "Elasticsearch cluster status: GREEN (optimal)"
        return 0
    elif echo "$response" | grep -q '"status":"yellow"'; then
        success_log "Elasticsearch cluster status: YELLOW (operational)"
        return 0
    else
        error_log "Elasticsearch cluster health check failed"
        verbose_log "Response: $response"
        ((critical_failures++))
        return 1
    fi
}

# CRITICAL TEST 2: Index Lifecycle Management Policies
test_ilm_policies() {
    log "CRITICAL TEST: ILM policy configuration validation"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_ilm/policy" 2>/dev/null || echo "CONNECTION_FAILED")
    
    if echo "$response" | grep -q "fttranscendence-logs-policy"; then
        success_log "ILM policies configured and active"
        return 0
    else
        error_log "ILM policies missing or misconfigured"
        verbose_log "Response: $response"
        ((critical_failures++))
        return 1
    fi
}

# CRITICAL TEST 3: Data Ingestion Pipeline
test_data_ingestion() {
    log "CRITICAL TEST: Data ingestion pipeline validation"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_cat/indices/fttranscendence-logs*?h=index,docs.count" 2>/dev/null || echo "CONNECTION_FAILED")
    
    if echo "$response" | grep -q "fttranscendence-logs"; then
        local doc_count=$(echo "$response" | grep "fttranscendence-logs" | awk '{print $2}' | head -1)
        if [ "$doc_count" != "0" ] && [ -n "$doc_count" ]; then
            success_log "Data ingestion active ($doc_count documents indexed)"
            return 0
        else
            warning_log "Indices exist but no documents indexed yet"
            ((warning_count++))
            return 0
        fi
    else
        error_log "No log indices found - data ingestion pipeline failed"
        verbose_log "Response: $response"
        ((critical_failures++))
        return 1
    fi
}

# CRITICAL TEST 4: Kibana Service Availability
test_kibana_availability() {
    log "CRITICAL TEST: Kibana service availability validation"
    
    local response=$(curl -s -k "https://localhost:5601/api/status" 2>/dev/null || echo "CONNECTION_FAILED")
    
    if echo "$response" | grep -q '"level":"available"' || \
       echo "$response" | grep -q '"overall":{"level":"available"'; then
        success_log "Kibana service operational and accessible"
        return 0
    else
        error_log "Kibana service not available"
        verbose_log "Response: $response"
        ((critical_failures++))
        return 1
    fi
}

# WARNING TEST 5: Logstash Processing Status
test_logstash_processing() {
    log "WARNING TEST: Logstash processing pipeline validation"
    
    local logstash_logs=$(docker logs elk-logstash --tail 20 2>/dev/null || echo "NO_LOGS")
    
    if echo "$logstash_logs" | grep -q "Starting pipeline.*main.*\|Pipeline started successfully"; then
        success_log "Logstash pipeline active and processing"
        return 0
    elif echo "$logstash_logs" | grep -q "ft_backend\|@timestamp"; then
        success_log "Logstash processing logs detected"
        return 0
    else
        warning_log "Logstash processing status unclear"
        verbose_log "Recent logs: $(echo "$logstash_logs" | tail -3)"
        ((warning_count++))
        return 1
    fi
}

# WARNING TEST 6: Archive Repository Configuration
test_archive_repository() {
    log "WARNING TEST: Snapshot repository configuration validation"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_snapshot" 2>/dev/null || echo "CONNECTION_FAILED")
    
    if echo "$response" | grep -q "ft_archive_repo"; then
        success_log "Archive repository configured for backups"
        return 0
    else
        warning_log "Archive repository not configured - backups unavailable"
        verbose_log "Response: $response"
        ((warning_count++))
        return 1
    fi
}

# Main CI/CD execution pipeline
main() {
    echo "=================================================="
    echo "ELK - CI/CD Integration Test"
    echo "=================================================="
    
    # Load environment configuration
    load_environment
    
    log "Starting CI/CD validation pipeline..."
    echo ""
    
    # Execute critical tests (must pass for deployment)
    test_elasticsearch_health
    echo ""
    
    test_ilm_policies
    echo ""
    
    test_data_ingestion
    echo ""
    
    test_kibana_availability
    echo ""
    
    # Execute warning-level tests (failures are noted but not blocking)
    test_logstash_processing || true
    echo ""
    
    test_archive_repository || true
    echo ""
    
    # Final CI/CD results evaluation
    echo "=================================================="
    log "CI/CD TEST RESULTS SUMMARY:"
    echo ""
    
    log "Critical failures: $critical_failures"
    log "Warning count: $warning_count"
    echo ""
    
    # Determine CI/CD pipeline result
    if [ $critical_failures -eq 0 ]; then
        if [ $warning_count -eq 0 ]; then
            success_log "ALL TESTS PASSED - ELK Stack ready for production"
            exit 0
        elif [ "$FAIL_ON_WARNINGS" = true ]; then
            error_log "PIPELINE FAILED - Warnings treated as failures (--fail-on-warnings)"
            exit 1
        else
            success_log "PIPELINE PASSED - ELK Stack operational with warnings"
            exit 0
        fi
    else
        error_log "PIPELINE FAILED - Critical component failures detected"
        log "Deployment should be blocked until critical issues are resolved"
        exit 1
    fi
}

# Execute CI/CD pipeline
main "$@"
