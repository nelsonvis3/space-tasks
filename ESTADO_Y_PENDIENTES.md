# SPACE Tasks — Estado del proyecto y pendientes

Actualizado: **23 de octubre de 2026**. Este documento reúne el trabajo realizado, las comprobaciones disponibles y lo que falta antes de distribuir el programa. Los resultados describen esta revisión; no garantizan ausencia absoluta de errores ni sustituyen la validación en el equipo del usuario.

## 1. Dirección confirmada

- Aplicación de **productividad**, con prioridad en escritorio Linux, gratuita y con código propio libre bajo **GPL-3.0-only**.
- Los juegos fueron retirados. No se continúa con colonia, nave, roguelike ni niveles de combate. Los saldos y registros históricos de XP/monedas se conservan por compatibilidad.
- Android, iPhone y sus tiendas quedaron fuera del alcance por decisión del usuario.
- La IA y la traducción funcionan en el dispositivo, sin exigir API de inferencia de pago.
- Actualmente es una aplicación web con servidor Node/SQLite. **Todavía no existe un instalador de escritorio AppImage/Flatpak.**
- No se desplegó hosting, no se publicaron paquetes, no se conectaron cuentas externas y no se realizó commit ni push.

## Distribución (24/10/2026)

- **Escritorio (versión completa):** Electron 44.9.3 en `desktop/main.mjs`. La interfaz se sirve desde `space://app` y `/api/` lo responde el mismo código del servidor dentro del proceso, sin abrir puertos. Base SQLite, backups y sesión quedan en el perfil del usuario con permisos 600. Cuentas locales, historial, biblioteca de PDF y recuperación funcionan igual que en el servidor. Pendiente: paquete Flatpak `io.github.nelsonvis3.space-tasks`.
- **Pruebas del escritorio** (`npm run runtime -- run test:desktop`, después de `build`): varias cuentas aisladas, sesión que sobrevive a un reinicio, sección legal, bucles y música propia que siguen tras reiniciar, biblioteca de PDF (incluido uno de 8 MB) y WebGPU disponible. Con `SPACE_MODEL_TEST=1` corre OCR y traducción reales; con `SPACE_AI_TEST=1`, el asistente descarga el modelo y responde. Todo verificado el 24/10/2026.
- **Legal y ayuda** (plegado dentro de **Tu cuenta**): política de privacidad, reportar un problema (GitHub Issues), código fuente y licencias.
- **Flatpak** (`flatpak/`): ID `io.github.nelsonvis3.space-tasks`, runtime y base de Electron 26.08. El build es sin conexión (`generated-sources.json` del lockfile más los motores de `/vendor` con sha512). Compila, se instala y pasa la prueba dentro del sandbox. `flatpak-builder-lint` no reporta errores ni en el manifiesto ni en el paquete compilado con `--compose-url-policy=full --mirror-screenshots-url=https://dl.flathub.org/media`. Para regenerar las fuentes tras cambiar dependencias: `flatpak-node-generator npm package-lock.json -o flatpak/generated-sources.json` (con la versión de git de flatpak-builder-tools).
- **Pendiente para Flathub:** publicar un tag `v3.0.0`, cambiar en el manifiesto la fuente `dir` por la fuente `git` de ese tag y abrir el pedido en el repositorio `flathub/flathub` (rama `new-pr`).
- **Web (demo):** GitHub Pages en `https://nelsonvis3.github.io/space-tasks/`, compilada por `.github/workflows/pages.yml` con `SPACE_BASE=/space-tasks/` y `VITE_DEVICE_ONLY=1`: sin cuentas, todo queda en el navegador.

## 2. Funciones implementadas

### Productividad e interfaz

- Tareas con estado, prioridad, fecha y espacios de trabajo; calendario y estadísticas basadas en tareas reales.
- El puntaje sube con las tareas completadas y puede bajar con tareas vencidas pendientes. Cambiar de vista no penaliza al usuario. No se inventa historial anterior que nunca fue guardado.
- Bienvenida, perfil y saludo con el nombre guardado. El avatar de la barra superior abre un único panel **Tu cuenta**: perfil con foto (se recorta y reduce a 256×256 en el navegador y se sincroniza con el perfil), sesión y sincronización, recuperación y seguridad. El botón de la bienvenida desaparece de la barra al terminar la configuración inicial y sigue disponible como "Personalizar tu espacio" dentro del panel. La pantalla de acceso recuerda la apariencia y, al entrar, aplica la paleta de la cuenta.
- Barra configurable en los cuatro bordes: estilos, tamaño, separación, transparencia, desenfoque, esquinas, ampliación, etiquetas, ocultación automática y selección de accesos.
- Orden, visibilidad, iconos, colores e imágenes de los accesos personalizables. Restauración por ajuste, icono, acceso, orden y barra completa.
- Paletas y colores de acento, fondo, superficies y texto con restauración individual. Contraste mejorado en paletas incorporadas.
- Mejoras para ventanas estrechas, controles táctiles, títulos largos, calendario y barra sin desbordamiento horizontal.
- Etiquetas accesibles, foco de teclado y aislamiento del fondo al abrir diálogos.
- Catálogo de interfaz de **465 claves** en **EN, ES, PT, FR, DE, IT y JA**, sin faltantes detectados. Los textos escritos por el usuario y títulos originales no se traducen como etiquetas.

