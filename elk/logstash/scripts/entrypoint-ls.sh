#!/usr/bin/env bash
set -e

# 1) Create the /logs directory (if it doesn't exist) and the two log files
# mkdir -p /logs
# touch /logs/server.log /logs/client.log
# chmod 666 /logs/*.log

# 2) Wait for Elasticsearch to be ready
while ! curl -s -u "elastic:${ELASTIC_PASSWORD}" "http://elasticsearch:9200" >/dev/null; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

# 3) Start Logstash with your configuration
exec /usr/share/logstash/bin/logstash \
  -f /usr/share/logstash/pipeline/logstash.conf \
  "$@"
