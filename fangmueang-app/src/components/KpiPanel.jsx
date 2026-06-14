import { useState, useEffect, useRef } from 'react'

function useCountUp(target, duration=1200) {
  const [val, setVal] = useState(0)
  const start = useRef(null)
  useEffect(() => {
    start.current = null
    const step = ts => {
      if (!start.current) start.current = ts
      const p = Math.min((ts - start.current) / duration, 1)
      const ease = 1 - Math.pow(1-p, 3)
      setVal(Math.round(target * ease))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return val
}

function KpiCard({ icon, label, value, suffix, color, delay }) {
  const [visible, setVisible] = useState(false)
  const num = useCountUp(visible ? value : 0)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])

  const colors = {
    blue:   { grad:'linear-gradient(135deg,#3b82f6,#2563eb)', glow:'rgba(59,130,246,0.3)', border:'rgba(59,130,246,0.2)', text:'#93c5fd' },
    emerald:{ grad:'linear-gradient(135deg,#10b981,#059669)', glow:'rgba(16,185,129,0.3)', border:'rgba(16,185,129,0.2)', text:'#6ee7b7' },
    cyan:   { grad:'linear-gradient(135deg,#06b6d4,#0891b2)', glow:'rgba(6,182,212,0.3)',  border:'rgba(6,182,212,0.2)',  text:'#67e8f9' },
    violet: { grad:'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow:'rgba(139,92,246,0.3)', border:'rgba(139,92,246,0.2)', text:'#c4b5fd' },
  }
  const c = colors[color]

  return (
    <div style={{
      background:'rgba(15,23,42,0.8)',
      backdropFilter:'blur(16px)',
      border:`1px solid ${c.border}`,
      borderRadius:16,padding:24,
      boxShadow:`0 8px 32px ${c.glow}`,
      opacity: visible?1:0,
      transform: visible?'translateY(0) scale(1)':'translateY(20px) scale(0.95)',
      transition:`all 0.5s ease ${delay}ms`,
      cursor:'default',position:'relative',overflow:'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow=`0 16px 48px ${c.glow}` }}
    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow=`0 8px 32px ${c.glow}` }}
    >
      {/* BG glow */}
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:c.grad,opacity:0.1,filter:'blur(20px)',pointerEvents:'none'}}/>

      <div style={{width:44,height:44,borderRadius:12,background:c.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:16,boxShadow:`0 4px 16px ${c.glow}`}}>
        {icon}
      </div>
      <div style={{fontSize:28,fontWeight:800,color:c.text,fontVariantNumeric:'tabular-nums',marginBottom:4}}>
        {num.toLocaleString()}{suffix}
      </div>
      <div style={{fontSize:13,color:'#64748b',fontWeight:500}}>{label}</div>
    </div>
  )
}

export default function KpiPanel({ data }) {
  const total = data?.city_avg?.total || 0
  const resolved = Object.values(data?.districts||{}).reduce((s,d)=>s+(d.resolved||0),0)
  const rate = Math.round((data?.city_avg?.resolve_rate||0)*100)
  const days = Math.round((data?.city_avg?.avg_days||0)*10)/10

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
      <KpiCard icon="📊" label="ร้องเรียนทั้งหมด" value={total}   suffix=" ครั้ง" color="blue"    delay={0}   />
      <KpiCard icon="✅" label="แก้ไขแล้ว"        value={resolved} suffix=" ครั้ง" color="emerald" delay={80}  />
      <KpiCard icon="📈" label="อัตราแก้ไข"       value={rate}    suffix="%"      color="cyan"    delay={160} />
      <KpiCard icon="⏱️" label="วันเฉลี่ยต่อเรื่อง" value={days} suffix=" วัน"   color="violet"  delay={240} />
    </div>
  )
}
