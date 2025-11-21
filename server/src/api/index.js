// api/index.js – Vercel serverless handler
const serverless = require('serverless-http');
const app = require('../app'); // your express app WITHOUT app.listen()
const { connectToDatabase } = require('../lib/mongoose');

// Make sure DB connection happens only once in serverless environment
let isConnected = false;
let handler = serverless(app);

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  if (!isConnected) {
    try {
      await connectToDatabase(process.env.MONGO_URI);
      isConnected = true;
      console.log("MongoDB connected (serverless)");
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
      return res.status(503).json({ error: "DB connection failed" });
    }
  }

  return handler(req, res);
};
