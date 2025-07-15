#!/bin/bash

# Start Kibana in background
echo "Starting Kibana..."
/usr/local/bin/kibana-docker &
KIBANA_PID=$!

# Wait for Kibana to be fully ready
echo "Waiting for Kibana initialization..."
until curl -s -k "https://localhost:5601/api/status" | grep -q "available"; do
  sleep 10
done

# Wait additional time for full startup
sleep 30

# Setup dashboards only once
if [ ! -f /tmp/dashboards-initialized ]; then
  echo "Setting up Kibana dashboards..."
  /scripts/setup-dashboards.sh
  touch /tmp/dashboards-initialized
  echo "Dashboards setup completed!"
fi

# Keep Kibana running
wait $KIBANA_PID
