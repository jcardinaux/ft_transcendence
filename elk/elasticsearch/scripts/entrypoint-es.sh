#!/bin/bash

set -e

echo "Starting Elasticsearch with TLS configuration..."

# Create archive directory (ownership will be set by tests)
echo "Setting up archive directory..."
mkdir -p /usr/share/elasticsearch/archives
echo "Archive directory ready."

# Create certificates directory in Elasticsearch config
mkdir -p /usr/share/elasticsearch/config/certs

# Wait for certificates to be ready
while [ ! -f /shared-certs/ca/ca-cert.pem ] || [ ! -f /shared-certs/elasticsearch/elasticsearch-cert.pem ]; do
    echo "Waiting for certificates to be generated..."
    sleep 5
done

# Copy certificates to Elasticsearch config directory (required for security permissions)
echo "Copying certificates to Elasticsearch config directory..."
cp /shared-certs/ca/ca-cert.pem /usr/share/elasticsearch/config/certs/
cp /shared-certs/elasticsearch/elasticsearch-cert.pem /usr/share/elasticsearch/config/certs/
cp /shared-certs/elasticsearch/elasticsearch-key.pem /usr/share/elasticsearch/config/certs/

# Set proper permissions
chmod 644 /usr/share/elasticsearch/config/certs/*.pem
chmod 600 /usr/share/elasticsearch/config/certs/elasticsearch-key.pem

echo "Certificates copied and permissions set."

# Start Elasticsearch in the background
/usr/local/bin/docker-entrypoint.sh eswrapper &

# Wait for Elasticsearch to be ready
until curl -s -k --cert /usr/share/elasticsearch/config/certs/elasticsearch-cert.pem --key /usr/share/elasticsearch/config/certs/elasticsearch-key.pem https://localhost:9200; do
  sleep 5
done

# Automatic configuration of the kibana_system user
if [ -n "$KIBANA_SYSTEM_PASSWORD" ]; then
  echo "Automatic configuration of the kibana_system user..."
  curl -X POST -k --cert /usr/share/elasticsearch/config/certs/elasticsearch-cert.pem --key /usr/share/elasticsearch/config/certs/elasticsearch-key.pem -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_security/user/kibana_system/_password" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$KIBANA_SYSTEM_PASSWORD\"}" 
fi

curl -X PUT -k --cert /usr/share/elasticsearch/config/certs/elasticsearch-cert.pem --key /usr/share/elasticsearch/config/certs/elasticsearch-key.pem -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_index_template/fttranscendence-logs" \
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

# Setup ILM policies
echo "Setting up Index Lifecycle Management policies..."
/scripts/setup-ilm.sh
  
# Keep the container running
wait