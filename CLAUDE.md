# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SPACE Tasks: app de productividad (tareas, calendario, lector de PDF con OCR y traducción, asistente IA y música) donde la IA, el OCR y la traducción corren en el dispositivo. React 19 + TypeScript + Vite en el frontend, Node 24 con `node:sqlite` en el backend, Electron para escritorio. GPL-3.0-only; el logo tiene todos los derechos reservados. El estado detallado y los pendientes están en `ESTADO_Y_PENDIENTES.md`.

## Comandos

Node exigido: `>=24.22.1 <25`; `server/runtime.mjs` corta el arranque con versiones anteriores. Si el Node del sistema no alcanza, `npm run runtime:install` baja una copia verificada a `.cache/node` y `npm run runtime -- run <script>` corre cualquier script con ella.

```bash
npm run dev                 # interfaz y API juntas en http://localhost:5173 (la API la monta el plugin de Vite)
npm run verify              # typecheck, tests unitarios, auditoría i18n, build y listado E2E (lo mismo que CI)
npm run verify:release      # además audit, E2E reales, traducción y OCR con modelos reales (necesita red)
npm test                    # tests unitarios/integración (node:test con --experimental-strip-types)
node --experimental-strip-types --test --test-isolation=none tests/sync.test.mjs   # un solo archivo
npm run test:i18n           # falla si falta alguna clave de UI en algún idioma
npm run test:e2e            # Playwright (Chromium, Firefox, ventana 390×844); navegadores en .cache/ms-playwright
npm run test:e2e -- e2e/productivity.spec.mjs -g "nombre del test" --project=chromium
npm run test:desktop        # Playwright sobre Electron, después de `npm run build`
npm run desktop             # ventana de escritorio, después de `npm run build`
npm run appimage            # release/SPACE_Tasks-<versión>-x86_64.AppImage, después de `npm run build`
SPACE_DESKTOP_APP=release/SPACE_Tasks-3.0.1-x86_64.AppImage npm run test:desktop   # la suite de escritorio contra el AppImage
npm start                   # servidor autónomo (sirve dist/ + /api), lee .env
```

- Brave en vez de Chromium: `SPACE_BRAVE_PATH=/usr/bin/brave npm run test:e2e -- --project=brave`. WebKit solo con `SPACE_TEST_WEBKIT=1` (no arranca en CachyOS).
- `SPACE_MODEL_TEST=1` / `SPACE_OCR_TEST=1` activan las suites que bajan modelos y Tesseract; `SPACE_AI_TEST=1` hace que el test de escritorio baje el modelo del asistente.
- Los E2E levantan su propia instancia (`scripts/e2e-server.mjs`, puerto 4179) con base temporal: nunca tocan `data/space.sqlite`.
- `predev`/`prebuild` corren `scripts/vendor.mjs` y regeneran licencias; `postbuild` comprime y revisa que `dist/` no lleve libros ni PDF.

## Arquitectura

**Un solo backend, tres anfitriones.** `server/api.mjs` (`createApi`) recibe un `Request` web y devuelve un `Response`; `server/store.mjs` tiene SQLite, cuentas (scrypt), sesiones, versiones y PDF. Esa misma API se monta en:
- `server/vite-plugin.mjs`: middleware de `/api/` en `vite dev`/`preview`, con la base en `data/`.
- `server/index.mjs`: servidor HTTP de producción con estáticos (`server/static.mjs`, CSP y cabeceras), backups (`server/backups.mjs`) y límites (`server/limits.mjs`).
- `desktop/main.mjs`: Electron registra el protocolo `space://app` y responde `/api/` dentro del proceso, sin abrir puertos; la base y los backups van al perfil del usuario. `scripts/appimage.mjs` lo empaqueta: copia el Electron de `node_modules` más `dist`, `desktop`, `server` y `package.json` a `resources/app`, y arma el AppImage con `appimagetool` y el runtime fijados por sha256. El `AppRun` agrega `--no-sandbox` solo donde el kernel bloquea los user namespaces (Ubuntu 24.04+).

**Modo dispositivo.** Con `VITE_DEVICE_ONLY=1` (`src/paths.ts`) no hay cuentas ni API: todo queda en el navegador (localStorage + IndexedDB para PDF). Así se compila la demo de GitHub Pages (`.github/workflows/pages.yml`, con `SPACE_BASE=/space-tasks/`). Cualquier función nueva que use la API tiene que degradar bien en este modo.

**Datos del cliente y sincronización** (`src/account/`). El espacio de trabajo es un `Record<string,string>` armado con las claves de localStorage con prefijo `orbit`/`orbit-tasks:` (nombre viejo del proyecto; no renombrar, rompe los datos guardados), aisladas por cuenta en `storage.ts`. `sync.ts` sube snapshots con número de revisión y el servidor rechaza los guardados viejos; `lock.ts` usa Web Locks para que haya una sola pestaña editando; `reconcile.ts` resuelve conflictos. `AuthGate.tsx` es el punto de entrada de la sesión y expone `useAccount`.

**Motores pesados fuera del bundle.** PDF.js, Tesseract, Transformers.js y WebLLM no están en `package.json`: `scripts/vendor.mjs` los baja del registro npm con sha512 fijado y los sirve desde `/vendor/`. La CSP no permite scripts de CDN. Para cambiar una versión hay que actualizar el hash en `scripts/vendor.mjs` y `docs/runtime-dependencies.md`, y correr `npm run audit:runtimes`. La traducción (`src/translation/`, worker con modelos OPUS/M2M100) y el asistente (`src/ai/`, WebLLM sobre WebGPU) corren en Web Workers con protocolos de mensajes tipados.

**i18n.** La UI se escribe en inglés y la clave es el propio texto: `t(language,'Texto en inglés')`. Las traducciones viven en `src/locales/messages.ts` como un array en orden `es, pt, fr, de, it, ja`. Todo texto nuevo de UI necesita sus seis traducciones o `npm run test:i18n` (y `verify`) falla.

**Tests.** Los unitarios (`tests/*.test.mjs`) importan directamente archivos `.ts` de `src/`, por eso esos módulos usan imports con extensión `.ts` explícita y no pueden depender de nada que Node no ejecute (JSX, `import.meta.env` sin `?.`). Los de cuentas y API crean bases temporales en `tmpdir()`.

## Convenciones y restricciones

- El código es denso: funciones de una línea, sin espacios alrededor de operadores, pocos comentarios. Mantener ese estilo.
- `.local-books/` tiene PDF privados que no se distribuyen. El build, `check-distribution.mjs` y la config de Vite (`server.fs.deny`) lo bloquean; no copiar nada de ahí a `public/` ni a `dist/`.
- Los juegos se retiraron: los saldos de XP y monedas (`gamification.ts`, `rewards.ts`) se conservan solo por compatibilidad.
- Flatpak quedó en pausa y se sacó del repo. Si se retoma: Flathub prohíbe manifiestos o envíos hechos con IA, así que no escribir ni proponer el manifiesto de Flathub.
- Variables del servidor en `.env.example` (`APP_ORIGIN` es obligatoria con `NODE_ENV=production`).
