# Docker Compose orchestration with ELK Stack integration

.PHONY: all up down clean test logs help

# ANSI color codes for terminal output
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Default target - launches complete application stack
all: up

# Initialize environment and start all services
up:
	@echo "$(BLUE)Initializing ft_transcendence deployment...$(NC)"
	@./create-env.sh
	@docker-compose up -d
	@echo "$(GREEN)Services started$(NC)"
	@echo ""
	@echo "$(YELLOW)Service endpoints:$(NC)"
	@echo "   Application: https://localhost:5000"
	@echo "   Elasticsearch: https://localhost:9200"
	@echo "   Kibana: https://localhost:5601"
	@echo ""
	@echo "$(YELLOW)Authentication credentials in .env$(NC)"

# Stop all services gracefully
down:
	@echo "$(RED)Stopping services...$(NC)"
	@docker-compose down

# Remove containers, volumes, and environment files
clean:
	@echo "$(RED)Cleaning deployment...$(NC)"
	@docker-compose down -v
	@docker system prune -f
	@rm -f .env

# Display service logs with real-time output
logs:
	@docker-compose logs -f

# Verify deployment status and service health
test:
	@echo "$(BLUE)Checking deployment status...$(NC)"
	@echo "$(YELLOW)Service health check:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)ELK connectivity validation:$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)Environment configuration found$(NC)"; \
		docker-compose exec -T elasticsearch curl -s -k -u "elastic:$$(grep ELASTIC_PASSWORD .env | cut -d= -f2)" "https://localhost:9200/_cluster/health" | grep -q "green\|yellow" && echo "$(GREEN)Elasticsearch cluster healthy$(NC)" || echo "$(RED)Elasticsearch cluster unavailable$(NC)"; \
	else \
		echo "$(RED)Environment not initialized - run 'make up'$(NC)"; \
	fi

# Comprehensive ELK Stack testing with auto-fix capabilities
test-elk:
	@echo "$(BLUE)Executing comprehensive ELK validation...$(NC)"
	@if [ ! -f .env ]; then echo "$(RED)Environment not initialized - run 'make up'$(NC)"; exit 1; fi
	@./elk/tests/elk-validation.sh

# CI/CD pipeline testing with structured output
test-ci:
	@echo "$(BLUE)Executing CI/CD ELK validation...$(NC)"
	@if [ ! -f .env ]; then echo "$(RED)Environment not initialized - run 'make up'$(NC)"; exit 1; fi
	@./elk/tests/elk-ci-pipeline.sh

# CI/CD testing with warning escalation to failures
test-ci-strict:
	@echo "$(BLUE)Executing strict CI/CD validation...$(NC)"
	@if [ ! -f .env ]; then echo "$(RED)Environment not initialized - run 'make up'$(NC)"; exit 1; fi
	@./elk/tests/elk-ci-pipeline.sh --fail-on-warnings

# Real-time ELK stack monitoring for development
monitor:
	@echo "$(YELLOW)ELK Stack monitoring active (Ctrl+C to exit)...$(NC)"
	@watch -n 5 'echo "=== CLUSTER HEALTH ===" && docker exec elk-elasticsearch curl -s -k -u "elastic:$$(grep ELASTIC_PASSWORD .env | cut -d= -f2)" "https://localhost:9200/_cluster/health" 2>/dev/null | grep -o "\"status\":\"[^\"]*\"" && echo "" && echo "=== INDEX STATUS ===" && docker exec elk-elasticsearch curl -s -k -u "elastic:$$(grep ELASTIC_PASSWORD .env | cut -d= -f2)" "https://localhost:9200/_cat/indices?h=index,health,docs.count" 2>/dev/null | grep fttranscendence'

# Display usage information
help:
	@echo "$(BLUE)ft_transcendence - Docker Compose Orchestration$(NC)"
	@echo ""
	@echo "$(YELLOW)Commands:$(NC)"
	@echo "  make              # Start complete application stack"
	@echo "  make up           # Initialize environment and start services"  
	@echo "  make down         # Stop all services"
	@echo "  make clean        # Remove containers, volumes, environment"
	@echo "  make logs         # Display service logs with real-time output"
	@echo "  make test         # Verify deployment and service health"
	@echo "  make test-elk     # Comprehensive ELK Stack validation"
	@echo "  make test-ci      # CI/CD pipeline testing"
	@echo "  make test-ci-strict # CI/CD testing with warning escalation"
	@echo "  make monitor      # Real-time ELK monitoring"
	@echo "  make help         # Display this help"
	@echo ""
	@echo "Subject compliance: Single command deployment requirement"
	@echo "$(GREEN)Implementation: Complete stack launches with 'make' command$(NC)"
