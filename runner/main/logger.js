// runner/main/logger.js
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}

export function createLogger(prefix, color = COLORS.cyan) {
  const tag = `${color}[${prefix}]${COLORS.reset}`;
  return {
    info: (...args) => console.log(`${COLORS.dim}${timestamp()}${COLORS.reset} ${tag}`, ...args),
    warn: (...args) => console.warn(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.yellow}[${prefix}]${COLORS.reset}`, ...args),
    error: (...args) => console.error(`${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.red}[${prefix}]${COLORS.reset}`, ...args),
    debug: (...args) => {
      if (process.env.DEBUG) console.log(`${COLORS.dim}${timestamp()} [${prefix}]${COLORS.reset}`, ...args);
    },
  };
}
