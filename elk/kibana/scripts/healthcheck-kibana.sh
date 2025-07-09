#!/bin/bash
curl -s "http://localhost:5601/api/status" | grep -q '"overall":{"level":"available"'