### Guía de estudio y calendario

- Actividades originales de enfoque, repaso, organización y estudio, con enlaces a sus fuentes y acciones para crear tareas.
- Temporizador de concentración y descanso.
- Enlace a lectura oficial de OpenStax; no se incluye el PDF de ese sitio en el programa.
- Versículos diarios estables por fecha local, con una selección que rota cada 12 días. Texto español RV1909 y adaptaciones propias identificadas en otros idiomas.

### PDF, OCR y traducción local

- Importación, biblioteca, lectura con la tipografía/paleta de SPACE y navegación de páginas con controles visibles.
- PDF.js extrae/renderiza por página; Tesseract reconoce páginas de imagen. Hay límites de resolución para evitar lienzos desmesurados.
- Mensajes para documentos dañados, protegidos, vacíos y errores de carga. El OCR no puede garantizar buenos resultados con manuscritos, escaneos borrosos o maquetación compleja.
- Idioma de origen configurable por separado del idioma de la interfaz. Extracción original y extracción seguida de traducción son acciones distintas.
- Traducción gratuita con Transformers.js y WASM en CPU; no depende de WebGPU, Ollama, DeepSeek ni una API de pago.
- Modelos específicos OPUS para varios pares; M2M100 para otros, incluido japonés. Un modelo pequeño para japonés se descartó por resultados incorrectos reales.
- División por contexto y tokens, reintento de fragmentos incompletos, cancelación, caché acotada y comprobaciones de cifras/idioma. Se conserva el original para comparar.
- PDF privados por cuenta en SQLite: hasta 40 MB por archivo y 500 MB por cuenta. Con menos de `MIN_FREE_DISK_MB` libres en el disco (2 GB por defecto) el servidor rechaza cuentas nuevas y subidas de PDF, sin afectar el guardado de los espacios existentes. Modo dispositivo en IndexedDB. Papelera recuperable y hashes para identificar contenido.
- La traducción automática **no está certificada como exacta** en libros o documentos completos. El idioma aparente y los números correctos no garantizan fidelidad semántica.

### IA en el navegador

- Asistente con WebLLM y Qwen2.5-0.5B-Instruct cuantizado, con variante según capacidades WebGPU.
- Descarga inicial, progreso, cancelación, liberación de memoria y errores de conexión/compatibilidad.
- La inferencia se ejecuta localmente y no envía consultas a un proveedor de IA. El historial puede sincronizarse con el propio servidor SPACE al iniciar sesión.
- El asistente propone texto; no modifica ni completa tareas automáticamente.
- Su inferencia real y rendimiento en el equipo Intel todavía requieren validación manual; no se presenta como compatible con todos los navegadores.

### Música persistente

- Proveedor global que conserva el transporte de audio entre vistas y evita dos transportes audibles simultáneos.
- Tres bucles sintetizados originales (48 kHz, FLAC sin pérdida) y cuatro pistas CC0 de OpenGameArt incluidas en `public/audio/cc0/`, con procedencia documentada. Toda la música funciona sin conexión y la CSP ya no permite conexiones a OpenGameArt.
- Reproducción en búfer con bucles por muestras, posición al pausar y volumen/pista conservados; un único HTMLAudioElement persistente como respaldo.
- Reproducción sujeta al gesto inicial que exija el navegador.
- Se comprobaron muestras, uniones, límites y reproducción/navegación en navegador. La escucha humana prolongada de continuidad y volumen sigue pendiente.

## 3. Cuentas, conservación de datos y seguridad

### Protección de datos implementada

