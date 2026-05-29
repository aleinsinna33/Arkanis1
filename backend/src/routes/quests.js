const router = require('express').Router()
const pool   = require('../models/db')
const auth   = require('../middleware/auth')

// ── DEFINIZIONE QUEST ──────────────────────────────────────────
// Ogni giorno vengono assegnate 3 quest casuali da questo pool
const QUEST_POOL = [
  { id:'win1',      name:'Prima Vittoria',       desc:'Vinci 1 battaglia',            type:'win',    target:1,  reward:{ credits:30,  spins:0, elo:5  }, icon:'⚔️',  rarity:'common'    },
  { id:'win3',      name:'Tre Vittorie',          desc:'Vinci 3 battaglie',            type:'win',    target:3,  reward:{ credits:80,  spins:1, elo:15 }, icon:'🏆',  rarity:'rare'      },
  { id:'win5',      name:'Guerriero del Giorno',  desc:'Vinci 5 battaglie',            type:'win',    target:5,  reward:{ credits:150, spins:2, elo:30 }, icon:'👑',  rarity:'epic'      },
  { id:'hard1',     name:'Sfida Difficile',       desc:'Vinci 1 partita in Difficile', type:'hard',   target:1,  reward:{ credits:60,  spins:1, elo:20 }, icon:'💀',  rarity:'rare'      },
  { id:'legend1',   name:'Leggenda Vivente',      desc:'Vinci 1 partita in Leggenda',  type:'legend', target:1,  reward:{ credits:120, spins:2, elo:50 }, icon:'🌟',  rarity:'legendary' },
  { id:'play3',     name:'Allenamento',           desc:'Gioca 3 battaglie',            type:'play',   target:3,  reward:{ credits:25,  spins:0, elo:5  }, icon:'🎮',  rarity:'common'    },
  { id:'play5',     name:'Guerriero Instancabile',desc:'Gioca 5 battaglie',            type:'play',   target:5,  reward:{ credits:50,  spins:1, elo:10 }, icon:'⚡',  rarity:'rare'      },
  { id:'streak3',   name:'Serie Vincente',        desc:'Vinci 3 partite di fila',      type:'streak', target:3,  reward:{ credits:100, spins:1, elo:25 }, icon:'🔥',  rarity:'epic'      },
  { id:'spin1',     name:'Ruota Fortunata',       desc:'Gira la ruota 1 volta',        type:'spin',   target:1,  reward:{ credits:20,  spins:0, elo:0  }, icon:'🎡',  rarity:'common'    },
  { id:'collect3',  name:'Collezionista',         desc:'Ottieni 3 carte oggi',         type:'collect',target:3,  reward:{ credits:40,  spins:1, elo:10 }, icon:'🃏',  rarity:'rare'      },
  { id:'daily',     name:'Presenza Giornaliera',  desc:'Ritira il pacco giornaliero',  type:'daily',  target:1,  reward:{ credits:15,  spins:0, elo:5  }, icon:'📦',  rarity:'common'    },
  { id:'elo1200',   name:'Ascesa al Potere',      desc:'Raggiungi 1200 ELO',           type:'elo',    target:1200,reward:{ credits:200, spins:3, elo:0 }, icon:'💎',  rarity:'legendary' },
]

// Seleziona 3 quest per oggi in modo deterministico (stesso seed per tutti gli utenti)
function getDailyQuestIds() {
  const today   = new Date().toISOString().split('T')[0].replace(/-/g,'')
  const seed    = parseInt(today) % QUEST_POOL.length
  const indices = new Set()
  let i = seed
  while (indices.size < 3) {
    indices.add(i % QUEST_POOL.length)
    i++
  }
  return [...indices].map(idx => QUEST_POOL[idx].id)
}

