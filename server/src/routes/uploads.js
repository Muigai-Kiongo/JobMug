const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads/resumes exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

router.post('/resume', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  // return accessible URL path
  const url = `/uploads/resumes/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;