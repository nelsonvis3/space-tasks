/** One editing tab per account prevents stale React state in a second tab from
 * overwriting the shared local cache. Browser locks are released on tab close. */
export async function acquireAccountLock(id:string,manager:Pick<LockManager,'request'>|undefined=navigator.locks):Promise<()=>void>{
 if(!manager)throw new Error('This browser cannot protect simultaneous editing. Use a current browser over HTTPS or localhost.')
 return new Promise((resolve,reject)=>{void manager.request(`space-account:${id}`,{ifAvailable:true},lock=>{if(!lock){reject(new Error('This account is open in another tab. Close that tab and sign in again.'));return}return new Promise<void>(release=>resolve(release))}).catch(reject)})
}
