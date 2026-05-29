const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../models/db')
const authMiddleware = require('../middleware/auth')

const makeToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' })
  if (username.length < 2 || username.length > 30)
    return res.status(400).json({ error: 'Username deve essere tra 2 e 30 caratteri' })
  if (!email.includes('@'))
    return res.status(400).json({ error: 'Email non valida' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password min 6 caratteri' })

  try {
    const hash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, elo, credits, spins, wins, losses, created_at`,
      [username.trim(), email.toLowerCase().trim(), hash]
    )
    const user = result.rows[0]
    res.status(201).json({ user, token: makeToken(user.id) })
  } catch (err) {
    if (err.code === '23505') {
      const field = err.constraint?.includes('email') ? 'email' : 'username'
      return res.status(409).json({ error: `${field} già in uso` })
    }
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password)
    return res.status(400).json({ error: 'Username e password obbligatori' })

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]
    )
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Utente non trovato' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Password errata' })

    // Get owned powers
    const powers = await pool.query(
      'SELECT power_id FROM user_powers WHERE user_id = $1', [user.id]
    )
    user.owned_powers = powers.rows.map(r => r.power_id)
    delete user.password_hash

    res.json({ user, token: makeToken(user.id) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const user = { ...req.user }
  delete user.password_hash
  // Get powers
  const powers = await pool.query(
    'SELECT power_id FROM user_powers WHERE user_id = $1', [user.id]
  )
  user.owned_powers = powers.rows.map(r => r.power_id)
  res.json({ user })
})

// PUT /api/auth/wallet  (collega Solflare)
router.put('/wallet', authMiddleware, async (req, res) => {
  const { wallet_address } = req.body
  if (!wallet_address) return res.status(400).json({ error: 'Indirizzo wallet mancante' })
  await pool.query(
    'UPDATE users SET wallet_address = $1 WHERE id = $2',
    [wallet_address, req.user.id]
  )
  res.json({ success: true })
})

module.exports = router
