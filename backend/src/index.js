require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')
const pool       = require('./models/db')

const app  = express()
const PORT = process.env.PORT || 4000

// ── MIDDLEWARE ──────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Rate limiting globale
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: { error: 'Troppe richieste' } }))

// Rate limiting più stretto per auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Troppi tentativi' } })

// ── ROUTES ──────────────────────────────────────────────────────
app.use('/api/auth',        authLimiter, require('./routes/auth'))
app.use('/api/cards',       require('./routes/cards'))
app.use('/api/battle',      require('./routes/battle'))
app.use('/api/leaderboard', require('./routes/leaderboard'))
app.use('/api/shop',        require('./routes/shop'))
app.use('/api/premium',     require('./routes/premium'))
app.use('/api/quests',      require('./routes/quests'))
app.use('/api/levels',      require('./routes/levels'))

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint non trovato' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Errore interno del server' })
})

app.listen(PORT, () => console.log(`✓ Arkanis backend avviato su porta ${PORT}`))
