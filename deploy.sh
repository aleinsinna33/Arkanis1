#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  ARKANIS — Deploy & Management Script
#  Uso: chmod +x deploy.sh && ./deploy.sh
# ═══════════════════════════════════════════════════════════════════

set -e

# ── COLORI ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── CONFIGURAZIONE ────────────────────────────────────────────────
PROJECT_NAME="arkanis"
FRONTEND_DIR="./frontend"
BACKEND_DIR="./backend"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
LOG_FILE="./deploy.log"
BACKUP_DIR="./backups"

# ── HELPERS ───────────────────────────────────────────────────────
log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
ok()  { echo -e "${GREEN}✓${NC} $1"; }
err() { echo -e "${RED}✗ ERRORE:${NC} $1"; }
warn(){ echo -e "${YELLOW}⚠${NC} $1"; }
sep() { echo -e "${GOLD}═══════════════════════════════════════════════════════${NC}"; }
line(){ echo -e "${BLUE}───────────────────────────────────────────────────────${NC}"; }

header() {
  clear
  sep
  echo -e "${GOLD}${BOLD}"
  echo "    ╔═══════════════════════════════════╗"
  echo "    ║       ARKANIS  DEPLOY TOOL        ║"
  echo "    ║    Crypto Card Game Manager       ║"
  echo "    ╚═══════════════════════════════════╝"
  echo -e "${NC}"
  sep
  echo -e " ${WHITE}Progetto:${NC} $PROJECT_NAME  |  ${WHITE}Data:${NC} $(date '+%d/%m/%Y %H:%M')  |  ${WHITE}Branch:${NC} $(git branch --show-current 2>/dev/null || echo 'N/A')"
  sep
  echo ""
}

press_enter() {
  echo ""
  echo -e "${YELLOW}Premi INVIO per continuare...${NC}"
  read -r
}

confirm() {
  echo -e "${YELLOW}$1 [s/N]${NC} "
  read -r resp
  [[ "$resp" =~ ^[sS]$ ]]
}

check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    warn "File .env non trovato!"
    if [ -f ".env.example" ]; then
      warn "Trovato .env.example — vuoi copiarlo in .env? [s/N]"
      read -r resp
      if [[ "$resp" =~ ^[sS]$ ]]; then
        cp .env.example .env
        ok ".env creato da .env.example — ricordati di compilare i valori!"
      fi
    fi
  fi
}

require_env() {
  check_env
  if [ ! -f "$ENV_FILE" ]; then
    err "File .env mancante. Impossibile continuare."
    press_enter
    return 1
  fi
  source "$ENV_FILE"
}

# ── MENU PRINCIPALE ───────────────────────────────────────────────
main_menu() {
  header
  echo -e " ${WHITE}${BOLD}MENU PRINCIPALE${NC}"
  line
  echo -e "  ${CYAN}1${NC}  🔀  GIT — Push / Pull / Status"
  echo -e "  ${CYAN}2${NC}  🚀  DEPLOY — Build e deploy completo"
  echo -e "  ${CYAN}3${NC}  🗄️  DATABASE — Migrazioni e backup"
  echo -e "  ${CYAN}4${NC}  📦  DIPENDENZE — Install / Update"
  echo -e "  ${CYAN}5${NC}  📋  LOG — Visualizza log applicazione"
  echo -e "  ${CYAN}6${NC}  🐳  DOCKER — Gestione container"
  echo -e "  ${CYAN}7${NC}  🔧  MANUTENZIONE — Pulizia e ottimizzazione"
  echo -e "  ${CYAN}8${NC}  🔐  SICUREZZA — SSL, secrets, env check"
  echo -e "  ${CYAN}9${NC}  📊  MONITOR — Status servizi e performance"
  echo -e "  ${CYAN}0${NC}  ❌  Esci"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) git_menu ;;
    2) deploy_menu ;;
    3) db_menu ;;
    4) deps_menu ;;
    5) logs_menu ;;
    6) docker_menu ;;
    7) maintenance_menu ;;
    8) security_menu ;;
    9) monitor_menu ;;
    0) echo -e "${GREEN}Arrivederci!${NC}"; exit 0 ;;
    *) warn "Scelta non valida"; sleep 1; main_menu ;;
  esac
}

