import {defineConfig,loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import {spaceApiPlugin} from './server/vite-plugin.mjs'
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'');return{plugins:[react(),spaceApiPlugin({dataDir:env.DATA_DIR||'data'})],server:{fs:{deny:['.env','.env.*','*.{crt,pem,key,p12,pfx,cer,der}','.npmrc','.yarnrc.yml','**/.git/**','**/.local-books/**']}}}})
