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
          options: { destination: './logs/app.log', mkdir: true }, 
          level: 'debug' 
        }
      ]
    }
  },
  https: httpOption
});
```

**Features:**
- JSON structured output to `./logs/app.log`
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
│   └── routes/
│       └── frontend.js         # Backend logging endpoint
└── logs/
    └── app.log             # Structured log output
```
c
### File Organization

- **Frontend Logger**: `public/ts/utils/logger.ts` - Contains TypeScript logging functions
- **Main Application**: `public/ts/main.ts` - Imports and uses logging throughout the app
- **Backend Endpoint**: `src/routes/frontend.js` - Handles log reception from frontend
- **Log Output**: `app.log` - JSON structured logs from both frontend and backend

### Log Format

Standard JSON structure in `app.log`:

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

## ELK Stack Integration

### Data Flow Architecture

```
Frontend (clientLog) → POST /log → Fastify/Pino → app.log → Logstash → Elasticsearch → Kibana
```
