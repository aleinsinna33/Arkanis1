const router = require('express').Router()
const pool   = require('../models/db')

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, elo, wins, losses, rank, title
       FROM leaderboard
       LIMIT 100`
    )
    res.json({ players: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

module.exports = router
