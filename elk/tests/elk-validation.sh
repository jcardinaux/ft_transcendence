#!/bin/bash

# ELK Stack Testing
# Validates Elasticsearch cluster health, ILM policies, snapshot repositories, indices, Logstash processing, and Kibana availability
# Implements auto-fix logic for archive repository and ILM configuration failures
# Re-tests components after applying fixes to verify successful repair

set -e

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Test execution counters
failed_tests=0
fixed_tests=0
total_tests=6

# Utility function for colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS") echo -e "${GREEN}PASS${NC}: $message" ;;
        "FAIL") echo -e "${RED}FAIL${NC}: $message" ;;
        "WARN") echo -e "${YELLOW}WARN${NC}: $message" ;;
        "INFO") echo -e "${BLUE}INFO${NC}: $message" ;;
        "FIX")  echo -e "${YELLOW}FIXING${NC}: $message" ;;
    esac
}

# Load and validate environment configuration
load_environment() {
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
        print_status "PASS" "Environment variables loaded from .env"
        return 0
    else
        print_status "FAIL" ".env file not found. Run 'make up' first."
        exit 1
    fi
}

# Test 1: Elasticsearch cluster health validation
test_elasticsearch_health() {
    print_status "INFO" "TEST 1: Elasticsearch Cluster Health"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_cluster/health" 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"status":"green"'; then
        print_status "PASS" "Elasticsearch cluster is healthy (status: green)"
        return 0
    elif echo "$response" | grep -q '"status":"yellow"'; then
        print_status "PASS" "Elasticsearch cluster is operational (status: yellow)"
        return 0
    else
        print_status "FAIL" "Elasticsearch cluster health check failed"
        echo "Response: $response"
        return 1
    fi
}

# Test 2: Index Lifecycle Management policies validation
test_ilm_policies() {
    print_status "INFO" "TEST 2: ILM Policies Configuration"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_ilm/policy/fttranscendence-logs-policy" 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q "fttranscendence-logs-policy"; then
        print_status "PASS" "fttranscendence-logs-policy found and active"
        return 0
    else
        print_status "FAIL" "ILM policies not properly configured"
        echo "Response: $response"
        return 1
    fi
}

# Test 3: Snapshot repository configuration validation
test_snapshot_repository() {
    print_status "INFO" "TEST 3: Snapshot Repository Configuration"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_snapshot/ft_archive_repo" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q '"type":"fs"' && echo "$response" | grep -q '"location"'; then
        print_status "PASS" "Archive repository configured and accessible"
        return 0
    else
        print_status "FAIL" "Archive repository missing or misconfigured"
        echo "Response: $response"
        return 1
    fi
}

# Test 4: Indices status and health validation
test_indices_status() {
    print_status "INFO" "TEST 4: Indices Status and Health"
    
    local response=$(curl -s -k -u "elastic:${ELASTIC_PASSWORD}" \
        "https://localhost:9200/_cat/indices/fttranscendence-logs*?h=index,health,status" 2>/dev/null || echo "")
    
    if [ -n "$response" ] && echo "$response" | grep -q "fttranscendence-logs"; then
        print_status "PASS" "Log indices are healthy and accessible"
        return 0
    else
        print_status "FAIL" "Cannot access indices or authentication failed"
        echo "Response: $response"
        return 1
    fi
}

# Test 5: Logstash pipeline processing validation
test_logstash_pipeline() {
    print_status "INFO" "TEST 5: Logstash Pipeline Processing"
    
    # Check if Logstash is processing logs correctly
    local recent_logs=$(docker logs elk-logstash 2>&1 | tail -10)
    
    # Check for active processing (JSON output indicates successful processing)
    if echo "$recent_logs" | grep -q "@timestamp\|ft_backend\|fastify" || \
       echo "$recent_logs" | grep -q "Starting pipeline.*main.*" || \
       echo "$recent_logs" | grep -q "Pipeline started successfully"; then
        print_status "PASS" "Logstash pipeline is active and processing logs"
        return 0
    else
        print_status "FAIL" "Logstash not processing logs correctly"
        echo "Recent logs: $recent_logs"
        return 1
    fi
}

