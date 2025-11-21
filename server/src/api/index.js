// server/api/index.js
// Vercel serverless wrapper for the Express app (server/src/app.js).
// Exports a handler that connects to DB (if configured) and delegates to serverless-http-wrapped express app.

const serverless = require('serverless-http');
const app = require('../src/app'); // path: server/src/app.js
let handler = null;
let initialized = false;

async function init() {
  // If you need DB connection caching, require the helper here
  // const { connectToDatabase } = require('../lib/mongoose');
  // const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  // if (uri && connectToDatabase) await connectToDatabase(uri, { maxAttempts: 4, baseDelay: 500 });

  handler = serverless(app);
  initialized = true;
}

module.exports = async (req, res) => {
  try {
    if (!initialized) {
      await init();
    }
    return handler(req, res);
  } catch (err) {
    console.error('Serverless wrapper initialization error:', err && err.message ? err.message : err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Server initialization failed', detail: err?.message }));
  }
};