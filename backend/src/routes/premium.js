const router = require('express').Router()
const pool   = require('../models/db')
const auth   = require('../middleware/auth')

const PREMIUM_PACKS = {
  starter: { sol:0.05, credits:100, spins:2,  allPowers:false },
  warrior: { sol:0.15, credits:300, spins:5,  allPowers:false },
  legend:  { sol:0.35, credits:1000,spins:15, allPowers:true  },
  season:  { sol:0.50, credits:2000,spins:30, allPowers:true  },
}

// POST /api/premium/verify
// Body: { packId, txSignature, walletAddress }
// In produzione verifica la firma sulla blockchain Solana
router.post('/verify', auth, async (req, res) => {
  const { packId, txSignature, walletAddress } = req.body
  const pack = PREMIUM_PACKS[packId]
  if (!pack) return res.status(400).json({ error: 'Pacco non trovato' })
  if (!txSignature) return res.status(400).json({ error: 'Firma transazione mancante' })

  // ── PRODUZIONE: verifica reale su Solana ──────────────────────
  // const { Connection, PublicKey } = require('@solana/web3.js')
  // const connection = new Connection(
  //   process.env.SOLANA_NETWORK === 'mainnet-beta'
  //     ? 'https://api.mainnet-beta.solana.com'
  //     : 'https://api.devnet.solana.com'
  // )
  // const tx = await connection.getTransaction(txSignature, { commitment: 'confirmed' })
  // if (!tx) return res.status(400).json({ error: 'Transazione non trovata' })
  // const lamports = tx.meta.postBalances[1] - tx.meta.preBalances[1]
  // const solReceived = lamports / 1e9
  // if (Math.abs(solReceived - pack.sol) > 0.001)
  //   return res.status(400).json({ error: 'Importo SOL non corretto' })
  // ─────────────────────────────────────────────────────────────

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Evita doppio acquisto con stessa firma
    const existing = await client.query(
      'SELECT id FROM transactions WHERE tx_signature=$1', [txSignature]
    )
    if (existing.rows.length) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Transazione già processata' })
    }

    // Salva transazione
    await client.query(
      `INSERT INTO transactions (user_id,pack_id,sol_amount,tx_signature,status)
       VALUES ($1,$2,$3,$4,'confirmed')`,
      [req.user.id, packId, pack.sol, txSignature]
    )

    // Dai crediti e giri
    await client.query(
      'UPDATE users SET credits=credits+$1, spins=spins+$2 WHERE id=$3',
      [pack.credits, pack.spins, req.user.id]
    )

    // Salva wallet address
    if (walletAddress) {
      await client.query(
        'UPDATE users SET wallet_address=$1 WHERE id=$2', [walletAddress, req.user.id]
      )
    }

    // Dai tutti i poteri se richiesto
    if (pack.allPowers) {
      const powers = ['burn','shield','heal','double','freeze','drain']
      for (const pw of powers) {
        await client.query(
          'INSERT INTO user_powers (user_id,power_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [req.user.id, pw]
        )
      }
    }

    // Pesca carte del pacco
    const cardCount = packId === 'starter' ? 5 : packId === 'warrior' ? 10
                    : packId === 'legend'  ? 20 : 30
    const cards = await client.query(
      'SELECT * FROM cards ORDER BY RANDOM() LIMIT $1', [cardCount]
    )
    for (const card of cards.rows) {
      await client.query(
        'INSERT INTO user_cards (user_id,card_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.user.id, card.id]
      )
    }

    await client.query('COMMIT')

    const updated = await pool.query(
      'SELECT credits, spins FROM users WHERE id=$1', [req.user.id]
    )
    res.json({ success: true, cards: cards.rows, ...updated.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  } finally {
    client.release()
  }
})

module.exports = router
