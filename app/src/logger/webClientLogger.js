import pino from 'pino';

const webClientLogger = pino(
  { level: 'debug' },
  pino.destination({ dest: './logs/client.log', mkdir: true })
);

export default webClientLogger;
