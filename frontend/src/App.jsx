
import { useState, useEffect, useCallback, useRef } from "react";
import { CARDS, RARITY_COLOR, DIFFICULTIES, POWERS, SHOP_PACKS, PREMIUM_PACKS, WHEEL_PRIZES } from "./data.js";
import * as API from "./api.js";
import QuestsTab from "./QuestsTab.jsx";
import LevelsTab, { LevelBadge, XpBar, LevelUpOverlay } from "./LevelsTab.jsx";

// ═══════════════════════════════════════════════════════
// MOCK DATABASE — in produzione sostituisci con API calls
// ═══════════════════════════════════════════════════════
// API endpoints da implementare sul backend:
// POST /api/auth/register  → { username, email, password } → { user, token }
// POST /api/auth/login     → { username, password }        → { user, token }
// GET  /api/cards          → { cards[] }
// GET  /api/user/cards     → { userCards[] }
// POST /api/battle/result  → { difficulty, won }           → { eloNew, creditsNew }
// GET  /api/leaderboard    → { players[] }
// POST /api/shop/buy       → { itemId, type }              → { success }
// POST /api/premium/buy    → { packId, txSignature }       → { success, items }

const DB = {
  users: JSON.parse(localStorage.getItem('ark_users') || '{}'),
  currentUser: JSON.parse(localStorage.getItem('ark_current_user') || 'null'),
  save() {
    localStorage.setItem('ark_users', JSON.stringify(this.users));
    localStorage.setItem('ark_current_user', JSON.stringify(this.currentUser));
  },
  register(username, email, password) {
    const key = username.toLowerCase();
    if (this.users[key]) throw new Error('Username già in uso');
    const user = {
      id: Date.now(),
      username,
      email,
      passwordHash: btoa(password),
      elo: 1000,
      credits: 100,
      spins: 1,
      ownedPowers: [],
      wins: 0,
      losses: 0,
      wallet: null,
      createdAt: new Date().toISOString(),
    };
    this.users[key] = user;
    this.currentUser = user;
    this.save();
    return user;
  },
  login(username, password) {
    const key = username.toLowerCase();
    const user = this.users[key];
    if (!user) throw new Error('Utente non trovato');
    if (user.passwordHash !== btoa(password)) throw new Error('Password errata');
    this.currentUser = user;
    this.save();
    return user;
  },
  updateUser(updates) {
    if (!this.currentUser) return;
    const key = this.currentUser.username.toLowerCase();
    this.currentUser = { ...this.currentUser, ...updates };
    this.users[key] = this.currentUser;
    this.save();
    return this.currentUser;
  },
  getLeaderboard() {
    return Object.values(this.users).sort((a, b) => b.elo - a.elo);
  },
};

// ═══════════════════════════════════════════════════════
// CARD DATA
// ═══════════════════════════════════════════════════════
;

;

;

;

;

;

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const G = {
  gold:"#c9a84c", goldLight:"#f0d080", goldDim:"#7a6230",
  bg:"#07060e", panel:"#0d0b1a", border:"#2a2540",
  text:"#e8e0cc", dim:"#8a8070",
};

const rarityColor = { common:"#9ca3af", rare:"#60a5fa", epic:"#a78bfa", legendary:"#f59e0b" };

