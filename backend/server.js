// server.js - Main Express server for Aira
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup to allow frontend requests
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Route handlers
const aiRoutes = require('./routes/ai');
const progressRoutes = require('./routes/progress');
const vocabularyRoutes = require('./routes/vocabulary');
const goalsRoutes = require('./routes/goals');

app.use('/api/ai', aiRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/goals', goalsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'ok',
    message: 'Aira backend server is running smoothly! 🌟',
    hasApiKey: hasKey,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌟 Aira – AI Female Communication Companion Backend`);
  console.log(`📡 Server listening on: http://localhost:${PORT}`);
  console.log(`🔑 Gemini API Key Status: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? '✅ Active' : '⚠️ Offline fallback active (no key yet)'}`);
  console.log(`======================================================\n`);
});

module.exports = app;
