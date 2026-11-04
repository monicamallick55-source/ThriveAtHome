'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function PairDevice() {
  const [code,setCode]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const router=useRouter()
  async function handlePair(){
    if(code.trim().length<6){setError('Enter the full pairing code');return}
    setLoading(true);setError('')
    try{
      const res=await fetch('/api/device/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pairing_code:code.trim()})})
      const data=await res.json()
      if(!res.ok){setError(data.error||'Pairing failed');setLoading(false);return}
      localStorage.setItem('device_token',data.device_token)
      router.replace('/device')
    }catch{setError('Could not connect. Check your internet.');setLoading(false)}
  }
  return (
    <div style={{minHeight:'100dvh',background:'#2d6a4f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:32}}>
      <div style={{fontSize:64,marginBottom:16}}>🏠</div>
      <div style={{fontSize:36,fontWeight:700,color:'#fff',marginBottom:8}}>ThriveAtHome</div>
      <div style={{fontSize:20,color:'#a7c9b2',marginBottom:48}}>Enter the pairing code from your navigator</div>
      <div style={{background:'#fff',borderRadius:24,padding:40,width:'100%',maxWidth:420,textAlign:'center'}}>
        <input type="text" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" maxLength={8}
          style={{width:'100%',fontSize:36,fontWeight:700,textAlign:'center',padding:'20px 16px',border:'3px solid #2d6a4f',borderRadius:12,letterSpacing:8,outline:'none',boxSizing:'border-box'}}
          onKeyDown={e=>e.key==='Enter'&&handlePair()}/>
        {error&&<div style={{color:'#c62828',marginTop:12,fontSize:18}}>{error}</div>}
        <button onClick={handlePair} disabled={loading}
          style={{width:'100%',marginTop:24,background:'#2d6a4f',color:'#fff',border:'none',borderRadius:12,padding:'20px',fontSize:24,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
          {loading?'Pairing…':'Pair Device'}
        </button>
      </div>
    </div>
  )
}
