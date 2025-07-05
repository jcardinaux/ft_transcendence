# Logging System Arch

## Overview

This document describes the centralized logging system implementation for the ft_transcendence application, featuring structured logging across frontend and backend components with ELK stack integration.

## Backend Configuration

### Fastify Logger Setup

The backend implements Pino logger through Fastify with dual output targets:

```typescript
const app = fastify({
  logger: {
    level: 'debug',
    transport: {
      targets: [
        { 
          target: 'pino-pretty', 
          options: { colorize: true }, 
          level: 'debug' 
        },
        { 
          target: 'pino/file', 
          options: { destination: './logs/backend.log', mkdir: true }, 
          level: 'debug' 
        }
      ]
    }
  },
  https: httpOption
});
```

**Features:**
- JSON structured output to `./logs/backend.log`
- Colorized console output for development
- Native support for log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Automatic log file rotation and directory creation

### HTTP Log Endpoint

Implementation in `frontend.js` routes:

```typescript
fastify.post("/log", async (req, reply) => {
  const { 
    level = 'info', 
    message = "No message provided", 
    context = {} 
  } = await req.body;

  const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  
  if (validLevels.includes(level) && typeof fastify.log[level] === 'function') {
    fastify.log[level]({ context }, message);
  } else {
    fastify.log.error({ context }, `Invalid log level: ${level} — ${message}`);
  }

  return reply.send({ status: "ok" });
});
```

**Capabilities:**
- Accepts structured log data from any HTTP client
- Validates log levels before processing
- Preserves context metadata in log entries
- Returns standardized response format

## Frontend Implementation

### Core Logging Function

TypeScript implementation in `main.ts`:

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export async function clientLog(
  level: LogLevel, 
  message: string, 
  context: Record<string, any> = {}
): Promise<void> {
  try {
    await fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, context })
    });
  } catch (error) {
    console.error('Failed to send log to server:', error);
  }
}
```

### Global Utility Functions

Browser console accessibility:

```typescript
(window as any).logTrace = (msg: string, ctx = {}) => clientLog('trace', msg, ctx);
(window as any).logDebug = (msg: string, ctx = {}) => clientLog('debug', msg, ctx);
(window as any).logInfo  = (msg: string, ctx = {}) => clientLog('info', msg, ctx);
(window as any).logWarn  = (msg: string, ctx = {}) => clientLog('warn', msg, ctx);
(window as any).logError = (msg: string, ctx = {}) => clientLog('error', msg, ctx);
(window as any).logFatal = (msg: string, ctx = {}) => clientLog('fatal', msg, ctx);
```

## Usage Guidelines

### Frontend Logging

Standard implementation pattern:

```typescript
// API call logging
logDebug('Initiating API request', { 
  endpoint: '/api/users',
  method: 'GET',
  timestamp: Date.now()
});

try {
  const response = await fetch('/api/users');
  logInfo('API request successful', { 
    status: response.status,
    responseTime: Date.now() - startTime
  });
  
  const data = await response.json();
  return data;
} catch (error) {
  logError('API request failed', { 
    error: error.message,
    stack: error.stack,
    endpoint: '/api/users'
  });
  throw error;
}
```

### Log Level Guidelines

| Level   | Use Case                              | Examples                                    |
|---------|---------------------------------------|---------------------------------------------|
| `trace` | Detailed execution flow              | Function entry/exit, loop iterations       |
| `debug` | Development information              | Variable states, conditional branches      |
| `info`  | General application events           | User actions, successful operations        |
| `warn`  | Recoverable issues                   | Deprecated API usage, fallback triggers    |
| `error` | Application errors                   | Failed requests, validation errors         |
| `fatal` | Critical system failures             | Database corruption, missing dependencies  |

### Backend Logging

Direct logger usage:

```typescript
// Request-scoped logging
app.get('/api/health', async (request, reply) => {
  request.log.info('Health check requested', { 
    clientIP: request.ip,
    userAgent: request.headers['user-agent']
  });
  
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Global error handling
app.setErrorHandler((error, request, reply) => {
  request.log.error({ 
    err: error,
    url: request.url,
    method: request.method
  }, 'Unhandled request error');
  
  reply.status(500).send({ 
    error: 'Internal server error',
    requestId: request.id
  });
});
```

## ELK Stack Integration

### Data Flow Architecture

```
Frontend (clientLog) → POST /log → Fastify/Pino → backend.log → Logstash → Elasticsearch → Kibana
```

### Log Format

Standard JSON structure in `backend.log`:

```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "server-01",
  "context": {
    "userId": "user123",
    "sessionId": "sess456",
    "source": "frontend"
  },
  "msg": "User authentication successful"
}
```

### Kibana Query Examples

Common search patterns:

```
# Error logs from last hour
level:error AND time:[now-1h TO now]

# Frontend-specific logs
context.source:frontend

# User-specific activity
context.userId:"user123"

# API endpoint monitoring
msg:*"/api/users"* AND level:>=warn

# Performance monitoring
context.responseTime:>1000
```

## Performance Considerations

- Asynchronous logging prevents UI blocking
- Log batching recommended for high-frequency events
- Context data should be serializable JSON
- File rotation configured to prevent disk space issues
- Network timeout handling for frontend log transmission
