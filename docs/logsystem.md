# Logging System Architecture

## Overview

This document describes the dual logging system implementation for the ft_transcendence application, featuring separate log streams for backend operations and web client activities with structured logging and ELK stack integration.

## Dual Logging Architecture

The application implements a **dual logging system** with separate log files:

- **Backend Log** (`logs/server.log`): Server operations, API calls, system events
- **Client Log** (`logs/client.log`): Frontend activities, user interactions, client-side events

This separation allows for better log analysis, debugging, and monitoring of different application layers.

## Backend Configuration

### Fastify Logger Setup

The backend implements Pino logger through Fastify with dual output targets for backend operations:

```typescript
const app = fastify({
  logger: {
    level: 'debug',
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: {
            colorize: true
          },
          level: 'debug'
        },
        {
          target: 'pino/file',
          options: {
            destination: './logs/server.log',
            mkdir: true
          },
          level: 'debug'
        }
      ]
    }
  },
  https: httpOption
});
```

**Features:**
- JSON structured output to `./logs/server.log`
- Colorized console output for development
- Native support for log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Automatic log file rotation and directory creation

### Web Client Logger

Separate logger instance for frontend log messages:

```javascript
import pino from 'pino';

const webClientLogger = pino(
  { level: 'debug' },
  pino.destination({ dest: './logs/client.log', mkdir: true })
);
```

**Purpose:**
- Dedicated logging for client-side events
- Writes to separate `client.log` file
- Maintains same log level support as backend logger

### HTTP Log Endpoint

Implementation in `routes/frontend.js`:

```javascript
fastify.post("/log", async (req, reply) => {
  const body = await req.body;

  const message = body?.message || "No message provided";
  const level = body?.level || "info";
  const context = body?.context || {};

  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (levels.includes(level) && typeof webClientLogger[level] === 'function') {
    webClientLogger[level]({ context }, message);  // writes to client.log
  } else {
    fastify.log.error({ context }, `Unknown log level: ${level} — ${message}`);
  }

  return reply.send({ status: "ok" });
});
```

**Capabilities:**
- Accepts structured log data from frontend clients
- Routes client logs to dedicated `client.log` file via `webClientLogger`
- Backend errors still logged to `server.log` via `fastify.log`
- Validates log levels before processing
- Preserves context metadata in log entries

## Frontend Implementation

### Core Logging Function

TypeScript implementation in `public/ts/utils/logger.ts`:

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

### Frontend Integration

Implementation in `main.ts`:

```typescript
import {
  clientLog,
  logTrace,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal
} from './utils/logger.js';

// Usage within application classes
class App {
  private showWelcomeMessage(): void {
    logInfo('Application initialized successfully');
    // ... rest of method
  }

  private handlePrimaryClick(): void {
    logDebug('Primary button clicked');
    // ... rest of method
  }

  private async testApi(): Promise<void> {
    try {
      logDebug('Starting API test call', { endpoint: '/api/test' });
      const response = await fetch('/api/test');
      logInfo('API test successful', { status: response.status, data });
    } catch (error) {
      logError('API test failed', { error: error instanceof Error ? error.message : error });
    }
  }
}
```

### Global Utility Functions

Browser console and runtime accessibility:

```typescript
(window as any).clientLog = clientLog;
(window as any).logTrace = logTrace;
(window as any).logDebug = logDebug;
(window as any).logInfo  = logInfo;
(window as any).logWarn  = logWarn;
(window as any).logError = logError;
(window as any).logFatal = logFatal;
```

## Usage Guidelines

### Frontend Logging

Import and usage pattern:

```typescript
import { logInfo, logError, logDebug } from './utils/logger.js';

// Application lifecycle logging
logInfo('Application initialized successfully');

// User interaction logging
logDebug('Primary button clicked');

// API call logging with context
logDebug('Starting API test call', { endpoint: '/api/test' });

try {
  const response = await fetch('/api/test');
  logInfo('API test successful', { status: response.status, data });
} catch (error) {
  logError('API test failed', { 
    error: error instanceof Error ? error.message : error 
  });
}

// Form submission with sanitized context
logInfo('Form submitted', { 
  name: data.name, 
  email: data.email,
  messageLength: data.message.length 
});
```

### Browser Console Access

Direct usage from DevTools:

```javascript
// Available globally on window object
logInfo('Debug message from console');
logError('Test error', { userId: 123 });
clientLog('warn', 'Custom warning', { context: 'additional data' });
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

## Project Structure

```
app/
├── public/ts/
│   ├── main.ts                 # Main application with integrated logging
│   └── utils/
│       └── logger.ts           # Frontend logging utilities
├── src/
│   ├── logger/
│   │   └── webClientLogger.js  # Dedicated client logger instance
│   └── routes/
│       └── frontend.js         # Backend logging endpoint
└── logs/
    ├── server.log                # Backend operations log
    └── client.log              # Frontend activities log
```

### File Organization

- **Frontend Logger**: `public/ts/utils/logger.ts` - Contains TypeScript logging functions
- **Main Application**: `public/ts/main.ts` - Imports and uses logging throughout the app
- **Web Client Logger**: `src/logger/webClientLogger.js` - Dedicated Pino instance for client logs
- **Backend Endpoint**: `src/routes/frontend.js` - Handles log reception from frontend
- **Log Outputs**: 
  - `logs/server.log` - Backend operations, server events, API calls
  - `logs/client.log` - Frontend activities, user interactions, client-side events

### Log Format

**Backend Log** (`logs/server.log`) - Server operations:

```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "server-01",
  "msg": "Health check requested",
  "clientIP": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

**Client Log** (`logs/client.log`) - Frontend activities:

```json
{
  "level": 30,
  "time": 1625140800000,
  "pid": 12345,
  "hostname": "server-01",
  "context": {
    "endpoint": "/api/test",
    "status": 200,
    "source": "frontend"
  },
  "msg": "API test successful"
}
```

### Kibana Query Examples

Common search patterns for dual log system:

**Backend Operations** (`server.log`):
```
# Server errors in backend
level:error AND filename:server.log

# API endpoint performance
msg:*"Health check"* AND filename:server.log

# Backend system events
hostname:"server-01" AND filename:server.log
```

**Frontend Activities** (`client.log`):
```
# Client-side errors
level:error AND filename:client.log

# User interactions
context.source:frontend AND filename:client.log

# API calls from frontend
msg:*"API test"* AND filename:client.log

# Performance monitoring
context.responseTime:>1000 AND filename:client.log
```

**Cross-System Analysis**:
```
# All errors across both systems
level:error

# Specific time range analysis
time:[now-1h TO now] AND (filename:server.log OR filename:client.log)
```

## Performance Considerations

- Asynchronous logging prevents UI blocking
- Log batching recommended for high-frequency events
- Context data should be serializable JSON
- File rotation configured to prevent disk space issues
- Network timeout handling for frontend log transmission

## ELK Stack Integration

### Data Flow Architecture

**Dual Stream Processing**:

```
Frontend (clientLog) → POST /log → webClientLogger → client.log → Logstash → Elasticsearch → Kibana
Backend (fastify.log) → Pino Transport → server.log → Logstash → Elasticsearch → Kibana
```

**Benefits of Dual Logging**:
- **Separation of Concerns**: Clear distinction between client and server events
- **Targeted Analysis**: Filter logs by source (frontend vs backend)
- **Performance Monitoring**: Compare client-side vs server-side performance
- **Debugging Efficiency**: Isolate issues to specific application layers
- **Scalable Architecture**: Independent log rotation and retention policies
