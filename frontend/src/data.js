export const CARDS = [
  { id:1,  name:"Drago di Fiamma",      type:"Leggendaria", mana:7, atk:8, def:5, rarity:"legendary", power:"burn",   emoji:"🐉", color:"#f59e0b" },
  { id:2,  name:"Cavaliere Oscuro",     type:"Epica",        mana:4, atk:6, def:4, rarity:"epic",      power:"shield", emoji:"🗡️", color:"#a78bfa" },
  { id:3,  name:"Mago Arcano",          type:"Epica",        mana:5, atk:7, def:2, rarity:"epic",      power:"double", emoji:"🧙", color:"#8b5cf6" },
  { id:4,  name:"Fenice Sacra",         type:"Rara",         mana:6, atk:5, def:3, rarity:"rare",      power:"heal",   emoji:"🔥", color:"#f97316" },
  { id:5,  name:"Golem di Pietra",      type:"Rara",         mana:4, atk:2, def:9, rarity:"rare",      power:null,     emoji:"🪨", color:"#9ca3af" },
  { id:6,  name:"Arciere Elfico",       type:"Comune",       mana:2, atk:4, def:2, rarity:"common",    power:null,     emoji:"🏹", color:"#4ade80" },
  { id:7,  name:"Scheletro Antico",     type:"Comune",       mana:1, atk:3, def:1, rarity:"common",    power:null,     emoji:"💀", color:"#d1d5db" },
  { id:8,  name:"Unicorno Astrale",     type:"Rara",         mana:3, atk:3, def:5, rarity:"rare",      power:"heal",   emoji:"🦄", color:"#c084fc" },
  { id:9,  name:"Demone del Caos",      type:"Epica",        mana:6, atk:8, def:3, rarity:"epic",      power:"burn",   emoji:"😈", color:"#ef4444" },
  { id:10, name:"Nano Guerriero",       type:"Comune",       mana:2, atk:3, def:4, rarity:"common",    power:null,     emoji:"⚒️", color:"#fbbf24" },
  { id:11, name:"Sirena Oscura",        type:"Rara",         mana:4, atk:4, def:4, rarity:"rare",      power:"double", emoji:"🧜", color:"#38bdf8" },
  { id:12, name:"Titan Celeste",        type:"Leggendaria",  mana:8, atk:9, def:7, rarity:"legendary", power:"double", emoji:"⚡", color:"#facc15" },
  { id:13, name:"Orso Berserker",       type:"Rara",         mana:4, atk:7, def:2, rarity:"rare",      power:null,     emoji:"🐻", color:"#a16207" },
  { id:14, name:"Strega delle Nevi",    type:"Epica",        mana:5, atk:5, def:5, rarity:"epic",      power:"freeze", emoji:"🧊", color:"#7dd3fc" },
  { id:15, name:"Vampiro Antico",       type:"Epica",        mana:5, atk:6, def:3, rarity:"epic",      power:"drain",  emoji:"🧛", color:"#f43f5e" },
  { id:16, name:"Grifone da Guerra",    type:"Rara",         mana:5, atk:5, def:4, rarity:"rare",      power:null,     emoji:"🦅", color:"#fb923c" },
  { id:17, name:"Elementale del Fuoco", type:"Comune",       mana:3, atk:5, def:1, rarity:"common",    power:null,     emoji:"🌋", color:"#f87171" },
  { id:18, name:"Paladino della Luce",  type:"Leggendaria",  mana:7, atk:6, def:8, rarity:"legendary", power:"heal",   emoji:"🛡️", color:"#fde047" },
  { id:19, name:"Assassino Fantasma",   type:"Epica",        mana:4, atk:7, def:2, rarity:"epic",      power:"double", emoji:"🗡️", color:"#94a3b8" },
  { id:20, name:"Drago di Ghiaccio",    type:"Leggendaria",  mana:8, atk:7, def:7, rarity:"legendary", power:"freeze", emoji:"❄️", color:"#bae6fd" },
]

