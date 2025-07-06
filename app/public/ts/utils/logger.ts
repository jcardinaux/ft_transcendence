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



/*
Usage: 

import { logInfo, logError } from './utils/logger';

logInfo("User clicked on: 'start'");
logError("Error in dashboard", { userId: 42 });

 */