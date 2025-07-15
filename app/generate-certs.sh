#!/bin/bash
# Generate development certificates for local Node.js development
# Usage: ./generate-dev-certs.sh

set -e

CERTS_DIR="./certs"
echo "Generating development certificates for ft_transcendence app"

# Create certs directory
mkdir -p "${CERTS_DIR}"

# Generate private key
echo "Generating private key..."
openssl genrsa -out "${CERTS_DIR}/server.key" 2048

# Generate certificate (self-signed for development)
echo "Generating certificate..."
openssl req -new -x509 -key "${CERTS_DIR}/server.key" \
    -out "${CERTS_DIR}/server.crt" \
    -days 365 \
    -subj "/C=IT/ST=Rome/L=Rome/O=42Roma/OU=ft_transcendence/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"

# Set correct permissions
chmod 644 "${CERTS_DIR}/server.crt"
chmod 600 "${CERTS_DIR}/server.key"

echo "Development certificates generated successfully!"
echo "Location: ${CERTS_DIR}/"
echo "   - server.crt (certificate)"
echo "   - server.key (private key)"
echo ""
echo "Now you can run: npm run dev"
echo "Access: https://localhost:5000"
