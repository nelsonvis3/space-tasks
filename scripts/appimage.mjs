// Packages the desktop app as release/SPACE_Tasks-<version>-x86_64.AppImage after `npm run build`.
// appimagetool and the AppImage runtime come from their GitHub releases, verified against pinned sha256.
// They are not npm packages: electron-builder would add hundreds of dependencies to the license inventory.
import {createHash} from 'node:crypto'
import {cpSync,existsSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {join,resolve} from 'node:path'
const TOOLS={
 appimagetool:{url:'https://github.com/AppImage/appimagetool/releases/download/1.9.1/appimagetool-x86_64.AppImage',sha256:'ed4ce84f0d9caff66f50bcca6ff6f35aae54ce8135408b3fa33abfc3cb384eb0'},
 runtime:{url:'https://github.com/AppImage/type2-runtime/releases/download/20251108/runtime-x86_64',sha256:'2fca8b443c92510f1483a883f60061ad09b46b978b2631c807cd873a47ec260d'},
}
const ID='io.github.nelsonvis3.space-tasks',root=resolve(import.meta.dirname,'..'),cache=join(root,'.cache/appimage'),{version}=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
// Chromium's sandbox needs unprivileged user namespaces: the SUID helper cannot work from the read-only AppImage mount.
const APP_RUN=`#!/bin/sh
here="$(dirname "$(readlink -f "$0")")"
sandbox=
if [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null)" = 1 ] || [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = 0 ]; then sandbox=--no-sandbox; fi
exec "$here/usr/lib/space-tasks/electron" --ozone-platform-hint=auto $sandbox "$@"
`
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex')
async function tool(name){
 const{url,sha256:pinned}=TOOLS[name],file=join(cache,name)
 if(existsSync(file)&&sha256(readFileSync(file))===pinned)return file
 const response=await fetch(url);if(!response.ok)throw new Error(`Could not download ${name} (HTTP ${response.status}).`)
 const bytes=Buffer.from(await response.arrayBuffer())
 if(sha256(bytes)!==pinned)throw new Error(`${name} does not match its pinned sha256. Nothing was packaged.`)
 mkdirSync(cache,{recursive:true});writeFileSync(file,bytes,{mode:0o755});return file
}
if(process.arch!=='x64')throw new Error('The AppImage is built for x86_64 only.')
if(!existsSync(join(root,'dist/index.html')))throw new Error('Run npm run build before packaging the AppImage.')
const appDir=join(cache,'SPACE_Tasks.AppDir'),lib=join(appDir,'usr/lib/space-tasks'),share=join(appDir,'usr/share')
rmSync(appDir,{recursive:true,force:true})
cpSync(join(root,'node_modules/electron/dist'),lib,{recursive:true,verbatimSymlinks:true})
for(const path of ['dist','desktop','server','package.json'])cpSync(join(root,path),join(lib,'resources/app',path),{recursive:true})
writeFileSync(join(appDir,'AppRun'),APP_RUN,{mode:0o755})
cpSync(join(root,`desktop/${ID}.desktop`),join(appDir,`${ID}.desktop`));cpSync(join(root,`desktop/${ID}.desktop`),join(share,`applications/${ID}.desktop`))
cpSync(join(root,'desktop/icons/256.png'),join(appDir,`${ID}.png`));cpSync(join(root,'desktop/icons/256.png'),join(appDir,'.DirIcon'))
cpSync(join(root,`desktop/icons/${ID}.svg`),join(share,`icons/hicolor/scalable/apps/${ID}.svg`))
cpSync(join(root,`desktop/${ID}.metainfo.xml`),join(share,`metainfo/${ID}.appdata.xml`))
const output=join(root,'release',`SPACE_Tasks-${version}-x86_64.AppImage`),runtime=await tool('runtime')
mkdirSync(join(root,'release'),{recursive:true});rmSync(output,{force:true})
// Extract-and-run keeps appimagetool working where FUSE is unavailable, such as CI containers.
const result=spawnSync(await tool('appimagetool'),['--runtime-file',runtime,appDir,output],{stdio:'inherit',env:{...process.env,ARCH:'x86_64',APPIMAGE_EXTRACT_AND_RUN:'1'}})
if(result.status!==0)throw new Error('appimagetool could not build the AppImage.')
console.log(`AppImage ready: ${output}`)
