import { useState, useEffect, useCallback } from "react"
import { getQuests, claimQuestReward } from "./api.js"

const G = {
  gold:"#c9a84c", goldLight:"#f0d080", goldDim:"#7a6230",
  bg:"#07060e", panel:"#0d0b1a", border:"#2a2540",
  text:"#e8e0cc", dim:"#8a8070",
}

const RARITY_STYLE = {
  common:    { color:"#9ca3af", bg:"#9ca3af12", border:"#9ca3af33", label:"Comune"    },
  rare:      { color:"#60a5fa", bg:"#60a5fa12", border:"#60a5fa33", label:"Rara"      },
  epic:      { color:"#a78bfa", bg:"#a78bfa12", border:"#a78bfa33", label:"Epica"     },
  legendary: { color:G.gold,    bg:"#c9a84c12", border:"#c9a84c44", label:"Leggendaria"},
}

// Countdown al prossimo reset (mezzanotte)
function useCountdown() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const tick = () => {
      const now  = new Date()
      const next = new Date(now)
      next.setHours(24, 0, 0, 0)
      const diff = next - now
      const h = String(Math.floor(diff / 3600000)).padStart(2,"0")
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,"0")
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,"0")
      setTime(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// Single quest card
function QuestCard({ quest, onClaim }) {
  const [claiming, setClaiming] = useState(false)
  const rs   = RARITY_STYLE[quest.rarity] || RARITY_STYLE.common
  const pct  = Math.min(100, Math.round((quest.progress / quest.target) * 100))
  const done = quest.completed
  const claimed = quest.claimed

  const handleClaim = async () => {
    if (!done || claimed || claiming) return
    setClaiming(true)
    try { await onClaim(quest.id) }
    finally { setClaiming(false) }
  }

  return (
    <div style={{
      background: done && !claimed ? `${rs.bg}` : G.panel,
      border: `1px solid ${done && !claimed ? rs.color : claimed ? "#4ade8033" : G.border}`,
      borderRadius: 12,
      padding: "1rem",
      transition: "all 0.3s",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow per quest completata non reclamata */}
      {done && !claimed && (
        <div style={{
          position:"absolute", inset:0,
          background:`radial-gradient(ellipse at 50% 0%, ${rs.color}18 0%, transparent 70%)`,
          pointerEvents:"none"
        }} />
      )}

      {/* Rarity badge */}
      <div style={{
        position:"absolute", top:8, right:8,
        fontSize:"0.44rem", fontFamily:"'Cinzel',serif",
        letterSpacing:"0.1em", textTransform:"uppercase",
        padding:"2px 6px", borderRadius:10,
        color: rs.color, background: rs.bg, border:`1px solid ${rs.border}`
      }}>
        {rs.label}
      </div>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <span style={{ fontSize:"1.8rem", flexShrink:0 }}>{quest.icon}</span>
        <div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.68rem",
            color: done ? rs.color : G.text, fontWeight:600 }}>
            {quest.name}
            {done && !claimed && (
              <span style={{ marginLeft:6, fontSize:"0.55rem", color:"#4ade80",
                background:"#4ade8015", border:"1px solid #4ade8033",
                borderRadius:10, padding:"1px 6px" }}>COMPLETATA!</span>
            )}
            {claimed && (
              <span style={{ marginLeft:6, fontSize:"0.55rem", color:G.dim,
                background:G.border+"44", borderRadius:10, padding:"1px 6px" }}>✓ Ritirata</span>
            )}
          </div>
          <div style={{ fontSize:"0.62rem", color:G.dim, fontStyle:"italic", marginTop:2 }}>
            {quest.desc}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontFamily:"'Cinzel',serif", fontSize:"0.52rem", color:G.dim, marginBottom:4 }}>
          <span>Progresso</span>
          <span style={{ color: done ? rs.color : G.text }}>
            {quest.progress} / {quest.target}
          </span>
        </div>
        <div style={{ height:6, background:"#1a1530", borderRadius:3, overflow:"hidden",
          border:`1px solid ${G.border}` }}>
          <div style={{
            height:"100%", borderRadius:3,
            width:`${pct}%`,
            background: done
              ? `linear-gradient(90deg, ${rs.color}99, ${rs.color})`
              : "linear-gradient(90deg,#3b82f6,#60a5fa)",
            transition:"width 0.6s cubic-bezier(.34,1.56,.64,1)",
            boxShadow: done ? `0 0 8px ${rs.color}88` : undefined
          }} />
        </div>
      </div>

      {/* Rewards row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {quest.reward.credits > 0 && (
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem",
              color:G.gold, background:"#c9a84c12", border:"1px solid #c9a84c33",
              borderRadius:20, padding:"2px 8px" }}>
              💰 +{quest.reward.credits}
            </span>
          )}
          {quest.reward.spins > 0 && (
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem",
              color:"#a78bfa", background:"#a78bfa12", border:"1px solid #a78bfa33",
              borderRadius:20, padding:"2px 8px" }}>
              🎡 +{quest.reward.spins} giro
            </span>
          )}
          {quest.reward.elo > 0 && (
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem",
              color:"#60a5fa", background:"#60a5fa12", border:"1px solid #60a5fa33",
              borderRadius:20, padding:"2px 8px" }}>
              ⚡ +{quest.reward.elo} ELO
            </span>
          )}
        </div>

        {/* Claim button */}
        {done && !claimed && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            style={{
              fontFamily:"'Cinzel',serif", fontSize:"0.58rem",
              letterSpacing:"0.12em", textTransform:"uppercase",
              padding:"5px 14px", borderRadius:20, border:"none",
              cursor: claiming ? "wait" : "pointer",
              background:`linear-gradient(135deg,${G.goldDim},${G.gold})`,
              color:G.bg, fontWeight:700, transition:"all 0.25s",
              opacity: claiming ? 0.7 : 1,
              animation:"pulse 1.5s ease-in-out infinite",
            }}>
            {claiming ? "..." : "✦ Ritira"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ──────────────────────────────────────────────
export default function QuestsTab({ user, onUserUpdate }) {
  const [quests,  setQuests]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")
  const [toast,   setToast]   = useState(null)
  const countdown = useCountdown()

  const loadQuests = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await getQuests()
      setQuests(data.quests || [])
    } catch (e) {
      setError("Impossibile caricare le quest. Riprova.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQuests() }, [loadQuests])

  const showToast = (msg, color = G.gold) => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const handleClaim = async (questId) => {
    try {
      const data = await claimQuestReward(questId)
      // Aggiorna user
      if (data.user) onUserUpdate(prev => ({ ...prev, ...data.user }))
      // Aggiorna quest locale
      setQuests(prev => prev.map(q =>
        q.id === questId ? { ...q, claimed: true } : q
      ))
      const r = data.reward
      const parts = []
      if (r.credits) parts.push(`+${r.credits} crediti`)
      if (r.spins)   parts.push(`+${r.spins} giro`)
      if (r.elo)     parts.push(`+${r.elo} ELO`)
      showToast(`🎉 Ricompensa ritirata! ${parts.join(" · ")}`, G.gold)
    } catch (e) {
      showToast(e.response?.data?.error || "Errore nel ritiro", "#f87171")
    }
  }

  // Stats
  const completed = quests.filter(q => q.completed).length
  const claimed   = quests.filter(q => q.claimed).length
  const total     = quests.length

  const sectionTitle = (text) => (
    <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.38em",
      textTransform:"uppercase", color:G.dim, margin:"16px 0 10px",
      display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${G.border})` }} />
      {text}
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${G.border},transparent)` }} />
    </div>
  )

  return (
    <div style={{ position:"relative" }}>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          background:G.panel, border:`1px solid ${toast.color}`,
          borderRadius:20, padding:"8px 20px", zIndex:900,
          fontFamily:"'Cinzel',serif", fontSize:"0.68rem", color:toast.color,
          boxShadow:`0 4px 20px ${toast.color}44`,
          animation:"fadeUp 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header summary */}
      <div style={{
        background:`linear-gradient(135deg,#120e22,#0d0b1a)`,
        border:`1px solid ${G.border}`, borderRadius:14,
        padding:"1.2rem", marginBottom:16,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:12
      }}>
        <div>
          <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.1rem",
            background:`linear-gradient(135deg,${G.goldDim},${G.goldLight})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Quest Giornaliere
          </div>
          <div style={{ fontSize:"0.65rem", color:G.dim, fontStyle:"italic", marginTop:2 }}>
            Si rinnovano ogni giorno a mezzanotte
          </div>
        </div>

        {/* Countdown */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.55rem",
            letterSpacing:"0.2em", color:G.dim, textTransform:"uppercase", marginBottom:2 }}>
            Reset tra
          </div>
          <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.2rem",
            color:G.gold, letterSpacing:"0.05em" }}>
            {countdown}
          </div>
        </div>
      </div>

      {/* Progress summary */}
      {total > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[
            { v:total,     l:"Totali",     c:G.dim   },
            { v:completed, l:"Completate", c:"#4ade80"},
            { v:claimed,   l:"Ritirate",   c:G.gold  },
          ].map(s => (
            <div key={s.l} style={{ flex:1, background:G.panel, border:`1px solid ${G.border}`,
              borderRadius:10, padding:"0.7rem 0.5rem", textAlign:"center" }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem", color:s.c }}>{s.v}</div>
              <div style={{ fontSize:"0.5rem", letterSpacing:"0.1em", color:G.dim,
                textTransform:"uppercase", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Global progress bar */}
      {total > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            fontFamily:"'Cinzel',serif", fontSize:"0.52rem", color:G.dim, marginBottom:5 }}>
            <span>Progresso giornaliero</span>
            <span style={{ color:G.gold }}>{claimed}/{total} completate</span>
          </div>
          <div style={{ height:8, background:"#1a1530", borderRadius:4, overflow:"hidden",
            border:`1px solid ${G.border}` }}>
            <div style={{
              height:"100%", borderRadius:4,
              width:`${total > 0 ? (claimed/total)*100 : 0}%`,
              background:`linear-gradient(90deg,${G.goldDim},${G.gold})`,
              transition:"width 0.8s cubic-bezier(.34,1.56,.64,1)",
              boxShadow: claimed === total && total > 0 ? `0 0 12px ${G.gold}88` : undefined
            }} />
          </div>
          {claimed === total && total > 0 && (
            <div style={{ textAlign:"center", marginTop:6, fontSize:"0.65rem",
              color:G.gold, fontStyle:"italic" }}>
              ✦ Tutte le quest completate per oggi! ✦
            </div>
          )}
        </div>
      )}

      {/* Quest list */}
      {sectionTitle("Quest di oggi")}

      {loading ? (
        <div style={{ textAlign:"center", padding:"2rem", color:G.dim,
          fontStyle:"italic", animation:"pulse 1.5s infinite" }}>
          Caricamento quest...
        </div>
      ) : error ? (
        <div style={{ background:"#dc262610", border:"1px solid #dc262633", borderRadius:10,
          padding:"1rem", color:"#f87171", fontSize:"0.75rem", textAlign:"center" }}>
          {error}
          <button onClick={loadQuests} style={{ display:"block", margin:"8px auto 0",
            fontFamily:"'Cinzel',serif", fontSize:"0.55rem", padding:"4px 12px",
            borderRadius:5, border:`1px solid #dc262633`, background:"transparent",
            color:"#f87171", cursor:"pointer" }}>
            Riprova
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {quests.map(q => (
            <QuestCard key={q.id} quest={q} onClaim={handleClaim} />
          ))}
        </div>
      )}

      {/* Info bonus */}
      {sectionTitle("Come guadagnare")}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:8, marginBottom:8 }}>
        {[
          { icon:"⚔️", text:"Vinci battaglie",           hint:"Quest win"     },
          { icon:"💀", text:"Sfide difficili",            hint:"Quest hard"    },
          { icon:"🎡", text:"Gira la ruota",              hint:"Quest spin"    },
          { icon:"📦", text:"Ritira pacco giornaliero",   hint:"Quest daily"   },
          { icon:"🃏", text:"Ottieni nuove carte",        hint:"Quest collect" },
          { icon:"⚡", text:"Aumenta il tuo ELO",        hint:"Quest elo"     },
        ].map(i => (
          <div key={i.text} style={{ background:G.panel, border:`1px solid ${G.border}`,
            borderRadius:10, padding:"0.75rem 0.65rem", textAlign:"center" }}>
            <div style={{ fontSize:"1.4rem", marginBottom:4 }}>{i.icon}</div>
            <div style={{ fontSize:"0.58rem", color:G.text, lineHeight:1.4 }}>{i.text}</div>
            <div style={{ fontSize:"0.5rem", color:G.dim, marginTop:2, fontStyle:"italic" }}>{i.hint}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
