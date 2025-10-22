FROM docker.elastic.co/logstash/logstash:8.15.0

# Esegui i comandi di build come root (l'immagine base può cambiare utente)
USER root

# Crea esplicitamente la cartella di destinazione
RUN mkdir -p /scripts

# Copia i singoli file necessari con permessi di esecuzione
COPY --chmod=755 ./scripts/entrypoint-ls.sh /scripts/entrypoint-ls.sh

# Lasciare il container a root; se vuoi eseguire come utente non-root,
# puoi aggiungere `USER logstash` qui se l'utente esiste nell'immagine base.