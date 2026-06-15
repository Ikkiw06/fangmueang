import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CAT_COLORS = {
  'ถนน/ทางเท้า':'#E58A53','น้ำท่วม':'#4F9FE0','ขยะ':'#6FC18A',
  'ไฟส่องสว่าง':'#E9C46A','ความปลอดภัย':'#D14B3C','อื่นๆ':'#8DA0B4',
}

function BarRow({ label, count, resolveRate, max, color, delay }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(max > 0 ? Math.max(3, (count/max)*100) : 0), 100+delay)
    return () => clearTimeout(t)
  }, [count, max])
  
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block', flexShrink:0 }}/>
          <span style={{ fontSize:13, color:'var(--ink)' }}>{label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:12, fontFamily:'IBM Plex Mono,monospace', color:'var(--muted)' }}>{count.toLocaleString()} ครั้ง</span>
          {resolveRate != null && (
            <span style={{
              fontSize:11, fontFamily:'IBM Plex Mono,monospace', fontWeight:600,
              color: resolveRate >= 0.7 ? '#5BD1B8' : resolveRate >= 0.5 ? '#E9C46A' : '#D14B3C',
              background: resolveRate >= 0.7 ? 'rgba(91,209,184,0.08)' : resolveRate >= 0.5 ? 'rgba(233,196,106,0.08)' : 'rgba(209,75,60,0.08)',
              padding:'2px 7px', borderRadius:99, border:`1px solid ${resolveRate >= 0.7 ? 'rgba(91,209,184,0.2)' : resolveRate >= 0.5 ? 'rgba(233,196,106,0.2)' : 'rgba(209,75,60,0.2)'}`,
            }}>
              แก้ {Math.round(resolveRate*100)}%
            </span>
          )}
        </div>
      </div>
      {/* Total bar */}
      <div style={{ height:6, background:'var(--panel2)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:99, background:color, width:`${w}%`, transition:'width 0.6s ease' }}/>
      </div>
      {/* Resolve sub-bar */}
      {resolveRate != null && (
        <div style={{ height:3, background:'transparent', borderRadius:99, overflow:'hidden', marginTop:2 }}>
          <div style={{
            height:'100%', borderRadius:99,
            background: resolveRate >= 0.7 ? '#5BD1B8' : resolveRate >= 0.5 ? '#E9C46A' : '#D14B3C',
            width:`${w * resolveRate}%`, transition:'width 0.8s ease 0.2s', opacity:0.6,
          }}/>
        </div>
      )}
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
  const topProblems = (district.top_problems || []).slice(0, 6)
  const maxCount = Math.max(...topProblems.map(p => p.count), 1)
  const trend = (district.monthly || []).slice(-6)

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--radius)',
    padding:'18px 20px', animation:'fade 0.3s ease',
  }
  const CMPBOX = {
    background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:11, padding:'13px 15px',
  }

  return (
    <section style={CARD}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700 }}>เขต{name}</h2>
          <div style={{ color:'var(--faint)', fontSize:12, marginTop:3 }}>
            {(district.total||0).toLocaleString()} เรื่องร้องเรียน · เทียบกับค่าเฉลี่ยเมือง
          </div>
        </div>
        <button onClick={onClose} style={{
          background:'none', border:'1px solid var(--line)', color:'var(--muted)',
          borderRadius:8, padding:'4px 12px', fontFamily:'inherit', fontSize:12, cursor:'pointer',
          transition:'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--muted)' }}>
          ปิด ✕
        </button>
      </div>

      {/* Comparison boxes */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
        <div style={CMPBOX}>
          <div style={{ fontSize:12, color:'var(--faint)' }}>อัตราแก้ไขรวม</div>
          <div style={{ fontSize:26, fontWeight:700, marginTop:4, fontFamily:'IBM Plex Mono,monospace', color:'var(--ink)' }}>{resolveRate}%</div>
          <div style={{ fontSize:12, marginTop:6, color: betterRate?'#5BD1B8':'#F08C7A', fontWeight:600 }}>
            {betterRate?'▲ ดีกว่าค่าเฉลี่ย':'▼ ต่ำกว่าค่าเฉลี่ย'} {Math.abs(resolveRate-cityRate)}%
          </div>
          <div style={{ fontSize:11, marginTop:2, color:'var(--faint)' }}>ค่าเฉลี่ยเมือง {cityRate}%</div>
        </div>
        <div style={CMPBOX}>
          <div style={{ fontSize:12, color:'var(--faint)' }}>เวลาเฉลี่ยในการแก้</div>
          <div style={{ fontSize:26, fontWeight:700, marginTop:4, fontFamily:'IBM Plex Mono,monospace', color:'var(--ink)' }}>
            {district.avg_days || '—'} <small style={{ fontSize:14, color:'var(--muted)', fontWeight:400 }}>วัน</small>
          </div>
          <div style={{ fontSize:12, marginTop:6, color: betterDays?'#5BD1B8':'#F08C7A', fontWeight:600 }}>
            {betterDays?'▲ เร็วกว่าค่าเฉลี่ย':'▼ ช้ากว่าค่าเฉลี่ย'} {Math.abs((district.avg_days||0)-cityDays).toFixed(1)} วัน
          </div>
          <div style={{ fontSize:11, marginTop:2, color:'var(--faint)' }}>ค่าเฉลี่ยเมือง {cityDays} วัน</div>
        </div>
      </div>

      {/* Per-type breakdown */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:12, color:'var(--faint)', fontWeight:600, letterSpacing:'0.04em' }}>ปัญหาแยกตามประเภท</div>
          <div style={{ display:'flex', gap:12, fontSize:10, color:'var(--faint)' }}>
            <span>▊ จำนวนทั้งหมด</span>
            <span style={{ color:'rgba(91,209,184,0.5)' }}>▊ แก้ไขแล้ว</span>
          </div>
        </div>
        {topProblems.map((p, i) => (
          <BarRow
            key={p.type}
            label={p.type}
            count={p.count}
            resolveRate={p.resolve_rate}
            max={maxCount}
            color={CAT_COLORS[p.type]||'#8DA0B4'}
            delay={i*80}
          />
        ))}
      </div>

      {/* Legend note */}
      <div style={{ fontSize:11, color:'var(--faint)', marginBottom:16, padding:'8px 12px', background:'var(--panel2)', borderRadius:8, borderLeft:'2px solid var(--mint)' }}>
        💡 % แก้ไข = จำนวนเรื่องที่ status เปลี่ยนเป็น "แก้ไขแล้ว" ÷ เรื่องทั้งหมดของประเภทนั้น (ข้อมูลจาก Traffy Fondue)
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <div>
          <div style={{ fontSize:12, color:'var(--faint)', marginBottom:8 }}>แนวโน้มรายเดือน (6 เดือนล่าสุด)</div>
          <div style={{ height:80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top:0, right:0, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5BD1B8" stopOpacity={0.25}/>
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