# ═══════════════════════════════════════════════════════════════════
# 1. GIT MENU
# ═══════════════════════════════════════════════════════════════════
git_menu() {
  header
  echo -e " ${WHITE}${BOLD}GIT${NC}"
  line
  echo -e "  ${CYAN}1${NC}  📥  Pull (aggiorna dal remote)"
  echo -e "  ${CYAN}2${NC}  📤  Push (invia modifiche)"
  echo -e "  ${CYAN}3${NC}  📊  Status (file modificati)"
  echo -e "  ${CYAN}4${NC}  💾  Commit + Push rapido"
  echo -e "  ${CYAN}5${NC}  🌿  Gestione branch"
  echo -e "  ${CYAN}6${NC}  🏷️  Tag versione"
  echo -e "  ${CYAN}7${NC}  🔄  Reset hard (ATTENZIONE)"
  echo -e "  ${CYAN}8${NC}  📜  Log commit recenti"
  echo -e "  ${CYAN}9${NC}  🔀  Merge branch"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) git_pull ;;
    2) git_push ;;
    3) git_status ;;
    4) git_quick_commit ;;
    5) git_branch_menu ;;
    6) git_tag ;;
    7) git_reset ;;
    8) git_log ;;
    9) git_merge ;;
    0) main_menu ;;
    *) warn "Scelta non valida"; sleep 1; git_menu ;;
  esac
}

git_pull() {
  log "Git pull in corso..."
  BRANCH=$(git branch --show-current)
  git fetch origin
  git pull origin "$BRANCH"
  ok "Pull completato su branch: $BRANCH"
  press_enter; git_menu
}

git_push() {
  log "Git push in corso..."
  BRANCH=$(git branch --show-current)
  git push origin "$BRANCH"
  ok "Push completato su branch: $BRANCH"
  press_enter; git_menu
}

git_status() {
  echo ""
  echo -e "${WHITE}${BOLD}Status Git:${NC}"
  line
  git status
  echo ""
  echo -e "${WHITE}${BOLD}Differenze (ultime modifiche):${NC}"
  git diff --stat
  press_enter; git_menu
}

git_quick_commit() {
  git status
  echo ""
  echo -n "  Messaggio commit: "
  read -r msg
  if [ -z "$msg" ]; then
    err "Messaggio vuoto, operazione annullata"
    press_enter; git_menu; return
  fi
  git add -A
  git commit -m "$msg"
  BRANCH=$(git branch --show-current)
  if confirm "Vuoi fare anche il push su origin/$BRANCH?"; then
    git push origin "$BRANCH"
    ok "Commit + Push completati"
  else
    ok "Commit effettuato (solo locale)"
  fi
  press_enter; git_menu
}

git_branch_menu() {
  echo ""
  echo -e "${WHITE}Branch disponibili:${NC}"
  git branch -a
  echo ""
  echo -e "  ${CYAN}1${NC} Crea nuovo branch"
  echo -e "  ${CYAN}2${NC} Cambia branch"
  echo -e "  ${CYAN}3${NC} Elimina branch"
  echo -e "  ${CYAN}0${NC} Torna indietro"
  echo -n "  Scelta: "
  read -r bc
  case "$bc" in
    1) echo -n "Nome nuovo branch: "; read -r nb; git checkout -b "$nb"; ok "Branch '$nb' creato" ;;
    2) echo -n "Nome branch: "; read -r sb; git checkout "$sb"; ok "Cambiato a branch '$sb'" ;;
    3) echo -n "Nome branch da eliminare: "; read -r db
       if confirm "Eliminare branch '$db'?"; then git branch -d "$db"; ok "Branch eliminato"; fi ;;
    0) git_menu; return ;;
  esac
  press_enter; git_menu
}

git_tag() {
  echo ""
  echo -e "${WHITE}Tag esistenti:${NC}"
  git tag -l | sort -V | tail -10
  echo ""
  echo -n "  Nuova versione (es. v1.2.0): "
  read -r tag
  echo -n "  Descrizione release: "
  read -r tagmsg
  git tag -a "$tag" -m "$tagmsg"
  if confirm "Pushare il tag su origin?"; then
    git push origin "$tag"
    ok "Tag $tag creato e pushato"
  fi
  press_enter; git_menu
}

git_reset() {
  warn "ATTENZIONE: reset hard elimina TUTTE le modifiche locali non committate!"
  if confirm "Sei sicuro di voler fare reset hard?"; then
    git reset --hard HEAD
    git clean -fd
    ok "Reset hard completato"
  else
    ok "Operazione annullata"
  fi
  press_enter; git_menu
}

git_log() {
  echo ""
  git log --oneline --graph --decorate --color -20
  press_enter; git_menu
}

git_merge() {
  echo -e "${WHITE}Branch disponibili:${NC}"
  git branch
  echo -n "  Branch da mergiare nel corrente: "
  read -r mb
  git merge "$mb"
  ok "Merge di '$mb' completato"
  press_enter; git_menu
}

