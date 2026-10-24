# SPACE Tasks

Aplicación de productividad con React 19, TypeScript y Vite: tareas, espacios de trabajo, calendario, estadísticas, lectura y música. Los juegos fueron retirados. Los balances de XP y monedas y sus registros de recompensas anteriores se conservan como compatibilidad, sin ejecutar simulaciones.

**Software libre y gratuito para escritorio, con prioridad en Linux.** No se preparan publicaciones para Android/iPhone ni cuentas de tiendas. El código propio tiene licencia **GPL-3.0-only**: [LICENSE](LICENSE). Las dependencias conservan sus licencias; [alcance y recursos pendientes de autorización](LICENSING.md), [avisos de terceros](THIRD_PARTY_NOTICES.md). Los libros proporcionados están excluidos del build y del paquete de código. El logo es propio y conserva todos los derechos: los forks deben usar otro. Las tareas y PDF privados siguen perteneciendo al usuario.

[Estado completo del proyecto y pendientes](ESTADO_Y_PENDIENTES.md).

## Desarrollo local

Requiere **Node 24.22.1 o una revisión de seguridad posterior de 24.x**, npm y las dependencias instaladas. `.nvmrc` y `.node-version` fijan el mínimo verificado. La [versión 24.22.1](https://nodejs.org/en/blog/release/v24.22.1) corrige avisos de seguridad del runtime que `npm audit` no detecta como paquetes de esta aplicación.

En Linux glibc x64/arm64 se puede usar un runtime local sin modificar Node del sistema:

```bash
npm run runtime:install
npm run runtime -- ci
npm run runtime -- run dev
```

La descarga oficial se verifica contra un SHA-256 fijado de la publicación de Node antes de extraer o ejecutar el archivo. Queda en `.cache/node` y conserva su licencia completa. `npm run runtime -- run verify:release` ejecuta todos los controles con esa copia. Si el sistema ya tiene una versión compatible, también funcionan los comandos normales:

```bash
npm install
npm run dev
```

Abrir la dirección que indica Vite, normalmente `http://localhost:5173`. **Un solo comando** inicia la interfaz y la API de cuentas en el mismo origen: ya no hace falta arrancar otro servidor ni depender de un proxy a un puerto fijo. Funciona también si Vite elige un puerto diferente. `npm run preview`, después de compilar, incorpora esa misma API para la revisión local.

`npm run dev:server` sigue disponible si se quiere ejecutar el backend por separado para revisar producción. Todas estas entradas usan la misma base `DATA_DIR/space.sqlite`. No hay que arrancarlas juntas para usar la aplicación.

También se puede elegir **Continuar en este dispositivo**, sin cuenta: conserva los datos locales anteriores. No crea una cuenta ni sincroniza entre dispositivos. Servir únicamente los archivos de `dist` mediante un alojamiento estático no incorpora la API.

La pantalla de acceso recuerda la última paleta del navegador desde el primer render. Una copia de apariencia sin nombre, contraseña ni tareas permite aplicar el color de fondo antes de arrancar React. Al acceder se aplica la configuración propia de la cuenta, y el inicio saluda con el nombre guardado. La bienvenida y sus formularios usan los mismos colores, también al previsualizar el tema claro u oscuro.

## Personalización

La barra permite posición en los cuatro bordes, desplazamiento sobre el borde, tres estilos, tamaño, separación, transparencia, desenfoque, esquinas, ampliación al pasar el mouse, ocultación automática, etiquetas, indicador activo y forma de los iconos. Cada acceso puede reordenarse, ocultarse y cambiar su icono, color o imagen PNG/JPEG/WebP. Las imágenes se reducen a 96 px antes de guardarlas.

Cada ajuste tiene su propio botón **Restaurar valor original**. También hay restauración por icono, por acceso, del orden y de la barra completa. Los colores de la página tienen cuatro paletas y controles independientes de acento, fondo, tarjetas y texto, cada uno con restauración individual. Se advierte cuando el contraste del texto personalizado es bajo.

EN, ES, PT, FR, DE, IT y JA tienen catálogo de interfaz, errores y controles accesibles. Los nombres escritos por el usuario y los títulos originales de los libros no se traducen como etiquetas de interfaz.

## Cuentas y guardado

`server/` implementa cuentas reales en SQLite con el módulo incorporado de Node: contraseñas con scrypt (N=131072, r=8, p=1) y sal individual, sesiones revocables de 30 días en cookies HttpOnly/SameSite, validación de origen, token CSRF y límite de intentos. Las cuentas anteriores conservan su contraseña y sus datos: su hash con N=32768 se actualiza al iniciar sesión correctamente mediante una migración aditiva. El trabajo de autenticación se limita a cuatro operaciones simultáneas. No se guardan contraseñas en el navegador. No hay recuperación de contraseña por correo implementada.

Se sincronizan tareas, espacios, perfil, configuración, estadísticas, preferencias de música y conversación local del asistente con **tu servidor SPACE**. La inferencia sigue en el dispositivo: no se envían consultas a un proveedor de IA. Los PDF importados en una cuenta se guardan en la misma base de datos con comprobación de propietario; límite de 40 MB por archivo y 500 MB por cuenta. En modo dispositivo se usa IndexedDB.

El navegador mantiene una copia por cuenta y una cola persistente de cambios pendientes. El reintento ocurre al recuperar conexión y cada 15 segundos; un guardado espera también los cambios realizados mientras la petición estaba en curso. Cerrar sesión exige guardar el estado visible y recibir la confirmación del servidor. Si falla el almacenamiento o la sincronización, la sesión permanece abierta y se ofrece exportar una copia. Si caduca la sesión, **Volver a iniciar sesión** conserva la cola de esa cuenta. La copia local no sustituye al servidor y puede desaparecer si se borran los datos del navegador.

Cada cuenta tiene una sola pestaña de edición por navegador, mediante Web Locks (requiere un navegador moderno en HTTPS o localhost). Otra pestaña no monta el editor y no puede sobrescribir el caché compartido. Distintos dispositivos siguen usando revisiones: ante cambios incompatibles, o si un servidor recuperado tiene una revisión anterior a la copia del navegador, se pide elegir qué versión conservar. No se sobrescribe en silencio la copia más reciente del dispositivo.

En **Tu cuenta → Recuperación del espacio** se pueden consultar y restaurar las últimas versiones del servidor (hasta 100, y como máximo 100 MB por cuenta), descargar la copia de recuperación local e importar/exportar un respaldo JSON. Restaurar requiere sincronizar primero los cambios pendientes y guarda la versión actual antes de reemplazarla. Una restauración completa vuelve al contenido y las preferencias de esa versión, incluidos sus balances históricos; la versión reemplazada queda recuperable. El JSON incluye las tareas, sus registros de recompensas y las preferencias, pero no los archivos PDF. Las claves locales anteriores se conservan durante la migración.

Las tareas eliminadas van a **Recuperar tareas eliminadas**, con sus ID originales; restaurarlas no concede otra recompensa. Se conserva el original antes de reparar un payload de tareas o papelera dañado. Los PDF eliminados también son recuperables desde la biblioteca, sin borrado físico automático; siguen contando para el límite de 500 MB. La biblioteca del dispositivo se puede importar a la cuenta sin borrar sus archivos originales. Los PDF nuevos incluyen SHA-256 para evitar confundir dos archivos distintos con igual nombre y tamaño. Los archivos anteriores sin hash pueden importarse una vez más; se prioriza conservar su contenido.

### Producción y copias

```bash
npm run build
env NODE_ENV=production APP_ORIGIN=https://tu-dominio.example npm start
```

El servidor Node sirve `dist` y `/api` en el mismo origen. El build genera Brotli/gzip para recursos públicos de texto; el servidor negocia la codificación y conserva una variante sin comprimir. Las respuestas privadas de la API no se comprimen. Las cuatro fuentes WOFF2 variables se sirven localmente con sus licencias OFL, sin solicitudes a Google Fonts al abrir la interfaz. Hace falta configurar un proxy HTTPS y un volumen **persistente** para `DATA_DIR`. No sirve desplegar solamente `dist` para tener cuentas. El puerto 3001 permanece ligado a localhost por defecto; en un contenedor puede configurarse `HOST=0.0.0.0` detrás de su proxy. `APP_ORIGIN` debe coincidir exactamente con el origen público. El límite de intentos cuenta solo los inicios de sesión fallidos (20 cada 15 minutos por IP) y, aparte, los registros (5 cada 15 minutos por IP); las direcciones IPv6 se agrupan por red /64. Detrás de **un** proxy que agregue `X-Forwarded-For`, definir `TRUST_PROXY=1` para limitar por la IP real del visitante; sin esa variable no se confía en encabezados reenviados y todos los visitantes comparten la IP del proxy.

```bash
npm run backup
```

El servidor autónomo crea una copia consistente cada seis horas (al arrancar, solo si la última tiene más de seis horas). Conserva las 2 más nuevas, la última de cada día de la semana y la última de cada semana del mes, y no copia si el disco no tiene libre el doble del tamaño de la base. `npm run backup` crea otra copia con la misma comprobación de integridad y retención. La API de backup incluye cuentas, versiones y PDF, incluso los cambios confirmados en WAL. Los archivos de base de datos y las copias usan permisos `0600` y las carpetas nuevas `0700`. Los archivos en curso usan `.partial` y se renombran después de comprobar su integridad; las copias anteriores solo se retiran después de comprobar una nueva copia válida. Los errores se registran en la consola del servidor.

`BACKUP_DIR` cambia el destino del servidor autónomo. El complemento de desarrollo/preview guarda las copias en `DATA_DIR/backups`. Las pruebas usan bases temporales: no restauran ni borran los datos reales del usuario.

Antes de alojar el sitio hay que preparar almacenamiento persistente para la base y los respaldos, copia externa y recuperación probada. Las copias en el mismo disco no protegen contra la pérdida de ese disco. Para una restauración de servidor: detener la aplicación, conservar la base actual y sus WAL/SHM juntos como recuperación, restaurar una copia comprobada en otro directorio limpio y configurar `DATA_DIR` a ese directorio antes de arrancar. No combinar una base restaurada con WAL/SHM anteriores. No hay despliegue realizado ni garantía absoluta contra pérdida de datos.

## Biblioteca y conversión a texto

La distribución empieza sin libros precargados. Los tres libros proporcionados y sus conversiones se conservaron fuera de `public/`, en `.local-books/pdfs/` y `.local-books/reading/`, con comprobación SHA-256 antes y después del traslado. Esa carpeta está excluida del control de versiones y del empaquetado npm, y bloqueada por el servidor de desarrollo. No se ejecuta una indexación de libros al iniciar ni al compilar.

La biblioteca sigue permitiendo importar PDF propios, leerlos con el estilo de SPACE, navegar sus páginas, extraer texto, usar OCR y traducirlos. No se modificaron los PDF privados de las cuentas ni del navegador. Para volver a leer un libro personal conservado, importarlo desde `.local-books/pdfs/`.

```bash
npm run pdfs:index
```

La orden opcional anterior trabaja únicamente en `.local-books/`: convierte con Poppler (`pdftotext`) y escribe un catálogo privado en esa misma carpeta. No incorpora libros ni textos al catálogo de la aplicación o al build. No modifica los archivos originales.

Los PDF importados se extraen por página con PDF.js en un worker. El documento permanece cargado al cambiar entre texto e imagen. Hay mensajes distintos para archivos dañados, documentos ausentes y contraseñas incorrectas; las contraseñas no se guardan. Se puede elegir orden del documento, filas o una separación aproximada en dos columnas, y girar la página. El runtime y las fuentes de PDF.js 5.4.149 se descargan al abrir un documento que lo necesita. El modo **PDF original** conserva la disposición de página y hay descarga del archivo original si el lector no carga. La vista de texto reorganiza líneas y párrafos, pero no promete reproducir tablas, columnas complejas, fórmulas ni imágenes. Las páginas escaneadas y las capas de texto ilegibles tienen **OCR local con Tesseract.js 6**, activado por el usuario para la página o automáticamente cuando falta texto. Se elige el idioma del documento aparte del idioma de traducción (EN/ES/PT/FR/DE/IT/JA). El motor y los datos de idioma se descargan la primera vez, las imágenes se procesan en el dispositivo y se muestra progreso y confianza de reconocimiento. Los lienzos de OCR se limitan a 4 millones de píxeles. OCR y extracción pueden fallar con manuscritos, imágenes borrosas, maquetación compleja o archivos dañados: no se promete compatibilidad absoluta con todos los PDF.

La traducción usa un worker dedicado con **Transformers.js 3.8.1 + WebAssembly en CPU**, separado del asistente WebGPU. Funciona sin `navigator.gpu` ni memoria compartida; utiliza un solo hilo para mantener compatibilidad y limitar recursos. Desde inglés se priorizan los modelos OPUS específicos EN→ES/DE/FR/IT; portugués usa `Xenova/opus-mt-en-ROMANCE` con el token de destino `>>pt<<` requerido por el modelo. ES→EN conserva `Xenova/opus-mt-es-en`. Las otras combinaciones entre los siete idiomas usan `Xenova/m2m100_418M`. Japonés mantiene M2M100 tras la regresión detectada con un modelo pequeño. Todos usan pesos cuantizados a 8 bits. Los pares específicos evitan cargar M2M100 para documentos en inglés. M2M100 descarga pesos bastante más grandes: la interfaz informa los bytes reales recibidos. No se requiere DeepSeek, API de pago ni enviar el texto a un proveedor; sí se necesita red para descargar runtimes y modelos inicialmente.

Se elige el **idioma del documento** aparte del idioma de la página. La detección automática es orientativa y puede corregirse manualmente. **Extraer y traducir** procesa primero el OCR y luego traduce el texto obtenido al idioma de la interfaz; **Extraer solo el texto original** no traduce. Los controles de página están arriba y abajo y muestran Anterior/Siguiente con texto.

Para conservar contexto, se reparan palabras cortadas por saltos de línea y se agrupan oraciones completas y párrafos. La tokenización sin truncamiento comprueba el tamaño antes de inferir. Si se alcanza el límite de entrada o salida, se divide ese pasaje y se vuelve a procesar desde el original, sin publicar como completa una salida cortada. La generación es determinista. El idioma resultante se verifica con una heurística conservadora y se avisa si cambian cifras o faltan enlaces del original. Estos controles no certifican equivalencia semántica: la traducción automática y el OCR pueden equivocarse y necesitan contraste con el original en textos importantes.

Se puede cancelar, comparar con el original y reintentar. La caché de hasta 20 páginas dura mientras está abierto el lector e incluye texto de origen e idiomas, por lo que corregir OCR o cambiar idioma invalida la salida anterior. Solo se mantiene un modelo de traducción cargado a la vez. No se modifica el PDF ni se genera otro con la misma maquetación.

**Distribución:** el build comprueba `public/` antes de compilar y `dist/` al terminar; rechaza PDF, carpetas de libros/textos derivados y enlaces simbólicos. El catálogo de libros precargados debe permanecer vacío. No copiar `.local-books/` a una publicación. Los PDF privados de las cuentas se sirven únicamente con sesión y no se copian a `public/`.

## IA gratuita en el navegador

Se usa WebLLM en un worker y **Qwen2.5-0.5B-Instruct**, cuantizado a 4 bits. Se elige q4f16 con `shader-f16`, o q4f32 si el adaptador WebGPU no ofrece esa capacidad. No necesita Ollama, clave de API, suscripción ni inferencia pagada. Los prompts no van a un proveedor. El código del runtime y los pesos se descargan desde sus orígenes públicos; esa descarga sí necesita red y puede quedar en la caché del navegador.

Requiere HTTPS o localhost, un navegador compatible con WebGPU y memoria suficiente. La compatibilidad y rapidez dependen del dispositivo; no todos los navegadores pueden ejecutarlo. Hay progreso de descarga, cancelación, liberación de memoria y errores de conexión, tiempo de espera y compatibilidad. El asistente solo propone texto: no modifica ni completa tareas.

Fuentes técnicas: [WebLLM](https://webllm.mlc.ai/docs/user/get_started.html), [modelo Qwen](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), [PDF.js](https://mozilla.github.io/pdf.js/examples/), [Tesseract.js](https://github.com/naptha/tesseract.js), [SQLite en Node 24](https://nodejs.org/download/release/v24.10.0/docs/api/sqlite.html).

## Estadísticas, guía, calendario y música

- Las estadísticas usan tareas reales y empiezan a registrar muestras desde esta versión. Puntaje: `max(0, round(completadas / total * 100 - vencidas pendientes / total * 25))`. Completar tareas mejora el puntaje; un vencimiento incumplido puede bajarlo. Cambiar de vista no genera penalizaciones. No se reconstruyen fechas de finalización que nunca fueron guardadas.
- La guía contiene actividades originales basadas en Atomic Habits, Make It Stick, Deep Work y College Success, con enlaces a las fuentes y acciones para crear tareas.
- El calendario conserva tareas por fecha y añade una selección de versículos estable para cada día. El original español es RV1909 de dominio público; las otras lenguas muestran adaptaciones propias claramente identificadas. La selección rota en 12 días, no cambia al volver a renderizar.
- El transporte de audio persiste entre vistas. Las tres pistas originales se generan en estéreo a 48 kHz (`scripts/generate_lofi.py`): piano eléctrico FM, voces ubicadas en el estéreo, ecualización y reverberación circulares sobre el ciclo completo de 16 compases, volumen de unos −14 dBFS con limitador suave por debajo de −1 dBFS y dither TPDF a 16 bits, sin fundidos a silencio al finalizar. Las canciones que agrega el usuario se guardan solo en su navegador y se reproducen con su calidad original, una tras otra. Se reproducen con un AudioBufferSourceNode en bucle con precisión de muestras, evitando depender de una búsqueda del reproductor HTML en cada vuelta. Se conserva la posición al pausar y la caché de audio decodificado está acotada.
- Hay un único HTMLAudioElement persistente como respaldo para navegadores o pistas remotas que impiden la descarga por CORS. El respaldo y el búfer no suenan simultáneamente. Las grabaciones externas que sí se pueden decodificar reciben una unión mediante mezcla gradual. Si se usa reproducción remota directa como respaldo, la continuidad depende de la red y del navegador y no se garantiza una unión imperceptible.
- Se mantienen volumen, pista y preferencia de reanudación; el navegador puede exigir pulsar Reproducir. Incluye tres bucles originales y cuatro pistas CC0 de OpenGameArt guardadas en `public/audio/cc0/`, con fuente y licencia; toda la música funciona sin conexión. `python3 scripts/generate_lofi.py` regenera los originales en FLAC sin pérdida (NumPy y ffmpeg, sin SciPy).

## Comprobaciones

```bash
npm run verify
```

Ejecuta typecheck, pruebas unitarias/integración, cobertura de idiomas, compilación y descubrimiento de los recorridos Playwright. **Descubrir los recorridos no los ejecuta.** Las pruebas incluyen cuentas y contraseñas, cookies y CSRF, acceso privado a PDF, concurrencia y cortes de red, separación del caché por cuenta, copia/restauración de SQLite con datos reales de prueba, migración de esquema, papelera y recompensas únicas, traducción completa y extracción, estadísticas y los WAV reales.

Para la comprobación con navegadores y modelos:

```bash
npm run doctor
npm run test:browsers:install
npm run verify:release
```

`verify:release` exige conexiones locales, DNS/HTTPS y navegadores instalados; después ejecuta los controles anteriores, `npm audit --audit-level=high`, la auditoría separada de los motores de `/vendor`, los recorridos en Chromium y Firefox, con accesibilidad automática y una ventana táctil estrecha, una prueba del traductor con los modelos descargados y el flujo OCR→traducción de un PDF de imagen, sin simular reconocimiento ni inferencia. La prueba del modelo comprueba idioma aparente, finalización y cifras y adjunta sus salidas; no reemplaza una revisión humana del significado. La prueba del traductor incluye los siete idiomas y un ejemplo con negación. La inferencia del asistente WebGPU y la inspección visual/auditiva requieren además revisar sus recorridos en un equipo compatible.

Los informes y resultados JSON se guardan por separado en `playwright-report/core`, `playwright-report/translation` y `playwright-report/ocr`; el listado de pruebas no reemplaza los informes ejecutados. Los perfiles de pruebas de modelos en `.cache/test-model-profiles` conservan los modelos descargados y limpian los datos sintéticos entre ejecuciones. WebKit es opcional mediante `SPACE_TEST_WEBKIT=1 npm run test:e2e`; exige bibliotecas compatibles del sistema y no supone preparar una aplicación para iPhone.

La configuración CI está en `.github/workflows/quality.yml`. Ejecuta los controles y los navegadores cuando el repositorio se publique y el proveedor lo permita; la descarga real de modelos se activa manualmente. No se ejecutó CI remoto ni se publicó el proyecto desde esta sesión.

La caché de npm y los binarios Playwright se guardan en `.cache/` dentro del proyecto para no depender de carpetas personales que el sandbox no permite escribir. [Diagnóstico del entorno y comandos para Codex/Brave](docs/testing-environment.md). [Registro de auditoría y límites comprobados](docs/audit-2026-10-23.md).
