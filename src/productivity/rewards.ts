import type {Priority} from '../gamification.ts'
export type HistoricalRewards={coins:number;claimedCoinTaskIds:string[]}
export const REWARDS_KEY='orbit:rewards:v1'
export const COINS_BY_PRIORITY={Low:25,Medium:40,High:60}
/** Preserve prior rewards without loading or running any game systems. */
export function readHistoricalRewards(storage:Pick<Storage,'getItem'>,finished:string[]):HistoricalRewards{
 for(const key of [REWARDS_KEY,'orbit:roguelike:v1','orbit:colony:v3','orbit:planet:v1']){
  try{const value=JSON.parse(storage.getItem(key)||'null');if(value&&Number.isSafeInteger(value.coins)&&value.coins>=0&&Array.isArray(value.claimedCoinTaskIds)&&value.claimedCoinTaskIds.every((id:unknown)=>typeof id==='string'))return{coins:value.coins,claimedCoinTaskIds:[...new Set<string>([...value.claimedCoinTaskIds,...finished])]}}catch{/* Leave the original key untouched. */}
 }
 return{coins:140,claimedCoinTaskIds:[...finished]}
}
export function grantHistoricalReward(s:HistoricalRewards,id:string,priority:Priority):HistoricalRewards{return s.claimedCoinTaskIds.includes(id)?s:{coins:s.coins+COINS_BY_PRIORITY[priority],claimedCoinTaskIds:[...s.claimedCoinTaskIds,id]}}
