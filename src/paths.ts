// Public files live under the build's base path (for example /space-tasks/ on GitHub Pages).
const base:string=import.meta.env?.BASE_URL??'/'
export const asset=(path:string)=>base+path.replace(/^\//,'')
/** A static build without the SPACE server (GitHub Pages): no accounts, everything stays on the device. */
export const DEVICE_ONLY=import.meta.env?.VITE_DEVICE_ONLY==='1'
