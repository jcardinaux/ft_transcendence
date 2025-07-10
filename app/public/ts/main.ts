import { initRouter } from './Router.js';
import { logInfo } from './utils/logger.js';

window.addEventListener('DOMContentLoaded', () => {
  logInfo('SPA started')
  initRouter();
});