// ═══════════════════════════════════════════════════════
// CARD COMPONENT
// ═══════════════════════════════════════════════════════
function CardArt({ card, size = "full", onClick, selected, locked }) {
  const rc = rarityColor[card.rarity];
  const isSmall = size === "small";
  const s = isSmall ? { width:62, height:93, fontSize:"0.38rem" } : { width:"100%", aspectRatio:"2/3", fontSize:"0.58rem" };

  return (
    <div
      onClick={onClick}
      style={{
        position:"relative", borderRadius:8, overflow:"hidden", cursor:onClick?"pointer":"default",
        background:G.panel, border:`1px solid ${selected ? G.gold : G.border}`,
        width:s.width||undefined, height:s.height||undefined, aspectRatio:s.aspectRatio||undefined,
        boxShadow: selected ? `0 0 16px ${G.gold}88` : undefined,
        transition:"transform 0.2s, box-shadow 0.2s",
        flexShrink:0,
      }}
      className="card-hover"
    >
      {/* Rarity top bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:rc,
        boxShadow: card.rarity !== "common" ? `0 0 10px ${rc}` : undefined }} />

      {/* Background gradient */}
      <div style={{ position:"absolute", inset:0,
        background:`radial-gradient(ellipse at 50% 35%, ${card.color}22 0%, transparent 70%)` }} />

      {/* Big emoji art */}
      <div style={{ position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-62%)", fontSize: isSmall ? "1.6rem" : "clamp(2rem,8vw,3.5rem)",
        filter:`drop-shadow(0 4px 12px ${card.color}88)` }}>
        {card.emoji}
      </div>

      {/* Bottom overlay */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"50%",
        background:"linear-gradient(transparent,rgba(7,6,14,0.97))" }} />

      {/* Mana */}
      <div style={{ position:"absolute", top:isSmall?4:8, left:isSmall?4:8,
        width:isSmall?18:24, height:isSmall?18:24, borderRadius:"50%",
        background:"radial-gradient(#3b82f6,#1d4ed8)", display:"flex",
        alignItems:"center", justifyContent:"center", fontFamily:"serif",
        fontSize:isSmall?"0.65rem":"0.78rem", fontWeight:700, color:"white",
        border:"1px solid #60a5fa44" }}>
        {card.mana}
      </div>

      {/* Rarity badge */}
      {!isSmall && (
        <div style={{ position:"absolute", top:8, right:8, fontSize:"0.42rem",
          fontFamily:"serif", letterSpacing:"0.1em", textTransform:"uppercase",
          padding:"2px 4px", borderRadius:3, color:rc,
          border:`1px solid ${rc}33`, background:`${rc}0a` }}>
          {card.rarity}
        </div>
      )}

      {/* Card info */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:isSmall?"4px":"8px" }}>
        <div style={{ fontFamily:"serif", fontSize:s.fontSize, fontWeight:600,
          color:G.text, marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {card.name}
        </div>
        {!isSmall && (
          <div style={{ fontSize:"0.5rem", color:G.dim, fontStyle:"italic", marginBottom:4 }}>
            {card.type}
          </div>
        )}
        <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
          <span style={{ fontFamily:"serif", fontSize:isSmall?"0.52rem":"0.62rem", color:"#f87171" }}>⚔{card.atk}</span>
          <span style={{ fontFamily:"serif", fontSize:isSmall?"0.52rem":"0.62rem", color:"#60a5fa" }}>🛡{card.def}</span>
        </div>
      </div>

      {/* Locked */}
      {locked && (
        <div style={{ position:"absolute", inset:0, background:"#00000088",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>🔒</div>
      )}
      {selected && <div style={{ position:"absolute", inset:0, border:`2px solid ${G.gold}`, borderRadius:8, pointerEvents:"none" }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      let user;
      if (tab === "login") {
        user = DB.login(form.username, form.password);
      } else {
        if (!form.email.includes("@")) throw new Error("Email non valida");
        if (form.password.length < 6) throw new Error("Password min 6 caratteri");
        user = DB.register(form.username, form.email, form.password);
      }
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center",
      justifyContent:"center", padding:16, fontFamily:"'Crimson Pro', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&family=Cinzel:wght@400;600&family=Crimson+Pro:ital,wght@0,300;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07060e; }
        .card-hover:hover { transform: translateY(-4px) scale(1.02); }
        input::placeholder { color: #8a8070; font-style: italic; }
        input:focus { outline: none; border-color: #7a6230 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0b1a; }
        ::-webkit-scrollbar-thumb { background: #2a2540; border-radius: 2px; }
        @keyframes glow { from { filter: drop-shadow(0 0 10px #c9a84c44); } to { filter: drop-shadow(0 0 30px #c9a84c99); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes clashL { 0%{transform:translateX(-80px) scale(0.5);} 40%{transform:translateX(8px) scale(1.1);} 100%{transform:translateX(-20px) scale(0.8);opacity:0;} }
        @keyframes clashR { 0%{transform:translateX(80px) scale(0.5);} 40%{transform:translateX(-8px) scale(1.1);} 100%{transform:translateX(20px) scale(0.8);opacity:0;} }
        @keyframes clashVs { 0%{transform:scale(0);opacity:0;} 30%{transform:scale(1.5);opacity:1;} 100%{transform:scale(2);opacity:0;} }
        @keyframes clashWrap { 0%{opacity:0;transform:scale(0.5);} 15%{opacity:1;transform:scale(1.1);} 80%{opacity:1;} 100%{opacity:0;transform:scale(0.8);} }
        @keyframes hpFlash { 0%,100%{filter:brightness(1);} 50%{filter:brightness(2.5) saturate(2);} }
        @keyframes dmgFloat { 0%{transform:translateY(0) scale(0.5);opacity:1;} 30%{transform:translateY(-25px) scale(1.3);opacity:1;} 100%{transform:translateY(-70px);opacity:0;} }
        @keyframes shake { 0%,100%{transform:translate(0,0);} 20%{transform:translate(-5px,3px);} 40%{transform:translate(4px,-3px);} 60%{transform:translate(-3px,4px);} 80%{transform:translate(4px,-2px);} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes cardReveal { from{transform:rotateY(90deg) scale(0.8);} to{transform:rotateY(0) scale(1);} }
        @keyframes victoryIn { 0%{opacity:0;transform:scale(0.6) translateY(-40px);} 65%{opacity:1;transform:scale(1.06) translateY(4px);} 100%{opacity:1;transform:scale(1) translateY(0);} }
      `}</style>

      {/* Stars bg */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse at 20% 40%,#1a0a3030 0%,transparent 50%),radial-gradient(ellipse at 80% 70%,#0a153030 0%,transparent 50%)" }} />

      <div style={{ width:"100%", maxWidth:400, background:G.panel, border:`1px solid ${G.border}`,
        borderRadius:18, padding:"2rem 1.8rem", position:"relative", zIndex:1,
        animation:"fadeUp 0.5s ease" }}>

        <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(1.6rem,5vw,2rem)",
          fontWeight:900, textAlign:"center", marginBottom:4,
          background:`linear-gradient(135deg,${G.goldDim},${G.goldLight},${G.gold})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          filter:"drop-shadow(0 0 16px #c9a84c55)", animation:"glow 3s ease-in-out infinite alternate" }}>
          ARKANIS
        </div>
        <div style={{ textAlign:"center", fontFamily:"'Cinzel',serif", fontSize:"0.55rem",
          letterSpacing:"0.35em", color:G.dim, textTransform:"uppercase", marginBottom:"1.5rem" }}>
          Collect · Battle · Invest · on Solana
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:G.bg, borderRadius:8, padding:3, marginBottom:"1.4rem", gap:3 }}>
          {["login","register"].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
              flex:1, fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.1em",
              textTransform:"uppercase", padding:"0.5rem", borderRadius:6, border:"none",
              cursor:"pointer", transition:"all 0.25s",
              background: tab===t ? G.panel : "transparent",
              color: tab===t ? G.gold : G.dim,
            }}>
              {t === "login" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

        <form onSubmit={handle}>
          {[
            { key:"username", label:"Nome utente", type:"text", ph:"Il tuo nome guerriero..." },
            ...(tab==="register" ? [{ key:"email", label:"Email", type:"email", ph:"nome@esempio.com" }] : []),
            { key:"password", label:"Password", type:"password", ph:"••••••••" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:"0.85rem" }}>
              <label style={{ display:"block", fontFamily:"'Cinzel',serif", fontSize:"0.52rem",
                letterSpacing:"0.18em", color:G.dim, textTransform:"uppercase", marginBottom:4 }}>
                {f.label}
              </label>
              <input
                type={f.type} placeholder={f.ph} value={form[f.key]}
                onChange={e => setForm({...form, [f.key]: e.target.value})}
                style={{ width:"100%", background:G.bg, border:`1px solid ${G.border}`, borderRadius:8,
                  padding:"0.65rem 0.9rem", fontFamily:"'Crimson Pro',serif", fontSize:"0.9rem",
                  color:G.text, transition:"border-color 0.2s" }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background:"#dc262610", border:"1px solid #dc262633", borderRadius:8,
              padding:"0.55rem 0.9rem", fontSize:"0.7rem", color:"#f87171", marginBottom:"0.85rem", fontStyle:"italic" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:"100%", fontFamily:"'Cinzel',serif", fontSize:"0.62rem", letterSpacing:"0.15em",
            textTransform:"uppercase", padding:"0.7rem", borderRadius:6, border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,${G.goldDim},${G.gold})`, color:G.bg, fontWeight:700,
            opacity: loading ? 0.7 : 1, transition:"all 0.25s",
          }}>
            {loading ? "..." : tab === "login" ? "Entra nel regno" : "Crea account"}
          </button>
        </form>

        <div style={{ marginTop:"1rem", textAlign:"center", fontSize:"0.6rem", color:G.dim }}>
          Demo: usa qualsiasi username/password per registrarti
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COLLECTION TAB
// ═══════════════════════════════════════════════════════
function CollectionTab() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? CARDS : CARDS.filter(c => c.rarity === filter);

  return (
    <div>
      {/* Filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {["all","common","rare","epic","legendary"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily:"'Cinzel',serif", fontSize:"0.55rem", letterSpacing:"0.12em",
            textTransform:"uppercase", padding:"4px 10px", borderRadius:20, border:"1px solid",
            cursor:"pointer", transition:"all 0.2s",
            borderColor: filter===f ? (f==="all" ? G.gold : rarityColor[f]||G.gold) : G.border,
            background: filter===f ? `${(rarityColor[f]||G.gold)}18` : "transparent",
            color: filter===f ? (rarityColor[f]||G.gold) : G.dim,
          }}>
            {f === "all" ? "Tutte" : f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
        {filtered.map(c => <CardArt key={c.id} card={c} />)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BATTLE TAB
// ═══════════════════════════════════════════════════════
function BattleTab({ user, onUserUpdate }) {
  const [difficulty, setDifficulty] = useState("normal");
  const [playerHP, setPlayerHP] = useState(30);
  const [enemyHP, setEnemyHP] = useState(30);
  const [maxEnemyHP, setMaxEnemyHP] = useState(30);
  const [hand, setHand] = useState([]);
  const [playerField, setPlayerField] = useState([]);
  const [enemyField, setEnemyField] = useState([]);
  const [selected, setSelected] = useState(null);
  const [log, setLog] = useState({ text:"Seleziona la difficoltà e inizia a giocare!", type:"info" });
  const [clashing, setClashing] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [frozenTurns, setFrozenTurns] = useState(0);
  const [burnTurns, setBurnTurns] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [levelUpData, setLevelUpData] = useState(null);

  const startBattle = useCallback((diff) => {
    const d = DIFFICULTIES[diff];
    setPlayerHP(30); setEnemyHP(d.enemyHP); setMaxEnemyHP(d.enemyHP);
    setPlayerField([]); setEnemyField([]); setSelected(null);
    setGameOver(null); setFrozenTurns(0); setBurnTurns(0); setShieldActive(false);
    const newHand = [...CARDS].sort(() => Math.random()-0.5).slice(0, d.handSize);
    setHand(newHand);
    setLog({ text:`${d.label} — Hai ${d.handSize} carte. In bocca al lupo!`, type:"info" });
    // Enemy plays first card
    const pool = diff==="legend" ? CARDS.filter(c=>c.rarity==="legendary"||c.rarity==="epic")
               : diff==="hard"   ? CARDS.filter(c=>c.rarity!=="common")
               : CARDS;
    const ec = pool[Math.floor(Math.random()*pool.length)];
    setTimeout(() => {
      setEnemyField([ec]);
      setLog({ text:`Il nemico schiera ${ec.name} ${ec.emoji}!`, type:"damage" });
    }, 600);
  }, []);

  useEffect(() => { startBattle("normal"); }, []);

  const playCard = () => {
    if (selected === null) { setLog({ text:"Seleziona una carta dalla mano!", type:"info" }); return; }
    if (gameOver) return;
    const card = hand[selected];
    setPlayerField(prev => [...prev, card]);
    setHand(prev => prev.filter((_,i) => i !== selected));
    setSelected(null);
    setLog({ text:`Hai giocato ${card.name} ${card.emoji} (⚔${card.atk} 🛡${card.def})!`, type:"info" });
  };

  const attack = () => {
    if (playerField.length === 0) { setLog({ text:"Gioca prima una carta sul campo!", type:"info" }); return; }
    if (gameOver) return;
    if (frozenTurns > 0) { setFrozenTurns(f=>f-1); setLog({ text:"Il nemico era congelato — turno saltato!", type:"info" }); return; }

    const d = DIFFICULTIES[difficulty];
    const pCard = playerField[playerField.length-1];
    let totalAtk = playerField.reduce((s,c) => s+c.atk, 0);
    if (burnTurns > 0) { totalAtk += 3; setBurnTurns(b=>b-1); }

    // Show clash animation
    const eCard = enemyField[0];
    setClashing({ attacker: pCard, defender: eCard });
    setTimeout(() => setClashing(null), 1200);

    // Player attacks
    let newEnemyHP = enemyHP;
    if (eCard) {
      const scaledDef = Math.round(eCard.def * d.defMult);
      const dmg = Math.max(0, totalAtk - scaledDef);
      newEnemyHP = Math.max(0, enemyHP - dmg);
      setEnemyHP(newEnemyHP);
      setLog({ text:`${pCard.name} attacca ${eCard.name}! Danno: ${dmg} (Def:${scaledDef})`, type:"damage" });
    } else {
      newEnemyHP = Math.max(0, enemyHP - totalAtk);
      setEnemyHP(newEnemyHP);
      setLog({ text:`Attacco diretto! Danno: ${totalAtk}`, type:"damage" });
    }

    if (newEnemyHP <= 0) {
      setTimeout(() => {
        setGameOver("win");
        const newCredits = (user.credits||0) + d.credits;
        const newElo     = (user.elo||1000)  + d.elo;
        const newWins    = (user.wins||0)    + 1;
        const newSpins   = (user.spins||1)   + 1;
        // XP calc
        const xpGained   = Math.round(50 * ({ easy:0.8,normal:1,hard:1.5,legend:2.5 }[difficulty]||1));
        const oldXp      = user.xp    || 0;
        const oldLevel   = user.level  || 1;
        const newXp      = oldXp + xpGained;
        // Simple level formula: level = floor(newXp/100)^(1/1.8)+1
        const newLevel   = Math.max(oldLevel, Math.floor(Math.pow(newXp/100, 1/1.8)) + 1);
        const leveledUp  = newLevel > oldLevel;
        const levelUpBonus = leveledUp ? (newLevel - oldLevel) * 50 : 0;
        const RANK_LIST  = [
          {minLevel:1,name:"Recluta",color:"#9ca3af",icon:"🪨"},
          {minLevel:5,name:"Apprendista",color:"#4ade80",icon:"🌿"},
          {minLevel:10,name:"Guerriero",color:"#60a5fa",icon:"⚔️"},
          {minLevel:20,name:"Veterano",color:"#a78bfa",icon:"🔮"},
          {minLevel:35,name:"Campione",color:"#f59e0b",icon:"🏆"},
          {minLevel:50,name:"Gran Maestro",color:"#f97316",icon:"👑"},
          {minLevel:75,name:"Leggenda",color:"#ef4444",icon:"🌟"},
          {minLevel:100,name:"Immortale",color:"#c9a84c",icon:"💎"},
        ];
        const newRank = [...RANK_LIST].reverse().find(r => newLevel >= r.minLevel) || RANK_LIST[0];
        const updated = DB.updateUser({
          credits: newCredits + levelUpBonus,
          elo: newElo, wins: newWins, spins: newSpins,
          xp: newXp, level: newLevel
        });
        onUserUpdate(updated);
        if (leveledUp) {
          setTimeout(() => setLevelUpData({ oldLevel, newLevel, rank: newRank, bonus: levelUpBonus }), 800);
        }
      }, 400);
      return;
    }

    // Enemy counterattack
    setTimeout(() => {
      const totalEAtk = enemyField.reduce((s,c) => s + Math.round(c.atk * d.atkMult), 0);
      const totalPDef = playerField.reduce((s,c) => s+c.def, 0);
      let dmgToPlayer = Math.max(0, totalEAtk - Math.floor(totalPDef/2));
      let sh = shieldActive;
      if (sh) { dmgToPlayer = Math.floor(dmgToPlayer/2); setShieldActive(false); sh = false; }

      setShakeKey(k=>k+1);
      const newPlayerHP = Math.max(0, playerHP - dmgToPlayer);
      setPlayerHP(newPlayerHP);
      setLog({ text:`Il nemico contrattacca! Subisci ${dmgToPlayer} danni.`, type:"damage" });

      if (newPlayerHP <= 0) {
        setTimeout(() => {
          setGameOver("lose");
          const newElo = Math.max(0, (user.elo||1000) - 15);
          const newLosses = (user.losses||0) + 1;
          const updated = DB.updateUser({ elo:newElo, losses:newLosses });
          onUserUpdate(updated);
        }, 400);
        return;
      }

      // Enemy changes card
      if (Math.random() > 0.5) {
        const pool = difficulty==="legend" ? CARDS.filter(c=>c.rarity==="legendary"||c.rarity==="epic")
                   : difficulty==="hard"   ? CARDS.filter(c=>c.rarity!=="common") : CARDS;
        const nc = pool[Math.floor(Math.random()*pool.length)];
        setEnemyField([nc]);
        setLog({ text:`Il nemico gioca ${nc.name} ${nc.emoji}!`, type:"damage" });
      }

      // Draw card
      setHand(prev => {
        if (prev.length < d.handSize) {
          const dr = CARDS[Math.floor(Math.random()*CARDS.length)];
          return [...prev, dr];
        }
        return prev;
      });
    }, 700);
  };

  const usePower = (pid) => {
    if (gameOver) return;
    if (pid==="burn")   { setBurnTurns(2); setLog({ text:"🔥 Aura di Fuoco! +3 danni per 2 turni", type:"info" }); }
    if (pid==="shield") { setShieldActive(true); setLog({ text:"🛡️ Scudo attivato!", type:"info" }); }
    if (pid==="heal")   { setPlayerHP(h=>Math.min(30,h+8)); setLog({ text:"💚 Curati di 8 HP!", type:"heal" }); }
    if (pid==="freeze") { setFrozenTurns(1); setLog({ text:"❄️ Nemico congelato per 1 turno!", type:"info" }); }
    if (pid==="drain")  { setPlayerHP(h=>Math.min(30,h+5)); setEnemyHP(h=>Math.max(0,h-5)); setLog({ text:"🩸 Risucchiati 5 HP!", type:"heal" }); }
    if (pid==="double") { setLog({ text:"⚔️ Prossimo attacco raddoppiato!", type:"info" }); }
  };

  const logColors = { info:"#60a5fa", damage:"#f87171", heal:"#4ade80", victory:G.gold };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }} key={shakeKey}
      style={{ animation: shakeKey > 0 ? "shake 0.45s ease" : undefined }}>

      {/* Difficulty Selector */}
      <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
        {Object.entries(DIFFICULTIES).map(([key, d]) => (
          <button key={key} onClick={() => { setDifficulty(key); startBattle(key); }} style={{
            fontFamily:"'Cinzel',serif", fontSize:"0.56rem", letterSpacing:"0.1em",
            textTransform:"uppercase", padding:"5px 12px", borderRadius:20, border:"1px solid",
            cursor:"pointer", transition:"all 0.2s",
            borderColor: difficulty===key ? (key==="easy"?"#4ade80":key==="normal"?"#60a5fa":key==="hard"?"#f87171":G.gold) : G.border,
            background: difficulty===key ? `${(key==="easy"?"#4ade80":key==="normal"?"#60a5fa":key==="hard"?"#f87171":G.gold)}18` : "transparent",
            color: difficulty===key ? (key==="easy"?"#4ade80":key==="normal"?"#60a5fa":key==="hard"?"#f87171":G.gold) : G.dim,
          }}>
            {d.label}
          </button>
        ))}
      </div>

      {/* HP Bars */}
      {[
        { label:"Nemico", hp:enemyHP, max:maxEnemyHP, cls:"enemy", color:"linear-gradient(90deg,#dc2626,#f87171)", id:"enemy-hp" },
        { label:"Tu",     hp:playerHP, max:30,         cls:"player",color:"linear-gradient(90deg,#16a34a,#4ade80)", id:"player-hp" },
      ].map(b => (
        <div key={b.cls} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.52rem", color:G.dim,
            width:52, textTransform:"uppercase", letterSpacing:"0.08em" }}>{b.label}</div>
          <div style={{ flex:1, height:7, background:"#1a1530", borderRadius:4,
            border:`1px solid ${G.border}`, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:4, transition:"width 0.5s cubic-bezier(.34,1.56,.64,1)",
              background:b.color, width:`${Math.max(0,(b.hp/b.max)*100)}%` }} />
          </div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.62rem", color:G.text,
            width:28, textAlign:"right" }}>{Math.max(0,b.hp)}</div>
        </div>
      ))}

      {/* Enemy Field */}
      <div style={{ background:"linear-gradient(135deg,#0d0b1a,#0a0818)", border:`1px solid ${G.border}`,
        borderRadius:12, padding:"0.9rem", minHeight:120 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.52rem", letterSpacing:"0.28em",
          textTransform:"uppercase", color:G.dim, marginBottom:8 }}>Campo nemico</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {enemyField.length === 0
            ? <div style={{ width:62, height:93, borderRadius:6, border:`1px dashed ${G.border}`,
                display:"flex", alignItems:"center", justifyContent:"center", color:G.dim, opacity:0.4 }}>+</div>
            : enemyField.map((c,i) => <CardArt key={i} card={c} size="small" />)
          }
        </div>
      </div>

      {/* VS divider */}
      <div style={{ textAlign:"center", position:"relative", padding:"2px 0" }}>
        <div style={{ position:"absolute", top:"50%", left:"10%", right:"10%", height:1,
          background:`linear-gradient(90deg,transparent,${G.goldDim},transparent)` }} />
        <span style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"0.9rem", color:G.goldDim,
          background:G.bg, padding:"0 0.7rem", position:"relative" }}>⚔</span>
      </div>

      {/* Player Field */}
      <div style={{ background:"linear-gradient(135deg,#0d0b1a,#0a0818)", border:`1px solid ${G.border}`,
        borderRadius:12, padding:"0.9rem", minHeight:120 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.52rem", letterSpacing:"0.28em",
          textTransform:"uppercase", color:G.dim, marginBottom:8 }}>Il tuo campo</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {playerField.length === 0
            ? <div style={{ width:62, height:93, borderRadius:6, border:`1px dashed ${G.border}`,
                display:"flex", alignItems:"center", justifyContent:"center", color:G.dim, opacity:0.4 }}>+</div>
            : playerField.map((c,i) => <CardArt key={i} card={c} size="small" />)
          }
        </div>
      </div>

      {/* Battle log */}
      <div style={{ background:"#07060e", border:`1px solid ${G.border}`, borderRadius:8,
        padding:"0.7rem 0.9rem", fontSize:"0.78rem", color:logColors[log.type]||G.dim,
        minHeight:48, fontStyle:"italic", lineHeight:1.7 }}>
        {log.text}
      </div>

      {/* Hand */}
      <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:12, padding:"0.9rem" }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.55rem", letterSpacing:"0.3em",
          textTransform:"uppercase", color:G.dim, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${G.border},transparent)` }} />
          Mano
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${G.border},transparent)` }} />
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", minHeight:50 }}>
          {hand.length === 0
            ? <span style={{ color:G.dim, fontStyle:"italic", fontSize:"0.72rem" }}>Nessuna carta</span>
            : hand.map((c,i) => (
                <CardArt key={i} card={c} size="small" selected={selected===i}
                  onClick={() => setSelected(selected===i ? null : i)} />
              ))
          }
        </div>
      </div>

      {/* Power buttons */}
      {user.ownedPowers?.length > 0 && (
        <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
          {user.ownedPowers.map(pid => {
            const pw = POWERS.find(p=>p.id===pid);
            if (!pw) return null;
            return (
              <button key={pid} onClick={() => usePower(pid)} style={{
                fontFamily:"'Cinzel',serif", fontSize:"0.5rem", letterSpacing:"0.08em",
                padding:"5px 10px", borderRadius:5, border:"1px solid #a78bfa44",
                background:"#a78bfa0d", color:"#a78bfa", cursor:"pointer", transition:"all 0.2s",
              }}>
                {pw.icon} {pw.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Battle controls */}
      <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
        {[
          { label:"Gioca carta", color:`linear-gradient(135deg,${G.goldDim},${G.gold})`, textColor:G.bg, onClick:playCard },
          { label:"⚔ Attacca!", color:"linear-gradient(135deg,#7f1d1d,#dc2626)", textColor:"white", onClick:attack },
          { label:"↺ Nuova", color:"transparent", textColor:G.dim, border:`1px solid ${G.border}`, onClick:()=>startBattle(difficulty) },
        ].map(b => (
          <button key={b.label} onClick={b.onClick} style={{
            fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.12em",
            textTransform:"uppercase", padding:"8px 14px", borderRadius:6, border:b.border||"none",
            cursor:"pointer", background:b.color, color:b.textColor, fontWeight:700, transition:"all 0.25s",
          }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Clash overlay */}
      {clashing && (
        <div style={{ position:"fixed", inset:0, zIndex:600, pointerEvents:"none",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:0, animation:"clashWrap 1.2s ease forwards" }}>
            <span style={{ fontSize:"clamp(3rem,12vw,5rem)", animation:"clashL 1.2s ease forwards" }}>
              {clashing.attacker?.emoji || "⚔️"}
            </span>
            <span style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(1.2rem,5vw,2rem)",
              color:"#f87171", padding:"0 8px", textShadow:"0 0 20px #f8717188",
              animation:"clashVs 1.2s ease forwards" }}>⚡</span>
            <span style={{ fontSize:"clamp(3rem,12vw,5rem)", animation:"clashR 1.2s ease forwards" }}>
              {clashing.defender?.emoji || "🛡️"}
            </span>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div style={{ position:"fixed", inset:0, zIndex:700, display:"flex", alignItems:"center",
          justifyContent:"center", background:"#07060ecc", backdropFilter:"blur(6px)" }}>
          <div style={{ textAlign:"center", animation:"victoryIn 0.6s cubic-bezier(.34,1.56,.64,1) forwards",
            padding:"2rem" }}>
            <div style={{ fontSize:"5rem", marginBottom:"1rem" }}>{gameOver==="win" ? "🏆" : "💀"}</div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif",
              fontSize:"clamp(2rem,7vw,3rem)", fontWeight:900, marginBottom:8,
              color: gameOver==="win" ? G.gold : "#f87171",
              textShadow:`0 0 40px ${gameOver==="win"?G.gold+"88":"#f8717188"}` }}>
              {gameOver==="win" ? "VITTORIA!" : "SCONFITTA"}
            </div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.7rem", letterSpacing:"0.22em",
              color:G.dim, textTransform:"uppercase", marginBottom:"0.6rem" }}>
              {gameOver==="win"
                ? `+${DIFFICULTIES[difficulty].elo} ELO · +${DIFFICULTIES[difficulty].credits} Crediti · +1 Giro`
                : "-15 ELO"}
            </div>
            {gameOver==="win" && (
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem",
                color:"#a78bfa", marginBottom:"1.2rem" }}>
                +{Math.round(50*({easy:0.8,normal:1,hard:1.5,legend:2.5}[difficulty]||1))} XP
              </div>
            )}
            <button onClick={() => startBattle(difficulty)} style={{
              fontFamily:"'Cinzel',serif", fontSize:"0.62rem", letterSpacing:"0.15em",
              textTransform:"uppercase", padding:"10px 24px", borderRadius:6, border:"none",
              cursor:"pointer", background:`linear-gradient(135deg,${G.goldDim},${G.gold})`,
              color:G.bg, fontWeight:700 }}>
              {gameOver==="win" ? "⚔ Ancora" : "↺ Riprova"}
            </button>
          </div>
        </div>
      )}

      {/* Level-up overlay */}
      {levelUpData && (
        <LevelUpOverlay
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          rank={levelUpData.rank}
          bonus={levelUpData.bonus}
          onClose={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// REWARDS TAB
// ═══════════════════════════════════════════════════════
function RewardsTab({ user, onUserUpdate }) {
  const [dailyClaimed, setDailyClaimed] = useState(
    localStorage.getItem('ark_daily') === new Date().toDateString()
  );
  const [revealedCards, setRevealedCards] = useState([null,null,null]);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState("");
  const [wheelRot, setWheelRot] = useState(0);
  const canvasRef = useRef();

  useEffect(() => { drawWheel(wheelRot); }, [wheelRot]);

  function drawWheel(rot) {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const n = WHEEL_PRIZES.length, arc = (Math.PI*2)/n, cx=130, cy=130, r=120;
    ctx.clearRect(0,0,260,260);
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot * Math.PI/180); ctx.translate(-cx,-cy);
    WHEEL_PRIZES.forEach((p,i) => {
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,i*arc,(i+1)*arc); ctx.closePath();
      ctx.fillStyle=p.color; ctx.fill();
      ctx.strokeStyle='#c9a84c33'; ctx.lineWidth=1; ctx.stroke();
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(i*arc+arc/2);
      ctx.textAlign='right'; ctx.fillStyle='#e8e0cc';
      ctx.font="bold 11px 'Cinzel',serif"; ctx.fillText(p.label,r-8,4); ctx.restore();
    });
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2);
    ctx.fillStyle='#07060e'; ctx.fill();
    ctx.strokeStyle='#c9a84c'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#c9a84c'; ctx.font="12px serif";
    ctx.textAlign='center'; ctx.fillText('Ⱥ',cx,cy+4);
  }

  const claimDaily = () => {
    if (dailyClaimed) return;
    localStorage.setItem('ark_daily', new Date().toDateString());
    setDailyClaimed(true);
    const cards = Array(3).fill(null).map(() => CARDS[Math.floor(Math.random()*CARDS.length)]);
    cards.forEach((c,i) => setTimeout(() => {
      setRevealedCards(prev => { const n=[...prev]; n[i]=c; return n; });
    }, i*600+300));
    const updated = DB.updateUser({ credits:(user.credits||0)+10 });
    onUserUpdate(updated);
  };

  const spinWheel = () => {
    if (spinning) return;
    if ((user.spins||0) <= 0) { setSpinResult("Nessun giro disponibile! Vinci battaglie."); return; }
    setSpinning(true); setSpinResult("");
    const pi = Math.floor(Math.random()*WHEEL_PRIZES.length);
    const n = WHEEL_PRIZES.length, arc = 360/n;
    const deg = 360*6 + (n-pi)*arc - arc/2 + (Math.random()*arc*0.6-arc*0.3);
    const dur = 3500;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed/dur,1);
      const ease = t<0.5 ? 2*t*t : -1+(4-2*t)*t;
      setWheelRot(ease*deg);
      if (t < 1) requestAnimationFrame(animate);
      else {
        setSpinning(false);
        const prize = WHEEL_PRIZES[pi];
        let msg = "";
        let updates = { spins:(user.spins||0)-1 };
        if (prize.type==="credits") { updates.credits=(user.credits||0)+prize.val; msg=`🎉 Hai vinto ${prize.val} crediti!`; }
        else if (prize.type==="card") { const c=CARDS[Math.floor(Math.random()*CARDS.length)]; msg=`🃏 Carta: ${c.name} ${c.emoji}!`; }
        else if (prize.type==="power") { const pw=POWERS[Math.floor(Math.random()*POWERS.length)]; msg=`✨ Potere: ${pw.icon} ${pw.name}!`; const op=user.ownedPowers||[]; if(!op.includes(pw.id)) updates.ownedPowers=[...op,pw.id]; }
        else if (prize.type==="spin") { updates.spins=(updates.spins||0)+1; msg="🎡 Giro extra vinto!"; }
        setSpinResult(msg);
        const updated = DB.updateUser(updates);
        onUserUpdate(updated);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Daily Pack */}
      <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:14, padding:"1.3rem", textAlign:"center" }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.6rem", letterSpacing:"0.35em",
          textTransform:"uppercase", color:G.dim, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${G.border})` }} />
          Pacco Giornaliero
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${G.border},transparent)` }} />
        </div>
        <p style={{ fontSize:"0.75rem", color:G.dim, fontStyle:"italic", marginBottom:12 }}>
          {dailyClaimed ? "Hai già ritirato il pacco oggi. Torna domani!" : "Ritira 3 carte gratuite ogni giorno!"}
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:10, margin:"12px 0" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:75, height:112, borderRadius:8,
              border:`1px solid ${revealedCards[i] ? G.goldDim : G.border}`,
              background:revealedCards[i] ? "transparent" : G.bg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.4rem", position:"relative", overflow:"hidden",
              animation:revealedCards[i] ? "cardReveal 0.6s cubic-bezier(.34,1.56,.64,1) forwards" : undefined,
              boxShadow:revealedCards[i] ? `0 0 20px ${G.gold}33` : undefined }}>
              {revealedCards[i] ? (
                <div style={{ width:"100%", height:"100%" }}>
                  <CardArt card={revealedCards[i]} size="small" />
                </div>
              ) : "?"}
            </div>
          ))}
        </div>
        <button onClick={claimDaily} disabled={dailyClaimed} style={{
          fontFamily:"'Cinzel',serif", fontSize:"0.6rem", letterSpacing:"0.15em",
          textTransform:"uppercase", padding:"8px 20px", borderRadius:6, border:"none",
          cursor: dailyClaimed ? "default" : "pointer",
          background: dailyClaimed ? G.border : `linear-gradient(135deg,${G.goldDim},${G.gold})`,
          color: dailyClaimed ? G.dim : G.bg, fontWeight:700, opacity: dailyClaimed ? 0.6 : 1 }}>
          {dailyClaimed ? "✓ Ritirato oggi" : "🎁 Ritira il pacco"}
        </button>
      </div>

      {/* Fortune Wheel */}
      <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:14, padding:"1.3rem", textAlign:"center" }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.6rem", letterSpacing:"0.35em",
          textTransform:"uppercase", color:G.dim, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${G.border})` }} />
          Ruota della Fortuna
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${G.border},transparent)` }} />
        </div>
        <p style={{ fontSize:"0.72rem", color:G.dim, fontStyle:"italic", marginBottom:12 }}>
          Giri disponibili: <span style={{ color:G.gold, fontFamily:"'Cinzel',serif" }}>{user.spins||0}</span>
        </p>
        <div style={{ position:"relative", width:260, height:260, margin:"0 auto 12px" }}>
          <div style={{ position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)",
            fontSize:"1.6rem", filter:`drop-shadow(0 0 8px ${G.gold})`, zIndex:2 }}>▼</div>
          <canvas ref={canvasRef} width={260} height={260} style={{ borderRadius:"50%",
            boxShadow:`0 0 0 4px ${G.goldDim},0 0 30px #c9a84c44`, cursor: spinning?"wait":"pointer" }}
            onClick={spinWheel} />
        </div>
        {spinResult && (
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.82rem", color:G.gold, marginBottom:8 }}>
            {spinResult}
          </div>
        )}
        <button onClick={spinWheel} disabled={spinning} style={{
          fontFamily:"'Cinzel',serif", fontSize:"0.6rem", letterSpacing:"0.15em",
          textTransform:"uppercase", padding:"8px 20px", borderRadius:6, border:"none",
          cursor: spinning ? "wait" : "pointer",
          background:"linear-gradient(135deg,#4c1d95,#7c3aed)", color:"white", transition:"all 0.25s",
          opacity: spinning ? 0.7 : 1 }}>
          {spinning ? "..." : "🎡 Gira!"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SHOP TAB
// ═══════════════════════════════════════════════════════
function ShopTab({ user, onUserUpdate }) {
  const [payModal, setPayModal] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const buyPack = (pack) => {
    if ((user.credits||0) < pack.cost) { alert(`Crediti insufficienti! Servono ${pack.cost}.`); return; }
    const ro=["common","rare","epic","legendary"], mi=ro.indexOf(pack.minRarity);
    const pool=CARDS.filter(c=>ro.indexOf(c.rarity)>=mi);
    let msg=`📦 ${pack.name} aperto!\n\n`;
    for(let i=0;i<pack.cards;i++) { const c=pool[Math.floor(Math.random()*pool.length)]; msg+=`• ${c.emoji} ${c.name} (${c.rarity})\n`; }
    const updated=DB.updateUser({ credits:(user.credits||0)-pack.cost });
    onUserUpdate(updated);
    alert(msg);
  };

  const buyPower = (pw) => {
    if ((user.ownedPowers||[]).includes(pw.id)) { alert("Possiedi già questo potere!"); return; }
    if ((user.credits||0) < pw.cost) { alert(`Crediti insufficienti! Servono ${pw.cost}.`); return; }
    const updated=DB.updateUser({ credits:(user.credits||0)-pw.cost, ownedPowers:[...(user.ownedPowers||[]),pw.id] });
    onUserUpdate(updated);
  };

  const executePay = async () => {
    if (!payModal) return;
    setPaying(true); setPayError("");
    try {
      if (typeof window.solflare !== "undefined") {
        await window.solflare.connect();
        // In produzione: costruisci e invia transazione Solana reale
        // const tx = new Transaction().add(SystemProgram.transfer({...}));
        // await window.solflare.signAndSendTransaction(tx);
      }
      // Simula pagamento (demo)
      await new Promise(r => setTimeout(r, 1500));
      const pack = payModal;
      let updates = { credits:(user.credits||0)+pack.credits, spins:(user.spins||0)+pack.spins };
      if (pack.allPowers) updates.ownedPowers = POWERS.map(p=>p.id);
      const updated = DB.updateUser(updates);
      onUserUpdate(updated);
      setPayModal(null);
      alert(`✅ ${pack.name} acquistato!\n+${pack.credits} crediti, +${pack.spins} giri${pack.allPowers?" + tutti i poteri":""}`);
    } catch(err) {
      setPayError(err.message || "Transazione annullata");
    } finally {
      setPaying(false);
    }
  };

  const sectionTitle = (text) => (
    <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.38em",
      textTransform:"uppercase", color:G.dim, margin:"16px 0 10px",
      display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${G.border})` }} />
      {text}
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${G.border},transparent)` }} />
    </div>
  );

  return (
    <div>
      <p style={{ fontSize:"0.75rem", color:G.dim, fontStyle:"italic", marginBottom:4 }}>
        Crediti disponibili: <span style={{ color:G.gold, fontFamily:"'Cinzel',serif" }}>{user.credits||0}</span>
      </p>

      {sectionTitle("Pacchi con Crediti")}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:8 }}>
        {SHOP_PACKS.map(p => (
          <div key={p.name} onClick={() => buyPack(p)} style={{
            background:G.panel, border:`1px solid ${G.border}`, borderRadius:12, padding:"1rem",
            textAlign:"center", cursor:"pointer", transition:"all 0.25s" }}
            className="card-hover">
            <span style={{ fontSize:"1.8rem", marginBottom:8, display:"block" }}>{p.icon}</span>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.62rem", color:G.text, marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:"0.62rem", color:G.dim, fontStyle:"italic", marginBottom:8, lineHeight:1.5 }}>{p.desc}</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.7rem", color:G.gold }}>💰 {p.cost}</div>
          </div>
        ))}
      </div>

      {sectionTitle("Poteri Magici")}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))", gap:8, marginBottom:8 }}>
        {POWERS.map(pw => {
          const owned = (user.ownedPowers||[]).includes(pw.id);
          return (
            <div key={pw.id} onClick={() => !owned && buyPower(pw)} style={{
              background:G.panel, border:`1px solid ${owned?"#4ade8033":G.border}`,
              background: owned ? "#4ade8008" : G.panel,
              borderRadius:10, padding:"0.9rem", textAlign:"center",
              cursor: owned ? "default" : "pointer", transition:"all 0.25s", position:"relative" }}
              className={owned ? "" : "card-hover"}>
              {owned && <div style={{ position:"absolute", top:4, right:4, fontSize:"0.42rem",
                fontFamily:"'Cinzel',serif", color:"#4ade80", border:"1px solid #4ade8033",
                borderRadius:3, padding:"1px 4px", background:"#4ade8008" }}>POSSEDUTO</div>}
              <div style={{ fontSize:"1.6rem", marginBottom:6 }}>{pw.icon}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem", color:G.text, marginBottom:3 }}>{pw.name}</div>
              <div style={{ fontSize:"0.56rem", color:G.dim, fontStyle:"italic", marginBottom:6, lineHeight:1.4 }}>{pw.desc}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.6rem", color: owned ? "#4ade80" : "#60a5fa" }}>
                {owned ? "✓ Arsenale" : `💰 ${pw.cost}`}
              </div>
            </div>
          );
        })}
      </div>

      {sectionTitle("💎 Pacchetti Premium — SOL")}
      <p style={{ fontSize:"0.7rem", color:G.dim, fontStyle:"italic", marginBottom:10 }}>
        Acquista con SOL tramite Solflare. Contenuti esclusivi e permanenti.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
        {PREMIUM_PACKS.map(p => (
          <div key={p.id} onClick={() => { setPayModal(p); setPayError(""); }} style={{
            background:"linear-gradient(135deg,#120e22,#0d0b1a)",
            border:`1px solid ${G.goldDim}`, borderRadius:14, padding:"1.2rem",
            textAlign:"center", cursor:"pointer", transition:"all 0.3s",
            position:"relative", overflow:"hidden" }}
            className="card-hover">
            <span style={{ position:"absolute", top:6, right:6, fontSize:"0.44rem",
              fontFamily:"'Cinzel',serif", letterSpacing:"0.08em", padding:"2px 6px",
              borderRadius:10, textTransform:"uppercase",
              background: p.badge==="new"?"#16a34a22":p.badge==="hot"?"#dc262622":"#c9a84c22",
              color: p.badge==="new"?"#4ade80":p.badge==="hot"?"#f87171":G.gold,
              border:`1px solid ${p.badge==="new"?"#16a34a44":p.badge==="hot"?"#dc262644":"#c9a84c44"}` }}>
              {p.badge}
            </span>
            <span style={{ fontSize:"2rem", marginBottom:8, display:"block" }}>{p.icon}</span>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem", color:G.text, marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:"0.58rem", color:G.dim, fontStyle:"italic", marginBottom:8, lineHeight:1.5 }}>{p.desc}</div>
            <span style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1rem", color:G.gold, display:"block" }}>
              ◎ {p.sol} SOL
            </span>
            <span style={{ fontSize:"0.56rem", color:G.dim }}>≈ ${p.usd} USD</span>
          </div>
        ))}
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div style={{ position:"fixed", inset:0, zIndex:800, background:"#07060eee",
          backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center",
          animation:"fadeUp 0.3s ease" }}>
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:16,
            padding:"2rem 1.8rem", maxWidth:340, width:"90%", textAlign:"center" }}>
            <span style={{ fontSize:"2.5rem", marginBottom:10, display:"block" }}>{payModal.icon}</span>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1rem", color:G.gold, marginBottom:6 }}>{payModal.name}</div>
            <div style={{ fontSize:"0.68rem", color:G.dim, fontStyle:"italic", marginBottom:12, lineHeight:1.6 }}>{payModal.desc}</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.3rem", color:G.gold, marginBottom:3 }}>◎ {payModal.sol} SOL</div>
            <div style={{ fontSize:"0.62rem", color:G.dim, marginBottom:"1.2rem" }}>≈ ${payModal.usd} USD</div>
            {payError && (
              <div style={{ background:"#dc262610", border:"1px solid #dc262633", borderRadius:8,
                padding:"0.5rem", fontSize:"0.65rem", color:"#f87171", marginBottom:"0.9rem", fontStyle:"italic" }}>
                {payError}
              </div>
            )}
            <button onClick={executePay} disabled={paying} style={{
              width:"100%", fontFamily:"'Cinzel',serif", fontSize:"0.62rem", letterSpacing:"0.15em",
              textTransform:"uppercase", padding:"10px", borderRadius:6, border:"none",
              cursor: paying ? "wait" : "pointer", marginBottom:8,
              background:`linear-gradient(135deg,${G.goldDim},${G.gold})`,
              color:G.bg, fontWeight:700, opacity: paying ? 0.7 : 1 }}>
              {paying ? "Elaborazione..." : `🔥 Paga ◎ ${payModal.sol} SOL`}
            </button>
            <button onClick={() => setPayModal(null)} style={{
              width:"100%", fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.12em",
              textTransform:"uppercase", padding:"8px", borderRadius:6,
              border:`1px solid ${G.border}`, background:"transparent", color:G.dim, cursor:"pointer" }}>
              Annulla
            </button>
            <p style={{ fontSize:"0.55rem", color:G.dim, marginTop:10, fontStyle:"italic", lineHeight:1.6 }}>
              ⚠ Prototipo: pagamento simulato.<br/>In produzione si apre Solflare.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LEADERBOARD TAB
