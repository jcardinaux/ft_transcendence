#!/bin/bash

set -e

CERTS_DIR="/shared-certs"
CA_DIR="${CERTS_DIR}/ca"

echo "Starting certificate generation for ft_transcendence ELK + App"

# Create directory structure
mkdir -p "${CA_DIR}"
mkdir -p "${CERTS_DIR}/app"
mkdir -p "${CERTS_DIR}/elasticsearch"
mkdir -p "${CERTS_DIR}/kibana"
mkdir -p "${CERTS_DIR}/logstash"

# Generate CA private key
echo "Generating Certificate Authority"
openssl genrsa -out "${CA_DIR}/ca-key.pem" 4096

# Generate CA certificate
openssl req -new -x509 -days 365 -key "${CA_DIR}/ca-key.pem" \
    -out "${CA_DIR}/ca-cert.pem" \
    -subj "/C=IT/ST=Rome/L=Rome/O=42Roma/OU=ft_transcendence/CN=ft-transcendence-ca"

echo "CA Certificate generated"

# Function to generate service certificates
generate_service_cert() {
    local service=$1
    local cn=$2
    local alt_names=$3
    
    echo "Generating certificate for ${service}"
    
    # Generate private key
    openssl genrsa -out "${CERTS_DIR}/${service}/${service}-key.pem" 2048
    
    # Generate certificate signing request
    openssl req -new -key "${CERTS_DIR}/${service}/${service}-key.pem" \
        -out "${CERTS_DIR}/${service}/${service}.csr" \
        -subj "/C=IT/ST=Rome/L=Rome/O=42Roma/OU=ft_transcendence/CN=${cn}"
    
    # Create extensions file with SAN
    cat > "${CERTS_DIR}/${service}/${service}.ext" <<EOF
[v3_req]
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = ${alt_names}
EOF

    # Generate signed certificate
    openssl x509 -req -in "${CERTS_DIR}/${service}/${service}.csr" \
        -CA "${CA_DIR}/ca-cert.pem" \
        -CAkey "${CA_DIR}/ca-key.pem" \
        -CAcreateserial \
        -out "${CERTS_DIR}/${service}/${service}-cert.pem" \
        -days 365 \
        -extensions v3_req \
        -extfile "${CERTS_DIR}/${service}/${service}.ext"
    
    # Cleanup CSR and extension files
    rm "${CERTS_DIR}/${service}/${service}.csr" "${CERTS_DIR}/${service}/${service}.ext"
    
    echo "Certificate for ${service} generated successfully"
}

# Generate certificates for each service
generate_service_cert "app" "ft-app" "DNS:ft-app,DNS:localhost,IP:127.0.0.1"
generate_service_cert "elasticsearch" "elk-elasticsearch" "DNS:elk-elasticsearch,DNS:elasticsearch,DNS:localhost,IP:127.0.0.1"
generate_service_cert "kibana" "elk-kibana" "DNS:elk-kibana,DNS:kibana,DNS:localhost,IP:127.0.0.1"
generate_service_cert "logstash" "elk-logstash" "DNS:elk-logstash,DNS:logstash,DNS:localhost,IP:127.0.0.1"

# Set proper permissions
chmod 644 "${CERTS_DIR}"/**/*-cert.pem
chmod 644 "${CERTS_DIR}"/**/*-key.pem  # Changed from 600 to 644 for container access
chmod 644 "${CA_DIR}/ca-cert.pem"
chmod 644 "${CA_DIR}/ca-key.pem"  # Changed from 600 to 644 for container access

echo "All certificates generated successfully"
echo "Certificates structure:"
find "${CERTS_DIR}" -type f -name "*.pem" | sort

echo "Certificate generator completed. Container will exit"
