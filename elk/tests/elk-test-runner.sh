#!/bin/bash

# ELK Test Runner Utility
# Wrapper for comprehensive, CI/CD, and quick connectivity testing modes
# Validates prerequisites and provides unified interface for all test types
# Usage: ./elk-test-runner.sh [comprehensive|ci|ci-strict|quick|help]

set -e

# ANSI color codes
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[0;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
    echo -e "${BLUE}ELK Stack Test Runner${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./elk-test-runner.sh [option]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  comprehensive    Run complete validation with auto-fix"
    echo "  ci              Run CI/CD tests (warnings allowed)"
    echo "  ci-strict       Run CI/CD tests (fail on warnings)"
    echo "  quick           Run basic connectivity tests"
    echo "  help            Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./elk-test-runner.sh comprehensive"
    echo "  ./elk-test-runner.sh ci-strict"
    echo ""
    echo -e "${YELLOW}Prerequisites:${NC}"
    echo "  - ELK Stack must be running (make up)"
    echo "  - Wait 30-60 seconds after startup"
}

check_prerequisites() {
    if [ ! -f "$SCRIPT_DIR/../../.env" ]; then
        echo -e "${RED}ERROR: .env file not found${NC}"
        echo "Run 'make up' first to start the ELK Stack"
        exit 1
    fi
    
    if ! docker ps | grep -q elk-elasticsearch; then
        echo -e "${RED}ERROR: ELK Stack not running${NC}"
        echo "Run 'make up' first to start the ELK Stack"
        exit 1
    fi
}

run_comprehensive() {
    echo -e "${BLUE}Running complete ELK Stack tests...${NC}"
    "$SCRIPT_DIR/elk-validation.sh"
}

run_ci() {
    echo -e "${BLUE}Running CI/CD ELK tests...${NC}"
    "$SCRIPT_DIR/elk-ci-pipeline.sh"
}

run_ci_strict() {
    echo -e "${BLUE}Running strict CI/CD ELK tests...${NC}"
    "$SCRIPT_DIR/elk-ci-pipeline.sh" --fail-on-warnings
}

run_quick() {
    echo -e "${BLUE}Running quick connectivity tests...${NC}"
    
    source "$SCRIPT_DIR/../../.env"
    
    echo -e "${YELLOW}Testing Elasticsearch...${NC}"
    if curl -k -s -u "elastic:${ELASTIC_PASSWORD}" "https://localhost:9200/_cluster/health" | grep -q "green\|yellow"; then
        echo -e "${GREEN}✓ Elasticsearch healthy${NC}"
    else
        echo -e "${RED}✗ Elasticsearch not accessible${NC}"
    fi
    
    echo -e "${YELLOW}Testing Kibana...${NC}"
    if curl -k -s "https://localhost:5601/api/status" | grep -q "available"; then
        echo -e "${GREEN}✓ Kibana available${NC}"
    else
        echo -e "${RED}✗ Kibana not accessible${NC}"
    fi
    
    echo -e "${YELLOW}Testing Logstash...${NC}"
    if docker logs elk-logstash --tail 20 2>/dev/null | grep -q "@timestamp\|pipeline\|ft_backend"; then
        echo -e "${GREEN}✓ Logstash processing${NC}"
    else
        echo -e "${RED}✗ Logstash not processing${NC}"
    fi
}

main() {
    case "${1:-help}" in
        comprehensive)
            check_prerequisites
            run_comprehensive
            ;;
        ci)
            check_prerequisites
            run_ci
            ;;
        ci-strict)
            check_prerequisites
            run_ci_strict
            ;;
        quick)
            check_prerequisites
            run_quick
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}ERROR: Unknown option '$1'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
