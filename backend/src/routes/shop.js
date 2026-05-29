const router = require('express').Router()
const pool   = require('../models/db')
const auth   = require('../middleware/auth')

const SHOP_PACKS = [
  { id:'base',    name:'Pacco Base',     cost:50,  cards:3, minRarity:'common'    },
  { id:'epic',    name:'Pacco Epico',    cost:120, cards:3, minRarity:'rare'      },
  { id:'legend',  name:'Pacco Leggenda', cost:300, cards:3, minRarity:'legendary' },
]

const POWERS = [
  { id:'burn',   cost:80  },
  { id:'shield', cost:60  },
  { id:'heal',   cost:70  },
  { id:'double', cost:100 },
  { id:'freeze', cost:90  },
  { id:'drain',  cost:85  },
]

const WHEEL_PRIZES = [
  { type:'credits', val:50  },
  { type:'card',    val:1   },
  { type:'credits', val:20  },
  { type:'power',   val:1   },
  { type:'credits', val:100 },
  { type:'card',    val:1   },
  { type:'credits', val:30  },
  { type:'spin',    val:1   },
]

// POST /api/shop/credits  — acquista pacco con crediti
router.post('/credits', auth, async (req, res) => {
  const { packId } = req.body
  const pack = SHOP_PACKS.find(p => p.id === packId)
  if (!pack) return res.status(400).json({ error: 'Pacco non trovato' })
  if (req.user.credits < pack.cost)
    return res.status(400).json({ error: 'Crediti insufficienti' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'UPDATE users SET credits = credits - $1 WHERE id = $2',
      [pack.cost, req.user.id]
    )

    // Pesca carte casuali della rarità minima
    const rarityOrder = ['common','rare','epic','legendary']
    const minIdx = rarityOrder.indexOf(pack.minRarity)
    const cardResult = await client.query(
      `SELECT * FROM cards WHERE rarity = ANY($1::text[]) ORDER BY RANDOM() LIMIT $2`,
      [rarityOrder.slice(minIdx), pack.cards]
    )
    const drawnCards = cardResult.rows

    // Aggiungi carte all'utente (ignora duplicati)
    for (const card of drawnCards) {
      await client.query(
        'INSERT INTO user_cards (user_id, card_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, card.id]
      )
    }

    await client.query('COMMIT')
    const updated = await pool.query('SELECT credits FROM users WHERE id = $1', [req.user.id])
    res.json({ success: true, cards: drawnCards, credits: updated.rows[0].credits })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  } finally {
    client.release()
  }
})

// POST /api/shop/power — acquista potere
router.post('/power', auth, async (req, res) => {
  const { powerId } = req.body
  const power = POWERS.find(p => p.id === powerId)
  if (!power) return res.status(400).json({ error: 'Potere non trovato' })
  if (req.user.credits < power.cost)
    return res.status(400).json({ error: 'Crediti insufficienti' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Verifica non già posseduto
    const existing = await client.query(
      'SELECT 1 FROM user_powers WHERE user_id=$1 AND power_id=$2',
      [req.user.id, powerId]
    )
    if (existing.rows.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Potere già posseduto' })
    }
    await client.query('UPDATE users SET credits=credits-$1 WHERE id=$2', [power.cost, req.user.id])
    await client.query('INSERT INTO user_powers (user_id, power_id) VALUES ($1,$2)', [req.user.id, powerId])
    await client.query('COMMIT')
    const updated = await pool.query('SELECT credits FROM users WHERE id=$1', [req.user.id])
    res.json({ success: true, credits: updated.rows[0].credits })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Errore server' })
  } finally {
    client.release()
  }
})

// POST /api/shop/daily — ritira pacco giornaliero
router.post('/daily', auth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  if (req.user.daily_claimed_at &&
      req.user.daily_claimed_at.toISOString().split('T')[0] === today)
    return res.status(400).json({ error: 'Pacco già ritirato oggi' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'UPDATE users SET credits=credits+10, daily_claimed_at=NOW() WHERE id=$1',
      [req.user.id]
    )
    // 3 carte casuali
    const cards = await client.query('SELECT * FROM cards ORDER BY RANDOM() LIMIT 3')
    for (const card of cards.rows) {
      await client.query(
        'INSERT INTO user_cards (user_id,card_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.user.id, card.id]
      )
    }
    await client.query('COMMIT')
    const updated = await pool.query('SELECT credits FROM users WHERE id=$1', [req.user.id])
    res.json({ success: true, cards: cards.rows, credits: updated.rows[0].credits })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Errore server' })
  } finally {
    client.release()
  }
})

// POST /api/shop/spin — gira la ruota
router.post('/spin', auth, async (req, res) => {
  if (req.user.spins <= 0)
    return res.status(400).json({ error: 'Nessun giro disponibile' })

  const prize = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)]
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('UPDATE users SET spins=spins-1 WHERE id=$1', [req.user.id])

    let extra = {}
    if (prize.type === 'credits') {
      await client.query('UPDATE users SET credits=credits+$1 WHERE id=$2', [prize.val, req.user.id])
      extra = { creditsEarned: prize.val }
    } else if (prize.type === 'spin') {
      await client.query('UPDATE users SET spins=spins+1 WHERE id=$1', [req.user.id])
      extra = { spinEarned: true }
    } else if (prize.type === 'card') {
      const card = await client.query('SELECT * FROM cards ORDER BY RANDOM() LIMIT 1')
      if (card.rows.length) {
        await client.query(
          'INSERT INTO user_cards (user_id,card_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [req.user.id, card.rows[0].id]
        )
        extra = { card: card.rows[0] }
      }
    } else if (prize.type === 'power') {
      const powers = ['burn','shield','heal','double','freeze','drain']
      const pw = powers[Math.floor(Math.random() * powers.length)]
      await client.query(
        'INSERT INTO user_powers (user_id,power_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.user.id, pw]
      )
      extra = { power: pw }
    }

    await client.query('COMMIT')
    const updated = await pool.query(
      'SELECT credits, spins FROM users WHERE id=$1', [req.user.id]
    )
    res.json({ success: true, prize, ...extra, ...updated.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Errore server' })
  } finally {
    client.release()
  }
})

module.exports = router
