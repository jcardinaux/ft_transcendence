# Usa l'immagine ufficiale come base
FROM docker.elastic.co/elasticsearch/elasticsearch:8.15.0

# Copia gli script nella cartella /scripts dentro l'immagine
COPY ./scripts/ /scripts/

# Dai i permessi di esecuzione a tutti gli script
RUN chmod +x /scripts/*.sh