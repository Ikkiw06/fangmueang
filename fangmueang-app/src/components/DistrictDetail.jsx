import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TYPE_COLORS = { 'ถนน/ทางเท้า':'#f97316','น้ำท่วม':'#06b6d4','ขยะ':'#10b981','ไฟส่องสว่าง':'#eab308','ความปลอดภัย':'#ef4444','อื่นๆ':'#8b5cf6' }

export default function DistrictDetail({ district, name, cityAvg, onClose }) {
  const [visible, setVisible] = useState(false)
  const [barWidths, setBarWidths] = useState([])
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t) }, [name])
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setBarWidths(district.top_problems?.map((_,i)=>i) || []), 400)
      return () => clearTimeout(t)
    }
  }, [visible])

  const resolveRate = Math.round((district.resolved / district.total) * 100)
  const cityRate = Math.round((cityAvg?.resolve_rate || 0) * 100)
  const better = resolveRate >= cityRate

  return (
    <div style={{
      background:'rgba(15,23,42,0.8)',backdropFilter:'blur(16px)',
      border:'1px solid rgba(59,130,246,0.2)',borderRadius:16,
      padding:24,height:460,overflowY:'auto',
      boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
      opacity:visible?1:0,transform:visible?'translateX(0)':'translateX(32px)',
      transition:'all 0.4s ease'
    }}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <h3 style={{color:'white',fontWeight:800,fontSize:18,margin:'0 0 4px'}}>เขต{name}</h3>
          <p style={{color:'#64748b',fontSize:12,margin:0}}>{district.total?.toLocaleString()} ร้องเรียน • เฉลี่ย {district.avg_days} วัน/เรื่อง</p>
        </div>
        <button onClick={onClose} style={{
          width:32,height:32,borderRadius:8,background:'rgba(51,65,85,0.6)',border:'1px solid rgba(71,85,105,0.4)',
          color:'#94a3b8',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all 0.2s'
        }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.2)';e.currentTarget.style.color='#fca5a5'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(51,65,85,0.6)';e.currentTarget.style.color='#94a3b8'}}
        >✕</button>
      </div>

      {/* Resolve rate */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:8}}>
          <span style={{color:'#64748b'}}>อัตราแก้ไขปัญหา</span>
          <span style={{color:better?'#34d399':'#fb923c',fontWeight:600}}>
            {better?'↑ ดีกว่าค่าเฉลี่ย':'↓ ต่ำกว่าค่าเฉลี่ย'}
          </span>
        </div>
        <div style={{height:28,background:'rgba(30,41,59,0.8)',borderRadius:99,overflow:'hidden',position:'relative'}}>
          {/* City avg line */}
          <div style={{position:'absolute',top:0,bottom:0,width:2,background:'rgba(148,163,184,0.5)',left:`${cityRate}%`,zIndex:2}}/>
          {/* Bar */}
          <div style={{
            height:'100%',borderRadius:99,
            background:better?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,#f97316,#fb923c)',
            width:visible?`${resolveRate}%`:'0%',
            transition:'width 0.8s ease 0.3s',
            boxShadow:better?'0 0 12px rgba(16,185,129,0.5)':'0 0 12px rgba(249,115,22,0.5)',
          }}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800,fontSize:13,zIndex:3}}>
            {resolveRate}%
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#475569',marginTop:4}}>
          <span>0%</span><span>ค่าเฉลี่ยเมือง {cityRate}%</span><span>100%</span>
        </div>
      </div>

      {/* Top problems */}
      <div style={{marginBottom:20}}>
        <p style={{color:'#475569',fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12}}>ปัญหาที่พบบ่อย</p>
        {(district.top_problems||[]).map((p, i) => {
          const color = TYPE_COLORS[p.type] || '#60a5fa'
          const max = district.top_problems[0].count
          const pct = (p.count / max) * 100
          return (
            <div key={p.type} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:24,height:24,borderRadius:6,background:`${color}22`,color,fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {i+1}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:'#cbd5e1'}}>{p.type}</span>
                  <span style={{color:'#64748b'}}>{p.count.toLocaleString()}</span>
                </div>
                <div style={{height:4,background:'rgba(30,41,59,0.8)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{
                    height:'100%',borderRadius:99,background:color,
                    width: barWidths.includes(i) ? `${pct}%` : '0%',
                    transition:`width 0.6s ease ${i*80}ms`,
                    boxShadow:`0 0 8px ${color}66`
                  }}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trend */}
      {(district.monthly||[]).length > 0 && (
        <div>
          <p style={{color:'#475569',fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12}}>แนวโน้มรายเดือน</p>
          <div style={{height:80}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={district.monthly} margin={{top:0,right:0,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fill:'#475569',fontSize:10}} tickLine={false} axisLine={false}/>
                <YAxis hide/>
                <Tooltip contentStyle={{background:'rgba(15,23,42,0.9)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:8,fontSize:12}}/>
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{r:4,fill:'#3b82f6'}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
