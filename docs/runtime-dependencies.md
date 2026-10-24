# Runtimes y revisión de avisos — 2026-10-23

Los motores se sirven desde el propio servidor en `/vendor/`: `scripts/vendor.mjs` los baja durante `dev`/`build` del registro de npm, comprueba la integridad sha512 fijada y copia solo los archivos usados. No se ejecuta código descargado de un CDN. No aparecen en `package-lock.json` (`@huggingface/transformers` instalaría `sharp` y `onnxruntime-node`); `npm run audit:runtimes` audita su árbol aparte. Los datos de modelos y de OCR siguen descargándose al usarlos.

| Componente | Versión fijada | Uso y origen |
| --- | --- | --- |
| PDF.js / pdfjs-dist | 5.4.149 | Extracción/renderizado, `/vendor`; `src/productivity/pdfjs.ts` |
| Tesseract.js | 6.0.1 | OCR en worker, `/vendor`; `src/productivity/ocr.ts` |
| tesseract.js-core | 6.0.0 | Core WASM del OCR (variantes LSTM), `/vendor` |
| Datos OCR | ruta 4.0.0 | Idiomas de tessdata.projectnaptha.com |
| Transformers.js | 3.8.1 | Traducción WASM, `/vendor`; `src/translation/translation.worker.ts` |
| WebLLM | 0.2.85 | Asistente WebGPU, `lib/index.js` del paquete en `/vendor`; `src/ai/browser.worker.ts` |
| Modelos de traducción | repositorios Hugging Face | `Xenova/opus-mt-en-{es,de,fr,it}`, `Xenova/opus-mt-en-ROMANCE`, `Xenova/opus-mt-es-en`, `Xenova/m2m100_418M`; q8 |
| Modelo del asistente | catálogo WebLLM | Qwen2.5-0.5B-Instruct, q4f16/q4f32 según soporte |

Los repositorios de modelos no están fijados a un commit. Una prueba de regresión y revisión de sus salidas sigue siendo necesaria al cambiar pesos/caché/runtime. Tras habilitar la red se ejecutó el worker real con los modelos EN→ES, ES→EN y M2M100; la prueba de siete idiomas, cifras y negación terminó correctamente. No equivale a certificar calidad semántica en documentos completos.

## Consulta manual a fuentes primarias

Esta revisión es acotada y no reemplaza el escaneo del árbol completo de dependencias:

