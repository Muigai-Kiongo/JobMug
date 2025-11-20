// Vercel serverless wrapper for your Express app (CommonJS).
// Ensures DB is connected before forwarding requests to the Express app using serverless-http.

const serverless = require('serverless-http');
const app = require('../app'); // adjust path if your app.js is elsewhere
const { connectToDatabase } = require('../lib/mongoose');

let isConnected = false;
let handler = null;

module.exports = async (req, res) => {
  // Quickly handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  if (!isConnected) {
    try {
      await connectToDatabase(process.env.MONGODB_URI || process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxAttempts: 4,
        baseDelay: 500
      });
      isConnected = true;
      handler = serverless(app);
    } catch (err) {
      console.error('DB connection failed in wrapper:', err && err.message ? err.message : err);
      res.statusCode = 503;
      return res.end(JSON.stringify({ error: 'DB connection failed', detail: err && err.message ? err.message : String(err) }));
    }
  }

  return handler(req, res);
};