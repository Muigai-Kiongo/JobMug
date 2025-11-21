const serverless = require('serverless-http');
const app = require('../src/app'); // ensure path correct: server/src/app.js
const { connectToDatabase } = require('../lib/mongoose'); // optional helper if you have it

let handler = null;
let isConnected = false;

module.exports = async (req, res) => {
  // quick preflight/CORS short-circuit if you need it (optional)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  // Ensure DB connection if you use MongoDB (best-effort; remove if not needed)
  if (!isConnected) {
    try {
      const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (uri && connectToDatabase) {
        await connectToDatabase(uri, { serverSelectionTimeoutMS: 10000, maxAttempts: 4, baseDelay: 500 });
      }
      isConnected = true;
      handler = serverless(app);
    } catch (err) {
      console.error('DB connection failed in serverless wrapper:', err && err.message ? err.message : err);
      res.statusCode = 503;
      return res.end(JSON.stringify({ error: 'DB connection failed', detail: err?.message || String(err) }));
    }
  }

  // Delegate to express app wrapped by serverless-http
  return handler(req, res);
};