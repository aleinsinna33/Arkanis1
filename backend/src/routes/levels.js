const router = require('express').Router()
const pool   = require('../models/db')
const auth   = require('../middleware/auth')
const { levelFromXp, rankForLevel, totalXpForLevel, xpForLevel, RANKS, matchmakingTier } = require('../models/levels')

// GET /api/levels/me — info livello dell'utente corrente
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT xp, level, elo, username FROM users WHERE id=$1', [req.user.id]
    )
    const user  = result.rows[0]
    const level = user.level || 1
    const xp    = user.xp    || 0
    const rank  = rankForLevel(level)
    const xpThisLevel  = totalXpForLevel(level)
    const xpNextLevel  = totalXpForLevel(level + 1)
    const xpProgress   = xp - xpThisLevel
    const xpNeeded     = xpNextLevel - xpThisLevel
    const pct = Math.min(100, Math.round((xpProgress / xpNeeded) * 100))

    res.json({
      level, xp, rank,
      xpProgress, xpNeeded, pct,
      xpThisLevel, xpNextLevel,
      tier: matchmakingTier(level),
      nextRank: RANKS.find(r => r.minLevel > level) || null
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// GET /api/levels/ranks — lista tutti i rank
router.get('/ranks', (req, res) => {
  res.json({
    ranks: RANKS.map(r => ({
      ...r,
      xpRequired: totalXpForLevel(r.minLevel)
    }))
  })
})

// GET /api/levels/leaderboard — classifica per livello
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, level, xp, elo, wins, losses
       FROM users ORDER BY level DESC, xp DESC LIMIT 100`
    )
    const players = result.rows.map(p => ({
      ...p,
      rank: rankForLevel(p.level || 1)
    }))
    res.json({ players })
  } catch (err) {
    res.status(500).json({ error: 'Errore server' })
  }
})

// GET /api/levels/matchmaking — trova avversari del tuo tier
router.get('/matchmaking', auth, async (req, res) => {
  try {
    const me = await pool.query(
      'SELECT level FROM users WHERE id=$1', [req.user.id]
    )
    const myLevel = me.rows[0]?.level || 1
    const myTier  = matchmakingTier(myLevel)

    // Trova il range di livelli per il tier
    const tierRanks = RANKS.filter(r => r.tier === myTier)
    const minLevel  = tierRanks[0]?.minLevel || 1
    const nextTier  = RANKS.find(r => r.tier === myTier + 1)
    const maxLevel  = nextTier ? nextTier.minLevel - 1 : 999

    const result = await pool.query(
      `SELECT id, username, level, elo, wins, losses
       FROM users
       WHERE level BETWEEN $1 AND $2 AND id != $3
       ORDER BY ABS(level - $4) ASC
       LIMIT 10`,
      [minLevel, maxLevel, req.user.id, myLevel]
    )
    const opponents = result.rows.map(p => ({
      ...p,
      rank: rankForLevel(p.level || 1)
    }))

    res.json({
      myLevel, myTier,
      tierName: rankForLevel(myLevel).name,
      minLevel, maxLevel,
      opponents
    })
  } catch (err) {
    res.status(500).json({ error: 'Errore server' })
  }
})

module.exports = router
