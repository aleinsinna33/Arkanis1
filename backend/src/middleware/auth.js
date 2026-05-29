const jwt = require('jsonwebtoken')
const pool = require('../models/db')

module.exports = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' })
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.userId])
    if (!result.rows.length) return res.status(401).json({ error: 'Utente non trovato' })
    req.user = result.rows[0]
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token non valido' })
  }
}
