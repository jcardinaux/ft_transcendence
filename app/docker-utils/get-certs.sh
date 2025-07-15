#!/bin/bash
# Certificate management: Docker certificates from cert-generator, local fallback for development

DOCKER_CERTS_DIR="/shared-certs/app"
LOCAL_CERTS_DIR="/app/certs"
CERTS_DIR="/app/certs"

mkdir -p "${CERTS_DIR}"

if [ -f "${DOCKER_CERTS_DIR}/app-cert.pem" ] && [ -f "${DOCKER_CERTS_DIR}/app-key.pem" ]; then
    echo "Using Docker-generated certificates from cert-generator service"
    # Create symlinks instead of copying for better permission handling
    ln -sf "${DOCKER_CERTS_DIR}/app-cert.pem" "${CERTS_DIR}/server.crt"
    ln -sf "${DOCKER_CERTS_DIR}/app-key.pem" "${CERTS_DIR}/server.key"
    # Copy CA cert for trust chain
    if [ -f "/shared-certs/ca/ca-cert.pem" ]; then
        ln -sf "/shared-certs/ca/ca-cert.pem" "${CERTS_DIR}/ca-cert.pem"
    fi
else
    echo "Using local certificates (development environment only)"
    
    # Check if local certificates exist (only for local development outside Docker)
    if [ ! -f "${LOCAL_CERTS_DIR}/server.crt" ] || [ ! -f "${LOCAL_CERTS_DIR}/server.key" ]; then
        echo "ERROR: No certificates found"
        echo "   - Docker certificates missing: ${DOCKER_CERTS_DIR}/"
        echo "   - Local certificates missing: ${LOCAL_CERTS_DIR}/"
        echo "   In Docker: ensure cert-generator service runs successfully"
        echo "   In local dev: provide certificates in ${LOCAL_CERTS_DIR}/"
        exit 1
    else
        cp "${LOCAL_CERTS_DIR}/server.crt" "${CERTS_DIR}/server.crt"
        cp "${LOCAL_CERTS_DIR}/server.key" "${CERTS_DIR}/server.key"
        # Set correct permissions for copied files
        chmod 644 "${CERTS_DIR}/server.crt"
        chmod 600 "${CERTS_DIR}/server.key"
        echo "Note: Using local development certificates - not for production!"
    fi
fi

echo "Certificates ready in ${CERTS_DIR}"
