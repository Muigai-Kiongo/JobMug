const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// ❗ REMOVE express-rate-limit — it breaks in serverless
// const rateLimit = require('express-rate-limit');

// Your routes
const jobsRouter = require('./routes/jobs');
const authRouter = require('./routes/auth');
const uploadsRouter = require('./routes/uploads');
const profileRouter = require('./routes/profile');
const notificationsRouter = require('./routes/notifications');

const app = express();

// Security + compression
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Required for serverless (Vercel sets real IP in headers)
app.set('trust proxy', 1);

// --- CORS ---
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || '';
const corsOptions = FRONTEND_ORIGIN
  ? { origin: FRONTEND_ORIGIN.split(',').map(s => s.trim()), credentials: true }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));

// ❗ REMOVE rate limiter — serverless resets on every call
// app.use(rateLimit(...));

// Body parsing
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- IMPORTANT FOR VERCEL ---
// ❗ DO NOT serve or store uploads locally
app.get('/uploads/*', (req, res) => {
  res.status(404).json({
    error: 'Local uploads not available on Vercel. Use S3, Cloudinary, or Supabase Storage.'
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/uploads', uploadsRouter);   // should upload to S3/Cloudinary
app.use('/api/profile', profileRouter);
app.use('/api/notifications', notificationsRouter);

// API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: { message: 'API route not found' } });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err?.stack || err);
  const status = err.status || 500;

  const response = {
    error: {
      message: err.message || 'Internal Server Error'
    }
  };

  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
});

module.exports = app;
