const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const jobsRouter = require('./routes/jobs');
const authRouter = require('./routes/auth');
const uploadsRouter = require('./routes/uploads');
const profileRouter = require('./routes/profile');
const notificationsRouter = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Job Board API', uptime: process.uptime() });
});

// Auth routes
app.use('/api/auth', authRouter);

// Jobs routes
app.use('/api/jobs', jobsRouter);

// Uploads
app.use('/api/uploads', uploadsRouter);

// Profile
app.use('/api/profile', profileRouter);

// Notifications
app.use('/api/notifications', notificationsRouter);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

module.exports = app;