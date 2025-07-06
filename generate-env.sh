#!/bin/bash

# Script to automatically generate .env file with secure passwords

echo "Generating .env file with secure passwords..."

# Generate secure passwords
ELASTIC_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
KIBANA_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
KIBANA_ENCRYPTION_KEY=$(openssl rand -hex 16)

# Create .env file
cat > .env << EOF
# Password for elastic user (superuser)
ELASTIC_PASSWORD=${ELASTIC_PASSWORD}

# Password for kibana_system user
KIBANA_PASSWORD=${KIBANA_PASSWORD}

# Encryption key for Kibana (32 characters)
KIBANA_ENCRYPTION_KEY=${KIBANA_ENCRYPTION_KEY}
EOF

echo "File .env generated successfully!"
echo ""
echo "Generated credentials:"
echo "   Elastic user: elastic"
echo "   Elastic password: ${ELASTIC_PASSWORD}"
echo "   Kibana user: kibana_system"
echo "   Kibana password: ${KIBANA_PASSWORD}"
echo ""
echo "You can now run: docker compose up -d"