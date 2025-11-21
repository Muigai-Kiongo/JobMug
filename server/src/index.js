const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

dotenv.config();

// prefer MONGODB_URI (common name) but fall back to MONGO_URI for compatibility
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/job-board';

// Connection tuning
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000;

/**
 * Connect to MongoDB with retries and exponential backoff.
 * Throws if all attempts fail.
 */
async function connectWithRetry(uri, { maxAttempts = 5, baseDelay = 1000 } = {}) {
  if (!uri) {
    throw new Error('MongoDB connection URI is not provided');
  }

  // Configure mongoose global settings
  mongoose.set('strictQuery', false);

  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
    socketTimeoutMS: DEFAULT_SOCKET_TIMEOUT_MS,
    // poolSize: Number(process.env.MONGO_POOL_SIZE) || 10, // optional tuning
  };

  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      console.info(`[mongo] attempt ${attempt} connecting to ${uri}`);
      await mongoose.connect(uri, connectOptions);
      console.info('[mongo] connected');
      return mongoose;
    } catch (err) {
      lastErr = err;
      console.error(`[mongo] connection attempt ${attempt} failed: ${err.message || err}`);
      if (attempt >= maxAttempts) break;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.info(`[mongo] retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // All attempts failed
  throw lastErr;
}

/**
 * Start the HTTP server. Returns the server instance after listening.
 * If this module is required (not run directly), callers can call start() themselves.
 */
async function start({ port = PORT, mongoUri = MONGO_URI } = {}) {
  try {
    await connectWithRetry(mongoUri, { maxAttempts: 6, baseDelay: 1000 });
  } catch (err) {
    console.error('Failed to connect to MongoDB after retries:', err && err.message ? err.message : err);
    // If this file was run directly, exit so orchestrator can restart.
    if (require.main === module) {
      process.exit(1);
    }
    // Otherwise throw so caller (serverless wrapper) can handle the error.
    throw err;
  }

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  // If running on a long-running host you may want to tweak keepAliveTimeout:
  // server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS) || 65000;

  // Graceful shutdown helper
  let closing = false;
  async function gracefulShutdown(signal) {
    if (closing) return;
    closing = true;
    console.info(`[shutdown] ${signal} received - closing server`);
    // stop accepting new connections
    server.close(async (err) => {
      if (err) {
        console.error('[shutdown] error closing server:', err);
        // If run directly, exit non-zero
        if (require.main === module) process.exit(1);
        return;
      }
      try {
        await mongoose.disconnect();
        console.info('[shutdown] mongoose disconnected');
        if (require.main === module) process.exit(0);
      } catch (e) {
        console.error('[shutdown] error during mongoose disconnect', e);
        if (require.main === module) process.exit(1);
      }
    });

    // force exit after timeout
    setTimeout(() => {
      console.warn('[shutdown] timed out - forcing exit');
      if (require.main === module) process.exit(1);
    }, 30_000).unref();
  }

  // Only register process listeners when running as main module; if required by
  // another module (e.g. serverless wrapper) that wrapper should manage lifecycle.
  if (require.main === module) {
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Catch unhandled rejections / uncaught exceptions and shutdown
    process.on('unhandledRejection', (reason) => {
      console.error('[process] unhandledRejection:', reason);
      // attempt graceful shutdown
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (err) => {
      console.error('[process] uncaughtException:', err);
      // attempt graceful shutdown
      gracefulShutdown('uncaughtException');
    });
  }

  // Mongoose connection event logging (always safe to attach)
  mongoose.connection.on('connected', () => console.info('[mongo] event connected'));
  mongoose.connection.on('reconnected', () => console.info('[mongo] event reconnected'));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] event disconnected'));
  mongoose.connection.on('close', () => console.warn('[mongo] event close'));
  mongoose.connection.on('error', (err) => console.error('[mongo] event error', err && err.message ? err.message : err));

  return server;
}

// If run directly, start the server. If required, do nothing (caller can call start()).
if (require.main === module) {
  // start() will call process.exit(1) on failure.
  start().catch((err) => {
    // Defensive fallback: log and exit if something unexpected bubbles up
    console.error('[bootstrap] fatal error starting server:', err && err.message ? err.message : err);
    process.exit(1);
  });
}

module.exports = {
  start,
  connectWithRetry
};