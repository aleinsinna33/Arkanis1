// ═══════════════════════════════════════════════════════
// SISTEMA LIVELLI — XP e Rank
// ═══════════════════════════════════════════════════════

// XP necessaria per ogni livello (curva esponenziale)
// livello 1 = 0 XP, livello 2 = 100 XP, ecc.
function xpForLevel(level) {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.8))
}

// XP totale accumulata per raggiungere un livello
function totalXpForLevel(level) {
  let total = 0
  for (let i = 2; i <= level; i++) total += xpForLevel(i)
  return total
}

// Dato l'XP totale, calcola il livello corrente
function levelFromXp(xp) {
  let level = 1
  while (totalXpForLevel(level + 1) <= xp) level++
  return level
}

// XP guadagnata per una battaglia
function xpForBattle({ result, difficulty }) {
  const base = { win: 50, lose: 15 }[result] || 0
  const mult = { easy: 0.8, normal: 1.0, hard: 1.5, legend: 2.5 }[difficulty] || 1
  return Math.round(base * mult)
}

// Titolo e colore per ogni fascia di livello
const RANKS = [
  { minLevel: 1,  name: "Recluta",        color: "#9ca3af", icon: "🪨", tier: 1 },
  { minLevel: 5,  name: "Apprendista",     color: "#4ade80", icon: "🌿", tier: 2 },
  { minLevel: 10, name: "Guerriero",       color: "#60a5fa", icon: "⚔️", tier: 3 },
  { minLevel: 20, name: "Veterano",        color: "#a78bfa", icon: "🔮", tier: 4 },
  { minLevel: 35, name: "Campione",        color: "#f59e0b", icon: "🏆", tier: 5 },
  { minLevel: 50, name: "Gran Maestro",    color: "#f97316", icon: "👑", tier: 6 },
  { minLevel: 75, name: "Leggenda",        color: "#ef4444", icon: "🌟", tier: 7 },
  { minLevel: 100,name: "Immortale",       color: "#c9a84c", icon: "💎", tier: 8 },
]

function rankForLevel(level) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r
    else break
  }
  return rank
}

// Fascia matchmaking (tier) — si scontra contro chi ha lo stesso tier
function matchmakingTier(level) {
  return rankForLevel(level).tier
}

module.exports = { xpForLevel, totalXpForLevel, levelFromXp, xpForBattle, rankForLevel, matchmakingTier, RANKS }
