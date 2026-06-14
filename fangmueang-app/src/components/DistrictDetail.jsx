import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CAT_COLORS = {
  'ถนน/ทางเท้า':'#E58A53','น้ำท่วม':'#4F9FE0','ขยะ':'#6FC18A',
  'ไฟส่องสว่าง':'#E9C46A','ความปลอดภัย':'#D14B3C','อื่นๆ':'#8DA0B4',
}

function BarRow({ label, n, max, color }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(max > 0 ? Math.max(3, (n/max)*100) : 0), 100); return () => clearTimeout(t) }, [n, max])
  return (
    <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 60px', alignItems:'center', gap:10, margin:'9px 0' }}>
      <div style={{ fontSize:13, color:'var(--ink)' }}>{label}</div>
      <div style={{ height:14, background:'var(--panel2)', borderRadius:7, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:7, background:color, width:`${w}%`, transition:'width 0.6s ease' }}/>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', textAlign:'right', fontFamily:'IBM Plex Mono,monospace' }}>
        {n.toLocaleString()}
      </div>
    </div>
  )
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--line)', borderRadius:9, padding:'8px 13px' }}>
      <div style={{ fontSize:11, color:'var(--faint)' }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--mint)', fontFamily:'IBM Plex Mono,monospace' }}>
        {payload[0]?.value?.toLocaleString()} ครั้ง
      </div>
    </div>
  )
}

export default function DistrictDetail({ district, name, cityAvg, onClose }) {
  const resolveRate = Math.round((district.resolved / Math.max(district.total, 1)) * 100)
  const cityRate = Math.round((cityAvg?.resolve_rate || 0) * 100)
  const cityDays = cityAvg?.avg_days || 0
  const betterRate = resolveRate >= cityRate
  const betterDays = (district.avg_days || 0) <= cityDays

  const topProblems = (district.top_problems || []).slice(0, 5)
  const maxCount = Math.max(...topProblems.map(p => p.count), 1)
  const trend = (district.monthly || []).slice(-6)

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--radius)',
    padding:'16px 17px', animation:'fade 0.3s ease',
  }
  const CMPBOX = {
    background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:11, padding:13,
  }

  return (
    <section style={CARD}>
      <button onClick={onClose} style={{
        float:'right', cursor:'pointer', border:'1px solid var(--line)', background:'none',
        color:'var(--muted)', borderRadius:8, padding:'3px 10px', fontFamily:'inherit', fontSize:12,
      }}
      onMouseEnter={e => { e.currentTarget.style.color='var(--ink)'; e.currentTarget.style.borderColor='var(--mint-d)' }}
      onMouseLeave={e => { e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor='var(--line)' }}>
        ปิด ✕
      </button>

      <h2 style={{ margin:'0 0 2px', fontSize:15, fontWeight:600 }}>เขต{name}</h2>
      <div style={{ color:'var(--faint)', fontSize:12, marginBottom:14 }}>
        {(district.total || 0).toLocaleString()} เรื่องร้องเรียน · เทียบกับค่าเฉลี่ยทั้งเมือง
      </div>

      {/* Bars */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--faint)', marginBottom:6 }}>Top ปัญหาของเขตนี้</div>
        {topProblems.map(p => (
          <BarRow key={p.type} label={p.type} n={p.count} max={maxCount} color={CAT_COLORS[p.type] || '#8DA0B4'}/>
        ))}
      </div>

      {/* Comparison boxes */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom: trend.length ? 16 : 0 }}>
        <div style={CMPBOX}>
          <div style={{ fontSize:12, color:'var(--faint)' }}>แก้ไขแล้ว</div>
          <div style={{ fontSize:24, fontWeight:600, marginTop:4, fontFamily:'IBM Plex Mono,monospace' }}>{resolveRate}%</div>
          <div style={{ fontSize:12, marginTop:6, color: betterRate ? '#5BD1B8' : '#F08C7A' }}>
            {betterRate ? '▲ ดีกว่าค่าเฉลี่ย' : '▼ ต่ำกว่าค่าเฉลี่ย'} {Math.abs(resolveRate - cityRate)}%
          </div>
          <div style={{ fontSize:12, marginTop:2, color:'var(--faint)' }}>ค่าเฉลี่ยเมือง {cityRate}%</div>
        </div>
        <div style={CMPBOX}>
          <div style={{ fontSize:12, color:'var(--faint)' }}>เวลาเฉลี่ยในการแก้</div>
          <div style={{ fontSize:24, fontWeight:600, marginTop:4, fontFamily:'IBM Plex Mono,monospace' }}>
            {district.avg_days || '—'} <small style={{ fontSize:14, color:'var(--muted)', fontWeight:400 }}>วัน</small>
          </div>
          <div style={{ fontSize:12, marginTop:6, color: betterDays ? '#5BD1B8' : '#F08C7A' }}>
            {betterDays ? '▲ เร็วกว่าค่าเฉลี่ย' : '▼ ช้ากว่าค่าเฉลี่ย'} {Math.abs((district.avg_days || 0) - cityDays).toFixed(1)} วัน
          </div>
          <div style={{ fontSize:12, marginTop:2, color:'var(--faint)' }}>ค่าเฉลี่ยเมือง {cityDays} วัน</div>
        </div>
      </div>

      {/* Trend */}
      {trend.length > 0 && (
        <div>
          <div style={{ fontSize:12, color:'var(--faint)', marginBottom:8 }}>แนวโน้มรายเดือน</div>
          <div style={{ height:80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top:0, right:0, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5BD1B8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5BD1B8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill:'#64778C', fontSize:9 }} tickLine={false} axisLine={false}/>
                <YAxis hide/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="count" stroke="#5BD1B8" strokeWidth={1.5}
                  fill="url(#tg)" dot={false} activeDot={{ r:3, fill:'#5BD1B8', strokeWidth:0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}
