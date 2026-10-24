#!/bin/sh
# Electron needs zypak (from the Electron BaseApp) to run its sandbox inside Flatpak.
export TMPDIR="$XDG_RUNTIME_DIR/app/$FLATPAK_ID"
exec zypak-wrapper /app/main/electron --ozone-platform-hint=auto "$@"