- Cuentas reales con nombre de usuario y contraseña, sesiones revocables y datos aislados por cuenta.
- En **Tu cuenta → Seguridad**: cambiar la contraseña (pide la actual y cierra las demás sesiones), cerrar sesión en los demás dispositivos y eliminar la cuenta para siempre (pide la contraseña y una confirmación; borra sesiones, espacio, versiones y PDF del servidor, y en el dispositivo la copia local y la música agregada). Las copias en los backups del servidor desaparecen al rotar, en un máximo de cinco semanas.
- Copia local y cola persistente de cambios; reintentos de sincronización tras recuperar conexión.
- Al cerrar sesión, después de sincronizar, se borra del navegador la copia local de la cuenta (tareas, preferencias, cola y respaldo local); al volver a entrar se recupera del servidor. La música agregada por el usuario queda en el dispositivo porque solo existe ahí.
- Cerrar sesión exige confirmar el guardado. Un fallo de red o cuota no permite informar falsamente que todo está sincronizado.
- Reautenticación conservando la cola; control de conflictos entre revisiones y protección ante restauraciones antiguas del servidor.
- Una sola pestaña de edición por cuenta/navegador mediante Web Locks; otro dispositivo conserva el control por revisión.
- Recuperación de tareas con ID original, evitando duplicar recompensas. Copia del contenido antes de reparar datos locales dañados.
- Historial de hasta 100 versiones del espacio y como máximo 100 MB por cuenta (se descartan las más viejas), importación/exportación JSON y restauración con conservación de la versión reemplazada.
- **La exportación JSON del espacio no incluye los archivos PDF.** Una copia completa de SQLite sí incluye cuentas, versiones y PDF guardados en el servidor.
- Backups SQLite consistentes cada seis horas (al arrancar solo si la última tiene más de seis horas), integridad comprobada y espera al cerrar el servidor. Se conservan las 2 copias más nuevas, la última de cada día de la semana y la última de cada semana del mes (unas 13 como máximo), así que una racha de reinicios no borra las copias viejas. No se crea una copia si en el disco no entra el doble del tamaño de la base. Permisos privados y renombrado desde archivos parciales, sin dejar archivos `-wal`/`-shm` sueltos.
- Las pruebas de cuentas usan bases y perfiles temporales; no restauran ni borran la base personal del usuario.

### Seguridad y optimización aplicadas

- Contraseñas scrypt con sal individual y N=131072; migración de hashes anteriores tras login correcto, preservando identidad, tareas y sesiones.
- Cookies HttpOnly/SameSite y configuración Secure para producción; validación de origen, CSRF y propiedad de PDF.
- Límites de intentos y memoria, concurrencia de autenticación, cuerpos acotados y plazas limitadas para cargas/guardados simultáneos.
- CSP, cabeceras de seguridad, sandbox de PDF, protección de rutas y enlaces simbólicos y ausencia de ejecución de scripting del visor PDF.
- Node **24.22.1** preparado localmente con SHA-256 verificado; no se reemplazó Node del sistema. Se rechazan versiones anteriores al mínimo configurado antes de abrir datos.
- Fuentes WOFF2 locales con OFL, carga diferida de vistas y compresión Brotli/gzip de recursos públicos. Las respuestas privadas de la API no se comprimen.
- Cachés, rasterizado PDF/OCR y número de modelos cargados acotados.
- Los motores (PDF.js, Tesseract, Transformers.js, WebLLM) se sirven desde el propio servidor: se bajan del registro de npm con integridad sha512 fijada y la CSP no permite scripts de ningún CDN. Auditoría separada del árbol npm y de esos motores. No se equipara un build correcto con una certificación de seguridad.

## 4. Licencias y exclusión de libros

### Aplicado

- [LICENSE](LICENSE): GNU GPL versión 3 únicamente para el código propio.
- [LICENSING.md](LICENSING.md): alcance, obligaciones de distribución y excepciones para datos/recursos de terceros.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) y `public/licenses/`: avisos originales de dependencias, Node, motores, modelos y fuentes.
- Inventario automático de 55 entradas de dependencias; se exige texto de licencia para cada paquete instalado. Incluye avisos del binding de Rolldown que el paquete npm omite.
- Las dependencias conservan sus términos. OPUS EN→DE requiere atribución CC-BY-4.0; no se le aplica la GPL del programa.
- Las licencias se regeneran en desarrollo/build y son accesibles desde la aplicación. Los pesos externos no se incluyen en el código.

### Libros excluidos por decisión del usuario

