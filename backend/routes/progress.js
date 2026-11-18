// progress.js - Persistent progress tracking & session analytics
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// POST /api/progress/session/start
router.post('/session/start', (req, res) => {
  try {
    const { situation = 'everyday', mode = 'practice', difficulty = 'intermediate' } = req.body;
    const sessionId = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO sessions (id, situation, mode, difficulty)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(sessionId, situation, mode, difficulty);
    return res.json({ sessionId, message: 'Session started successfully' });
  } catch (error) {
    console.error('Session start error:', error);
    return res.status(500).json({ error: 'Failed to start session', details: error.message });
  }
});

// POST /api/progress/session/end
router.post('/session/end', (req, res) => {
  try {
    const { sessionId, duration = 0, messageCount = 0, scores, feedbackSummary = '' } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const grammar = Number(scores?.grammar) || 75;
    const fluency = Number(scores?.fluency) || 75;
    const relevance = Number(scores?.relevance) || 75;
    const vocabulary = Number(scores?.vocabulary) || 75;
    const overall = scores?.overall !== undefined ? Number(scores.overall) : Math.round((grammar + fluency + relevance + vocabulary) / 4);

    const stmt = db.prepare(`
      UPDATE sessions
      SET ended_at = CURRENT_TIMESTAMP,
          duration_seconds = ?,
          message_count = ?,
          grammar_score = ?,
          fluency_score = ?,
          relevance_score = ?,
          vocabulary_score = ?,
          overall_score = ?,
          feedback_summary = ?
      WHERE id = ?
    `);

    stmt.run(
      Math.max(0, duration),
      Math.max(0, messageCount),
      grammar,
      fluency,
      relevance,
      vocabulary,
      overall,
      feedbackSummary,
      sessionId
    );

    // Update aggregated daily stats
    const today = new Date().toISOString().split('T')[0];
    const session = db.prepare('SELECT situation FROM sessions WHERE id = ?').get(sessionId);

    if (session) {
      const existingStat = db.prepare(
        'SELECT id, sessions_count, total_minutes, avg_score FROM daily_stats WHERE date = ? AND situation = ?'
      ).get(today, session.situation);

      const sessionMins = Math.max(1, Math.round(duration / 60));

      if (existingStat) {
        const newCount = existingStat.sessions_count + 1;
        const newMins = existingStat.total_minutes + sessionMins;
        const newAvg = Math.round(((existingStat.avg_score * existingStat.sessions_count) + overall) / newCount);

        db.prepare(`
          UPDATE daily_stats
          SET sessions_count = ?, total_minutes = ?, avg_score = ?
          WHERE id = ?
        `).run(newCount, newMins, newAvg, existingStat.id);
      } else {
        db.prepare(`
          INSERT INTO daily_stats (date, situation, sessions_count, total_minutes, avg_score)
          VALUES (?, ?, 1, ?, ?)
        `).run(today, session.situation, sessionMins, overall);
      }
    }

    return res.json({ message: 'Session ended successfully', overallScore: overall });
  } catch (error) {
    console.error('Session end error:', error);
    return res.status(500).json({ error: 'Failed to end session', details: error.message });
  }
});

// POST /api/progress/message
router.post('/message', (req, res) => {
  try {
    const { sessionId, speaker, text, evaluation } = req.body;

    if (!sessionId || !speaker || !text) {
      return res.status(400).json({ error: 'Missing required message parameters' });
    }

    const stmt = db.prepare(`
      INSERT INTO messages (session_id, speaker, text, evaluation)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(sessionId, speaker, text, evaluation ? JSON.stringify(evaluation) : null);
    return res.json({ message: 'Message logged successfully' });
  } catch (error) {
    console.error('Log message error:', error);
    return res.status(500).json({ error: 'Failed to log message', details: error.message });
  }
});

// GET /api/progress/dashboard
router.get('/dashboard', (req, res) => {
  try {
    // Overall aggregated metrics
    const overallStats = db.prepare(`
      SELECT
        COUNT(*) as totalSessions,
        COALESCE(SUM(duration_seconds), 0) as totalSeconds,
        COALESCE(AVG(overall_score), 0) as avgOverallScore,
        COALESCE(AVG(grammar_score), 0) as avgGrammar,
        COALESCE(AVG(fluency_score), 0) as avgFluency,
        COALESCE(AVG(relevance_score), 0) as avgRelevance,
        COALESCE(AVG(vocabulary_score), 0) as avgVocabulary
      FROM sessions
      WHERE ended_at IS NOT NULL
    `).get();

    // Per-situation stats across all 5 situations
    const situationStats = db.prepare(`
      SELECT
        situation,
        COUNT(*) as sessions,
        AVG(overall_score) as avgScore,
        SUM(duration_seconds) as totalSeconds,
        MAX(overall_score) as bestScore
      FROM sessions
      WHERE ended_at IS NOT NULL
      GROUP BY situation
    `).all();

    // Weekly trend (last 7 days)
    const weeklyProgress = db.prepare(`
      SELECT
        date(started_at) as date,
        COUNT(*) as sessions,
        ROUND(AVG(overall_score), 1) as avgScore,
        ROUND(SUM(duration_seconds) / 60.0, 1) as minutes
      FROM sessions
      WHERE ended_at IS NOT NULL
        AND started_at >= datetime('now', '-7 days')
      GROUP BY date(started_at)
      ORDER BY date ASC
    `).all();

    // Monthly trend (last 30 days)
    const monthlyProgress = db.prepare(`
      SELECT
        date(started_at) as date,
        COUNT(*) as sessions,
        ROUND(AVG(overall_score), 1) as avgScore,
        ROUND(SUM(duration_seconds) / 60.0, 1) as minutes
      FROM sessions
      WHERE ended_at IS NOT NULL
        AND started_at >= datetime('now', '-30 days')
      GROUP BY date(started_at)
      ORDER BY date ASC
    `).all();

    // Recent 15 sessions
    const recentSessions = db.prepare(`
      SELECT id, situation, mode, difficulty,
             started_at, duration_seconds, overall_score, feedback_summary
      FROM sessions
      WHERE ended_at IS NOT NULL
      ORDER BY started_at DESC
      LIMIT 15
    `).all();

    // Vocabulary count
    const vocabCount = db.prepare('SELECT COUNT(*) as count FROM vocabulary').get();

    return res.json({
      overall: overallStats,
      bySituation: situationStats,
      weeklyProgress,
      monthlyProgress,
      recentSessions,
      vocabCount: vocabCount.count
    });
  } catch (error) {
    console.error('Dashboard retrieval error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard', details: error.message });
  }
});

// GET /api/progress/sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT * FROM sessions
      WHERE ended_at IS NOT NULL
      ORDER BY started_at DESC
      LIMIT 50
    `).all();

    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

// GET /api/progress/session/:id/messages
router.get('/session/:id/messages', (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `).all(req.params.id);

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// DELETE /api/progress/history
router.delete('/history', (req, res) => {
  try {
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM daily_stats').run();
    return res.json({ message: 'All practice history reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear history', details: error.message });
  }
});

module.exports = router;