// GET /api/quests — recupera quest del giorno con progresso utente
router.get('/', auth, async (req, res) => {
  try {
    const today    = new Date().toISOString().split('T')[0]
    const questIds = getDailyQuestIds()

    // Assicura che le righe esistano per oggi
    for (const qid of questIds) {
      await pool.query(
        `INSERT INTO user_quests (user_id, quest_id, quest_date)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [req.user.id, qid, today]
      )
    }

    // Carica progresso
    const result = await pool.query(
      `SELECT quest_id, progress, completed, claimed
       FROM user_quests
       WHERE user_id=$1 AND quest_date=$2`,
      [req.user.id, today]
    )

    const progressMap = {}
    result.rows.forEach(r => { progressMap[r.quest_id] = r })

    const quests = questIds.map(qid => {
      const def  = QUEST_POOL.find(q => q.id === qid)
      const prog = progressMap[qid] || { progress:0, completed:false, claimed:false }
      return { ...def, progress: prog.progress, completed: prog.completed, claimed: prog.claimed }
    })

    res.json({ quests, date: today })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// POST /api/quests/progress — aggiorna progresso (chiamato internamente)
// type: win | play | hard | legend | streak | spin | collect | daily | elo
router.post('/progress', auth, async (req, res) => {
  const { type, value = 1 } = req.body
  if (!type) return res.status(400).json({ error: 'type obbligatorio' })

  try {
    const today    = new Date().toISOString().split('T')[0]
    const questIds = getDailyQuestIds()

    const updated = []
    for (const qid of questIds) {
      const def = QUEST_POOL.find(q => q.id === qid)
      if (!def || def.type !== type) continue

      // Carica stato attuale
      const current = await pool.query(
        `SELECT progress, completed FROM user_quests
         WHERE user_id=$1 AND quest_id=$2 AND quest_date=$3`,
        [req.user.id, qid, today]
      )
      if (!current.rows.length || current.rows[0].completed) continue

      const newProgress = type === 'elo'
        ? value  // per elo usiamo valore assoluto
        : current.rows[0].progress + value

      const completed = newProgress >= def.target

      await pool.query(
        `UPDATE user_quests
         SET progress=$1, completed=$2, completed_at=CASE WHEN $2 THEN NOW() ELSE NULL END
         WHERE user_id=$3 AND quest_id=$4 AND quest_date=$5`,
        [Math.min(newProgress, def.target), completed, req.user.id, qid, today]
      )

      updated.push({ id: qid, progress: Math.min(newProgress, def.target), completed })
    }

    res.json({ updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// POST /api/quests/claim/:questId — ritira ricompensa
router.post('/claim/:questId', auth, async (req, res) => {
  const { questId } = req.params
  const def = QUEST_POOL.find(q => q.id === questId)
  if (!def) return res.status(404).json({ error: 'Quest non trovata' })

  const today = new Date().toISOString().split('T')[0]
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const row = await client.query(
      `SELECT completed, claimed FROM user_quests
       WHERE user_id=$1 AND quest_id=$2 AND quest_date=$3
       FOR UPDATE`,
      [req.user.id, questId, today]
    )

    if (!row.rows.length || !row.rows[0].completed)
      throw new Error('Quest non completata')
    if (row.rows[0].claimed)
      throw new Error('Ricompensa già ritirata')

    // Marca come claimed
    await client.query(
      `UPDATE user_quests SET claimed=TRUE
       WHERE user_id=$1 AND quest_id=$2 AND quest_date=$3`,
      [req.user.id, questId, today]
    )

    // Dai ricompensa
    const r = def.reward
    await client.query(
      `UPDATE users SET
         credits = credits + $1,
         spins   = spins   + $2,
         elo     = elo     + $3,
         updated_at = NOW()
       WHERE id=$4`,
      [r.credits, r.spins, r.elo, req.user.id]
    )

    await client.query('COMMIT')

    const updated = await pool.query(
      'SELECT credits, spins, elo FROM users WHERE id=$1', [req.user.id]
    )
    res.json({ success: true, reward: def.reward, user: updated.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

module.exports = router
module.exports.getDailyQuestIds = getDailyQuestIds
module.exports.QUEST_POOL = QUEST_POOL