# ═══════════════════════════════════════════════════════════════════
# 2. DEPLOY MENU
# ═══════════════════════════════════════════════════════════════════
deploy_menu() {
  header
  echo -e " ${WHITE}${BOLD}DEPLOY${NC}"
  line
  echo -e "  ${CYAN}1${NC}  🚀  Full deploy (frontend + backend)"
  echo -e "  ${CYAN}2${NC}  🎨  Deploy solo Frontend"
  echo -e "  ${CYAN}3${NC}  ⚙️   Deploy solo Backend"
  echo -e "  ${CYAN}4${NC}  🏗️   Build Frontend"
  echo -e "  ${CYAN}5${NC}  🔄  Restart servizi"
  echo -e "  ${CYAN}6${NC}  ⏹️   Stop servizi"
  echo -e "  ${CYAN}7${NC}  ▶️   Start servizi"
  echo -e "  ${CYAN}8${NC}  📡  Deploy su Vercel (frontend)"
  echo -e "  ${CYAN}9${NC}  🚂  Deploy su Railway (backend)"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) full_deploy ;;
    2) deploy_frontend ;;
    3) deploy_backend ;;
    4) build_frontend ;;
    5) restart_services ;;
    6) stop_services ;;
    7) start_services ;;
    8) deploy_vercel ;;
    9) deploy_railway ;;
    0) main_menu ;;
    *) warn "Scelta non valida"; sleep 1; deploy_menu ;;
  esac
}

full_deploy() {
  log "=== FULL DEPLOY ARKANIS ==="
  require_env || return

  log "1/5 Pull aggiornamenti..."
  git pull origin "$(git branch --show-current)"

  log "2/5 Install dipendenze frontend..."
  cd "$FRONTEND_DIR" && npm ci --silent && cd ..

  log "3/5 Build frontend..."
  cd "$FRONTEND_DIR" && npm run build && cd ..

  log "4/5 Install dipendenze backend..."
  cd "$BACKEND_DIR" && npm ci --silent && cd ..

  log "5/5 Restart servizi..."
  if command -v docker-compose &>/dev/null; then
    docker-compose down && docker-compose up -d --build
  elif command -v pm2 &>/dev/null; then
    pm2 restart all
  else
    warn "Nessun orchestratore trovato (docker-compose / pm2)"
  fi

  ok "=== FULL DEPLOY COMPLETATO ==="
  press_enter; deploy_menu
}

build_frontend() {
  log "Build frontend..."
  cd "$FRONTEND_DIR"
  npm ci --silent
  npm run build
  cd ..
  ok "Build completata → dist/"
  press_enter; deploy_menu
}

deploy_frontend() {
  log "Deploy frontend..."
  build_frontend
  if command -v rsync &>/dev/null; then
    echo -n "  Destinazione deploy (es. user@server:/var/www/arkanis): "
    read -r dest
    rsync -avz --delete "$FRONTEND_DIR/dist/" "$dest"
    ok "Frontend deployato su $dest"
  fi
  press_enter; deploy_menu
}

deploy_backend() {
  log "Deploy backend..."
  cd "$BACKEND_DIR" && npm ci --silent && cd ..
  if command -v pm2 &>/dev/null; then
    pm2 restart arkanis-backend 2>/dev/null || pm2 start "$BACKEND_DIR/src/index.js" --name arkanis-backend
    ok "Backend riavviato con PM2"
  fi
  press_enter; deploy_menu
}

restart_services() {
  log "Restart servizi..."
  if command -v docker-compose &>/dev/null && [ -f "$COMPOSE_FILE" ]; then
    docker-compose restart
    ok "Container riavviati"
  elif command -v pm2 &>/dev/null; then
    pm2 restart all
    ok "PM2 processi riavviati"
  else
    warn "Nessun orchestratore trovato"
  fi
  press_enter; deploy_menu
}

stop_services() {
  if confirm "Fermare tutti i servizi?"; then
    if command -v docker-compose &>/dev/null && [ -f "$COMPOSE_FILE" ]; then
      docker-compose stop
      ok "Container fermati"
    elif command -v pm2 &>/dev/null; then
      pm2 stop all
      ok "PM2 processi fermati"
    fi
  fi
  press_enter; deploy_menu
}

start_services() {
  if command -v docker-compose &>/dev/null && [ -f "$COMPOSE_FILE" ]; then
    docker-compose up -d
    ok "Container avviati"
  elif command -v pm2 &>/dev/null; then
    pm2 start all
    ok "PM2 processi avviati"
  fi
  press_enter; deploy_menu
}

deploy_vercel() {
  log "Deploy su Vercel..."
  if ! command -v vercel &>/dev/null; then
    warn "Vercel CLI non installata. Installo..."
    npm i -g vercel
  fi
  cd "$FRONTEND_DIR"
  vercel --prod
  cd ..
  press_enter; deploy_menu
}

