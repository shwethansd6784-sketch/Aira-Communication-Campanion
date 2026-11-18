// vocabulary.js - Personal Vocabulary Notebook management
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/vocabulary
router.get('/', (req, res) => {
  try {
    const { search = '' } = req.query;
    let words;

    if (search.trim()) {
      words = db.prepare(`
        SELECT * FROM vocabulary
        WHERE word LIKE ? OR meaning LIKE ? OR example LIKE ?
        ORDER BY saved_at DESC
      `).all(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      words = db.prepare(`SELECT * FROM vocabulary ORDER BY saved_at DESC`).all();
    }

    return res.json({ words });
  } catch (error) {
    console.error('Fetch vocabulary error:', error);
    return res.status(500).json({ error: 'Failed to fetch vocabulary', details: error.message });
  }
});

// POST /api/vocabulary
router.post('/', (req, res) => {
  try {
    const { word, meaning, example = '', pronunciation = '' } = req.body;

    if (!word || !meaning) {
      return res.status(400).json({ error: 'Word and meaning are required fields' });
    }

    const cleanWord = word.trim().toLowerCase();

    const stmt = db.prepare(`
      INSERT INTO vocabulary (word, meaning, example, pronunciation)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(word) DO UPDATE SET
        meaning = excluded.meaning,
        example = excluded.example,
        pronunciation = excluded.pronunciation,
        saved_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(cleanWord, meaning.trim(), example.trim(), pronunciation.trim());
    return res.json({ message: 'Word saved successfully', id: result.lastInsertRowid });
  } catch (error) {
    console.error('Save vocabulary error:', error);
    return res.status(500).json({ error: 'Failed to save vocabulary word', details: error.message });
  }
});

// DELETE /api/vocabulary/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM vocabulary WHERE id = ?').run(id);
    return res.json({ message: 'Word removed from vocabulary notebook' });
  } catch (error) {
    console.error('Delete vocabulary error:', error);
    return res.status(500).json({ error: 'Failed to delete vocabulary word', details: error.message });
  }
});

// GET /api/vocabulary/random
router.get('/random', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const words = db.prepare(`
      SELECT * FROM vocabulary
      ORDER BY RANDOM()
      LIMIT ?
    `).all(limit);

    return res.json({ words });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get random words', details: error.message });
  }
});

module.exports = router;
