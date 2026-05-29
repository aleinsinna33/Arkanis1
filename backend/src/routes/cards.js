const router = require('express').Router()
const pool   = require('../models/db')
const auth   = require('../middleware/auth')

// GET /api/cards — tutte le carte
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cards ORDER BY id')
    res.json({ cards: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// GET /api/cards/mine — carte dell'utente loggato
router.get('/mine', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, uc.acquired_at
       FROM cards c
       JOIN user_cards uc ON c.id = uc.card_id
       WHERE uc.user_id = $1
       ORDER BY c.rarity DESC, c.name`,
      [req.user.id]
    )
    res.json({ cards: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

module.exports = router