deploy_railway() {
  log "Deploy su Railway..."
  if ! command -v railway &>/dev/null; then
    warn "Railway CLI non installata."
    echo "Installa con: npm i -g @railway/cli"
    press_enter; deploy_menu; return
  fi
  cd "$BACKEND_DIR"
  railway up
  cd ..
  press_enter; deploy_menu
}

# ═══════════════════════════════════════════════════════════════════
# 3. DATABASE MENU
# ═══════════════════════════════════════════════════════════════════
db_menu() {
  header
  echo -e " ${WHITE}${BOLD}DATABASE${NC}"
  line
  echo -e "  ${CYAN}1${NC}  🏗️   Esegui migrazione (crea tabelle)"
  echo -e "  ${CYAN}2${NC}  💾  Backup database"
  echo -e "  ${CYAN}3${NC}  📥  Restore backup"
  echo -e "  ${CYAN}4${NC}  🌱  Seed dati di esempio"
  echo -e "  ${CYAN}5${NC}  📊  Statistiche database"
  echo -e "  ${CYAN}6${NC}  🔍  Query SQL diretta"
  echo -e "  ${CYAN}7${NC}  🗑️   Reset database (PERICOLOSO)"
  echo -e "  ${CYAN}8${NC}  📋  Lista backup disponibili"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) db_migrate ;;
    2) db_backup ;;
    3) db_restore ;;
    4) db_seed ;;
    5) db_stats ;;
    6) db_query ;;
    7) db_reset ;;
    8) db_list_backups ;;
    0) main_menu ;;
    *) warn "Scelta non valida"; sleep 1; db_menu ;;
  esac
}

db_migrate() {
  require_env || return
  log "Esecuzione migrazioni..."
  node "$BACKEND_DIR/src/models/migrate.js"
  ok "Migrazioni completate"
  press_enter; db_menu
}

db_backup() {
  require_env || return
  mkdir -p "$BACKUP_DIR"
  TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
  BACKUP_FILE="$BACKUP_DIR/arkanis_${TIMESTAMP}.sql"
  log "Backup database in corso → $BACKUP_FILE"
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
  gzip "$BACKUP_FILE"
  ok "Backup salvato: ${BACKUP_FILE}.gz"
  du -h "${BACKUP_FILE}.gz"
  press_enter; db_menu
}

db_restore() {
  require_env || return
  db_list_backups
  echo ""
  echo -n "  Nome file backup (dalla lista sopra): "
  read -r backup_file
  if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
    err "File non trovato: $BACKUP_DIR/$backup_file"
    press_enter; db_menu; return
  fi
  if confirm "Restore da $backup_file? Sovrascriverà il database attuale!"; then
    log "Restore in corso..."
    gunzip -c "$BACKUP_DIR/$backup_file" | psql "$DATABASE_URL"
    ok "Restore completato"
  fi
  press_enter; db_menu
}

db_seed() {
  require_env || return
  if confirm "Inserire dati di esempio nel database?"; then
    log "Seed dati..."
    psql "$DATABASE_URL" << 'SQL'
INSERT INTO users (username, email, password_hash, elo, wins, losses)
VALUES
  ('ShadowBlade', 'shadow@arkanis.io', '$2b$12$placeholder', 1480, 42, 8),
  ('IronGolem99', 'iron@arkanis.io',   '$2b$12$placeholder', 1350, 31, 12),
  ('ArcaneWitch', 'witch@arkanis.io',  '$2b$12$placeholder', 1210, 27, 15)
ON CONFLICT DO NOTHING;
SQL
    ok "Seed completato"
  fi
  press_enter; db_menu
}

db_stats() {
  require_env || return
  log "Statistiche database..."
  psql "$DATABASE_URL" << 'SQL'
\echo '=== UTENTI ==='
SELECT COUNT(*) as totale, AVG(elo)::int as elo_medio, MAX(elo) as elo_max FROM users;

\echo '=== TOP 5 GIOCATORI ==='
SELECT username, elo, wins, losses FROM leaderboard LIMIT 5;

\echo '=== BATTAGLIE ==='
SELECT difficulty, COUNT(*) as totale,
  SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) as vittorie
FROM battles GROUP BY difficulty ORDER BY difficulty;

\echo '=== TRANSAZIONI ==='
SELECT pack_id, COUNT(*) as acquisti, SUM(sol_amount) as sol_totale
FROM transactions WHERE status='confirmed'
GROUP BY pack_id;
SQL
  press_enter; db_menu
}

db_query() {
  require_env || return
  echo ""
  echo -e "${YELLOW}Inserisci la query SQL (termina con ; e INVIO):${NC}"
  echo -n "SQL> "
  read -r query
  psql "$DATABASE_URL" -c "$query"
  press_enter; db_menu
}

