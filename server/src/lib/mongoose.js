// server/lib/mongoose.js
const mongoose = require('mongoose');

const CACHE_KEY = '__mongoose_connection__';
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000;

if (!global[CACHE_KEY]) global[CACHE_KEY] = { conn: null, promise: null };

const defaults = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
};

async function connectToDatabase(mongoUri, opts = {}) {
  if (!mongoUri) throw new Error('MONGODB_URI must be provided');

  if (global[CACHE_KEY].conn && global[CACHE_KEY].conn.connection?.readyState === 1) {
    return global[CACHE_KEY].conn;
  }

  if (!global[CACHE_KEY].promise) {
    const connectOpts = Object.assign({}, defaults, opts);
    global[CACHE_KEY].promise = (async () => {
      const maxAttempts = opts.maxAttempts || 4;
      const baseDelay = opts.baseDelay || 500;
      let attempt = 0;
      let lastErr = null;
      while (attempt < maxAttempts) {
        attempt += 1;
        try {
          await mongoose.connect(mongoUri, connectOpts);
          global[CACHE_KEY].conn = mongoose;
          return mongoose;
        } catch (err) {
          lastErr = err;
          if (attempt >= maxAttempts) break;
          const wait = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      throw lastErr;
    })();
  }

  global[CACHE_KEY].conn = await global[CACHE_KEY].promise;
  return global[CACHE_KEY].conn;
}

module.exports = { connectToDatabase };