#!/bin/bash
curl -s -k --cert /shared-certs/kibana/kibana-cert.pem --key /shared-certs/kibana/kibana-key.pem "https://localhost:5601/api/status" | grep -q '"overall":{"level":"available"'