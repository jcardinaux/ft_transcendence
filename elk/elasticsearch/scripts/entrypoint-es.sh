#!/bin/bash

# Start Elasticsearch in the background
/usr/local/bin/docker-entrypoint.sh eswrapper &

# Wait for Elasticsearch to be ready
until curl -s http://localhost:9200; do
  sleep 5
done

# Automatic configuration of the kibana_system user
if [ -n "$KIBANA_SYSTEM_PASSWORD" ]; then
  echo "Automatic configuration of the kibana_system user..."
  curl -X POST -u "elastic:$ELASTIC_PASSWORD" "http://localhost:9200/_security/user/kibana_system/_password" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$KIBANA_SYSTEM_PASSWORD\"}" 
fi

curl -X PUT -u "elastic:$ELASTIC_PASSWORD" "http://localhost:9200/_index_template/fttranscendence-logs" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
  
# Keep the container running
wait