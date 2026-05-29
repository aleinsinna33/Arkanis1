# ARKANIS — Crypto Card Game

Stack: React + Vite · Node.js + Express · PostgreSQL · Docker · Solana

## Avvio rapido

```bash
# 1. Clona e configura
cp backend/.env.example backend/.env
# Modifica backend/.env con i tuoi valori

# 2. Avvia tutto con Docker
docker-compose up -d

# 3. Esegui le migrazioni (prima volta)
./deploy.sh migrate
```

## Senza Docker (sviluppo locale)

```bash
# Database (PostgreSQL deve essere installato)
createdb arkanis_db

# Backend
cd backend && npm install && npm run db:migrate && npm run dev

# Frontend (altro terminale)
cd frontend && npm install && npm run dev
```

## Deploy script

```bash
chmod +x deploy.sh

./deploy.sh          # Menu interattivo completo
./deploy.sh deploy   # Full deploy
./deploy.sh pull     # Git pull
./deploy.sh push     # Commit + push
./deploy.sh backup   # Backup database
./deploy.sh status   # Status sistema
```

## Struttura

```
arkanis/
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # App principale (Auth, Collection, Battle, Shop, Leaderboard, Token)
│   │   ├── QuestsTab.jsx  # Quest giornaliere con countdown e ricompense
│   │   ├── data.js        # Carte, difficoltà, poteri, pacchi
│   │   ├── api.js         # Chiamate backend (auth, cards, battle, quests, shop, premium)
│   │   └── index.css      # Stili e animazioni globali
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   └── src/
│       ├── index.js
│       ├── middleware/auth.js
│       ├── models/db.js
│       ├── models/migrate.js
│       └── routes/
│           ├── auth.js
│           ├── cards.js
│           ├── battle.js        # Auto-aggiorna progresso quest dopo ogni battaglia
│           ├── leaderboard.js
│           ├── shop.js
│           ├── premium.js
│           └── quests.js        # GET/POST progress/claim — 12 quest nel pool, 3 al giorno
├── docker-compose.yml
├── deploy.sh
└── .gitignore
```

## Variabili .env

```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/arkanis_db
JWT_SECRET=stringa_random_64_caratteri
FRONTEND_URL=http://localhost:5173
SOLANA_TREASURY_WALLET=il_tuo_wallet_solana
SOLANA_NETWORK=mainnet-beta
```

## Deploy su VPS

```bash
# Server Ubuntu 22.04
sudo apt update && sudo apt install -y docker.io docker-compose git

https://github.com/aleinsinna33/Arkanis1.git
cd arkanis
cp backend/.env.example backend/.env
# Modifica .env

docker-compose up -d
./deploy.sh migrate
```