db_reset() {
  warn "PERICOLO: Questo elimina TUTTI i dati del database!"
  warn "Digita 'CONFERMO' per procedere:"
  read -r confirm_text
  if [ "$confirm_text" = "CONFERMO" ]; then
    require_env || return
    db_backup  # Auto-backup prima del reset
    psql "$DATABASE_URL" << 'SQL'
DROP TABLE IF EXISTS transactions, battles, user_powers, user_cards, cards, users CASCADE;
DROP VIEW IF EXISTS leaderboard;
SQL
    node "$BACKEND_DIR/src/models/migrate.js"
    ok "Database resettato e migrato"
  else
    ok "Reset annullato"
  fi
  press_enter; db_menu
}

db_list_backups() {
  echo ""
  echo -e "${WHITE}Backup disponibili:${NC}"
  if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
    ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null || echo "  Nessun backup trovato"
  else
    echo "  Nessun backup trovato"
  fi
  press_enter; db_menu
}

# ═══════════════════════════════════════════════════════════════════
# 4. DIPENDENZE MENU
# ═══════════════════════════════════════════════════════════════════
deps_menu() {
  header
  echo -e " ${WHITE}${BOLD}DIPENDENZE${NC}"
  line
  echo -e "  ${CYAN}1${NC}  📦  Install tutte le dipendenze"
  echo -e "  ${CYAN}2${NC}  🎨  Install solo Frontend"
  echo -e "  ${CYAN}3${NC}  ⚙️   Install solo Backend"
  echo -e "  ${CYAN}4${NC}  🔄  Aggiorna tutte le dipendenze"
  echo -e "  ${CYAN}5${NC}  🔍  Controlla vulnerabilità (npm audit)"
  echo -e "  ${CYAN}6${NC}  🧹  Pulisci node_modules"
  echo -e "  ${CYAN}7${NC}  📋  Lista dipendenze outdated"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) log "Install frontend..." && cd "$FRONTEND_DIR" && npm install && cd ..
       log "Install backend..."  && cd "$BACKEND_DIR"  && npm install && cd ..
       ok "Tutte le dipendenze installate" ;;
    2) cd "$FRONTEND_DIR" && npm install && cd ..; ok "Frontend deps installate" ;;
    3) cd "$BACKEND_DIR"  && npm install && cd ..; ok "Backend deps installate" ;;
    4) log "Update frontend..." && cd "$FRONTEND_DIR" && npm update && cd ..
       log "Update backend..."  && cd "$BACKEND_DIR"  && npm update && cd ..
       ok "Dipendenze aggiornate" ;;
    5) echo -e "${WHITE}Frontend audit:${NC}"; cd "$FRONTEND_DIR" && npm audit; cd ..
       echo -e "${WHITE}Backend audit:${NC}";  cd "$BACKEND_DIR"  && npm audit; cd .. ;;
    6) if confirm "Eliminare node_modules (frontend + backend)?"; then
         rm -rf "$FRONTEND_DIR/node_modules" "$BACKEND_DIR/node_modules"
         ok "node_modules eliminati"
       fi ;;
    7) echo -e "${WHITE}Frontend outdated:${NC}"; cd "$FRONTEND_DIR" && npm outdated; cd ..
       echo -e "${WHITE}Backend outdated:${NC}";  cd "$BACKEND_DIR"  && npm outdated; cd .. ;;
    0) main_menu; return ;;
    *) warn "Scelta non valida"; sleep 1 ;;
  esac
  press_enter; deps_menu
}

# ═══════════════════════════════════════════════════════════════════
# 5. LOG MENU
# ═══════════════════════════════════════════════════════════════════
logs_menu() {
  header
  echo -e " ${WHITE}${BOLD}LOG${NC}"
  line
  echo -e "  ${CYAN}1${NC}  📋  Log applicazione (ultimi 50)"
  echo -e "  ${CYAN}2${NC}  📋  Log applicazione (live)"
  echo -e "  ${CYAN}3${NC}  🐳  Log Docker (backend)"
  echo -e "  ${CYAN}4${NC}  🐳  Log Docker (frontend)"
  echo -e "  ${CYAN}5${NC}  📊  Log PM2"
  echo -e "  ${CYAN}6${NC}  🌐  Log Nginx"
  echo -e "  ${CYAN}7${NC}  📁  Log deploy (questo script)"
  echo -e "  ${CYAN}8${NC}  🗑️   Pulisci log vecchi"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) tail -50 "$LOG_FILE" 2>/dev/null || warn "Nessun log trovato" ;;
    2) log "Ctrl+C per uscire..."; tail -f "$LOG_FILE" ;;
    3) docker logs arkanis-backend --tail=100 2>/dev/null || warn "Container non trovato" ;;
    4) docker logs arkanis-frontend --tail=100 2>/dev/null || warn "Container non trovato" ;;
    5) pm2 logs --lines 50 2>/dev/null || warn "PM2 non disponibile" ;;
    6) sudo tail -50 /var/log/nginx/access.log 2>/dev/null || warn "Nginx log non trovato" ;;
    7) cat "$LOG_FILE" ;;
    8) if confirm "Eliminare log vecchi (>7 giorni)?"; then
         find . -name "*.log" -mtime +7 -delete
         ok "Log vecchi eliminati"
       fi ;;
    0) main_menu; return ;;
    *) warn "Scelta non valida"; sleep 1 ;;
  esac
  press_enter; logs_menu
}

