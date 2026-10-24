# Componentes de terceros

Los autores de cada componente conservan sus derechos y términos. Este archivo complementa el inventario automático en `public/licenses/THIRD_PARTY_NOTICES.txt`.

| Componente | Licencia / fuente |
| --- | --- |
| Node.js 24.22.1 | Runtime opcional local; MIT y avisos de sus componentes en el LICENSE original: <https://github.com/nodejs/node/blob/v24.22.1/LICENSE>. Si se instala con el script, se copia completo a `public/licenses/Node-24.22.1-LICENSE.txt`. |
| React y React DOM | MIT; textos originales copiados desde los paquetes instalados |
| Lucide | ISC; texto original copiado desde `lucide-react` |
| Vite, herramientas y pruebas | Versiones, avisos y licencias individuales en el inventario automático |
| Rolldown 1.2.15 y sus bindings nativos | MIT; los bindings omiten el archivo en npm y usan el LICENSE del mismo release. Avisos de código derivado de Rollup/esbuild conservados en `public/licenses/rolldown@1.2.15-THIRD-PARTY-LICENSE`, obtenido de <https://github.com/rolldown/rolldown/blob/v1.2.15/THIRD-PARTY-LICENSE>. |
| PDF.js 5.4.149 | Apache-2.0: <https://github.com/mozilla/pdf.js/blob/v5.4.149/LICENSE> |
| Tesseract.js 6.0.1 | Apache-2.0: <https://github.com/naptha/tesseract.js/blob/v6.0.1/LICENSE.md> |
| Tesseract.js core 6.0.0 | Apache-2.0: <https://github.com/naptha/tesseract.js-core/blob/v6.0.0/LICENSE> |
| Transformers.js 3.8.1 | Apache-2.0: <https://github.com/huggingface/transformers.js/blob/3.8.1/LICENSE> |
| WebLLM 0.2.85 | Apache-2.0: <https://github.com/mlc-ai/web-llm/blob/v0.2.85/LICENSE> |
| DM Sans y Space Grotesk | SIL Open Font License 1.1; alojadas localmente en `public/fonts/`, con sus OFL y hashes de procedencia en esa carpeta: <https://github.com/google/fonts/tree/main/ofl/dmsans>, <https://github.com/google/fonts/tree/main/ofl/spacegrotesk> |
| Qwen2.5-0.5B-Instruct | Apache-2.0 para el modelo original; revisar también la conversión MLC: <https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct> y catálogo de WebLLM; no se incluyen pesos en el código fuente |
| OPUS EN→DE | CC-BY-4.0; Helsinki-NLP, modelo `opus-mt-en-de`: <https://huggingface.co/Helsinki-NLP/opus-mt-en-de>. Conversión ONNX/q8 por Xenova: <https://huggingface.co/Xenova/opus-mt-en-de>. Licencia: <https://creativecommons.org/licenses/by/4.0/>. Los pesos no se incluyen en el programa. |
| OPUS EN→ES/FR/IT, EN→ROMANCE y ES→EN | Apache-2.0 para los modelos originales Helsinki-NLP: <https://huggingface.co/Helsinki-NLP>. Conversiones ONNX/q8 por Xenova, con procedencia individual en el código del traductor. No se relicencian sus pesos. |
| Modelos de traducción y datos OCR | Descargados por el usuario; verificar las licencias de cada repositorio de origen y su conversión. No se aplica GPL a pesos o datos externos ni se afirma que las conversiones aporten una licencia que no publican. Véase `docs/runtime-dependencies.md`. |

Las licencias declaradas no equivalen a certificar todo el contenido de un paquete. Si se incorporan motores o pesos en un instalador sin conexión, incluir también sus licencias, avisos y procedencia completa antes de distribuirlo.

## Grabaciones externas

Se incluyen en `public/audio/cc0/` tal como se publicaron en OpenGameArt (licencia CC0 verificada en cada página el 24/10/2026); la app no se conecta a OpenGameArt.

- **Chill lofi inspired**, omfgdude / OMF-Games, CC0: <https://opengameart.org/content/chill-lofi-inspired>.
- **Lofi again**, OMF-Games, CC0: <https://opengameart.org/content/lofi-again>.
- **Lofi Hip Hop Loop**, OMF-Games, CC0: <https://opengameart.org/content/lofi-hip-hop-loop>.
- **Heavenly Loop**, isaiah658, CC0: <https://opengameart.org/content/heavenly-loop>.

Texto CC0: <https://creativecommons.org/publicdomain/zero/1.0/legalcode>.

Los tres bucles FLAC sintetizados por el generador propio se distribuyen bajo GPL-3.0-only. El logo es obra propia con todos los derechos reservados y los libros están excluidos; ambos se detallan en `LICENSING.md`.
