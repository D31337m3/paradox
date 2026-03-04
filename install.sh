#!/usr/bin/env bash
# =============================================================================
#  PARADOX — One-Click Recovery & Deployment Script
#  Version: 2.0  |  March 2026
#  Domain:  paradox.d31337m3.com
#  VPS IP:  108.61.242.25
#
#  Usage:
#    bash install.sh              — full install/reinstall
#    bash install.sh --no-ssl     — skip certbot (HTTP only, useful in staging)
#    bash install.sh --restart    — just restart PM2 processes (no reinstall)
#    bash install.sh --status     — show service status only
#
#  This script is fully idempotent — safe to run multiple times.
#  On a fresh VPS it installs all dependencies. On an existing system
#  it rebuilds and restarts the app without data loss.
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[FAIL]${NC}  $*" >&2; exit 1; }
banner()  { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${NC}\n"; }

# ── Configuration ─────────────────────────────────────────────────────────────
DOMAIN="paradox.d31337m3.com"
PROJECT_DIR="/root/projects/paradox"
FRONTEND_DIR="$PROJECT_DIR/frontend"
CHAT_DIR="$PROJECT_DIR/chat-server"
DIST_DIR="$FRONTEND_DIR/dist"
NGINX_CONF="/etc/nginx/sites-available/paradox"
NGINX_LINK="/etc/nginx/sites-enabled/paradox"
FRONTEND_PM2_NAME="paradox-frontend"
CHAT_PM2_NAME="paradox-chat"
FRONTEND_PORT=3000
CHAT_PORT=3001
NODE_REQUIRED="20"

# ── Flags ─────────────────────────────────────────────────────────────────────
SKIP_SSL=false
RESTART_ONLY=false
STATUS_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --no-ssl)   SKIP_SSL=true ;;
    --restart)  RESTART_ONLY=true ;;
    --status)   STATUS_ONLY=true ;;
  esac
done

# ── Status mode ───────────────────────────────────────────────────────────────
if $STATUS_ONLY; then
  echo -e "\n${BOLD}PARADOX Service Status${NC}"
  echo "────────────────────────────────────────"
  pm2 list --no-color
  echo ""
  info "Nginx: $(systemctl is-active nginx)"
  info "Frontend port 3000: $(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo 'unreachable')"
  info "Chat port 3001: $(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/chat/api/messages/general 2>/dev/null || echo 'unreachable')"
  info "HTTPS: $(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo 'unreachable')"
  exit 0
fi

# ── Restart-only mode ─────────────────────────────────────────────────────────
if $RESTART_ONLY; then
  banner "Restarting PARADOX processes"
  pm2 restart "$FRONTEND_PM2_NAME" 2>/dev/null || warn "Frontend not in PM2 — will start it"
  pm2 restart "$CHAT_PM2_NAME" 2>/dev/null || warn "Chat not in PM2 — will start it"
  pm2 list --no-color
  success "Restart complete"
  exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
banner "PARADOX Recovery Installation"
echo -e "  Domain:  ${BOLD}$DOMAIN${NC}"
echo -e "  Project: ${BOLD}$PROJECT_DIR${NC}"
echo -e "  Started: $(date)"
echo ""

# ── Must run as root ──────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || die "Run as root: sudo bash install.sh"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1 — System dependencies
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 1 — System Dependencies"

apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx sqlite3 2>/dev/null
success "apt packages ready"

# ── Node.js via nvm or system ────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.version.split(".")[0].replace("v",""))')" -lt "$NODE_REQUIRED" ]]; then
  info "Installing Node.js $NODE_REQUIRED via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_REQUIRED}.x | bash - 2>/dev/null
  apt-get install -y -qq nodejs
fi
success "Node $(node --version) / npm $(npm --version)"

# ── PM2 ──────────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 --silent
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
fi
success "PM2 $(pm2 --version 2>/dev/null | tail -1)"

# ── serve (static file server) ───────────────────────────────────────────────
if ! command -v serve &>/dev/null; then
  npm install -g serve --silent
fi
success "serve $(serve --version)"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 — Project files
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 2 — Project Files"

# The project should already exist at $PROJECT_DIR (extracted from archive).
# If it doesn't, the user must extract the archive first.
[[ -d "$PROJECT_DIR" ]] || die "Project directory not found: $PROJECT_DIR\nExtract the archive first:\n  unzip paradox-latest.zip -d /root/\n  mv paradox /root/projects/paradox"
success "Project directory exists: $PROJECT_DIR"

# ── Restore .env if missing ───────────────────────────────────────────────────
if [[ ! -f "$PROJECT_DIR/contracts/.env" ]]; then
  warn ".env missing — creating template"
  cat > "$PROJECT_DIR/contracts/.env" << 'ENVEOF'
