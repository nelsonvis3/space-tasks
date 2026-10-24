# Entorno de pruebas de SPACE

Ejecutar desde la raíz del proyecto con Node 24.22.1 o una revisión posterior de 24.x. Si el sistema tiene una versión anterior, `npm run runtime:install` prepara una copia local verificada y `npm run runtime -- run verify:release` utiliza esa copia sin modificar el sistema. Los recorridos de navegador arrancan una instancia separada con una base temporal en `/tmp`; no usan ni borran `data/space.sqlite` ni los PDF de las cuentas reales.

## Diagnóstico

```bash
npm run doctor
```

Comprueba creación de un servidor TCP en localhost, DNS/HTTPS de npm, escritura en la caché del proyecto y presencia de Chromium, Firefox y WebKit. Sale con código 2 cuando el entorno no permite completar los controles; no informa éxito si está bloqueado. Para exigir los navegadores de escritorio del alcance actual (Chromium y Firefox): `npm run doctor -- --browsers`. La presencia del ejecutable no prueba que pueda arrancar ni que tenga todas sus bibliotecas del sistema.

En la sesión restringida anterior se comprobaron `EPERM` al crear sockets TCP/UDP y `EAI_AGAIN` al consultar npm. El bloqueo de sockets explica que ni el servidor local ni la resolución mediante el DNS del sistema funcionen desde estos comandos. No demuestra que la conexión del equipo anfitrión esté caída. UFW y el sandbox de Codex son controles diferentes: reactivar o desactivar UFW no cambia los permisos de esta sesión.

## Navegadores y pruebas

```bash
npm run doctor
npm run test:browsers:install
npm run verify:release
```

Los navegadores van a `.cache/ms-playwright` y npm a `.cache/npm`. La instalación descarga binarios; no ejecuta `sudo` ni instala dependencias del sistema. En CachyOS/Arch puede ser necesario resolver bibliotecas compatibles por separado. En CI Ubuntu se usa la instalación oficial con `--with-deps`.

Para probar Brave ya instalado:

```bash
SPACE_BRAVE_PATH=/usr/bin/brave npm run test:e2e -- --project=brave
```

Primero compilar con `npm run build`. Brave reemplaza el proyecto Chromium; Firefox sigue disponible. WebKit se habilita expresamente con `SPACE_TEST_WEBKIT=1`. El proyecto del traductor conserva el nombre `chromium` y también acepta `SPACE_BRAVE_PATH`.

Los recorridos de biblioteca importada necesitan descargar PDF.js. La traducción real descarga Transformers.js y los modelos desde jsDelivr/Hugging Face; el OCR descarga Tesseract y los datos de idioma. Comprobar bloqueos de esos destinos si el servidor y npm funcionan pero el lector o los modelos fallan. No desactivar globalmente las protecciones del navegador.

## Alcance de cada comando

| Comando | Qué comprueba |
| --- | --- |
| `npm run verify` | Tipos, reglas e integración local, idiomas, build y listado E2E |
| `npm run test:e2e:list` | Carga de la configuración y descubrimiento, sin navegador |
| `npm run test:e2e` | Interfaz y API reales en Chromium/Firefox, accesibilidad y ventana estrecha; WebKit opcional |
| `npm run audit:runtimes` | Grafo aislado de las versiones CDN y revisión acotada de avisos propios de la entrada Node |
| `npm run test:translation:real` | Worker compilado y modelos reales; guarda salidas como artefacto |
| `npm run test:ocr:real` | PDF de imagen original → reconocimiento Tesseract → traducción al español de la interfaz |
| `npm run verify:release` | Diagnóstico estricto, controles locales, audit, E2E, traductor real y OCR real |

Los fallos de audit por DNS no equivalen a cero vulnerabilidades. Una compilación correcta no demuestra calidad lingüística, audio audible, OCR correcto, HTTPS ni recuperación en el futuro alojamiento.

## Verificación posterior al desbloqueo

El 23 de octubre se volvieron a comprobar TCP local, DNS y HTTPS correctamente. Chromium y Brave arrancaron y ejecutaron recorridos reales. Firefox falló dentro del sandbox al abrir el perfil temporal, pero arrancó y ejecutó las pruebas al autorizarlas fuera del sandbox. No se cambió UFW ni el DNS. WebKit descargó su binario, pero no arrancó por bibliotecas ausentes en CachyOS (`libicu74`, `libxml2`, `libflite1`); no se ejecutó un comando apt sobre Arch ni se instalaron paquetes del sistema automáticamente.

Las pruebas de modelos usan perfiles exclusivos bajo `.cache/test-model-profiles`, conservan Cache Storage y limpian cookies, almacenamiento de tareas e IndexedDB de prueba. No abren un perfil personal. Los informes quedan separados por suite en `playwright-report/{core,translation,ocr}` y `test-results/{core,translation,ocr}`. El descubrimiento usa solo el reportero de consola para preservar los resultados anteriores.
