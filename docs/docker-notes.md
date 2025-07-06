# Note Docker - ft_transcendence

## Configurazione HTTPS

### Generazione Certificati SSL

**Prerequisito**: Assicurarsi che OpenSSL sia installato nel container o nell'ambiente di sviluppo.

#### Comando per generare i certificati:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 \
  -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"
```

#### Parametri del comando:

- `-x509`: Genera un certificato autofirmato
- `-newkey rsa:2048`: Crea una nuova chiave RSA a 2048 bit
- `-nodes`: Non crittografa la chiave privata (no password richiesta)
- `-keyout server.key`: Nome del file della chiave privata
- `-out server.crt`: Nome del file del certificato
- `-days 365`: Validità del certificato (1 anno)
- `-subj`: Soggetto del certificato (dati dell'organizzazione)

#### Posizionamento dei file:

I certificati devono essere posizionati nella directory:
```
app/certs/
├── server.crt
└── server.key
```

### Dockerfile - Setup Automatico

Per automatizzare la generazione dei certificati nel Dockerfile:

```dockerfile
# Installa OpenSSL se non presente
RUN apt-get update && apt-get install -y openssl

# Crea directory per i certificati
RUN mkdir -p /app/certs

# Genera certificati SSL se non esistono
RUN if [ ! -f /app/certs/server.crt ]; then \
    openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /app/certs/server.key \
    -out /app/certs/server.crt \
    -days 365 \
    -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"; \
    fi
```

### Docker Compose - Volumes

Configurazione per persistere i certificati:

```yaml
version: '3.8'
services:
  backend:
    build: .
    volumes:
      - ./app/certs:/app/certs
    ports:
      - "443:443"
      - "3000:3000"
    environment:
      - NODE_ENV=development
```

## Checklist Pre-Avvio

Prima di avviare il container del backend:

1. **Verifica OpenSSL installato**:
   ```bash
   openssl version
   ```

2. **Controlla esistenza certificati**:
   ```bash
   ls -la app/certs/
   ```

3. **Genera certificati se mancanti**:
   ```bash
   mkdir -p app/certs
   cd app/certs
   openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 \
     -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"
   ```

4. **Verifica permessi file**:
   ```bash
   chmod 600 app/certs/server.key
   chmod 644 app/certs/server.crt
   ```

## Troubleshooting

### Errori Comuni

**Errore**: `ENOENT: no such file or directory, open './certs/server.key'`
- **Soluzione**: Verificare che i certificati siano stati generati nella directory corretta

**Errore**: `Error: Cannot find module 'https'`
- **Soluzione**: Verificare che Node.js supporti il modulo HTTPS (dovrebbe essere nativo)

**Errore**: `EACCES: permission denied`
- **Soluzione**: Correggere i permessi dei file certificato

### Regenerazione Certificati

Per rigenerare i certificati (es. dopo scadenza):

```bash
# Backup vecchi certificati
mv app/certs/server.key app/certs/server.key.old
mv app/certs/server.crt app/certs/server.crt.old

# Genera nuovi certificati
openssl req -x509 -newkey rsa:2048 -nodes -keyout app/certs/server.key -out app/certs/server.crt -days 365 \
  -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"

# Riavvia il container
docker-compose restart backend
```

## Note di Sicurezza

- I certificati autofirmati sono adatti solo per sviluppo locale
- Per produzione, utilizzare certificati firmati da una CA riconosciuta
- Non committare mai le chiavi private nel repository Git
- Aggiungere `*.key` al file `.gitignore`

