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
  const count    = payload.find(p => p.dataKey === 'count')?.value || 0
  const resolved = payload.find(p => p.dataKey === 'resolved')?.value || 0
  const pct = count > 0 ? Math.round(resolved / count * 100) : 0
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--line)',
      borderRadius:10, padding:'10px 14px', minWidth:140,
      boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize:11, color:'var(--faint)', marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#5BD1B8' }}>● ร้องเรียน</span>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)', fontFamily:'IBM Plex Mono,monospace' }}>{count.toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#F9CA24' }}>● แก้ไขแล้ว</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#F9CA24', fontFamily:'IBM Plex Mono,monospace' }}>{resolved.toLocaleString()}</span>
        </div>
        <div style={{ borderTop:'1px solid var(--line)', marginTop:4, paddingTop:4, fontSize:11, color:'var(--faint)' }}>
          อัตราแก้ไข <span style={{ color: pct>=70?'#5BD1B8':pct>=50?'#F9CA24':'#EB4D4B', fontWeight:700 }}>{pct}%</span>
        </div>
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
        <div style={{ background:'var(--panel2)', borderRadius:12, padding:'14px 16px', border:'1px solid var(--line)' }}>
          {/* Chart header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>แนวโน้มรายเดือน</div>
              <div style={{ fontSize:11, color:'var(--faint)' }}>6 เดือนล่าสุด</div>
            </div>
            <div style={{ display:'flex', gap:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:20, height:2, background:'#5BD1B8', display:'inline-block', borderRadius:2 }}/>
                <span style={{ fontSize:11, color:'var(--faint)' }}>ร้องเรียน</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:20, height:2, background:'#F9CA24', display:'inline-block', borderRadius:2 }}/>
                <span style={{ fontSize:11, color:'var(--faint)' }}>แก้ไขแล้ว</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ height:130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top:8, right:4, bottom:0, left:4 }}>
                <defs>
                  <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#5BD1B8" stopOpacity={0.35}/>
                    <stop offset="100%" stopColor="#5BD1B8" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#F9CA24" stopOpacity={0.30}/>
                    <stop offset="100%" stopColor="#F9CA24" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill:'#64778C', fontSize:10, fontFamily:'IBM Plex Sans Thai,sans-serif' }}
                  tickLine={false}
                  axisLine={{ stroke:'rgba(255,255,255,0.06)' }}
                />
                <YAxis hide domain={['auto','auto']}/>
                <Tooltip content={<TT/>} cursor={{ stroke:'rgba(255,255,255,0.08)', strokeWidth:1 }}/>
                {/* Resolved area (below) */}
                <Area
                  type="monotone" dataKey="resolved"
                  stroke="#F9CA24" strokeWidth={2}
                  fill="url(#gradResolved)"
                  dot={false}
                  activeDot={{ r:4, fill:'#F9CA24', stroke:'var(--panel)', strokeWidth:2 }}
                />
                {/* Total area (above) */}
                <Area
                  type="monotone" dataKey="count"
                  stroke="#5BD1B8" strokeWidth={2.5}
                  fill="url(#gradCount)"
                  dot={false}
                  activeDot={{ r:5, fill:'#5BD1B8', stroke:'var(--panel)', strokeWidth:2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom stat */}
          {(() => {
            const first = trend[0], last = trend[trend.length-1]
            const diff = last.count - first.count
            const sign = diff >= 0 ? '+' : ''
            const pct  = first.count > 0 ? Math.round(diff / first.count * 100) : 0
            return (
              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--faint)' }}>เทียบเดือนแรก vs เดือนล่าสุด</span>
                <span style={{
                  fontSize:12, fontWeight:700, fontFamily:'IBM Plex Mono,monospace',
                  color: diff <= 0 ? '#5BD1B8' : '#EB4D4B',
                }}>
                  {sign}{pct}% {diff <= 0 ? '▼ ลดลง' : '▲ เพิ่มขึ้น'}
                </span>
              </div>
            )
          })()}
        </div>
      )}
    </section>
  )
}
