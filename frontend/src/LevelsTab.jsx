import { useState, useEffect } from "react"
import { getMyLevel, getAllRanks, getLevelsLeaderboard } from "./api.js"

const G = {
  gold:"#c9a84c", goldLight:"#f0d080", goldDim:"#7a6230",
  bg:"#07060e", panel:"#0d0b1a", border:"#2a2540",
  text:"#e8e0cc", dim:"#8a8070",
}

// ── COMPONENTE BADGE LIVELLO (riusabile ovunque) ────────────────
export function LevelBadge({ level, rank, size = "sm" }) {
  if (!rank) return null
  const isLg = size === "lg"
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:isLg?5:3,
      background:`${rank.color}18`,
      border:`1px solid ${rank.color}44`,
      borderRadius:20,
      padding: isLg ? "4px 10px" : "2px 7px",
      fontFamily:"'Cinzel',serif",
      fontSize: isLg ? "0.72rem" : "0.48rem",
      color: rank.color,
      letterSpacing:"0.05em",
      whiteSpace:"nowrap",
    }}>
      {rank.icon} Lv.{level} {isLg && rank.name}
    </span>
  )
}

// ── XP BAR COMPONENT ───────────────────────────────────────────
export function XpBar({ levelData, showLabel = true }) {
  if (!levelData) return null
  const { level, rank, xpProgress, xpNeeded, pct } = levelData
  return (
    <div style={{ width:"100%" }}>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between",
          fontFamily:"'Cinzel',serif", fontSize:"0.52rem",
          color:G.dim, marginBottom:4 }}>
          <span style={{ color: rank?.color }}>
            {rank?.icon} {rank?.name} — Lv.{level}
          </span>
          <span>{xpProgress} / {xpNeeded} XP</span>
        </div>
      )}
      <div style={{ height:6, background:"#1a1530", borderRadius:3,
        overflow:"hidden", border:`1px solid ${G.border}` }}>
        <div style={{
          height:"100%", borderRadius:3,
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${rank?.color}88, ${rank?.color})`,
          transition:"width 0.8s cubic-bezier(.34,1.56,.64,1)",
          boxShadow:`0 0 8px ${rank?.color}66`,
        }} />
      </div>
    </div>
  )
}

// ── LEVEL UP OVERLAY (usato in BattleTab) ──────────────────────
export function LevelUpOverlay({ oldLevel, newLevel, rank, bonus, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:800,
      background:"#07060eee", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeUp 0.4s ease" }}>
      <div style={{ textAlign:"center", padding:"2.5rem 2rem",
        maxWidth:340, width:"90%",
        background:`linear-gradient(135deg,#120e22,#0d0b1a)`,
        border:`2px solid ${rank.color}`,
        borderRadius:20,
        boxShadow:`0 0 60px ${rank.color}44`,
        animation:"victoryIn 0.6s cubic-bezier(.34,1.56,.64,1) forwards" }}>

        <div style={{ fontSize:"4rem", marginBottom:"0.8rem",
          filter:`drop-shadow(0 0 20px ${rank.color})` }}>
          {rank.icon}
        </div>

        <div style={{ fontFamily:"'Cinzel Decorative',serif",
          fontSize:"clamp(1.4rem,6vw,2rem)", fontWeight:900,
          color:rank.color, marginBottom:6,
          textShadow:`0 0 30px ${rank.color}88` }}>
          LEVEL UP!
        </div>

        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
          letterSpacing:"0.2em", color:G.dim, marginBottom:"1.2rem",
          textTransform:"uppercase" }}>
          Livello {oldLevel} → <span style={{ color:rank.color }}>{newLevel}</span>
        </div>

        <div style={{ background:`${rank.color}18`, border:`1px solid ${rank.color}33`,
          borderRadius:12, padding:"0.9rem", marginBottom:"1.4rem" }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.72rem",
            color:rank.color, marginBottom:4 }}>
            {rank.name}
          </div>
          <div style={{ fontSize:"0.62rem", color:G.dim, fontStyle:"italic" }}>
            Nuovo rango sbloccato!
          </div>
          {bonus > 0 && (
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
              color:G.gold, marginTop:6 }}>
              🎁 Bonus: +{bonus} crediti
            </div>
          )}
        </div>

        <button onClick={onClose} style={{
          fontFamily:"'Cinzel',serif", fontSize:"0.62rem",
          letterSpacing:"0.15em", textTransform:"uppercase",
          padding:"10px 24px", borderRadius:6, border:"none",
          cursor:"pointer", fontWeight:700,
          background:`linear-gradient(135deg,${rank.color}88,${rank.color})`,
          color:G.bg }}>
          ✦ Continua
        </button>
      </div>
    </div>
  )
}