# ═══════════════════════════════════════════════════════════════════
# 6. DOCKER MENU
# ═══════════════════════════════════════════════════════════════════
docker_menu() {
  header
  echo -e " ${WHITE}${BOLD}DOCKER${NC}"
  line
  echo -e "  ${CYAN}1${NC}  🐳  Status container"
  echo -e "  ${CYAN}2${NC}  ▶️   Start (docker-compose up -d)"
  echo -e "  ${CYAN}3${NC}  ⏹️   Stop (docker-compose down)"
  echo -e "  ${CYAN}4${NC}  🔄  Restart"
  echo -e "  ${CYAN}5${NC}  🏗️   Build e start (--build)"
  echo -e "  ${CYAN}6${NC}  🧹  Pulizia immagini dangling"
  echo -e "  ${CYAN}7${NC}  📊  Utilizzo risorse container"
  echo -e "  ${CYAN}8${NC}  💻  Shell in container backend"
  echo -e "  ${CYAN}9${NC}  💻  Shell in container DB"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) docker-compose ps 2>/dev/null || docker ps ;;
    2) docker-compose up -d; ok "Container avviati" ;;
    3) docker-compose down; ok "Container fermati" ;;
    4) docker-compose restart; ok "Container riavviati" ;;
    5) docker-compose up -d --build; ok "Build + start completato" ;;
    6) docker image prune -f; ok "Immagini dangling rimosse" ;;
    7) docker stats --no-stream ;;
    8) docker exec -it arkanis-backend sh 2>/dev/null || warn "Container non disponibile" ;;
    9) docker exec -it arkanis-db psql -U arkanis_user arkanis_db 2>/dev/null || warn "Container DB non disponibile" ;;
    0) main_menu; return ;;
    *) warn "Scelta non valida"; sleep 1 ;;
  esac
  press_enter; docker_menu
}

