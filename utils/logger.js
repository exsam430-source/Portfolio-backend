/* Tiny dependency-free colored logger (works in every terminal + CI). */
const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const paint = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

const logger = {
  info: (msg) => console.log(`${paint('90', stamp())} ${paint('36', 'INFO')}  ${msg}`),
  success: (msg) => console.log(`${paint('90', stamp())} ${paint('32', 'OK')}    ${msg}`),
  warn: (msg) => console.warn(`${paint('90', stamp())} ${paint('33', 'WARN')}  ${msg}`),
  error: (msg) => console.error(`${paint('90', stamp())} ${paint('31', 'ERROR')} ${msg}`),
};

module.exports = logger;
