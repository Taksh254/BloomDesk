#!/usr/bin/env bash
# Local PostgreSQL for development: `npm run db:start`, `npm run db:stop`.
# Uses the PostgreSQL installed on this machine (initdb + pg_ctl) with its data in
# ./.postgres, or a Docker/Podman container when PostgreSQL isn't installed.
# Either way it listens on 127.0.0.1:54329 with user, password and database "bloomdesk",
# which is the DATABASE_URL in .env.example.
set -euo pipefail

PORT=54329
NAME=bloomdesk
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/.postgres"
CONTAINER=bloomdesk-postgres

engine() {
  if command -v docker >/dev/null 2>&1; then echo docker
  elif command -v podman >/dev/null 2>&1; then echo podman
  fi
}

find_bin() {
  if command -v "$1" >/dev/null 2>&1; then command -v "$1"; return; fi
  # Debian/Ubuntu keep the server binaries out of PATH.
  ls -d /usr/lib/postgresql/*/bin/"$1" 2>/dev/null | sort -V | tail -1
}

INITDB="$(find_bin initdb || true)"
PG_CTL="$(find_bin pg_ctl || true)"

start() {
  if [[ -n "$INITDB" && -n "$PG_CTL" ]]; then
    if [[ ! -f "$DATA/PG_VERSION" ]]; then
      echo "Creating a new database cluster in .postgres"
      local pw
      pw="$(mktemp)"
      echo "$NAME" >"$pw"
      "$INITDB" -D "$DATA" -U "$NAME" --pwfile="$pw" --auth=scram-sha-256 -E UTF8 --locale=C >/dev/null
      rm -f "$pw"
    fi
    if "$PG_CTL" -D "$DATA" status >/dev/null 2>&1; then
      echo "PostgreSQL is already running on port $PORT"
    else
      "$PG_CTL" -D "$DATA" -l "$DATA/server.log" -w \
        -o "-p $PORT -k '$DATA' -c listen_addresses=127.0.0.1" start >/dev/null
      echo "PostgreSQL started on port $PORT"
    fi
    # The cluster's default database is "postgres"; make ours once.
    PGPASSWORD=$NAME psql -h 127.0.0.1 -p $PORT -U $NAME -d postgres -tAc \
      "select 1 from pg_database where datname = '$NAME'" | grep -q 1 ||
      PGPASSWORD=$NAME psql -h 127.0.0.1 -p $PORT -U $NAME -d postgres -qc "create database $NAME"
    return
  fi

  local e
  e="$(engine)"
  if [[ -z "$e" ]]; then
    echo "Install PostgreSQL 15+ or Docker, or set DATABASE_URL in .env to any PostgreSQL database." >&2
    exit 1
  fi
  if "$e" ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    "$e" start "$CONTAINER" >/dev/null
  else
    "$e" run -d --name "$CONTAINER" -p 127.0.0.1:$PORT:5432 \
      -e POSTGRES_USER=$NAME -e POSTGRES_PASSWORD=$NAME -e POSTGRES_DB=$NAME \
      -v bloomdesk-postgres:/var/lib/postgresql/data docker.io/library/postgres:17 >/dev/null
  fi
  echo "Waiting for PostgreSQL…"
  for _ in $(seq 1 30); do
    "$e" exec "$CONTAINER" pg_isready -U $NAME >/dev/null 2>&1 && { echo "PostgreSQL started on port $PORT"; return; }
    sleep 1
  done
  echo "PostgreSQL didn't start; check '$e logs $CONTAINER'." >&2
  exit 1
}

stop() {
  if [[ -n "$PG_CTL" && -f "$DATA/PG_VERSION" ]]; then
    "$PG_CTL" -D "$DATA" status >/dev/null 2>&1 && "$PG_CTL" -D "$DATA" -w stop >/dev/null
    echo "PostgreSQL stopped"
    return
  fi
  local e
  e="$(engine)"
  [[ -n "$e" ]] && "$e" stop "$CONTAINER" >/dev/null 2>&1 || true
  echo "PostgreSQL stopped"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *) echo "Usage: $0 start|stop" >&2; exit 1 ;;
esac
