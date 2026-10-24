#!/usr/bin/env bash
# Reactiva UFW sin borrar reglas ni modificar Docker, Nginx o el DNS.
set -euo pipefail

SPACE_UFW_DRY_RUN=false
SPACE_UFW_WEB=false
SPACE_UFW_SSH_PORT=''

usage() {
  cat <<'HELP'
Uso: bash scripts/activar-ufw.sh [--web] [--ssh-port PUERTO] [--dry-run]

Sin opciones: hace una copia de /etc/ufw, conserva las reglas existentes,
activa UFW y mantiene su servicio habilitado al iniciar el sistema.

  --web             Permite TCP 80 y 443 para servir HTTP/HTTPS con Nginx.
  --ssh-port N      Protege el acceso SSH por ese puerto antes de activar UFW.
                    En una conexión SSH detecta automáticamente el puerto actual.
  --dry-run         Muestra los comandos sin ejecutar cambios ni pedir sudo.
  --help            Muestra esta ayuda.

Ejecutalo desde tu terminal normal. No escribas tu contraseña en el chat.
Docker puede publicar puertos que eluden UFW: este script no modifica sus reglas.
HELP
}

while (($#)); do
  case "$1" in
    --web) SPACE_UFW_WEB=true; shift ;;
    --dry-run) SPACE_UFW_DRY_RUN=true; shift ;;
    --ssh-port)
      if (($# < 2)); then printf '%s\n' 'Falta el puerto de --ssh-port.' >&2; exit 2; fi
      SPACE_UFW_SSH_PORT=$2; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Opción desconocida: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

# Capturarlo antes de sudo evita depender de que sudo conserve SSH_CONNECTION.
if [[ -z "$SPACE_UFW_SSH_PORT" && -n "${SSH_CONNECTION:-}" ]]; then
  read -r SPACE_UFW_CLIENT SPACE_UFW_CLIENT_PORT SPACE_UFW_SERVER SPACE_UFW_SSH_PORT SPACE_UFW_EXTRA <<< "$SSH_CONNECTION"
  if [[ -n "${SPACE_UFW_EXTRA:-}" || -z "$SPACE_UFW_SSH_PORT" ]]; then
    printf '%s\n' 'No se pudo identificar el puerto SSH. Usá --ssh-port con el puerto correcto.' >&2
    exit 2
  fi
fi
if [[ -n "$SPACE_UFW_SSH_PORT" ]]; then
  if [[ ! "$SPACE_UFW_SSH_PORT" =~ ^[0-9]{1,5}$ ]] || ((10#$SPACE_UFW_SSH_PORT < 1 || 10#$SPACE_UFW_SSH_PORT > 65535)); then
    printf '%s\n' 'El puerto SSH debe ser un número entre 1 y 65535.' >&2; exit 2
  fi
  SPACE_UFW_SSH_PORT=$((10#$SPACE_UFW_SSH_PORT))
fi

SPACE_UFW_COMMAND=$(command -v ufw || true)
if [[ -z "$SPACE_UFW_COMMAND" ]]; then printf '%s\n' 'UFW no está instalado en esta máquina.' >&2; exit 1; fi
SPACE_UFW_RUN=()
if ((EUID != 0)); then
  if ! command -v sudo >/dev/null; then printf '%s\n' 'Necesitás sudo o ejecutar este script como administrador.' >&2; exit 1; fi
  SPACE_UFW_RUN=(sudo)
fi

run() {
  printf '+'
  printf ' %q' "${SPACE_UFW_RUN[@]}" "$@"
  printf '\n'
  if [[ "$SPACE_UFW_DRY_RUN" == false ]]; then "${SPACE_UFW_RUN[@]}" "$@"; fi
}

SPACE_UFW_BACKUP="/var/backups/ufw-$(date -u +%Y%m%dT%H%M%SZ)-$$"
printf '%s\n' 'Se conservarán las reglas y políticas actuales de UFW.'
run install -d -m 700 "$SPACE_UFW_BACKUP"
run cp -a /etc/ufw "$SPACE_UFW_BACKUP/ufw"
if [[ -f /etc/default/ufw ]]; then run cp -a /etc/default/ufw "$SPACE_UFW_BACKUP/default-ufw"; fi

if [[ -n "$SPACE_UFW_SSH_PORT" ]]; then run "$SPACE_UFW_COMMAND" limit "$SPACE_UFW_SSH_PORT/tcp" comment 'SSH'; fi
if [[ "$SPACE_UFW_WEB" == true ]]; then
  run "$SPACE_UFW_COMMAND" allow 80/tcp comment 'HTTP'
  run "$SPACE_UFW_COMMAND" allow 443/tcp comment 'HTTPS'
fi

run "$SPACE_UFW_COMMAND" --force enable
if command -v systemctl >/dev/null && [[ -f /usr/lib/systemd/system/ufw.service || -f /lib/systemd/system/ufw.service || -f /etc/systemd/system/ufw.service ]]; then
  run systemctl enable ufw.service
fi
run "$SPACE_UFW_COMMAND" status verbose

if [[ "$SPACE_UFW_DRY_RUN" == true ]]; then
  printf '%s\n' 'Simulación terminada. No se modificó el firewall.'
else
  printf '\nUFW activado. Copia previa: %s\n' "$SPACE_UFW_BACKUP"
fi
