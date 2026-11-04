'use client'
import { useEffect, useState } from 'react'
const TILES = [
  {id:'buddy',label:'Call My Buddy',emoji:'👋',color:'#2d6a4f'},
  {id:'aria',label:'Talk to Aria',emoji:'🤖',color:'#1565c0'},
  {id:'events',label:"Today's Events",emoji:'📅',color:'#6a1b9a'},
  {id:'family',label:'My Family',emoji:'❤️',color:'#c62828'},
  {id:'help',label:'Get Help',emoji:'🙋',color:'#e65100'},
  {id:'sos',label:'Emergency',emoji:'🚨',color:'#b71c1c'},
]
export default function DeviceKiosk() {
  const [time,setTime]=useState('')
  const [confirm,setConfirm]=useState<string|null>(null)
  useEffect(()=>{
    const u=()=>setTime(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))
    u(); const t=setInterval(u,10000)
    const hb=setInterval(()=>fetch('/api/device/heartbeat',{method:'POST',body:'{}',headers:{'Content-Type':'application/json'}}).catch(()=>{}),300000)
    return ()=>{clearInterval(t);clearInterval(hb)}
  },[])
  function handleTile(tile:typeof TILES[0]){
    if(tile.id==='sos'){setConfirm(tile.id);return}
    fetch(`/api/device/action?action=${tile.id}`,{method:'POST'}).catch(()=>{})
  }
  return (
    <div style={{minHeight:'100dvh',background:'#f5f5f5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:24}}>
      <div style={{fontSize:48,fontWeight:700,color:'#2d6a4f',marginBottom:8}}>{time}</div>
      <div style={{fontSize:22,color:'#555',marginBottom:40}}>How can I help you today?</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20,width:'100%',maxWidth:600}}>
        {TILES.map(t=>(
          <button key={t.id} onClick={()=>handleTile(t)}
            style={{background:t.color,color:'#fff',border:'none',borderRadius:20,padding:'32px 16px',fontSize:22,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:12,minHeight:120}}>
            <span style={{fontSize:44}}>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>
      {confirm==='sos'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#fff',borderRadius:24,padding:40,textAlign:'center',maxWidth:400}}>
            <div style={{fontSize:64}}>🚨</div>
            <div style={{fontSize:28,fontWeight:700,margin:'16px 0'}}>Call for help?</div>
            <div style={{fontSize:20,color:'#555',marginBottom:32}}>This will alert your navigator and emergency contact.</div>
            <div style={{display:'flex',gap:16,justifyContent:'center'}}>
              <button onClick={()=>{fetch('/api/device/action?action=sos',{method:'POST'}).catch(()=>{});setConfirm(null)}}
                style={{background:'#b71c1c',color:'#fff',border:'none',borderRadius:12,padding:'16px 32px',fontSize:22,fontWeight:700,cursor:'pointer'}}>Yes, call now</button>
              <button onClick={()=>setConfirm(null)}
                style={{background:'#eee',color:'#333',border:'none',borderRadius:12,padding:'16px 32px',fontSize:22,fontWeight:700,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
