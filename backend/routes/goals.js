// goals.js - Daily practice goals management
const express = require('express');
const router = express.Router();
const db = require('../db/database');

const getTodayDate = () => new Date().toISOString().split('T')[0];

// GET /api/goals
router.get('/', (req, res) => {
  try {
    const today = getTodayDate();
    let goals = db.prepare(`SELECT * FROM goals WHERE date = ?`).all(today);

    // If no goals set for today, provide default starter goals
    if (goals.length === 0) {
      const defaults = [
        { type: 'practice_minutes', target: 10 },
        { type: 'save_words', target: 3 },
        { type: 'complete_sessions', target: 1 }
      ];

      const insertStmt = db.prepare(`
        INSERT INTO goals (type, target, current, date, completed)
        VALUES (?, ?, 0, ?, 0)
      `);

      for (const d of defaults) {
        insertStmt.run(d.type, d.target, today);
      }

      goals = db.prepare(`SELECT * FROM goals WHERE date = ?`).all(today);
    }

    return res.json({ goals });
  } catch (error) {
    console.error('Fetch goals error:', error);
    return res.status(500).json({ error: 'Failed to fetch goals', details: error.message });
  }
});

// POST /api/goals
router.post('/', (req, res) => {
  try {
    const { type, target } = req.body;
    const today = getTodayDate();

    if (!type || !target || Number(target) <= 0) {
      return res.status(400).json({ error: 'Valid goal type and target are required' });
    }

    const existing = db.prepare('SELECT id FROM goals WHERE type = ? AND date = ?').get(type, today);

    if (existing) {
      db.prepare('UPDATE goals SET target = ? WHERE id = ?').run(Number(target), existing.id);
    } else {
      db.prepare(`
        INSERT INTO goals (type, target, current, date, completed)
        VALUES (?, ?, 0, ?, 0)
      `).run(type, Number(target), today);
    }

    return res.json({ message: 'Goal updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save goal', details: error.message });
  }
});

// PATCH /api/goals/:id/progress
router.patch('/:id/progress', (req, res) => {
  try {
    const { increment = 1 } = req.body;
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const newCurrent = Math.min(goal.current + Number(increment), goal.target);
    const completed = newCurrent >= goal.target ? 1 : 0;

    db.prepare(`
      UPDATE goals SET current = ?, completed = ? WHERE id = ?
    `).run(newCurrent, completed, req.params.id);

    return res.json({ current: newCurrent, completed: Boolean(completed) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update goal progress', details: error.message });
  }
});

module.exports = router;