- Vite instalado: **8.3.5** (`npm ls --depth=0`). Los avisos [GHSA-rq7h-c2jc-7f22](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22), [GHSA-vfpm-58rq-9qcg](https://github.com/vitejs/vite/security/advisories/GHSA-vfpm-58rq-9qcg) y [GHSA-9jrq-w75r-8gcw](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw) indican 8.3.3 como parche en la rama 8.3. El aviso del 21 de octubre [GHSA-8g5g-mxqh-grgj](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj) se refiere a 6.4.4. Por sus rangos publicados, 8.3.5 queda fuera de estos avisos concretos.
- PDF.js fijado: **5.4.149**. Los avisos publicados [CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq) y [CVE-2026-16633](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) publican rangos que no incluyen esta versión. Se mantiene `isEvalSupported:false`, un lector propio sin administrador de scripting del visor y CSP. Esto no certifica ausencia de otros problemas ni justifica mantener indefinidamente una versión antigua.
- React/React DOM instalados: **19.3.1**. El lockfile no contiene `react-server-dom-*` ni `@vitejs/plugin-rsc`; el servidor no ejecuta React Server Components. La [explicación oficial de CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) delimita esa vulnerabilidad a integraciones RSC; no corresponde atribuirla a esta SPA solo por usar React 19.

## Escaneo posterior con red

`npm audit --json` del proyecto respondió con **0 avisos conocidos** en el árbol instalado (55 entradas de dependencias). Ese resultado no incluye los motores de `/vendor` ni acredita ausencia total de vulnerabilidades.

`npm run audit:runtimes` construye un lockfile aislado con las cinco versiones exactas de la tabla, sin instalar binarios ni ejecutar scripts, y conserva `.cache/runtime-audit/report.json`. El grafo Node de Transformers.js 3.8.1 presenta **dos entradas altas**: `sharp` 0.34.5 y su efecto transitivo sobre Transformers.js. Los avisos corresponden a bibliotecas nativas de imagen: [libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) y [librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).

La aplicación carga el archivo precompilado para navegador `dist/transformers.min.js` dentro de un Web Worker. No tiene `sharp` instalado ni ejecuta Transformers.js en el servidor Node. El script conserva esos avisos y aplica una excepción de alcance únicamente para esos tres identificadores, siempre que se mantenga esa arquitectura. Comprueba el árbol instalado, las dependencias declaradas, el URL de la entrada de navegador y los módulos del servidor. Un aviso nuevo o incorporar la entrada Node requiere revisión y hace fallar el control; no se descartan todos los avisos de una dependencia.

Las fuentes DM Sans y Space Grotesk se alojan ahora localmente, con WOFF2, OFL y hashes en `public/fonts/`. La política CSP ya no permite fuentes/estilos de Google. Las licencias completas de los cinco motores están en `public/licenses/`. Los modelos originales OPUS declaran Apache-2.0 ([EN→ES](https://huggingface.co/Helsinki-NLP/opus-mt-en-es), [ES→EN](https://huggingface.co/Helsinki-NLP/opus-mt-es-en)); el original [M2M100](https://huggingface.co/facebook/m2m100_418M) declara MIT. Las conversiones Xenova no declaran una licencia independiente en sus fichas consultadas; conservar la procedencia y revisar avisos antes de incluir pesos en un instalador. Actualmente los pesos se descargan por separado, no se redistribuyen dentro del programa.

No se cambiaron versiones mayores para ocultar avisos ajenos al camino de ejecución usado. La actualización de runtimes sigue requiriendo probar API, CSP, extracción, OCR y traducción reales.


## Runtime Node y evaluación lingüística

Se comprobó que el sistema usa Node 24.21.0 y que la [publicación de seguridad 24.22.1](https://nodejs.org/en/blog/release/v24.22.1) corrige avisos de TLS, DNS, Brotli y otros componentes. El proyecto exige ahora 24.22.1 o una revisión posterior de 24.x. La copia local `.cache/node` se descarga del sitio oficial y se verifica contra un SHA-256 fijado antes de extraerla; no se reemplaza Node del sistema. `npm run runtime -- run verify:release` utiliza ese intérprete en todos los subprocesos. El LICENSE completo de Node queda en `public/licenses/`.

Revisar las salidas reales detectó que M2M100 traducía incorrectamente una pausa de estudio en alemán, aunque el texto conservaba idioma aparente y números. Se priorizan OPUS específicos desde inglés para español, alemán, francés, italiano y portugués y se comprueba también el concepto de descanso/pausa en la prueba de regresión. Esto no certifica fidelidad en cualquier párrafo.

Las fichas originales de OPUS EN→FR/IT y EN→ROMANCE declaran Apache-2.0. **EN→DE declara CC-BY-4.0**, no Apache: atribución a Helsinki-NLP, [modelo original](https://huggingface.co/Helsinki-NLP/opus-mt-en-de), [conversión de Xenova](https://huggingface.co/Xenova/opus-mt-en-de), [licencia](https://creativecommons.org/licenses/by/4.0/). Los pesos se convierten a ONNX y q8 por Xenova; no se les aplica la GPL del programa. El token portugués `>>pt<<` se verificó contra la configuración y las instrucciones del modelo EN→ROMANCE.

La evaluación descartó `opus-mt-en-jap`: omitió las cifras del ejemplo y produjo contenido ajeno al original. Japonés conserva M2M100, que preservó cifras y el concepto de descanso. La selección depende de resultados reales, no solo del tamaño del modelo.