// ── MAIN LEVELS TAB ────────────────────────────────────────────
export default function LevelsTab({ user }) {
  const [levelData,    setLevelData]    = useState(null)
  const [allRanks,     setAllRanks]     = useState([])
  const [leaderboard,  setLeaderboard]  = useState([])
  const [activeView,   setActiveView]   = useState("profile") // profile | ranks | leaderboard
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([getMyLevel(), getAllRanks(), getLevelsLeaderboard()])
      .then(([lv, rk, lb]) => {
        setLevelData(lv)
        setAllRanks(rk.ranks || [])
        setLeaderboard(lb.players || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sectionTitle = (text) => (
    <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.38em",
      textTransform:"uppercase", color:G.dim, margin:"16px 0 10px",
      display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${G.border})` }} />
      {text}
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${G.border},transparent)` }} />
    </div>
  )

  if (loading) return (
    <div style={{ textAlign:"center", padding:"3rem", color:G.dim,
      fontStyle:"italic", animation:"pulse 1.5s infinite" }}>
      Caricamento...
    </div>
  )

  return (
    <div>
      {/* View toggle */}
      <div style={{ display:"flex", background:G.bg, borderRadius:8,
        padding:3, marginBottom:16, gap:3 }}>
        {[
          { id:"profile",     label:"Il mio profilo" },
          { id:"ranks",       label:"Gradi"          },
          { id:"leaderboard", label:"Classifica"     },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            flex:1, fontFamily:"'Cinzel',serif", fontSize:"0.56rem",
            letterSpacing:"0.1em", textTransform:"uppercase",
            padding:"7px", borderRadius:6, border:"none", cursor:"pointer",
            background: activeView===v.id ? G.panel : "transparent",
            color: activeView===v.id ? G.gold : G.dim,
            transition:"all 0.25s",
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE VIEW ── */}
      {activeView === "profile" && levelData && (
        <div>
          {/* Hero card */}
          <div style={{
            background:`linear-gradient(135deg,#120e22,#0d0b1a)`,
            border:`2px solid ${levelData.rank.color}44`,
            borderRadius:16, padding:"1.8rem",
            textAlign:"center", marginBottom:16,
            position:"relative", overflow:"hidden",
            boxShadow:`0 0 40px ${levelData.rank.color}22`,
          }}>
            {/* Glow */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none",
              background:`radial-gradient(ellipse at 50% 0%, ${levelData.rank.color}18 0%, transparent 65%)` }} />

            <div style={{ fontSize:"3.5rem", marginBottom:8,
              filter:`drop-shadow(0 0 20px ${levelData.rank.color}88)` }}>
              {levelData.rank.icon}
            </div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif",
              fontSize:"clamp(1.5rem,5vw,2rem)", fontWeight:900,
              color:levelData.rank.color,
              textShadow:`0 0 20px ${levelData.rank.color}66`,
              marginBottom:4 }}>
              {levelData.rank.name}
            </div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
              letterSpacing:"0.3em", color:G.dim, textTransform:"uppercase",
              marginBottom:"1.5rem" }}>
              {user?.username} — Livello {levelData.level}
            </div>

            {/* XP Bar */}
            <XpBar levelData={levelData} showLabel={true} />

            {levelData.nextRank && (
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.55rem",
                color:G.dim, marginTop:8 }}>
                Prossimo grado: <span style={{ color:levelData.nextRank.color }}>
                  {levelData.nextRank.icon} {levelData.nextRank.name}
                </span> al Lv.{levelData.nextRank.minLevel}
              </div>
            )}
          </div>

          {/* Stats grid */}
          {sectionTitle("Statistiche")}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[
              { v: levelData.level,   l:"Livello",  c:levelData.rank.color },
              { v: levelData.xp,      l:"XP totale",c:G.gold },
              { v: `Tier ${levelData.tier}`, l:"Fascia",  c:"#60a5fa" },
              { v: user?.wins||0,     l:"Vittorie", c:"#4ade80" },
              { v: user?.losses||0,   l:"Sconfitte",c:"#f87171" },
              { v: user?.elo||1000,   l:"ELO",      c:G.gold },
            ].map(s => (
              <div key={s.l} style={{ background:G.panel, border:`1px solid ${G.border}`,
                borderRadius:10, padding:"0.85rem 0.5rem", textAlign:"center" }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem",
                  color:s.c, marginBottom:3 }}>{s.v}</div>
                <div style={{ fontSize:"0.5rem", letterSpacing:"0.1em",
                  color:G.dim, textTransform:"uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* XP sources */}
          {sectionTitle("Come guadagnare XP")}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))", gap:8 }}>
            {[
              { icon:"⚔️", ev:"Vittoria",        xp:"+50 XP",  mult:"×2.5 in Leggenda" },
              { icon:"💀", ev:"Sconfitta",        xp:"+15 XP",  mult:"×1.5 in Difficile" },
              { icon:"🌟", ev:"Livello Leggenda", xp:"×2.5 XP", mult:"bonus massimo"  },
              { icon:"💀", ev:"Livello Difficile",xp:"×1.5 XP", mult:"bonus alto"     },
            ].map(i => (
              <div key={i.ev} style={{ background:G.panel, border:`1px solid ${G.border}`,
                borderRadius:10, padding:"0.85rem", textAlign:"center" }}>
                <div style={{ fontSize:"1.5rem", marginBottom:5 }}>{i.icon}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem",
                  color:G.text, marginBottom:3 }}>{i.ev}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.72rem",
                  color:G.gold }}>{i.xp}</div>
                <div style={{ fontSize:"0.52rem", color:G.dim, marginTop:2,
                  fontStyle:"italic" }}>{i.mult}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RANKS VIEW ── */}
      {activeView === "ranks" && (
        <div>
          {sectionTitle("Tutti i gradi")}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {allRanks.map((rank, i) => {
              const isCurrentTier = levelData && levelData.rank.name === rank.name
              return (
                <div key={rank.name} style={{
                  background: isCurrentTier ? `${rank.color}12` : G.panel,
                  border:`1px solid ${isCurrentTier ? rank.color : G.border}`,
                  borderRadius:12, padding:"1rem",
                  display:"flex", alignItems:"center", gap:12,
                  transition:"all 0.25s",
                  boxShadow: isCurrentTier ? `0 0 20px ${rank.color}33` : undefined,
                }}>
                  <div style={{ fontSize:"2rem", width:44, textAlign:"center",
                    filter: isCurrentTier ? `drop-shadow(0 0 10px ${rank.color})` : undefined }}>
                    {rank.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={{ fontFamily:"'Cinzel',serif", fontSize:"0.72rem",
                        color: isCurrentTier ? rank.color : G.text, fontWeight:600 }}>
                        {rank.name}
                      </span>
                      {isCurrentTier && (
                        <span style={{ fontSize:"0.46rem", fontFamily:"'Cinzel',serif",
                          color: rank.color, background:`${rank.color}18`,
                          border:`1px solid ${rank.color}44`, borderRadius:10,
                          padding:"1px 6px" }}>
                          GRADO ATTUALE
                        </span>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:12, fontSize:"0.58rem", color:G.dim }}>
                      <span>Dal Lv.{rank.minLevel}</span>
                      <span>·</span>
                      <span>Tier {rank.tier}</span>
                      {rank.xpRequired > 0 && (
                        <>
                          <span>·</span>
                          <span>{rank.xpRequired.toLocaleString()} XP totale</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Progress toward this rank */}
                  {levelData && !isCurrentTier && levelData.level < rank.minLevel && (
                    <div style={{ textAlign:"right", fontSize:"0.52rem", color:G.dim }}>
                      Lv.{rank.minLevel - levelData.level} mancanti
                    </div>
                  )}
                  {levelData && levelData.level >= rank.minLevel && !isCurrentTier && (
                    <div style={{ fontSize:"0.9rem" }}>✓</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LEADERBOARD VIEW ── */}
      {activeView === "leaderboard" && (
        <div>
          {sectionTitle("Classifica per Livello")}
          <div style={{ background:G.panel, border:`1px solid ${G.border}`,
            borderRadius:12, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"grid",
              gridTemplateColumns:"36px 1fr 60px 60px 55px",
              alignItems:"center", padding:"8px 12px",
              background:"#0a0818", gap:6,
              fontFamily:"'Cinzel',serif", fontSize:"0.5rem",
              letterSpacing:"0.15em", textTransform:"uppercase", color:G.dim }}>
              <div>#</div>
              <div>Guerriero</div>
              <div style={{textAlign:"center"}}>Lv.</div>
              <div style={{textAlign:"right"}}>XP</div>
              <div style={{textAlign:"right"}}>ELO</div>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{ padding:"2rem", textAlign:"center",
                color:G.dim, fontStyle:"italic", fontSize:"0.75rem" }}>
                Nessun giocatore ancora
              </div>
            ) : leaderboard.map((p, i) => {
              const isMe = p.username?.toLowerCase() === user?.username?.toLowerCase()
              const medals = ["🥇","🥈","🥉"]
              return (
                <div key={p.id} style={{
                  display:"grid",
                  gridTemplateColumns:"36px 1fr 60px 60px 55px",
                  alignItems:"center", padding:"10px 12px", gap:6,
                  borderTop:`1px solid ${G.border}`,
                  background: isMe ? "#c9a84c08" : "transparent",
                  borderLeft:`2px solid ${isMe ? G.goldDim : "transparent"}`,
                }}>
                  <div style={{ fontFamily:"'Cinzel Decorative',serif",
                    fontSize:"0.8rem", textAlign:"center",
                    color: i < 3 ? [G.gold,"#9ca3af","#cd7c2f"][i] : G.dim }}>
                    {i < 3 ? medals[i] : i + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
                      color:G.text, marginBottom:2 }}>
                      {p.username}
                    </div>
                    <LevelBadge level={p.level||1} rank={p.rank} />
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.72rem",
                    color: p.rank?.color || G.text, textAlign:"center",
                    fontWeight:600 }}>
                    {p.level || 1}
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
                    color:G.dim, textAlign:"right" }}>
                    {(p.xp||0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
                    color:G.gold, textAlign:"right" }}>
                    {p.elo||1000}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
