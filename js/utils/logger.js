import { CONFIG } from '../config/constants.js';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
const current = LEVELS[CONFIG.LOG_LEVEL] ?? LEVELS.info;

const emit = (level, ...args) => {
  if (LEVELS[level] < current) return;
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  (console[level] || console.log)(prefix, ...args);
};

export const logger = {
  debug: (...a) => emit('debug', ...a),
  info:  (...a) => emit('info',  ...a),
  warn:  (...a) => emit('warn',  ...a),
  error: (...a) => emit('error', ...a),
};