// ═══════════════════════════════════════════════════════
function LeaderboardTab({ user }) {
  const RANK_TITLES = [
    {min:1400,t:"👑 Gran Maestro"},{min:1200,t:"⚔ Campione"},
    {min:1050,t:"🔥 Veterano"},{min:900,t:"🗡 Guerriero"},{min:0,t:"🪨 Recluta"},
  ];
  const getTitle = (s) => RANK_TITLES.find(r=>s>=r.min)?.t || "🪨 Recluta";

  const DEMO = [
    {username:"ShadowBlade",elo:1480,wins:42,losses:8},
    {username:"IronGolem99",elo:1350,wins:31,losses:12},
    {username:"ArcaneWitch", elo:1210,wins:27,losses:15},
    {username:"DarkKnight",  elo:1120,wins:19,losses:14},
    {username:"PhoenixRider",elo:1045,wins:14,losses:16},
  ];

  const dbPlayers = DB.getLeaderboard();
  const all = [...DEMO];
  dbPlayers.forEach(p => {
    const idx = all.findIndex(d => d.username.toLowerCase()===p.username?.toLowerCase());
    if (idx!==-1) all[idx]=p; else all.push(p);
  });
  const players = all.sort((a,b)=>b.elo-a.elo);

  // My stats
  const myPos = players.findIndex(p => p.username?.toLowerCase()===user.username?.toLowerCase());

  return (
    <div>
      {/* My stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
        {[
          {v:user.elo||1000, l:"ELO"},
          {v:user.wins||0, l:"Vittorie", c:"#4ade80"},
          {v:user.losses||0, l:"Sconfitte", c:"#f87171"},
          {v:myPos>=0?`#${myPos+1}`:"—", l:"Posizione"},
        ].map(s => (
          <div key={s.l} style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10,
            padding:"0.85rem 0.4rem", textAlign:"center" }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.95rem", color:s.c||G.gold, marginBottom:3 }}>{s.v}</div>
            <div style={{ fontSize:"0.5rem", letterSpacing:"0.1em", color:G.dim, textTransform:"uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:12, overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:"38px 1fr 70px 45px 45px",
          alignItems:"center", padding:"8px 12px", background:"#0a0818",
          fontFamily:"'Cinzel',serif", fontSize:"0.5rem", letterSpacing:"0.18em",
          textTransform:"uppercase", color:G.dim, gap:6 }}>
          <div>#</div><div>Guerriero</div>
          <div style={{textAlign:"right"}}>ELO</div>
          <div style={{textAlign:"center"}}>V</div>
          <div style={{textAlign:"center"}}>S</div>
        </div>
        {players.slice(0,20).map((p, i) => {
          const isMe = p.username?.toLowerCase()===user.username?.toLowerCase();
          const medals = ["🥇","🥈","🥉"];
          return (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"38px 1fr 70px 45px 45px",
              alignItems:"center", padding:"10px 12px", gap:6,
              borderTop:`1px solid ${G.border}`,
              background: isMe ? "#c9a84c08" : "transparent",
              borderLeft: isMe ? `2px solid ${G.goldDim}` : "2px solid transparent" }}>
              <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"0.85rem", textAlign:"center",
                color: i<3 ? [G.gold,"#9ca3af","#cd7c2f"][i] : G.dim }}>
                {i<3 ? medals[i] : i+1}
              </div>
              <div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.65rem", color:G.text }}>
                  {p.username}
                </div>
                <div style={{ fontSize:"0.46rem", letterSpacing:"0.1em", color:G.goldDim, marginTop:1 }}>
                  {getTitle(p.elo||1000)}
                </div>
              </div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.72rem", color:G.gold, textAlign:"right" }}>
                {p.elo||1000}
              </div>
              <div style={{ fontSize:"0.65rem", color:"#4ade80", textAlign:"center" }}>{p.wins||0}</div>
              <div style={{ fontSize:"0.65rem", color:"#f87171", textAlign:"center" }}>{p.losses||0}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TOKEN TAB
// ═══════════════════════════════════════════════════════
function TokenTab() {
  const [crypto, setCrypto] = useState("USDC");
  const [amount, setAmount] = useState(10);
  const prices = { SOL:142, ETH:2980, USDC:1 };

  return (
    <div>
      <div style={{ textAlign:"center", padding:"1.8rem 1rem", marginBottom:16,
        background:"linear-gradient(135deg,#0d0b1a,#120e22)", border:`1px solid ${G.border}`,
        borderRadius:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-50%", left:"-50%", width:"200%", height:"200%",
          background:"conic-gradient(from 0deg at 50% 50%,transparent 0deg,#c9a84c08 60deg,transparent 120deg)",
          animation:"spin 20s linear infinite", pointerEvents:"none" }} />
        <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"2.8rem", position:"relative",
          background:`linear-gradient(135deg,${G.goldDim},${G.goldLight})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Ⱥ</div>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.62rem", letterSpacing:"0.38em",
          color:G.dim, margin:"4px 0 8px", textTransform:"uppercase", position:"relative" }}>
          Arkanis Token — ARK
        </div>
        <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.7rem", color:G.gold, position:"relative" }}>
          $0.0042
        </div>
        <div style={{ display:"inline-block", color:"#4ade80", fontFamily:"'Cinzel',serif",
          fontSize:"0.62rem", background:"#16a34a1a", border:"1px solid #16a34a33",
          borderRadius:4, padding:"2px 7px", position:"relative", marginTop:4 }}>
          ▲ +18.3% questa settimana
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        {[["4.2M","Supply totale"],["1.8M","In circolazione"],["847","Holder"],
          ["$7,560","Volume 24h"],["30%","Revenue holder"],["Q3 2025","Next drop"]].map(([v,l]) => (
          <div key={l} style={{ background:G.panel, border:`1px solid ${G.border}`,
            borderRadius:10, padding:"0.9rem", textAlign:"center" }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem", color:G.gold, marginBottom:3 }}>{v}</div>
            <div style={{ fontSize:"0.55rem", letterSpacing:"0.15em", color:G.dim, textTransform:"uppercase" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:12, padding:"1.1rem", maxWidth:400, margin:"0 auto" }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.25em",
          color:G.dim, textTransform:"uppercase", marginBottom:12 }}>Acquista Token ARK</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
          {["USDC","SOL","ETH"].map(c => (
            <button key={c} onClick={() => setCrypto(c)} style={{
              background: crypto===c ? "#c9a84c08" : G.bg,
              border:`1px solid ${crypto===c ? G.goldDim : G.border}`,
              borderRadius:8, padding:"8px", textAlign:"center", cursor:"pointer",
              fontFamily:"'Cinzel',serif", fontSize:"0.56rem",
              color: crypto===c ? G.gold : G.dim, transition:"all 0.2s" }}>
              <span style={{ fontSize:"1.1rem", display:"block", marginBottom:3 }}>
                {c==="USDC"?"$":c==="SOL"?"◎":"Ξ"}
              </span>
              {c}
            </button>
          ))}
        </div>
        <div style={{ position:"relative", marginBottom:10 }}>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min={1}
            style={{ width:"100%", background:G.bg, border:`1px solid ${G.border}`, borderRadius:8,
              padding:"0.65rem 0.9rem", fontFamily:"'Cinzel',serif", fontSize:"0.9rem", color:G.text }} />
          <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            fontFamily:"'Cinzel',serif", fontSize:"0.58rem", color:G.goldDim }}>{crypto}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"0.65rem", background:"#c9a84c08", border:"1px solid #c9a84c1a",
          borderRadius:8, marginBottom:12 }}>
          <span style={{ fontSize:"0.68rem", color:G.dim }}>Token stimati</span>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:"0.9rem", color:G.gold }}>
            ~{Math.floor(amount*(prices[crypto]||1)/0.0042).toLocaleString("it-IT")} ARK
          </span>
        </div>
        <button onClick={() => alert("🔒 In produzione si apre Solflare per acquistare token ARK.")}
          style={{ width:"100%", fontFamily:"'Cinzel',serif", fontSize:"0.62rem", letterSpacing:"0.15em",
            textTransform:"uppercase", padding:"10px", borderRadius:6, border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,${G.goldDim},${G.gold})`, color:G.bg, fontWeight:700 }}>
          Connetti Wallet & Acquista
        </button>
        <p style={{ fontSize:"0.62rem", color:G.dim, textAlign:"center", fontStyle:"italic",
          marginTop:10, lineHeight:1.6 }}>
          ⚠ Prototipo. I token ARK non sono ancora in vendita.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(DB.currentUser);
  const [tab, setTab] = useState("collection");

  if (!user) return <AuthScreen onLogin={setUser} />;

  const TABS = [
    { id:"collection", label:"⚔ Carte"     },
    { id:"battle",     label:"🔥 Battaglia" },
    { id:"quests",     label:"📜 Quest"     },
    { id:"levels",     label:"⭐ Livelli"   },
    { id:"rewards",    label:"🎁 Premi"     },
    { id:"shop",       label:"🏪 Negozio"   },
    { id:"leaderboard",label:"🏆 Classifica"},
    { id:"token",      label:"◈ ARK"       },
  ];

  return (
    <div style={{ minHeight:"100vh", background:G.bg, fontFamily:"'Crimson Pro',Georgia,serif",
      color:G.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&family=Cinzel:wght@400;600&family=Crimson+Pro:ital,wght@0,300;1,300&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#07060e; }
        .card-hover:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 10px 25px #c9a84c22; }
        input::placeholder { color:#8a8070; font-style:italic; }
        input:focus { outline:none; border-color:#7a6230 !important; box-shadow:0 0 0 2px #c9a84c12; }
        button:hover { filter:brightness(1.1); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0d0b1a; }
        ::-webkit-scrollbar-thumb { background:#2a2540; border-radius:2px; }
        @keyframes glow { from{filter:drop-shadow(0 0 10px #c9a84c44);} to{filter:drop-shadow(0 0 30px #c9a84c99);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        @keyframes clashL { 0%{transform:translateX(-80px) scale(0.5);} 40%{transform:translateX(8px) scale(1.1);} 100%{transform:translateX(-20px) scale(0.8);opacity:0;} }
        @keyframes clashR { 0%{transform:translateX(80px) scale(0.5);} 40%{transform:translateX(-8px) scale(1.1);} 100%{transform:translateX(20px) scale(0.8);opacity:0;} }
        @keyframes clashVs { 0%{transform:scale(0);opacity:0;} 30%{transform:scale(1.5);opacity:1;} 100%{transform:scale(2);opacity:0;} }
        @keyframes clashWrap { 0%{opacity:0;transform:scale(0.5);} 15%{opacity:1;transform:scale(1.1);} 80%{opacity:1;} 100%{opacity:0;transform:scale(0.8);} }
        @keyframes hpFlash { 0%,100%{filter:brightness(1);} 50%{filter:brightness(2.5) saturate(2);} }
        @keyframes shake { 0%,100%{transform:translate(0,0);} 20%{transform:translate(-5px,3px);} 40%{transform:translate(4px,-3px);} 60%{transform:translate(-3px,4px);} 80%{transform:translate(4px,-2px);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes cardReveal { from{transform:rotateY(90deg) scale(0.8);} to{transform:rotateY(0) scale(1);} }
        @keyframes victoryIn { 0%{opacity:0;transform:scale(0.6) translateY(-40px);} 65%{opacity:1;transform:scale(1.06) translateY(4px);} 100%{opacity:1;transform:scale(1) translateY(0);} }
      `}</style>

      {/* Stars background */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background:"radial-gradient(ellipse at 20% 40%,#1a0a3020 0%,transparent 50%),radial-gradient(ellipse at 80% 70%,#0a153020 0%,transparent 50%)" }} />

      {/* Header */}
      <header style={{ position:"relative", zIndex:10, textAlign:"center",
        padding:"1.4rem 1rem 0.7rem", borderBottom:`1px solid ${G.border}`,
        background:"linear-gradient(180deg,#0d0b1a 0%,transparent 100%)" }}>
        <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(1.5rem,5vw,2.5rem)",
          fontWeight:900, background:`linear-gradient(135deg,${G.goldDim},${G.goldLight},${G.gold})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"glow 3s ease-in-out infinite alternate" }}>
          ARKANIS
        </div>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem", letterSpacing:"0.28em",
          color:G.dim, marginTop:2 }}>Collect · Battle · Invest · on Solana</div>
      </header>

      {/* Credits bar */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16,
        padding:"0.45rem 1rem", background:"#0a0818", borderBottom:`1px solid ${G.border}`,
        flexWrap:"wrap", position:"relative", zIndex:10 }}>
        {[
          { icon:"💰", label:"Crediti", val:user.credits||0 },
          { icon:"⚡", label:"ELO",     val:user.elo||1000  },
          { icon:"🎡", label:"Giri",    val:user.spins||0   },
        ].map(i => (
          <div key={i.label} style={{ fontFamily:"'Cinzel',serif", fontSize:"0.58rem",
            letterSpacing:"0.08em", display:"flex", alignItems:"center", gap:5 }}>
            {i.icon} <span style={{ color:G.dim }}>{i.label}:</span>
            <span style={{ color:G.gold, fontWeight:700 }}>{i.val}</span>
          </div>
        ))}
        {/* Level badge */}
        {user.level && (
          <LevelBadge
            level={user.level}
            rank={{ icon:"⭐", name:`Lv.${user.level}`, color:G.gold }}
          />
        )}
        <button onClick={() => { DB.updateUser(null); DB.currentUser=null; DB.save(); setUser(null); }}
          style={{ fontFamily:"'Cinzel',serif", fontSize:"0.52rem", padding:"3px 8px",
            borderRadius:4, border:`1px solid ${G.border}`, background:"transparent",
            color:G.dim, cursor:"pointer" }}>
          ✕ {user.username}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ display:"flex", justifyContent:"center", flexWrap:"wrap",
        background:G.panel, borderBottom:`1px solid ${G.border}`, position:"relative", zIndex:10 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontFamily:"'Cinzel',serif", fontSize:"0.56rem", letterSpacing:"0.12em",
            textTransform:"uppercase", color: tab===t.id ? G.gold : G.dim,
            background:"none", border:"none", padding:"0.75rem 0.8rem", cursor:"pointer",
            transition:"all 0.3s", position:"relative", borderBottom: tab===t.id ? `2px solid ${G.gold}` : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ position:"relative", zIndex:5, maxWidth:1100, margin:"0 auto",
        padding:"1.2rem 0.8rem" }}>
        <div key={tab} style={{ animation:"fadeUp 0.3s ease" }}>
          {tab === "collection"  && <CollectionTab />}
          {tab === "battle"      && <BattleTab user={user} onUserUpdate={setUser} />}
          {tab === "quests"      && <QuestsTab user={user} onUserUpdate={setUser} />}
          {tab === "levels"      && <LevelsTab user={user} />}
          {tab === "rewards"     && <RewardsTab user={user} onUserUpdate={setUser} />}
          {tab === "shop"        && <ShopTab user={user} onUserUpdate={setUser} />}
          {tab === "leaderboard" && <LeaderboardTab user={user} />}
          {tab === "token"       && <TokenTab />}
        </div>
      </main>
    </div>
  );
}