# ═══════════════════════════════════════════════════════════════════
# 7. MANUTENZIONE MENU
# ═══════════════════════════════════════════════════════════════════
maintenance_menu() {
  header
  echo -e " ${WHITE}${BOLD}MANUTENZIONE${NC}"
  line
  echo -e "  ${CYAN}1${NC}  🧹  Pulizia build vecchie"
  echo -e "  ${CYAN}2${NC}  🗜️   Comprimi log vecchi"
  echo -e "  ${CYAN}3${NC}  📊  Analisi spazio disco"
  echo -e "  ${CYAN}4${NC}  🔄  Ruota backup (mantieni ultimi 10)"
  echo -e "  ${CYAN}5${NC}  ⚡  Ottimizza database (VACUUM)"
  echo -e "  ${CYAN}6${NC}  🌐  Test connessione API"
  echo -e "  ${CYAN}7${NC}  📡  Test connessione database"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) rm -rf "$FRONTEND_DIR/dist" "$FRONTEND_DIR/.vite"
       ok "Build vecchie eliminate" ;;
    2) find . -name "*.log" -size +10M -exec gzip {} \;
       ok "Log compressi" ;;
    3) du -sh ./* 2>/dev/null | sort -rh | head -20 ;;
    4) if [ -d "$BACKUP_DIR" ]; then
         ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | tail -n +11 | xargs -r rm
         ok "Backup vecchi rimossi (mantenuti ultimi 10)"
       fi ;;
    5) require_env || break
       psql "$DATABASE_URL" -c "VACUUM ANALYZE;"
       ok "Database ottimizzato" ;;
    6) require_env || break
       BACKEND_PORT=${PORT:-4000}
       curl -sf "http://localhost:$BACKEND_PORT/api/health" && ok "API raggiungibile" || err "API non raggiungibile" ;;
    7) require_env || break
       psql "$DATABASE_URL" -c "SELECT 1;" && ok "Database raggiungibile" || err "Database non raggiungibile" ;;
    0) main_menu; return ;;
    *) warn "Scelta non valida"; sleep 1 ;;
  esac
  press_enter; maintenance_menu
}

# ═══════════════════════════════════════════════════════════════════
# 8. SICUREZZA MENU
# ═══════════════════════════════════════════════════════════════════
security_menu() {
  header
  echo -e " ${WHITE}${BOLD}SICUREZZA${NC}"
  line
  echo -e "  ${CYAN}1${NC}  🔐  Verifica variabili .env"
  echo -e "  ${CYAN}2${NC}  🔑  Rigenera JWT secret"
  echo -e "  ${CYAN}3${NC}  🛡️   Controlla permessi file"
  echo -e "  ${CYAN}4${NC}  🔒  SSL — Rinnova certificato Let's Encrypt"
  echo -e "  ${CYAN}5${NC}  📋  Audit npm (vulnerabilità)"
  echo -e "  ${CYAN}6${NC}  🚫  Verifica .gitignore"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) env_check ;;
    2) regen_jwt ;;
    3) check_permissions ;;
    4) renew_ssl ;;
    5) cd "$BACKEND_DIR" && npm audit --audit-level=high; cd .. ;;
    6) check_gitignore ;;
    0) main_menu; return ;;
    *) warn "Scelta non valida"; sleep 1 ;;
  esac
  press_enter; security_menu
}

env_check() {
  echo -e "\n${WHITE}Verifica variabili .env:${NC}"
  line
  REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "PORT" "FRONTEND_URL")
  if [ ! -f "$ENV_FILE" ]; then err ".env non trovato!"; press_enter; return; fi
  source "$ENV_FILE"
  all_ok=true
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      echo -e "  ${RED}✗${NC} $var — MANCANTE"
      all_ok=false
    else
      val="${!var}"
      masked="${val:0:4}****"
      echo -e "  ${GREEN}✓${NC} $var = $masked"
    fi
  done
  if [ "$all_ok" = true ]; then ok "Tutte le variabili presenti"; fi

  # Sicurezza JWT
  if [ ${#JWT_SECRET} -lt 32 ]; then
    warn "JWT_SECRET troppo corto! Usa almeno 64 caratteri."
  fi
}

regen_jwt() {
  if confirm "Rigenerare JWT_SECRET? Tutti gli utenti dovranno rifare il login."; then
    NEW_SECRET=$(openssl rand -hex 64)
    if [ -f "$ENV_FILE" ]; then
      sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" "$ENV_FILE"
      ok "JWT_SECRET rigenerato in .env"
    else
      echo "Aggiungi questa riga al tuo .env:"
      echo "JWT_SECRET=$NEW_SECRET"
    fi
  fi
}

check_permissions() {
  echo -e "\n${WHITE}Permessi file critici:${NC}"
  [ -f "$ENV_FILE" ] && ls -la "$ENV_FILE"
  [ -d "$BACKUP_DIR" ] && ls -la "$BACKUP_DIR" | head -5
  # Fix permissions
  if confirm "Correggere permessi (env 600, backup 700)?"; then
    chmod 600 "$ENV_FILE" 2>/dev/null
    chmod 700 "$BACKUP_DIR" 2>/dev/null
    ok "Permessi corretti"
  fi
}

renew_ssl() {
  if command -v certbot &>/dev/null; then
    sudo certbot renew --nginx
    ok "Certificato SSL rinnovato"
  else
    warn "Certbot non installato."
    echo "Installa con: sudo apt install certbot python3-certbot-nginx"
  fi
}

check_gitignore() {
  echo -e "\n${WHITE}Verifica .gitignore:${NC}"
  SENSITIVE=(".env" "node_modules" "dist" "*.log" "backups" ".env.local")
  for item in "${SENSITIVE[@]}"; do
    if grep -q "$item" .gitignore 2>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $item è in .gitignore"
    else
      echo -e "  ${RED}✗${NC} $item NON è in .gitignore — AGGIUNGILO!"
    fi
  done
  # Check if .env is tracked
  if git ls-files --error-unmatch .env &>/dev/null 2>&1; then
    err ".env è TRACCIATO da git! Rimuovilo con: git rm --cached .env"
  fi
}

# ═══════════════════════════════════════════════════════════════════
# 9. MONITOR MENU
# ═══════════════════════════════════════════════════════════════════
monitor_menu() {
  header
  echo -e " ${WHITE}${BOLD}MONITOR${NC}"
  line
  echo -e "  ${CYAN}1${NC}  📊  Status generale sistema"
  echo -e "  ${CYAN}2${NC}  💻  CPU e Memoria"
  echo -e "  ${CYAN}3${NC}  💾  Spazio disco"
  echo -e "  ${CYAN}4${NC}  🌐  Test endpoint API"
  echo -e "  ${CYAN}5${NC}  👥  Utenti attivi (database)"
  echo -e "  ${CYAN}6${NC}  📈  Statistiche partite"
  echo -e "  ${CYAN}7${NC}  🔌  Porte in ascolto"
  echo -e "  ${CYAN}0${NC}  ↩  Torna al menu principale"
  echo ""
  echo -n "  Scelta: "
  read -r choice
  case "$choice" in
    1) system_status ;;
    2) echo -e "\n${WHITE}CPU e Memoria:${NC}"; top -bn1 | head -15 ;;
    3) echo -e "\n${WHITE}Spazio disco:${NC}"; df -h ;;
    4) api_test ;;
    5) require_env && psql "$DATABASE_URL" -c "SELECT COUNT(*) as utenti_totali, SUM(wins+losses) as partite_totali, AVG(elo)::int as elo_medio FROM users;" ;;
    6) require_env && psql "$DATABASE_URL" -c "SELECT difficulty, COUNT(*) totale, SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) vittorie FROM battles WHERE played_at > NOW()-INTERVAL '24 hours' GROUP BY difficulty;" ;;
    7) echo -e "\n${WHITE}Porte in ascolto:${NC}"; ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null ;;
    0) main_menu; return ;;
    *) warn "Scelta non valida"; sleep 1 ;;
  esac
  press_enter; monitor_menu
}

system_status() {
  echo ""
  sep
  echo -e " ${WHITE}${BOLD}STATUS SISTEMA — $(date)${NC}"
  sep

  # Git
  echo -e "\n${WHITE}Git:${NC}"
  echo -e "  Branch: $(git branch --show-current 2>/dev/null)"
  echo -e "  Ultimo commit: $(git log -1 --pretty='%h — %s (%ar)' 2>/dev/null)"

  # Node
  echo -e "\n${WHITE}Runtime:${NC}"
  echo -e "  Node: $(node -v 2>/dev/null)"
  echo -e "  npm:  $(npm -v 2>/dev/null)"

  # Docker
  if command -v docker &>/dev/null; then
    echo -e "\n${WHITE}Docker:${NC}"
    docker-compose ps 2>/dev/null || docker ps --format "  {{.Names}} — {{.Status}}"
  fi

  # PM2
  if command -v pm2 &>/dev/null; then
    echo -e "\n${WHITE}PM2:${NC}"
    pm2 list 2>/dev/null
  fi

  # DB
  echo -e "\n${WHITE}Database:${NC}"
  if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    psql "$DATABASE_URL" -c "SELECT 'Connesso ✓' as stato;" 2>/dev/null || echo "  Non raggiungibile"
  fi

  # Disco
  echo -e "\n${WHITE}Disco:${NC}"
  df -h / | tail -1 | awk '{print "  Usato: "$3" / "$2" ("$5")"}'
}

api_test() {
  require_env || return
  PORT=${PORT:-4000}
  BASE="http://localhost:$PORT"
  echo -e "\n${WHITE}Test endpoint API:${NC}"
  ENDPOINTS=(
    "GET /api/health"
    "GET /api/cards"
    "GET /api/leaderboard"
  )
  for ep in "${ENDPOINTS[@]}"; do
    method=$(echo "$ep" | cut -d' ' -f1)
    path=$(echo "$ep" | cut -d' ' -f2)
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path")
    if [ "$status" = "200" ]; then
      echo -e "  ${GREEN}✓${NC} $ep → $status"
    else
      echo -e "  ${RED}✗${NC} $ep → $status"
    fi
  done
}

# ═══════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════

# Crea file di log se non esiste
touch "$LOG_FILE"

# Parametro da riga di comando (shortcut)
case "$1" in
  pull)    git_pull; exit 0 ;;
  push)    git_quick_commit; exit 0 ;;
  deploy)  full_deploy; exit 0 ;;
  build)   build_frontend; exit 0 ;;
  backup)  require_env && db_backup; exit 0 ;;
  migrate) db_migrate; exit 0 ;;
  status)  system_status; exit 0 ;;
  logs)    tail -50 "$LOG_FILE"; exit 0 ;;
  restart) restart_services; exit 0 ;;
  stop)    stop_services; exit 0 ;;
  start)   start_services; exit 0 ;;
  help)
    echo "Uso: ./deploy.sh [comando]"
    echo ""
    echo "Comandi rapidi:"
    echo "  pull      Git pull"
    echo "  push      Commit + push interattivo"
    echo "  deploy    Full deploy"
    echo "  build     Build frontend"
    echo "  backup    Backup database"
    echo "  migrate   Esegui migrazioni DB"
    echo "  status    Status sistema"
    echo "  logs      Ultimi log"
    echo "  restart   Restart servizi"
    echo "  stop      Stop servizi"
    echo "  start     Start servizi"
    echo ""
    echo "Senza argomenti: menu interattivo"
    exit 0 ;;
esac

# Menu interattivo
main_menu
