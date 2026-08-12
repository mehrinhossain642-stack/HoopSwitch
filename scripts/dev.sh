#!/usr/bin/env bash
#
# Manages the HoopSwitch local stack (PostgreSQL + Rails API + Expo) as
# background services, so starting doesn't tie up a terminal.
#
#   ./scripts/dev.sh start     start everything, return to your prompt
#   ./scripts/dev.sh stop      stop the API and Expo
#   ./scripts/dev.sh restart
#   ./scripts/dev.sh status
#   ./scripts/dev.sh logs      follow both logs (Ctrl+C just stops tailing)
#
# Normally driven through `task start` / `task stop`.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/api"
RUN_DIR="$ROOT/.dev"
API_PORT="${API_PORT:-3001}"
EXPO_PORT="${EXPO_PORT:-8081}"

# Homebrew's postgresql@17 is keg-only, so psql/pg_dump aren't on the default
# PATH. Rails' db:* tasks shell out to them.
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

BOLD=$'\033[1m'; RESET=$'\033[0m'
GREEN=$'\033[38;5;35m'; RED=$'\033[38;5;203m'; GREY=$'\033[38;5;245m'

log()  { printf '%s\n' "${BOLD}${*}${RESET}"; }
note() { printf '%s\n' "${GREY}${*}${RESET}"; }
ok()   { printf '%s\n' "${GREEN}${*}${RESET}"; }
err()  { printf '%s\n' "${RED}${*}${RESET}" >&2; }

mkdir -p "$RUN_DIR"

# --- helpers ---------------------------------------------------------------

# `lsof` exits 1 when nothing holds the port. Combined with `pipefail` that
# would make these functions non-zero and trip `set -e` at every call site, so
# absorb it — "no pid" is a normal answer here, not an error.
port_pid()  { lsof -ti:"$1" 2>/dev/null | head -1 || true; }
port_busy() { [[ -n "$(port_pid "$1")" ]]; }

# Puma and Metro both fork children, so signalling only the pid we recorded
# leaves orphans holding the port. Walk the tree depth-first instead.
kill_tree() {
  local pid="$1" sig="${2:-TERM}" child
  [[ -z "$pid" ]] && return 0
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child" "$sig"
  done
  kill "-$sig" "$pid" 2>/dev/null || true
}

stop_service() {
  # Declared separately: bash expands every word of a `local` statement before
  # assigning any of them, so referencing $name on the same line would be an
  # unbound variable under `set -u`.
  local name="$1"
  local port="$2"
  local pidfile="$RUN_DIR/$name.pid"
  local pid=""
  local stopped=0

  [[ -f "$pidfile" ]] && pid="$(cat "$pidfile" 2>/dev/null || true)"

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill_tree "$pid" TERM
    stopped=1
  fi

  # Whatever is actually holding the port is authoritative — a stale pidfile
  # (or a server started by hand) shouldn't survive `stop`.
  local holder
  holder="$(port_pid "$port")"
  if [[ -n "$holder" ]]; then
    kill_tree "$holder" TERM
    stopped=1
  fi

  for _ in $(seq 1 24); do
    port_busy "$port" || break
    sleep 0.25
  done

  holder="$(port_pid "$port")"
  if [[ -n "$holder" ]]; then
    kill_tree "$holder" KILL
    sleep 0.5
  fi

  rm -f "$pidfile"
  [[ "$stopped" -eq 1 ]] && ok "  stopped $name" || note "  $name was not running"
}

wait_for_port() {
  local port="$1" label="$2" logfile="$3"
  for _ in $(seq 1 120); do
    if port_busy "$port"; then return 0; fi
    sleep 0.5
  done
  err "$label didn't come up on port $port. Last lines of its log:"
  tail -15 "$logfile" >&2 || true
  return 1
}

ensure_postgres() {
  if pg_isready -q 2>/dev/null; then
    note "  postgres already running"
    return 0
  fi
  brew services start postgresql@17 >/dev/null
  for _ in $(seq 1 40); do
    pg_isready -q 2>/dev/null && { ok "  started postgres"; return 0; }
    sleep 0.5
  done
  err "PostgreSQL didn't start."
  return 1
}

# --- commands --------------------------------------------------------------

cmd_start() {
  if port_busy "$API_PORT" || port_busy "$EXPO_PORT"; then
    err "Something is already listening on port $API_PORT or $EXPO_PORT."
    note "Run 'task stop' (or 'task restart') first."
    exit 1
  fi

  log "Starting HoopSwitch…"
  ensure_postgres

  if [[ "${SKIP_DB_PREPARE:-}" != "1" ]]; then
    # Idempotent: creates the DB if missing, applies pending migrations, and
    # seeds only on first create.
    (cd "$API_DIR" && bin/rails db:prepare >/dev/null)
    note "  database ready"
  fi

  # nohup + disown so the services outlive this shell.
  ( cd "$API_DIR" && exec nohup bin/rails server -p "$API_PORT" -b 0.0.0.0 \
      > "$RUN_DIR/api.log" 2>&1 ) &
  echo $! > "$RUN_DIR/api.pid"
  disown %% 2>/dev/null || true

  ( cd "$ROOT" && exec nohup npx expo start --port "$EXPO_PORT" \
      > "$RUN_DIR/app.log" 2>&1 ) &
  echo $! > "$RUN_DIR/app.pid"
  disown %% 2>/dev/null || true

  wait_for_port "$API_PORT" "Rails API" "$RUN_DIR/api.log" || exit 1
  ok "  api  ready"
  wait_for_port "$EXPO_PORT" "Expo" "$RUN_DIR/app.log" || exit 1
  ok "  app  ready"

  cmd_status
}

cmd_stop() {
  log "Stopping HoopSwitch…"
  stop_service app "$EXPO_PORT"
  stop_service api "$API_PORT"
  note "  postgres left running ('brew services stop postgresql@17' to stop it)"
}

cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start
}

cmd_status() {
  local lan
  lan="$(ipconfig getifaddr en0 2>/dev/null || echo localhost)"

  log ""
  if port_busy "$API_PORT"; then
    ok  "  api   up    http://localhost:$API_PORT   (LAN http://$lan:$API_PORT)"
  else
    err "  api   down"
  fi
  if port_busy "$EXPO_PORT"; then
    ok  "  app   up    http://localhost:$EXPO_PORT"
  else
    err "  app   down"
  fi
  pg_isready -q 2>/dev/null && ok "  db    up" || err "  db    down"

  note ""
  note "  task logs    follow output      task stop    stop everything"
  note "  Scan the Expo QR from .dev/app.log, or open http://localhost:$EXPO_PORT"
  log ""
}

cmd_logs() {
  if [[ ! -f "$RUN_DIR/api.log" && ! -f "$RUN_DIR/app.log" ]]; then
    err "No logs yet — run 'task start' first."
    exit 1
  fi
  note "Following .dev/api.log and .dev/app.log — Ctrl+C stops tailing, not the servers."
  tail -f "$RUN_DIR/api.log" "$RUN_DIR/app.log"
}

case "${1:-start}" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  logs)    cmd_logs ;;
  *)
    err "Unknown command: $1"
    note "Usage: ./scripts/dev.sh [start|stop|restart|status|logs]"
    exit 1
    ;;
esac
