import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'rgba(15,23,42,0.95)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:12,padding:'10px 16px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      <p style={{color:'white',fontWeight:700,fontSize:14,margin:'0 0 4px'}}>{label}</p>
      <p style={{color:'#60a5fa',fontSize:13,margin:0}}>{payload[0].value.toLocaleString()} ครั้ง</p>
    </div>
  )
}

export default function ProblemChart({ data }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t) }, [])

  if (!data) return null

  // Aggregate from all districts
  const agg = {}
  Object.values(data.districts || {}).forEach(d => {
    (d.top_problems || []).forEach(p => { agg[p.type] = (agg[p.type]||0) + p.count })
  })
  const chartData = Object.entries(agg).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)

  return (
    <div style={{
      background:'rgba(15,23,42,0.8)',backdropFilter:'blur(16px)',
      border:'1px solid rgba(59,130,246,0.15)',borderRadius:16,
      padding:24,height:460,display:'flex',flexDirection:'column',
      boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
      opacity:visible?1:0,transform:visible?'translateX(0)':'translateX(24px)',
      transition:'all 0.5s ease'
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(59,130,246,0.4)'}}>
          📊
        </div>
        <div>
          <h3 style={{color:'white',fontWeight:700,fontSize:14,margin:0}}>ประเภทปัญหา</h3>
          <p style={{color:'#475569',fontSize:12,margin:0}}>ทั่วกรุงเทพฯ</p>
        </div>
      </div>
      <div style={{flex:1}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{top:0,right:24,bottom:0,left:8}}>
            <XAxis type="number" tick={{fill:'#475569',fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
            <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:12}} tickLine={false} axisLine={false} width={90} />
            <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(255,255,255,0.03)'}} />
            <Bar dataKey="value" radius={[0,8,8,0]}>
              {chartData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
