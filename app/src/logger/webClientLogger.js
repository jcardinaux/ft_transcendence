import fs from 'fs';
fs.mkdirSync('./logs', { recursive: true });
import pino from 'pino';

const webClientLogger = pino({
  level: 'debug',
  formatters: {
    level(label) {
      return { level: label };  // output consistent with Fastify JSON
    }
  },
  timestamp: pino.stdTimeFunctions.epochTime  // 'time' in ms
}, pino.destination({
  dest: './logs/client.log',
  mkdir: true,
  sync: true  // for immediate flush (useful for test/debug live log tailing)
}));

export default webClientLogger;
