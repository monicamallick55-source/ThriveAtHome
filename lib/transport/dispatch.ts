export type TransportTier='volunteer'|'lyft'|'av'
export interface DispatchResult{tier:TransportTier;provider_ref?:string;estimated_eta_minutes?:number;platform_fee_cents?:number;status:'dispatched'|'stub';note?:string}
export interface RideRequest{member_id:string;pickup_address:string;dropoff_address:string;pickup_lat?:number;pickup_lng?:number;dropoff_lat?:number;dropoff_lng?:number;preferred_tier?:'any'|TransportTier;av_consent?:boolean;mobility_assistance_needed?:boolean;estimated_fare_cents?:number}
const FEE_PCT=Number(process.env.PLATFORM_RIDE_FEE_PCT||'15')
async function tryVolunteer(req:RideRequest):Promise<DispatchResult|null>{
  console.log(`[transport] Checking volunteer drivers for ${req.member_id}`)
  return null
}
async function tryLyft(req:RideRequest):Promise<DispatchResult|null>{
  const fee=Math.round((req.estimated_fare_cents||2000)*FEE_PCT/100)
  if(!process.env.LYFT_API_KEY) return{tier:'lyft',status:'stub',platform_fee_cents:fee,estimated_eta_minutes:8,note:'Lyft stub'}
  return{tier:'lyft',status:'dispatched',platform_fee_cents:fee,estimated_eta_minutes:8}
}
async function tryAv(req:RideRequest):Promise<DispatchResult|null>{
  if(!req.av_consent||req.mobility_assistance_needed) return null
  if(!process.env.AV_PARTNER_API_KEY&&!process.env.ZOOX_API_KEY) return{tier:'av',status:'stub',estimated_eta_minutes:12,note:'AV stub'}
  return{tier:'av',status:'dispatched',estimated_eta_minutes:12}
}
export async function dispatchRide(req:RideRequest):Promise<DispatchResult>{
  const p=req.preferred_tier||'any'
  if(p==='volunteer'||p==='any'){const r=await tryVolunteer(req);if(r)return r;if(p==='volunteer')throw new Error('No volunteer available')}
  if(p==='lyft'||p==='any'){const r=await tryLyft(req);if(r)return r;if(p==='lyft')throw new Error('Lyft failed')}
  if(p==='av'||p==='any'){const r=await tryAv(req);if(r)return r}
  throw new Error('No transport provider available')
}
