import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {resolve,dirname,delimiter} from 'node:path'
import {NODE_VERSION,supportedRuntime} from '../server/runtime.mjs'
const root=resolve(import.meta.dirname,'..'),directory=resolve(root,`.cache/node/node-v${NODE_VERSION}-linux-${process.arch}`),local=resolve(directory,'bin/node'),node=existsSync(local)?local:process.execPath,npm=existsSync(local)?resolve(directory,'lib/node_modules/npm/bin/npm-cli.js'):process.env.npm_execpath
if(!npm||(!existsSync(local)&&!supportedRuntime(process.versions.node))){console.error('Install a supported Node 24.x security release, or run npm run runtime:install first.');process.exit(2)}
const args=process.argv.slice(2);if(!args.length){console.error('Usage: npm run runtime -- run dev | run verify:release | ci | start');process.exit(2)}
const result=spawnSync(node,[npm,...args],{cwd:root,stdio:'inherit',env:{...process.env,PATH:dirname(node)+delimiter+(process.env.PATH||'')}})
if(result.error){console.error(result.error.message);process.exit(1)}process.exit(result.status??1)