export const RARITY_COLOR = {
  common:    "#9ca3af",
  rare:      "#60a5fa",
  epic:      "#a78bfa",
  legendary: "#f59e0b",
}

export const DIFFICULTIES = {
  easy:   { label:"🌿 Facile",    enemyHP:20, handSize:5, atkMult:0.6, defMult:0.5, credits:15,  elo:10  },
  normal: { label:"⚔️ Normale",   enemyHP:30, handSize:4, atkMult:1.0, defMult:1.0, credits:30,  elo:25  },
  hard:   { label:"💀 Difficile", enemyHP:40, handSize:3, atkMult:1.4, defMult:1.3, credits:60,  elo:50  },
  legend: { label:"👑 Leggenda",  enemyHP:55, handSize:3, atkMult:1.8, defMult:1.7, credits:120, elo:100 },
}

export const POWERS = [
  { id:"burn",   name:"Aura di Fuoco",  icon:"🔥", desc:"+3 danni per 2 turni",  cost:80  },
  { id:"shield", name:"Scudo Divino",   icon:"🛡️", desc:"Dimezza danno subito",   cost:60  },
  { id:"heal",   name:"Cura Sacra",     icon:"💚", desc:"Ripristina 8 HP",        cost:70  },
  { id:"double", name:"Doppio Attacco", icon:"⚔️", desc:"Attacca due volte",      cost:100 },
  { id:"freeze", name:"Gelo Arcano",    icon:"❄️", desc:"Nemico salta 1 turno",   cost:90  },
  { id:"drain",  name:"Risucchio",      icon:"🩸", desc:"Ruba 5 HP al nemico",    cost:85  },
]

export const SHOP_PACKS = [
  { name:"Pacco Base",     icon:"📦", desc:"3 carte casuali",       cost:50,  cards:3, minRarity:"common"    },
  { name:"Pacco Epico",    icon:"💜", desc:"3 carte (min. Rare)",    cost:120, cards:3, minRarity:"rare"      },
  { name:"Pacco Leggenda", icon:"✨", desc:"1 Leggendaria garantita",cost:300, cards:3, minRarity:"legendary" },
]

export const PREMIUM_PACKS = [
  { id:"starter", name:"Starter Pack", icon:"📦", badge:"new",  sol:0.05, usd:7,  desc:"5 carte + 100 crediti + 2 giri", credits:100, spins:2  },
  { id:"warrior", name:"Warrior Pack", icon:"⚔️", badge:"hot",  sol:0.15, usd:21, desc:"10 carte + 300 cred + 5 giri + 1 potere", credits:300, spins:5  },
  { id:"legend",  name:"Legend Pack",  icon:"👑", badge:"best", sol:0.35, usd:49, desc:"20 carte + tutti i poteri + 1000 cred", credits:1000,spins:15, allPowers:true },
  { id:"season",  name:"Season Pass",  icon:"🌟", badge:"top",  sol:0.50, usd:70, desc:"30 carte + 2000 cred + 30 giri + bonus ELO", credits:2000,spins:30, allPowers:true },
]

export const WHEEL_PRIZES = [
  { label:"50 💰",  color:"#c9a84c", type:"credits", val:50  },
  { label:"Carta",  color:"#8b5cf6", type:"card",    val:1   },
  { label:"20 💰",  color:"#1e3a5f", type:"credits", val:20  },
  { label:"Potere", color:"#7f1d1d", type:"power",   val:1   },
  { label:"100 💰", color:"#1a4a1a", type:"credits", val:100 },
  { label:"Carta",  color:"#4a1a6a", type:"card",    val:1   },
  { label:"30 💰",  color:"#2a1a0a", type:"credits", val:30  },
  { label:"Giro 🎡",color:"#1a1a4a", type:"spin",    val:1   },
]
