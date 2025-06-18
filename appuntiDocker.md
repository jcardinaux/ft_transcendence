ricordarsi che all'avvio del docker di back end vanno generati i certificati per il server https
ovviamente ci deve essere installato openssl

```
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 -subj "/C=IT/ST=Lombardy/L=Milan/O=ft_transcendence/CN=localhost"
```

