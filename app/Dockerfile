FROM node:20 AS builder

WORKDIR /app

COPY app/package*.json ./
RUN npm install

COPY app ./

RUN npm run build


FROM node:20-slim AS runtime

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/database ./database
COPY --from=builder /app/certs ./certs
COPY --from=builder /app/tailwind.config.js .
COPY --from=builder /app/tsconfig.json .
COPY --from=builder /app/.env .env

RUN npm install --omit=dev

RUN mkdir -p /app/logs && touch /app/logs/server.log /app/logs/client.log
RUN chmod 666 /app/logs/*.log

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

#RUN adduser --disabled-password --gecos "" appuser \
#	&& chown -R appuser /app
#USER appuser

EXPOSE 5000

CMD ["npm", "start"]
