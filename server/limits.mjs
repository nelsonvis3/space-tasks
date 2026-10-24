import {ApiError} from './store.mjs'
/** Bounded state and periodic expiry avoid an ever-growing per-address map.
 * When full, the oldest client is forgotten instead of locking everyone out. */
export class AttemptLimiter{
 constructor({capacity=10000,limit=20,interval=900000}={}){this.entries=new Map();this.capacity=capacity;this.limit=limit;this.interval=interval;this.nextSweep=0}
 sweep(now){if(now>=this.nextSweep){for(const[k,v]of this.entries)if(v.until<=now)this.entries.delete(k);this.nextSweep=now+60000}}
 check(key,now=Date.now()){this.sweep(now);const bucket=this.entries.get(key);if(bucket&&bucket.until>now&&bucket.count>=this.limit)throw new ApiError(429,'Too many attempts. Please try again in 15 minutes.')}
 record(key,now=Date.now()){
  this.sweep(now);let bucket=this.entries.get(key)
  if(!bucket||bucket.until<=now){this.entries.delete(key);if(this.entries.size>=this.capacity)this.entries.delete(this.entries.keys().next().value);bucket={count:0,until:now+this.interval};this.entries.set(key,bucket)}
  bucket.count++
 }
 take(key,now=Date.now()){this.check(key,now);this.record(key,now)}
}
/** Limit buffered requests before consuming their bodies, not after allocation. */
export function requestBudget(limit){let active=0;return async operation=>{if(active>=limit)throw new ApiError(503,'Too many requests. Try again shortly.');active++;try{return await operation()}finally{active--}}}
