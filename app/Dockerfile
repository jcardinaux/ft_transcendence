FROM node:20 AS builder

WORKDIR /app

COPY app/package*.json app/package-lock.json ./
RUN npm ci

COPY app ./

RUN npm run build


FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos "" appuser

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/database ./database

# Copy Docker utilities
COPY app/docker-utils/get-certs.sh /app/docker-utils/get-certs.sh
RUN chmod +x /app/docker-utils/get-certs.sh

RUN mkdir -p /app/logs && touch /app/logs/server.log /app/logs/client.log
RUN chown -R appuser:appuser /app
RUN chmod 644 /app/logs/*.log

USER appuser

EXPOSE 5000

# Run certificate setup and start application
CMD ["/bin/bash", "-c", "/app/docker-utils/get-certs.sh && npm start"]