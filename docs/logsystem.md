# Logging System

## Architecture

Dual-stream logging: backend operations and frontend activities to separate files with structured JSON output and ELK stack integration.

**Log Streams**:
- `logs/server.log`: API calls, server operations, system events
- `logs/client.log`: User interactions, frontend activities, client-side events

**Output Format**: JSON structured logging via Pino, compatible with Logstash processing.

## Backend Configuration

**Fastify Logger**: Pino dual-target transport for development console output and production file logging.

```javascript
const app = fastify({
  logger: {
    level: 'debug',
    transport: {
      targets: [
        { target: 'pino-pretty', options: { colorize: true }, level: 'debug' },
        { target: 'pino/file', options: { destination: './logs/server.log', mkdir: true, sync: true }, level: 'debug' }
      ]
    }
  },
  https: httpOption
});
```

**Web Client Logger**: Dedicated Pino instance for frontend log routing.

```javascript
import pino from 'pino';
const webClientLogger = pino({
  level: 'debug',
  formatters: { level(label) { return { level: label }; }},
  timestamp: pino.stdTimeFunctions.epochTime
}, pino.destination({ dest: './logs/client.log', mkdir: true, sync: true }));
```

**HTTP Endpoint**: Backend route `/log` receives frontend log data.

```javascript
fastify.post("/log", async (req, reply) => {
  const { message = "No message provided", level = "info", context = {} } = req.body;
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  
  if (levels.includes(level)) {
    webClientLogger[level]({ context }, message);
  } else {
    fastify.log.error({ context }, `Unknown log level: ${level} — ${message}`);
  }
  return reply.send({ status: "ok" });
});
```

## Frontend Implementation

**TypeScript Logger** (`public/ts/utils/logger.ts`): Type-safe HTTP logging to backend.

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export async function clientLog(level: LogLevel, message: string, context = {}): Promise<void> {
  try {
    await fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, context })
    });
  } catch (err) {
    console.error('Log sending failed:', err);
  }
}

// Shortcuts
export const logTrace = (msg: string, ctx = {}) => clientLog('trace', msg, ctx);
export const logDebug = (msg: string, ctx = {}) => clientLog('debug', msg, ctx);
export const logInfo  = (msg: string, ctx = {}) => clientLog('info', msg, ctx);
export const logWarn  = (msg: string, ctx = {}) => clientLog('warn', msg, ctx);
export const logError = (msg: string, ctx = {}) => clientLog('error', msg, ctx);
export const logFatal = (msg: string, ctx = {}) => clientLog('fatal', msg, ctx);
```

**Usage Examples**:

```typescript
// Application events
logInfo('Application initialized successfully');
logDebug('Primary button clicked');

// API monitoring
logDebug('Starting API test call', { endpoint: '/api/test' });
logInfo('API test successful', { status: response.status, data });
logError('API test failed', { error: error.message });

// Form submissions
logInfo('Form submitted', { name: data.name, email: data.email, messageLength: data.message.length });
```

**Browser Console Access**: Global functions available via `window.logInfo()`, `window.logError()`, etc.

## Deployment

**Development**: `npm run dev` with nodemon, TypeScript watch, Tailwind CSS build tools.

**Container**: Multi-stage Docker build, `node:20-slim` runtime, non-root `appuser`, production dependencies only.

```dockerfile
# Runtime stage - production dependencies include pino-pretty
FROM node:20-slim AS runtime
RUN adduser --disabled-password appuser
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production  # Installs pino-pretty (regular dependency)
RUN mkdir -p /app/logs && touch /app/logs/server.log /app/logs/client.log
RUN chown -R appuser:appuser /app && chmod 644 /app/logs/*.log
USER appuser
CMD ["/bin/bash", "-c", "/app/docker-utils/get-certs.sh && npm start"]
```

**Volume Mapping**: 
- App: `./app/logs:/app/logs` (persistent log files)
- Logstash: `./app/logs:/logs` (read-only access to same log files)

**Log Persistence**: Log files persist on host filesystem, accessible to both app container and Logstash container simultaneously.

## File Structure

```
app/
├── src/
│   ├── server.js               # Fastify server, Pino dual-target configuration
│   ├── logger/webClientLogger.js   # Dedicated client logger instance
│   └── routes/frontend.js      # POST /log endpoint
├── public/ts/
│   ├── main.ts                 # Application with logger integration
│   └── utils/logger.ts         # Frontend TypeScript logging utilities
└── logs/
    ├── server.log              # Backend operations, JSON structured
    └── client.log              # Frontend activities, JSON structured
```

**Log Format**: JSON structured via Pino, `epochTime` timestamps, context metadata.

```json
// server.log
{"level":30,"time":1625140800000,"pid":12345,"hostname":"server-01","msg":"Health check requested","clientIP":"192.168.1.100"}

// client.log  
{"level":30,"time":1625140800000,"pid":12345,"hostname":"server-01","context":{"endpoint":"/api/test","status":200},"msg":"API test successful"}
```

## ELK Integration

**Logstash Pipeline**: Reads `/logs/server.log` and `/logs/client.log` via volume mapping, processes JSON with fingerprinting for deduplication.

```properties
# elk/logstash/pipeline/logstash.conf
input {
  file {
    path => "/logs/server.log"
    codec => json { target => "log_data" }
    tags => ["fastify"]
    type => "backend"
    sincedb_path => "/dev/null"  # For development - reprocesses on restart
  }
  file {
    path => "/logs/client.log" 
    codec => json { target => "log_data" }
    tags => ["client"]
    type => "web-client"
    sincedb_path => "/dev/null"
  }
}

filter {
  # Extract fields from JSON log_data
  if [log_data] {
    mutate { 
      add_field => { 
        "level" => "%{[log_data][level]}", 
        "msg" => "%{[log_data][msg]}",
        "time" => "%{[log_data][time]}"
      }
    }
  }
  
  # Add service identifier
  if [type] == "web-client" {
    mutate { add_field => { "service" => "ft_client" }}
  } else {
    mutate { add_field => { "service" => "ft_backend" }}
  }
  
  # Fingerprint for deduplication
  fingerprint {
    source => ["path", "host", "msg", "time"]
    target => "[@metadata][fingerprint]"
    method => "SHA256"
  }
}

output {
  elasticsearch {
    hosts => ["https://elasticsearch:9200"]
    index => "fttranscendence-logs-%{+YYYY.MM.dd}"
    document_id => "%{[@metadata][fingerprint]}"  # Prevents duplicates
    user => "${ES_USER}"
    password => "${ES_PASS}"
    ssl => true
    cacert => "/shared-certs/ca/ca-cert.pem"
  }
}
```

**Kibana Queries**:

```
# Backend errors
level:error AND service:ft_backend

# Client interactions  
service:ft_client AND msg:*"API test"*

# Cross-system errors
level:error AND (service:ft_backend OR service:ft_client)
```

**Data Flow**: 
- Frontend → HTTP /log → webClientLogger → client.log → Logstash → Elasticsearch → Kibana
- Backend → Fastify logger → server.log → Logstash → Elasticsearch → Kibana