- Tres PDF originales y tres conversiones a texto se trasladaron a `.local-books/`, sin alterar sus bytes. Se comprobaron SHA-256 antes y después.
- Se conservaron el catálogo anterior y un manifiesto de integridad dentro de esa carpeta privada local.
- `public/pdfs/` y `public/reading/` ya no contienen esos archivos; el catálogo distribuible de libros quedó vacío.
- `.gitignore` y `.npmignore` excluyen las copias locales, las rutas públicas anteriores, datos, backups, cachés e informes de navegador.
- Vite bloquea el acceso normal a `.local-books/` durante desarrollo, conservando los bloqueos predeterminados de archivos sensibles. [Referencia técnica](https://vite.dev/config/server-options#server-fs-deny).
- El build comprueba `public/` antes y `dist/` después de compilar. Rechaza PDF, textos precargados, copias comprimidas y enlaces simbólicos.
- La conversión opcional `pdfs:index` trabaja solo dentro de `.local-books/`; no alimenta la aplicación ni se ejecuta automáticamente.
- La biblioteca sigue importando PDF propios. Para leer otra vez uno de los originales conservados, importarlo desde `.local-books/pdfs/`.
- **No copiar `.local-books/` al publicar una carpeta manualmente.** Los archivos privados ya importados por usuarios no se eliminaron ni se modificaron.

### Logo

Resuelto: el logo y sus variantes son obra original de Nelson Sivisstum (2023). Quedan con todos los derechos reservados: se redistribuyen sin modificar con SPACE Tasks y los forks deben usar otro logo. Detalle en [LICENSING.md](LICENSING.md).

## 5. Comprobaciones y evidencia

### Tras excluir los libros

| Control | Resultado |
| --- | --- |
| TypeScript | Aprobado |
| Pruebas unitarias/integración | 76 aprobadas, 0 fallos; incluye exclusión de libros y conservación de recursos legales |
| Idiomas | 465 claves, siete idiomas, sin faltantes detectados |
| Build de producción | Aprobado; `public/` y `dist/` sin libros ni textos precargados |
| Integridad de los archivos trasladados | Seis archivos conservados con SHA-256 coincidente |
| Navegadores tras el cambio | 14 recorridos en Chromium/Firefox/ventana estrecha y seis en Brave, todos aprobados; biblioteca inicialmente vacía, rutas anteriores con HTTP 404 e importación/lectura de dos páginas/restauración de PDF propias comprobadas |
| Protección en desarrollo | Archivo sintético en `.local-books/` bloqueado con HTTP 403 tanto por ruta directa como por `/@fs/`, sin abrir PDF ni base de usuarios |
| Inventario de paquete fuente | `npm pack --dry-run --ignore-scripts`: sin libros, conversiones, datos privados, cachés ni informes; el único PDF es la muestra original de dos páginas de las pruebas. No se publicó ni generó un instalador |

### Verificación completa anterior, antes de esta exclusión

- `verify:release` terminó con código 0: 74 pruebas, tipos, idiomas, build, auditorías y recorridos reales.
- 14 pruebas principales en Chromium/Firefox/ventana estrecha y seis adicionales en Brave aprobadas.
- Traducción real: ocho muestras en siete idiomas con revisión de cifras, negación y concepto de descanso; salidas guardadas en [docs/evidence/](docs/evidence/).
- OCR real de un PDF de imagen original seguido de traducción al español, aprobado en Chromium, Firefox y Brave.
- `npm audit`: cero avisos conocidos en el árbol del proyecto. El escaneo independiente del grafo Node de runtimes conserva dos entradas altas relacionadas con bibliotecas nativas de `sharp`, que no se usan en la entrada de navegador. La excepción está acotada y revisada; no significa que esos avisos estén corregidos.
- No se repiten las inferencias costosas por un cambio que excluye libros y no modifica los motores/modelos; se distingue esta evidencia anterior de las pruebas nuevas.

Informes locales: `playwright-report/` y `test-results/`. La [evidencia de exclusión](docs/evidence/book-exclusion-2026-10-23.json) conserva el resultado del inventario y la comprobación de integridad. Detalle: [auditoría](docs/audit-2026-10-23.md), [runtimes](docs/runtime-dependencies.md), [entorno de pruebas](docs/testing-environment.md). El listado de Playwright descubre pruebas, pero no las ejecuta.

## 6. Pendientes antes de distribuir

### Prioridad 1 — Procedencia y primera instalación

- [x] Derechos del logo: obra propia, todos los derechos reservados (ver `LICENSING.md`).
- [ ] Elegir formato de distribución Linux y crear un instalador real; no confundir `dist/` o un archivo fuente con AppImage/Flatpak.
- [ ] Probar instalación limpia, inicio, cierre y desinstalación sin borrar los datos del usuario por defecto.
- [ ] Preparar actualizaciones y migraciones reversibles, con copia previa y recuperación tras una actualización interrumpida.
- [ ] Incluir código fuente correspondiente, lockfile, scripts de compilación y avisos GPL/terceros en cada release; revisar también los componentes nativos que se incorporen al instalador.
- [ ] Comprobar rutas de datos, permisos y copias en el formato elegido. Un paquete no debe llevar bases personales, claves, informes ni libros.
- [ ] Definir versiones soportadas de Linux/arquitecturas y medir el consumo real. El runtime automático actual contempla Linux glibc x64/arm64; no acredita todos los sistemas.

### Prioridad 2 — Experiencia y validación manual

- [ ] Ejecutar el asistente WebGPU de verdad en un equipo compatible y medir descarga, memoria, respuesta y cancelación.
- [ ] Medir rendimiento físico en Intel integrado/16 GB: arranque, uso sostenido, biblioteca grande y consumo combinado de audio/OCR/modelos.
- [ ] Escuchar bucles durante varias vueltas y revisar volumen, pausa/reanudación, cambio de pista y respaldo por fallos de red.
- [ ] Ampliar revisión humana de traducciones y OCR con documentos variados y los siete idiomas; verificar significado, nombres, fórmulas y tablas.
- [ ] Revisar manualmente textos, teclado y lectores de pantalla. Axe y la cobertura de claves no certifican toda la accesibilidad ni calidad lingüística.
- [ ] Resolver bibliotecas compatibles para ejecutar WebKit en este entorno si se incorpora a la matriz. Safari no está verificado.
- [ ] Fijar revisiones de pesos de modelos y evaluar funcionamiento sin conexión después de descargarlos. La primera descarga sigue necesitando red.

### Prioridad 3 — Recuperación y operación

- [ ] Diseñar recuperación segura de contraseña; actualmente no hay recuperación por correo. Evitar preguntas o mecanismos débiles que permitan apropiarse de cuentas.
- [ ] Definir purga definitiva de PDF eliminados con confirmación y retención explícita. Hoy siguen siendo recuperables y cuentan para la cuota.
- [ ] Decidir si hace falta cifrar datos locales/backups según el modo de distribución. La aplicación no incorpora actualmente cifrado en reposo.
- [ ] Preparar copias externas al disco y ensayar recuperación de una cuenta con sus PDF. Las copias en el mismo disco no cubren su pérdida física.
- [ ] Ejecutar CI remoto cuando se publique el repositorio y mantener auditorías/regresiones al actualizar dependencias y modelos.

### Solo si se decide alojar cuentas compartidas

- [ ] Obtener autorización y elegir infraestructura. No se contrató ni conectó hosting.
- [ ] Configurar HTTPS, `APP_ORIGIN`, cookies seguras, proxy y almacenamiento persistente de base/PDF/backups.
- [x] Límites por IP detrás del proxy: solo cuentan los fallos de inicio de sesión, los registros tienen su propio límite, IPv6 se agrupa por /64 y `TRUST_PROXY=1` usa la IP real detrás de un único proxy.
- [ ] Probar restauración, caídas, reinicios y límites de disco en la infraestructura elegida.
- [ ] Redactar información de privacidad adecuada al servicio realmente ofrecido.
- [ ] Verificar UFW/Docker en el equipo del usuario si corresponde. El script de UFW se preparó, pero no se activó el firewall desde Codex.

No se promete pérdida imposible de datos, compatibilidad universal ni traducción perfecta. Se preservan originales, se detectan errores y se ofrecen mecanismos de recuperación; la operación y las copias externas siguen siendo necesarias.

## 7. Comandos útiles

Desde la raíz del proyecto, usando el Node local verificado:

```bash
# Si todavía no se instaló el runtime local:
npm run runtime:install

# Desarrollo con interfaz y API juntas:
npm run runtime -- run dev

# Tipos, pruebas, idiomas, build y descubrimiento de E2E:
npm run runtime -- run verify

# Verificación completa con red, navegadores, modelos y OCR reales:
npm run runtime -- run verify:release

# Brave instalado en este equipo:
SPACE_BRAVE_PATH=/usr/bin/brave npm run runtime -- run test:e2e -- --project=brave

# Regenerar avisos y generar un backup consistente del servidor:
npm run runtime -- run licenses
npm run runtime -- run backup

# Revisar el contenido del paquete fuente sin publicarlo:
npm run runtime -- pack --dry-run --ignore-scripts --json
```

El servidor autónomo puede ejecutarse con `npm run runtime -- start` después del build. Un alojamiento estático de `dist/` permite el modo dispositivo, pero **no incorpora la API de cuentas**. Ninguno de estos comandos instala un programa nativo ni publica el proyecto.
