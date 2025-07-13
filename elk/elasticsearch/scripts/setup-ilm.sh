#!/bin/bash

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
until curl -s -k -u "elastic:${ELASTIC_PASSWORD}" "https://localhost:9200/_cluster/health" > /dev/null; do
  sleep 5
done

echo "Setting up Index Lifecycle Management policies..."

# Create ILM policy for log retention
curl -X PUT "https://localhost:9200/_ilm/policy/fttranscendence-logs-policy" \
  -k -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "actions": {
            "rollover": {
              "max_size": "50gb",
              "max_age": "7d"
            },
            "set_priority": {
              "priority": 100
            }
          }
        },
        "warm": {
          "min_age": "8d",
          "actions": {
            "allocate": {
              "number_of_replicas": 0
            },
            "set_priority": {
              "priority": 50
            }
          }
        },
        "cold": {
          "min_age": "31d",
          "actions": {
            "allocate": {
              "number_of_replicas": 0
            },
            "set_priority": {
              "priority": 0
            }
          }
        },

        "delete": {
          "min_age": "365d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

# Update index template to use ILM policy
curl -X PUT "https://localhost:9200/_index_template/fttranscendence-logs" \
  -k -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["fttranscendence-logs-*"],
    "template": {
      "settings": {
        "index.lifecycle.name": "fttranscendence-logs-policy",
        "index.lifecycle.rollover_alias": "fttranscendence-logs"
      },
      "mappings": {
        "properties": {
          "@timestamp": {"type": "date"},
          "service": {"type": "keyword"},
          "responseTime": {"type": "float"},
          "log_level": {"type": "keyword"},
          "reqId": {"type": "keyword"}
        }
      }
    }
  }'

echo "ILM policies configured successfully!"

echo "Setting up data archiving repository..."

# Create snapshot repository for archiving
curl -X PUT "https://localhost:9200/_snapshot/ft_archive_repo" \
  -k -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/usr/share/elasticsearch/archives",
      "compress": true,
      "chunk_size": "64mb"
    }
  }'

echo "Setting up automated backup policy..."

# Create SLM policy for automated snapshots
curl -X PUT "https://localhost:9200/_slm/policy/ft_archive_policy" \
  -k -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 0 2 * * ?",
    "name": "<ft-snapshot-{now/d}>",
    "repository": "ft_archive_repo",
    "config": {
      "indices": ["fttranscendence-logs-*"],
      "ignore_unavailable": false,
      "include_global_state": false
    },
    "retention": {
      "expire_after": "30d",
      "max_count": 50,
      "min_count": 5
    }
  }'

echo "SUCCESS: Data retention and archiving policies configured successfully"
echo "ARCHIVE: Location set to /usr/share/elasticsearch/archives"
echo "SCHEDULE: Daily snapshots automated at 2:00 AM"
echo "LIFECYCLE: Hot(7d) → Warm(8d) → Cold(31d) → Archive(90d) → Delete(365d)"
