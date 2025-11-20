const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const jobsRouter = require('./routes/jobs');
const authRouter = require('./routes/auth');
const uploadsRouter = require('./routes/uploads');
const profileRouter = require('./routes/profile');
const notificationsRouter = require('./routes/notifications');

const app = express();

// Basic hardening & performance
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());

// Logging - use dev only in non-production to avoid leaking secrets in logs
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Trust proxy if running behind a proxy/load-balancer (Heroku, Vercel, Render, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS - restrict to configured frontends if provided
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGINS || '';
const corsOptions = FRONTEND_ORIGIN
  ? { origin: FRONTEND_ORIGIN.split(',').map(s => s.trim()), credentials: true }
  : { origin: true, credentials: true }; // fallback: allow all (useful for development)
app.use(cors(corsOptions));

// Rate limiter - basic protection against brute force / abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX) || 120, // max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '100kb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '100kb' }));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve uploaded files only if explicitly enabled and uploads directory exists.
// NOTE: For serverless hosts (Vercel) you should not rely on local filesystem for uploads.
// Prefer S3 or another object store in production.
const SERVE_UPLOADS = process.env.SERVE_UPLOADS === 'true' || process.env.NODE_ENV !== 'production';
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

if (SERVE_UPLOADS) {
  app.use('/uploads', express.static(UPLOADS_DIR, {
    extensions: ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'],
    maxAge: '1d',
    index: false
  }));
} else {
  // If not serving local uploads, surface a helpful message for developers
  app.get('/uploads/*', (req, res) => {
    res.status(404).json({ error: 'Uploads are not served from this environment. Use an object store (S3) in production.' });
  });
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/notifications', notificationsRouter);

// Catch-all 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: { message: 'API route not found' } });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err.status || err.statusCode || 500;
  const body = {
    error: {
      message: err.message || 'Internal Server Error'
    }
  };
  // Don't leak stack traces in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.error.stack = err.stack;
  }
  res.status(status).json(body);
});

module.exports = app;