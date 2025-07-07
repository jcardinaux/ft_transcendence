#!/bin/bash
curl -s -u "elastic:$ELASTIC_PASSWORD" "http://localhost:9200/_cluster/health" | grep -qE '"status":"green|yellow"'