# REQUIRED: Deployer private key (without 0x prefix)
PRIVATE_KEY=REPLACE_WITH_DEPLOYER_PRIVATE_KEY

# Alchemy or other Polygon RPC URL
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/REPLACE_WITH_API_KEY
ENVEOF
  warn "IMPORTANT: Edit $PROJECT_DIR/contracts/.env with your actual keys before using contracts"
fi

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3 — Build frontend
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 3 — Build Frontend"

cd "$FRONTEND_DIR"
info "Installing npm dependencies..."
npm install --silent 2>/dev/null
info "Building production bundle..."
npm run build
[[ -d "$DIST_DIR" ]] || die "Build failed — dist directory not created"
success "Frontend built → $DIST_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4 — Chat server
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 4 — Chat Server"

cd "$CHAT_DIR"
info "Installing chat server dependencies..."
npm install --silent 2>/dev/null
success "Chat server dependencies ready"

# Ensure chat DB directory exists and is writable
touch "$CHAT_DIR/chat.db" 2>/dev/null || true
success "Chat database ready: $CHAT_DIR/chat.db"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 5 — Nginx configuration
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 5 — Nginx"

# Write the nginx config (HTTP only first, certbot adds SSL)
cat > "$NGINX_CONF" << NGINXEOF
server {
    server_name $DOMAIN;

    location / {
        proxy_pass         http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
    }

    # Chat server — REST API + Socket.io
    location /chat/ {
        proxy_pass         http://127.0.0.1:$CHAT_PORT/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }

    listen 80;
    listen [::]:80;
}
NGINXEOF

# Enable site
if [[ ! -L "$NGINX_LINK" ]]; then
  ln -sf "$NGINX_CONF" "$NGINX_LINK"
fi

# Remove default site if paradox is the only one
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t && systemctl reload nginx
success "Nginx configured and reloaded"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 6 — SSL certificate
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 6 — SSL Certificate"

if $SKIP_SSL; then
  warn "Skipping SSL (--no-ssl flag set). Site will run on HTTP only."
elif [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  success "SSL certificate already exists for $DOMAIN"
  # Ensure certbot config is in nginx (reload handles this)
  systemctl reload nginx
else
  info "Obtaining SSL certificate from Let's Encrypt..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
    --email "admin@$DOMAIN" --redirect 2>/dev/null \
    || warn "Certbot failed — check DNS and port 80. Run manually: certbot --nginx -d $DOMAIN"
fi

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 7 — PM2 processes
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 7 — PM2 Processes"

# Stop existing paradox processes gracefully
pm2 delete "$FRONTEND_PM2_NAME" 2>/dev/null || true
pm2 delete "$CHAT_PM2_NAME"     2>/dev/null || true

# Start frontend (static file server)
pm2 start serve \
  --name "$FRONTEND_PM2_NAME" \
  --interpreter none \
  -- -s "$DIST_DIR" -l $FRONTEND_PORT
success "paradox-frontend started on port $FRONTEND_PORT"

# Start chat server
pm2 start "$CHAT_DIR/index.js" \
  --name "$CHAT_PM2_NAME" \
  --cwd "$CHAT_DIR"
success "paradox-chat started on port $CHAT_PORT"

# Persist PM2 process list (survives reboot)
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash 2>/dev/null || true
success "PM2 startup configured (survives reboot)"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 8 — Health checks
# ─────────────────────────────────────────────────────────────────────────────
banner "Phase 8 — Health Checks"

sleep 3  # Give processes a moment to bind

PASS=0; FAIL=0

check() {
  local label="$1" cmd="$2" expected="$3"
  local result
  result=$(eval "$cmd" 2>/dev/null || echo "ERROR")
  if [[ "$result" == *"$expected"* ]]; then
    success "$label ✓ ($result)"
    ((PASS++))
  else
    warn "$label ✗ (got: $result)"
    ((FAIL++))
  fi
}

check "Frontend HTTP"      "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$FRONTEND_PORT" "200"
check "Chat API"           "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$CHAT_PORT/chat/api/messages/general" "200"
check "Nginx"              "systemctl is-active nginx" "active"

if ! $SKIP_SSL && [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  check "HTTPS external"   "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN" "200"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║   PARADOX IS ONLINE                          ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Site:${NC}    https://$DOMAIN"
echo -e "  ${CYAN}Health:${NC}  $PASS checks passed, $FAIL failed"
echo -e "  ${CYAN}PM2:${NC}     pm2 list"
echo -e "  ${CYAN}Logs:${NC}    pm2 logs $FRONTEND_PM2_NAME"
echo -e "           pm2 logs $CHAT_PM2_NAME"
echo -e "  ${CYAN}Nginx:${NC}   journalctl -u nginx -f"
echo ""

if [[ $FAIL -gt 0 ]]; then
  warn "$FAIL health check(s) failed. Run: bash install.sh --status"
fi

echo -e "Completed at $(date)"
