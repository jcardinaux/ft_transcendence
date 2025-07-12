FROM alpine:3.18

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl bash

# Create working directory
WORKDIR /generator

# Copy the certificate generation script
COPY generate-certs.sh .

# Make script executable
RUN chmod +x generate-certs.sh

# Run the certificate generation script
CMD ["./generate-certs.sh"]
