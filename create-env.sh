#!/bin/bash

# Generate random passwords for ELK stack
ELASTIC_PASSWORD=$(openssl rand -hex 12)
KIBANA_SYSTEM_PASSWORD=$(openssl rand -hex 12)
KIBANA_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Generate JWT secret (256-bit key recommended for HS256)
JWT_SECRET=$(openssl rand -base64 32)

# Create root .env for ELK stack
echo "ELASTIC_PASSWORD=$ELASTIC_PASSWORD" > .env
echo "KIBANA_SYSTEM_PASSWORD=$KIBANA_SYSTEM_PASSWORD" >> .env
echo "KIBANA_ENCRYPTION_KEY=$KIBANA_ENCRYPTION_KEY" >> .env

# Create app/.env for Fastify application
cat > app/.env << EOF
FASTIFY_PORT=5000
DATABASE_URL=./database/data.db
JWT_SECRET=$JWT_SECRET
NODE_ENV=development
EOF

echo "Environment files created:"
echo "- .env (ELK stack configuration)"
echo "- app/.env (Fastify application configuration)"