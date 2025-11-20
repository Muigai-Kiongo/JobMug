const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

dotenv.config();

// prefer MONGODB_URI (common name) but fall back to MONGO_URI for compatibility
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/job-board';

// Connection tuning
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = 45000;

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
  // Optionally disable buffering so queries fail fast instead of buffering
  // mongoose.set('bufferCommands', false);

  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
    socketTimeoutMS: DEFAULT_SOCKET_TIMEOUT_MS,
    // poolSize: 10, // optional tuning
  };

  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      console.info(`[mongo] attempt ${attempt} connecting to ${uri}`);
      await mongoose.connect(uri, connectOptions);
      console.info('[mongo] connected');
      return;
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

async function start() {
  try {
    await connectWithRetry(MONGO_URI, { maxAttempts: 6, baseDelay: 1000 });
  } catch (err) {
    console.error('Failed to connect to MongoDB after retries:', err && err.message ? err.message : err);
    // Exit with non-zero so orchestrator (Vercel dev server, Docker, systemd, etc.) can restart
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Optional: increase keepAlive/timeouts if behind load balancer or proxy
  // server.keepAliveTimeout = 65000;

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
        process.exit(1);
      }
      try {
        await mongoose.disconnect();
        console.info('[shutdown] mongoose disconnected');
        process.exit(0);
      } catch (e) {
        console.error('[shutdown] error during mongoose disconnect', e);
        process.exit(1);
      }
    });

    // force exit after timeout
    setTimeout(() => {
      console.warn('[shutdown] timed out - forcing exit');
      process.exit(1);
    }, 30_000).unref();
  }

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

  // Optional: log mongoose connection state changes for observability
  mongoose.connection.on('connected', () => console.info('[mongo] event connected'));
  mongoose.connection.on('reconnected', () => console.info('[mongo] event reconnected'));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] event disconnected'));
  mongoose.connection.on('close', () => console.warn('[mongo] event close'));
  mongoose.connection.on('error', (err) => console.error('[mongo] event error', err && err.message ? err.message : err));
}

start();