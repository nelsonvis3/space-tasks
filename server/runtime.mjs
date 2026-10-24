export const NODE_VERSION='24.22.1'
export function supportedRuntime(version){const match=/^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);return !!match&&Number(match[1])===24&&(Number(match[2])>22||(Number(match[2])===22&&Number(match[3])>=1))}
export function requireRuntime(){if(!supportedRuntime(process.versions.node))throw new Error('SPACE requires Node 24.22.1 or a newer 24.x security release. Run npm run runtime:install, then npm run runtime -- run dev (or start). Your data has not been opened.')}
