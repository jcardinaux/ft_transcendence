# Usa l'immagine ufficiale come base
FROM docker.elastic.co/elasticsearch/elasticsearch:8.15.0

# Copia gli script nella cartella /scripts dentro l'immagine con permessi di esecuzione
COPY --chmod=755 ./scripts/ /scripts/


#Ho risolto il problema modificando tutti i Dockerfile che usavano RUN chmod su file copiati da NFS. La soluzione è stata usare l'opzione --chmod nel comando COPY, che imposta i permessi direttamente durante la copia dei file nell'immagine Docker, evitando così problemi con filesystem come NFS che hanno restrizioni sulle operazioni di cambio permessi.