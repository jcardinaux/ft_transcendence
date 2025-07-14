# ELK Stack Testing Framework Index

## Testing Overview

**Comprehensive testing framework for ft_transcendence ELK Stack 8.15.0 deployment validation, problem detection, and automated repair.**

## Test Script Architecture

### `elk-validation.sh` - Comprehensive Validation Framework
**Primary Purpose**: Complete ELK stack health verification with automated repair capabilities

**Technical Specifications:**
- 6-test sequential validation covering all ELK stack components
- Auto-fix implementation for archive repository Docker permission issues and ILM configuration
- Re-test logic with 2-second stabilization delay after automated repairs
- ANSI color-coded professional terminal output with status indicators

**Auto-Fix Implementation**: Docker permission correction via `chown elasticsearch:elasticsearch` and repository recreation with `verify=false` parameter

**Execution Model**: Sequential test processing with auto-fix on tests 3 (archive repository) and 4 (ILM alias)

### `elk-ci-pipeline.sh` - CI/CD Integration Testing
**Primary Purpose**: Pipeline-ready testing with structured output and configurable failure categorization

**Technical Specifications:**
- Critical vs warning test result categorization for deployment decision making
- Command-line options: `--fail-on-warnings` (strict mode) and `--verbose` (diagnostic output)
- CI/CD compliant exit codes (0 = success/warnings, 1 = critical failure)
- Timestamp-prefixed output format: `[YYYY-MM-DD HH:MM:SS] STATUS: message`

**Test Classification**: CRITICAL tests (1-4: Elasticsearch, ILM, Data Ingestion, Kibana), WARNING tests (5-6: Logstash, Archive Repository)

**Integration Features**: Machine-readable output formatting for automation parsing and log aggregation

### `elk-test-runner.sh` - Unified Test Execution Interface
**Primary Purpose**: Simplified test execution wrapper with prerequisite validation and multiple execution modes

**Technical Specifications:**
- Multiple execution modes: comprehensive, ci, ci-strict, quick
- Environment prerequisite validation (ELASTIC_PASSWORD, .env file existence)
- Docker container status validation via `docker ps` for `elk-elasticsearch`
- Service accessibility verification before full test execution

**Quick Mode Implementation**: Direct connectivity tests for Elasticsearch (`/_cluster/health`), Kibana (`/api/status`), and Logstash (container log analysis)

## Documentation Structure

### `README.md` - Technical Framework Documentation
**Comprehensive technical documentation covering:**
- Test execution architecture and sequential processing logic
- Auto-fix implementation details and Docker permission resolution
- Troubleshooting procedures with diagnostic commands
- Configuration specifications and deployment integration examples

## Execution Interface

### Direct Script Execution
```bash
# Comprehensive validation with auto-fix capabilities
./elk/tests/elk-validation.sh

# CI/CD pipeline testing with configurable failure modes
./elk/tests/elk-ci-pipeline.sh [--fail-on-warnings] [--verbose]

# Unified test runner with mode selection
./elk/tests/elk-test-runner.sh [comprehensive|ci|ci-strict|quick]
```

### Makefile Integration
```bash
# Comprehensive testing (elk-validation.sh execution)
make test-elk

# CI/CD standard mode (warnings permitted)
make test-ci

# CI/CD strict mode (warnings treated as failures)
make test-ci-strict
```

**Framework Integration**: All test scripts integrate with project Makefile for simplified deployment validation workflows.