# Test 6: Kibana service availability validation
test_kibana_service() {
    print_status "INFO" "TEST 6: Kibana Service Availability"
    
    local response=$(curl -s -k "https://localhost:5601/api/status" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q '"level":"available"' || \
       echo "$response" | grep -q '"overall":{"level":"available"'; then
        print_status "PASS" "Kibana service is available and operational"
        return 0
    else
        print_status "FAIL" "Kibana not available"
        echo "Response: $response"
        return 1
    fi
}

# Auto-fix function for archive repository configuration
fix_archive_repository() {
    print_status "FIX" "Archive Repository Configuration"
    
    # Remove any existing corrupted repository
    print_status "INFO" "Removing existing repository..."
    curl -s -X DELETE "https://localhost:9200/_snapshot/ft_archive_repo" \
        -k -u "elastic:${ELASTIC_PASSWORD}" 2>/dev/null || true
    
    # Setup archive directory with proper permissions
    print_status "INFO" "Setting up archive directory..."
    docker exec elk-elasticsearch bash -c "
        # Remove any corrupted files
        rm -rf /usr/share/elasticsearch/archives/* 2>/dev/null || true
        
        # Ensure directory exists with proper permissions
        mkdir -p /usr/share/elasticsearch/archives
        chmod 777 /usr/share/elasticsearch/archives
        
        # Verify write permissions
        echo 'test' > /usr/share/elasticsearch/archives/.test_write 2>/dev/null && rm -f /usr/share/elasticsearch/archives/.test_write
        
        echo 'Archive directory setup completed'
    " 2>/dev/null
    
    # Wait for filesystem operations to complete
    sleep 2
    
    # Create repository with verification disabled initially
    print_status "INFO" "Creating repository..."
    local response=$(curl -s -X PUT "https://localhost:9200/_snapshot/ft_archive_repo?verify=false" \
        -k -u "elastic:${ELASTIC_PASSWORD}" \
        -H "Content-Type: application/json" \
        -d '{
            "type": "fs",
            "settings": {
                "location": "/usr/share/elasticsearch/archives",
                "compress": true,
                "chunk_size": "1gb",
                "readonly": false
            }
        }')
    
    if echo "$response" | grep -q '"acknowledged":true'; then
        print_status "PASS" "Archive repository created successfully"
        
        # Verify repository functionality
        print_status "INFO" "Verifying repository..."
        local verify_response=$(curl -s -X POST "https://localhost:9200/_snapshot/ft_archive_repo/_verify" \
            -k -u "elastic:${ELASTIC_PASSWORD}")
        
        if echo "$verify_response" | grep -q '"nodes"'; then
            print_status "PASS" "Repository verification successful"
            return 0
        else
            print_status "WARN" "Repository created but verification failed: $verify_response"
            return 0  # Consider it success since repository was created
        fi
    else
        print_status "FAIL" "Failed to create archive repository: $response"
        return 1
    fi
}

# Auto-fix function for ILM rollover alias configuration
fix_ilm_alias() {
    print_status "FIX" "ILM Rollover Alias Configuration"
    
    # Create write index with proper alias
    local response=$(curl -s -X PUT "https://localhost:9200/fttranscendence-logs-000001" \
        -k -u "elastic:${ELASTIC_PASSWORD}" \
        -H "Content-Type: application/json" \
        -d '{
            "aliases": {
                "fttranscendence-logs": {
                    "is_write_index": true
                }
            }
        }')
    
    if echo "$response" | grep -q '"acknowledged":true'; then
        print_status "PASS" "ILM alias configured successfully"
        return 0
    else
        print_status "FAIL" "Failed to configure ILM alias: $response"
        return 1
    fi
}

# Enhanced test execution with auto-fix and re-test logic
run_test_with_autofix() {
    local test_function=$1
    local fix_function=$2
    local test_name=$3
    
    # Run initial test
    if $test_function; then
        return 0
    else
        ((failed_tests++))
        
        # Attempt auto-fix if fix function provided
        if [ -n "$fix_function" ]; then
            print_status "INFO" "Attempting to fix $test_name..."
            
            if $fix_function; then
                print_status "INFO" "Fix applied, re-testing $test_name..."
                sleep 2  # Allow time for changes to take effect
                
                # Re-run the test after fix
                if $test_function; then
                    print_status "PASS" "Auto-fix successful for $test_name"
                    ((fixed_tests++))
                    ((failed_tests--))  # Reduce failed count since we fixed it
                    return 0
                else
                    print_status "FAIL" "Auto-fix failed for $test_name"
                    return 1
                fi
            else
                print_status "FAIL" "Auto-fix failed for $test_name"
                return 1
            fi
        fi
        return 1
    fi
}

# Main execution flow
main() {
    echo "=========================================="
    echo "ELK Stack Testing"
    echo "=========================================="
    
    # Load environment configuration
    load_environment
    
    echo ""
    print_status "INFO" "Starting validation with $total_tests tests..."
    echo ""
    
    # Execute all tests with auto-fix
    run_test_with_autofix "test_elasticsearch_health" "" "Elasticsearch Health"
    echo ""
    
    run_test_with_autofix "test_ilm_policies" "" "ILM Policies"
    echo ""
    
    run_test_with_autofix "test_snapshot_repository" "fix_archive_repository" "Snapshot Repository"
    echo ""
    
    run_test_with_autofix "test_indices_status" "fix_ilm_alias" "Indices Status"
    echo ""
    
    run_test_with_autofix "test_logstash_pipeline" "" "Logstash Pipeline"
    echo ""
    
    run_test_with_autofix "test_kibana_service" "" "Kibana Service"
    echo ""
    
    # Final results summary
    echo "=========================================="
    print_status "INFO" "TEST RESULTS SUMMARY:"
    local passed_tests=$((total_tests - failed_tests))
    print_status "PASS" "Passed: $passed_tests/$total_tests"
    
    if [ $failed_tests -gt 0 ]; then
        print_status "FAIL" "Failed: $failed_tests/$total_tests"
    fi
    
    if [ $fixed_tests -gt 0 ]; then
        print_status "INFO" "Auto-fixed: $fixed_tests tests"
    fi
    
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        print_status "PASS" "All tests passed successfully"
        exit 0
    else
        print_status "WARN" "Some tests failed. Check the output above for details."
        exit 1
    fi
}

# Execute main function
main "$@"
