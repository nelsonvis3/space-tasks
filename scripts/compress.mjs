import {readdir,readFile,writeFile} from 'node:fs/promises'
import {join,extname} from 'node:path'
import {gzip,brotliCompress,constants} from 'node:zlib'
import {promisify} from 'node:util'
const gz=promisify(gzip),br=promisify(brotliCompress),types=new Set(['.js','.css','.html','.svg','.json','.txt'])
let files=0,original=0,compressed=0
async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory()){await walk(path);continue}if(!entry.isFile()||!types.has(extname(path)))continue;const data=await readFile(path);if(data.length<1024||data.length>8*1024*1024)continue;const[brotli,gzipped]=await Promise.all([br(data,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}),gz(data,{level:9})]);if(brotli.length<data.length*.9){await writeFile(path+'.br',brotli);await writeFile(path+'.gz',gzipped);files++;original+=data.length;compressed+=brotli.length}}}
await walk('dist')
console.log(`Precompressed ${files} public text assets: ${original} → ${compressed} bytes (Brotli). Private API responses are not compressed.`)
