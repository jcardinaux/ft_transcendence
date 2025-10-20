FROM docker.elastic.co/logstash/logstash:8.15.0

# Crea esplicitamente la cartella di destinazione
RUN mkdir -p /scripts

# Copia i singoli file necessari
COPY ./scripts/entrypoint-ls.sh /scripts/entrypoint-ls.sh

# Rendi lo script eseguibile
RUN chmod +x /scripts/entrypoint-ls.sh