# Licencias de SPACE Tasks

El código propio de SPACE en `src/`, `server/`, `scripts/`, `tests/`, `e2e/` y su configuración se distribuye bajo **GNU GPL, versión 3 únicamente** (`GPL-3.0-only`). El texto completo y sin modificaciones está en [LICENSE](LICENSE), obtenido de <https://www.gnu.org/licenses/gpl-3.0.txt>.

SPACE es software libre: se permite usar, estudiar, modificar y redistribuir el programa bajo los términos de GPLv3. Al distribuir una versión compilada también debe proporcionarse su código fuente correspondiente, los scripts necesarios para compilarla e instalarla, la licencia y los avisos aplicables. Las modificaciones distribuidas del programa cubierto deben conservar esas libertades. No se ofrece garantía. La GPL permite usos comerciales; gratuidad de la descarga y libertad del código son decisiones diferentes. No hay obligación de pagar una tienda para distribuir SPACE directamente en Linux.

La licencia no concede derechos sobre los datos privados de los usuarios, sus tareas ni sus PDF. Tampoco cambia las licencias de dependencias, modelos, fuentes o materiales de terceros.

## Dependencias y recursos

`npm run licenses` genera [THIRD_PARTY_NOTICES.txt](public/licenses/THIRD_PARTY_NOTICES.txt), copia los textos de licencia disponibles en los paquetes instalados y publica la GPL junto con los archivos de la aplicación. El inventario incluye las versiones y licencias declaradas en `package-lock.json`, también las variantes opcionales de otras plataformas. Las licencias de esas variantes deben acompañar sus binarios si se distribuyen en un paquete de otra plataforma. Regenerar el inventario después de cambiar dependencias.

Los paquetes conservan sus licencias MIT, ISC, BSD, Apache o MPL. No se relicencian sus archivos individuales como GPL. Los motores de `public/vendor/` (con su LICENSE original al lado) y los pesos de los modelos tienen términos independientes; se documentan en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). La GPL no sustituye sus avisos.

El inventario detiene la generación si un paquete instalado no tiene texto de licencia. Los bindings nativos de Rolldown 1.2.15 usan el LICENSE del mismo release y sus avisos oficiales de código derivado; otra versión exige revisar esa correspondencia.

## Material que no debe incluirse en una distribución pública sin revisión

- **Libros excluidos:** los archivos antes situados en `public/pdfs/` y `public/reading/` se trasladaron a `.local-books/pdfs/` y `.local-books/reading/`, preservando sus bytes y hashes. No se les aplica GPL. El catálogo distribuible está vacío; el build rechaza su reintroducción y `.gitignore`/`.npmignore` excluyen esa carpeta y las rutas públicas anteriores. No incluir `.local-books/` en ningún archivo de distribución manual. La biblioteca permite seguir importando PDF propios; los PDF privados de las cuentas no se modificaron ni forman parte del paquete.
- Los bucles `public/audio/{midnight,rainy,coffee}-lofi.flac` se generan con `scripts/generate_lofi.py`, sin muestras externas. Se incluyen en GPL-3.0-only junto con su generador. Las grabaciones de OpenGameArt, incluidas en `public/audio/cc0/`, conservan CC0 y sus créditos originales.

## Logo

El logo de SPACE Tasks y sus variantes (`public/logo.png`, `public/space-logo.svg` y `public/space-mark.svg`) son obra original de Nelson Sivisstum, © 2023, publicada originalmente en su cuenta de Pinterest. **No están bajo la GPL ni bajo una licencia libre: todos los derechos reservados.**

Se permite redistribuirlos sin modificar dentro de copias de SPACE Tasks y usarlos para referirse al proyecto. Las versiones modificadas (forks) que se distribuyan deben reemplazar el logo por uno propio. Esto no limita ninguna de las libertades que la GPL da sobre el código.

No se ha publicado ni subido ningún archivo a una tienda o repositorio remoto. La licencia del código está aplicada; los libros excluidos siguen sin poder redistribuirse.
