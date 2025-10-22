FROM alpine:3.18

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl bash

# Create working directory
WORKDIR /generator

# Copy the certificate generation script with execution permissions
COPY --chmod=755 generate-certs.sh .

# Run the certificate generation script
CMD ["./generate-certs.sh"]
