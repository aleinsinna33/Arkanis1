const router = require('express').Router()
const pool   = require('../models/db')
const auth   = require('../middleware/auth')
const { getDailyQuestIds, QUEST_POOL } = require('./quests')
const { xpForBattle, levelFromXp, rankForLevel } = require('../models/levels')

const DIFFICULTY_CONFIG = {
  easy:   { elo: 10,  credits: 15  },
  normal: { elo: 25,  credits: 30  },
  hard:   { elo: 50,  credits: 60  },
  legend: { elo: 100, credits: 120 },
}

// Helper: aggiorna quest progress internamente
async function updateQuestProgress(userId, type, value = 1, client) {
  const db    = client || pool
  const today = new Date().toISOString().split('T')[0]
  const ids   = getDailyQuestIds()
  for (const qid of ids) {
    const def = QUEST_POOL.find(q => q.id === qid)
    if (!def || def.type !== type) continue
    const cur = await db.query(
      `SELECT progress, completed FROM user_quests
       WHERE user_id=$1 AND quest_id=$2 AND quest_date=$3`,
      [userId, qid, today]
    )
    if (!cur.rows.length || cur.rows[0].completed) continue
    const newProg  = type === 'elo' ? value : cur.rows[0].progress + value
    const completed = newProg >= def.target
    await db.query(
      `UPDATE user_quests SET progress=$1, completed=$2,
       completed_at=CASE WHEN $2 THEN NOW() ELSE NULL END
       WHERE user_id=$3 AND quest_id=$4 AND quest_date=$5`,
      [Math.min(newProg, def.target), completed, userId, qid, today]
    )
  }
}

// POST /api/battle/result
router.post('/result', auth, async (req, res) => {
  const { difficulty, result } = req.body
  if (!['easy','normal','hard','legend'].includes(difficulty))
    return res.status(400).json({ error: 'Difficoltà non valida' })
  if (!['win','lose'].includes(result))
    return res.status(400).json({ error: 'Risultato non valido' })

  const cfg      = DIFFICULTY_CONFIG[difficulty]
  const eloDelta = result === 'win' ? cfg.elo : -15
  const creditsEarned = result === 'win' ? cfg.credits : 0

  const xpEarned = xpForBattle({ result, difficulty })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Calcola nuovo livello
    const currentUser = await client.query('SELECT xp, level FROM users WHERE id=$1', [req.user.id])
    const oldXp    = currentUser.rows[0]?.xp    || 0
    const oldLevel = currentUser.rows[0]?.level  || 1
    const newXp    = oldXp + xpEarned
    const newLevel = levelFromXp(newXp)
    const leveledUp = newLevel > oldLevel

    // Bonus crediti per level-up
    const levelUpBonus = leveledUp ? (newLevel - oldLevel) * 50 : 0

    // Aggiorna utente
    await client.query(
      `UPDATE users SET
        elo        = GREATEST(0, elo + $1),
        credits    = credits + $2,
        wins       = wins    + $3,
        losses     = losses  + $4,
        spins      = spins   + $5,
        xp         = xp      + $6,
        level      = $7,
        updated_at = NOW()
       WHERE id = $8`,
      [
        eloDelta,
        creditsEarned + levelUpBonus,
        result === 'win' ? 1 : 0,
        result === 'lose' ? 1 : 0,
        result === 'win' ? 1 : 0,
        xpEarned,
        newLevel,
        req.user.id
      ]
    )

    // Salva battaglia nel log
    await client.query(
      `INSERT INTO battles (user_id, difficulty, result, elo_delta, credits_earned)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, difficulty, result, eloDelta, creditsEarned]
    )

    await client.query('COMMIT')

    // Aggiorna quest in background
    const newElo = req.user.elo + eloDelta
    setImmediate(async () => {
      try {
        await updateQuestProgress(req.user.id, 'play', 1)
        if (result === 'win') {
          await updateQuestProgress(req.user.id, 'win', 1)
          if (difficulty === 'hard')   await updateQuestProgress(req.user.id, 'hard', 1)
          if (difficulty === 'legend') await updateQuestProgress(req.user.id, 'legend', 1)
        }
        await updateQuestProgress(req.user.id, 'elo', newElo)
      } catch (e) { console.error('Quest update error:', e) }
    })

    // Ritorna i valori aggiornati con info livello
    const updated = await pool.query(
      'SELECT elo, credits, spins, wins, losses, xp, level FROM users WHERE id = $1',
      [req.user.id]
    )
    const rank = rankForLevel(newLevel)
    res.json({
      success: true,
      user: updated.rows[0],
      eloDelta,
      creditsEarned: creditsEarned + levelUpBonus,
      xpEarned,
      leveledUp,
      oldLevel,
      newLevel,
      rank,
      levelUpBonus
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  } finally {
    client.release()
  }
})

// GET /api/battle/history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT difficulty, result, elo_delta, credits_earned, played_at
       FROM battles WHERE user_id = $1
       ORDER BY played_at DESC LIMIT 20`,
      [req.user.id]
    )
    res.json({ battles: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Errore server' })
  }
})

module.exports = router
