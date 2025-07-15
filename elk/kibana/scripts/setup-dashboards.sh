#!/bin/bash

# Wait for Kibana to be ready
echo "Waiting for Kibana to be ready..."
until curl -s -k "https://localhost:5601/api/status" | grep -q "available"; do
  sleep 5
done

echo "Setting up Kibana index patterns and dashboards..."

# Create index pattern
curl -X POST "https://localhost:5601/api/saved_objects/index-pattern/fttranscendence-logs" \
  -k -u "kibana_system:${KIBANA_SYSTEM_PASSWORD}" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "fttranscendence-logs-*",
      "timeFieldName": "@timestamp",
      "fields": "[{\"name\":\"@timestamp\",\"type\":\"date\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"service\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"log_level\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"msg\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":false},{\"name\":\"reqId\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true}]"
    }
  }'

# Create log level visualization
curl -X POST "https://localhost:5601/api/saved_objects/visualization/log-levels-pie" \
  -k -u "kibana_system:${KIBANA_SYSTEM_PASSWORD}" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "Log Levels Distribution",
      "type": "pie",
      "params": {
        "addTooltip": true,
        "addLegend": true,
        "legendPosition": "right"
      },
      "aggs": [
        {
          "id": "1",
          "type": "count",
          "schema": "metric",
          "params": {}
        },
        {
          "id": "2",
          "type": "terms",
          "schema": "segment",
          "params": {
            "field": "log_level",
            "size": 10,
            "order": "desc",
            "orderBy": "1"
          }
        }
      ]
    },
    "references": [
      {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "fttranscendence-logs"
      }
    ]
  }'

# Create services visualization
curl -X POST "https://localhost:5601/api/saved_objects/visualization/services-bar" \
  -k -u "kibana_system:${KIBANA_SYSTEM_PASSWORD}" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "Logs by Service",
      "type": "histogram",
      "params": {
        "addTooltip": true,
        "addLegend": true,
        "scale": "linear",
        "mode": "stacked"
      },
      "aggs": [
        {
          "id": "1",
          "type": "count",
          "schema": "metric",
          "params": {}
        },
        {
          "id": "2",
          "type": "terms",
          "schema": "segment",
          "params": {
            "field": "service",
            "size": 10,
            "order": "desc",
            "orderBy": "1"
          }
        }
      ]
    },
    "references": [
      {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "fttranscendence-logs"
      }
    ]
  }'

# Create main dashboard
curl -X POST "https://localhost:5601/api/saved_objects/dashboard/fttranscendence-main" \
  -k -u "kibana_system:${KIBANA_SYSTEM_PASSWORD}" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "ft_transcendence Log Analytics",
      "type": "dashboard",
      "description": "Main dashboard for ft_transcendence application logs",
      "panelsJSON": "[{\"version\":\"8.15.0\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"},{\"version\":\"8.15.0\",\"gridData\":{\"x\":24,\"y\":0,\"w\":24,\"h\":15,\"i\":\"2\"},\"panelIndex\":\"2\",\"embeddableConfig\":{},\"panelRefName\":\"panel_2\"}]",
      "timeRestore": false,
      "timeTo": "now",
      "timeFrom": "now-24h",
      "refreshInterval": {
        "pause": false,
        "value": 10000
      }
    },
    "references": [
      {
        "name": "panel_1",
        "type": "visualization",
        "id": "log-levels-pie"
      },
      {
        "name": "panel_2", 
        "type": "visualization",
        "id": "services-bar"
      }
    ]
  }'

echo "Kibana dashboards configured successfully!"
