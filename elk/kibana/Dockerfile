FROM docker.elastic.co/kibana/kibana:8.15.0

# Copia gli script dentro l'immagine
COPY ./scripts/ /scripts/

# Assicurati che siano eseguibili
RUN chmod +x /scripts/*.sh