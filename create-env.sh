# Generate random passwords
ELASTIC_PASSWORD=$(openssl rand -hex 12)
KIBANA_SYSTEM_PASSWORD=$(openssl rand -hex 12)
KIBANA_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Save the passwords
echo "ELASTIC_PASSWORD=$ELASTIC_PASSWORD" > .env
echo "KIBANA_SYSTEM_PASSWORD=$KIBANA_SYSTEM_PASSWORD" >> .env
echo "KIBANA_ENCRYPTION_KEY=$KIBANA_ENCRYPTION_KEY" >> .env