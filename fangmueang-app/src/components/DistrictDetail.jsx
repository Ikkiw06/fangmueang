import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

const CAT_CONFIG = {
  'ถนน/ทางเท้า': { color:'#F4A261', glow:'rgba(244,162,97,0.4)',  icon:'🛣️', grad:'linear-gradient(90deg,#C96A1A,#F4A261,#FBBF7A)' },
  'น้ำท่วม':      { color:'#4F9FE0', glow:'rgba(79,159,224,0.4)',  icon:'🌊', grad:'linear-gradient(90deg,#0C4A7A,#4F9FE0,#7EC3F7)' },
  'ขยะ':          { color:'#6FC18A', glow:'rgba(111,193,138,0.4)', icon:'🗑️', grad:'linear-gradient(90deg,#1A5E35,#6FC18A,#94D9A8)' },
  'ไฟส่องสว่าง':  { color:'#E9C46A', glow:'rgba(233,196,106,0.4)', icon:'💡', grad:'linear-gradient(90deg,#9A7A10,#E9C46A,#F7DC8A)' },
  'ความปลอดภัย': { color:'#E05A6A', glow:'rgba(224,90,106,0.4)',  icon:'🚨', grad:'linear-gradient(90deg,#8B1020,#E05A6A,#F28090)' },
  'อื่นๆ':        { color:'#8DA0B4', glow:'rgba(141,160,180,0.3)', icon:'📋', grad:'linear-gradient(90deg,#3A4E62,#8DA0B4,#AABECF)' },
}
const FALLBACK = { color:'#8DA0B4', glow:'rgba(141,160,180,0.2)', icon:'📋', grad:'linear-gradient(90deg,#3A4E62,#8DA0B4)' }

/* ── Donut (strokeDasharray) ── */
function DonutChart({ problems, size = 200 }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])

  const total = problems.reduce((s, p) => s + p.count, 0) || 1
  const cx = size / 2, cy = size / 2
  const r  = size * 0.36
  const C  = 2 * Math.PI * r
  const sw = size * 0.155
  const GAP_DEG = 3

  let cum = 0
  const slices = problems.map((p) => {
    const cfg  = CAT_CONFIG[p.type] || FALLBACK
    const pct  = p.count / total
    const dash = Math.max(0, pct * C - (GAP_DEG / 360) * C)
    const offset = -(cum * C) + C / 4
    cum += pct
    return { ...p, cfg, pct, dash, offset }
  })

  return (
    <div>
      {/* Center: Donut SVG */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow:'visible' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw}/>
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.cfg.color} strokeWidth={sw} strokeLinecap="butt"
              style={{
                strokeDasharray: `${mounted ? s.dash : 0} ${C}`,
                strokeDashoffset: s.offset,
                filter: `drop-shadow(0 0 8px ${s.cfg.glow})`,
                transition: `stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          ))}
          <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--ink)"
            style={{ fontFamily:'IBM Plex Mono,monospace', fontSize: size * 0.15, fontWeight:700 }}>
            {total >= 1000 ? `${(total/1000).toFixed(1)}K` : total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--faint)"
            style={{ fontSize: size * 0.085 }}>เรื่องร้องเรียน</text>
        </svg>
      </div>

      {/* Legend grid: 2 columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:10, height:10, borderRadius:'50%', flexShrink:0,
              background: s.cfg.color, boxShadow: `0 0 8px ${s.cfg.glow}`,
            }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:'var(--ink)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                <span>{s.cfg.icon}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.type}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:99, background: s.cfg.color,
                    width: mounted ? `${s.pct * 100}%` : '0%',
                    transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
                    boxShadow: `0 0 5px ${s.cfg.glow}`,
                  }}/>
                </div>
                <span style={{
                  fontSize:13, fontFamily:'IBM Plex Mono,monospace', fontWeight:800,
                  color: s.cfg.color, flexShrink:0,
                }}>
                  {Math.round(s.pct * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Bar row ── */
function BarRow({ label, count, resolveRate, max, delay }) {
  const [w, setW] = useState(0)
  const cfg = CAT_CONFIG[label] || FALLBACK
  useEffect(() => {
    const t = setTimeout(() => setW(max > 0 ? Math.max(3, (count/max)*100) : 0), 100 + delay)
    return () => clearTimeout(t)
  }, [count, max, delay])

  const rr = resolveRate ?? 0
  const rrC  = rr >= 0.7 ? '#5BD1B8' : rr >= 0.5 ? '#E9C46A' : '#D14B3C'
  const rrBg = rr >= 0.7 ? 'rgba(91,209,184,0.1)' : rr >= 0.5 ? 'rgba(233,196,106,0.1)' : 'rgba(209,75,60,0.1)'
  const rrBo = rr >= 0.7 ? 'rgba(91,209,184,0.25)' : rr >= 0.5 ? 'rgba(233,196,106,0.25)' : 'rgba(209,75,60,0.25)'

  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:13 }}>{cfg.icon}</span>
          <span style={{ fontSize:12, color:'var(--ink)', fontWeight:500 }}>{label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontFamily:'IBM Plex Mono,monospace', color:'var(--muted)' }}>{count.toLocaleString()}</span>
          {resolveRate != null && (
            <span style={{ fontSize:11, fontFamily:'IBM Plex Mono,monospace', fontWeight:700, color:rrC,
              background:rrBg, padding:'2px 7px', borderRadius:99, border:`1px solid ${rrBo}` }}>
              ✓ {Math.round(rr*100)}%
            </span>
          )}
        </div>
      </div>
      <div style={{ height:11, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden', position:'relative' }}>
        <div style={{
          position:'absolute', inset:0, height:'100%', borderRadius:99,
          background: cfg.grad, width:`${w}%`,
          transition:'width 0.65s cubic-bezier(0.4,0,0.2,1)',
          boxShadow:`0 0 10px ${cfg.glow}`,
        }}/>
      </div>
      {resolveRate != null && (
        <div style={{ height:3, background:'transparent', borderRadius:99, overflow:'hidden', marginTop:2 }}>
          <div style={{ height:'100%', borderRadius:99, background:rrC,
            width:`${w * rr}%`, transition:'width 0.85s ease 0.25s', opacity:0.5 }}/>
        </div>
      )}
    </div>
  )
}

/* ── Trend tooltip ── */
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={{
      background:'#0D1520', border:'1px solid rgba(91,209,184,0.35)',
      borderRadius:10, padding:'11px 16px',
      boxShadow:'0 10px 30px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontSize:11, color:'#64778C', marginBottom:3 }}>เดือน {label}</div>
      <div style={{ fontSize:20, fontWeight:700, color:'#5BD1B8', fontFamily:'IBM Plex Mono,monospace', lineHeight:1 }}>
        {val?.toLocaleString()}
      </div>
      <div style={{ fontSize:10, color:'#64778C', marginTop:4 }}>เรื่องร้องเรียน</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export default function DistrictDetail({ district, name, cityAvg, onClose }) {
  const resolveRate = Math.round((district.resolved / Math.max(district.total, 1)) * 100)
  const cityRate    = Math.round((cityAvg?.resolve_rate || 0) * 100)
  const cityDays    = cityAvg?.avg_days || 0
  const betterRate  = resolveRate >= cityRate
  const betterDays  = (district.avg_days || 0) <= cityDays
  const topProblems = (district.top_problems || []).slice(0, 6)
  const maxCount    = Math.max(...topProblems.map(p => p.count), 1)
  const trend       = (district.monthly || []).slice(-6)
  const trendAvg    = trend.length
    ? Math.round(trend.reduce((s, t) => s + (t.count || 0), 0) / trend.length)
    : 0

  return (
    <section style={{
      background:'var(--panel)', border:'1px solid var(--line)',
      borderRadius:'var(--radius)', padding:'20px 24px',
      animation:'fade 0.3s ease',
    }}>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📍 เขต{name}</h2>
          <div style={{ color:'var(--faint)', fontSize:12, marginTop:3 }}>
            {(district.total||0).toLocaleString()} เรื่องร้องเรียน · เทียบกับค่าเฉลี่ยเมือง
          </div>
        </div>
        <button onClick={onClose} style={{
          background:'none', border:'1px solid var(--line)', color:'var(--muted)',
          borderRadius:8, padding:'5px 14px', fontFamily:'inherit', fontSize:12, cursor:'pointer',
          transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)';   e.currentTarget.style.color='var(--muted)' }}>
          ปิด ✕
        </button>
      </div>

      {/* ── Main 2-column layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, alignItems:'start' }}>

        {/* ── LEFT: KPIs + bars ── */}
        <div>
          {/* KPI boxes */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              {
                label: 'อัตราแก้ไขรวม',
                value: `${resolveRate}%`,
                better: betterRate,
                delta: `${Math.abs(resolveRate - cityRate)}%`,
                city: `ค่าเฉลี่ยเมือง ${cityRate}%`,
              },
              {
                label: 'เวลาเฉลี่ยในการแก้',
                value: district.avg_days ? `${district.avg_days} วัน` : '—',
                better: betterDays,
                delta: `${Math.abs((district.avg_days||0) - cityDays).toFixed(1)} วัน`,
                city: `ค่าเฉลี่ยเมือง ${cityDays} วัน`,
              },
            ].map(box => (
              <div key={box.label} style={{
                background:'var(--panel2)', border:'1px solid var(--line)',
                borderRadius:11, padding:'14px 16px',
              }}>
                <div style={{ fontSize:11, color:'var(--faint)' }}>{box.label}</div>
                <div style={{ fontSize:28, fontWeight:700, marginTop:4, fontFamily:'IBM Plex Mono,monospace', color:'var(--ink)' }}>
                  {box.value}
                </div>
                <div style={{ fontSize:12, marginTop:6, fontWeight:600, color: box.better ? '#5BD1B8' : '#F08C7A' }}>
                  {box.better ? '▲ ดีกว่าค่าเฉลี่ย' : '▼ ต่ำกว่าค่าเฉลี่ย'} {box.delta}
                </div>
                <div style={{ fontSize:11, marginTop:2, color:'var(--faint)' }}>{box.city}</div>
              </div>
            ))}
          </div>

          {/* Bar breakdown */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:11, color:'var(--faint)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                ปัญหาแยกตามประเภท
              </span>
              <span style={{ fontSize:10, color:'var(--faint)' }}>▊ ทั้งหมด &nbsp; <span style={{ color:'rgba(91,209,184,0.55)' }}>▊ แก้ไขแล้ว</span></span>
            </div>
            {topProblems.map((p, i) => (
              <BarRow key={p.type} label={p.type} count={p.count}
                resolveRate={p.resolve_rate} max={maxCount} delay={i * 75}/>
            ))}
          </div>

          {/* Note */}
          <div style={{
            fontSize:11, color:'var(--faint)',
            padding:'8px 12px', background:'var(--panel2)', borderRadius:8,
            borderLeft:'2px solid var(--mint)',
          }}>
            💡 % แก้ไข = เรื่องที่ status เปลี่ยนเป็น "แก้ไขแล้ว" ÷ เรื่องทั้งหมดของประเภทนั้น
          </div>
        </div>

        {/* ── RIGHT: Donut + Trend chart ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* Donut */}
          {topProblems.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:'var(--faint)', fontWeight:600, letterSpacing:'0.06em',
                textTransform:'uppercase', marginBottom:16 }}>
                🍩 สัดส่วนปัญหาแต่ละประเภท
              </div>
              <DonutChart problems={topProblems} size={200}/>
            </div>
          )}

          {/* Trend line chart */}
          {trend.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>📈 แนวโน้มรายเดือน</div>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:20, height:3, background:'#5BD1B8', borderRadius:99,
                    boxShadow:'0 0 8px rgba(91,209,184,0.8)' }}/>
                  <span style={{ fontSize:11, color:'#5BD1B8', fontWeight:600 }}>จำนวนเรื่อง</span>
                </div>
              </div>

              <div style={{ height:260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top:10, right:20, bottom:10, left:10 }}>
                    <defs>
                      <filter id="lg2" x="-20%" y="-50%" width="140%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid stroke="rgba(42,56,72,0.85)" strokeDasharray="4 4"/>
                    {trendAvg > 0 && (
                      <ReferenceLine y={trendAvg} stroke="rgba(91,209,184,0.4)" strokeDasharray="8 4"
                        label={{ value:`เฉลี่ย ${trendAvg}`, position:'insideTopRight',
                          fill:'rgba(91,209,184,0.6)', fontSize:10 }}
                      />
                    )}
                    <XAxis dataKey="month"
                      tick={{ fill:'#8DA0B4', fontSize:11, fontFamily:'IBM Plex Sans Thai,sans-serif' }}
                      tickLine={{ stroke:'rgba(42,56,72,0.9)' }}
                      axisLine={{ stroke:'rgba(42,56,72,0.9)' }}
                      dy={5}
                    />
                    <YAxis width={44}
                      domain={['auto', 'auto']}
                      tick={{ fill:'#8DA0B4', fontSize:11, fontFamily:'IBM Plex Mono,monospace' }}
                      tickLine={{ stroke:'rgba(42,56,72,0.9)' }}
                      axisLine={{ stroke:'rgba(42,56,72,0.9)' }}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v}
                    />
                    <Tooltip content={<TrendTooltip/>}
                      cursor={{ stroke:'rgba(91,209,184,0.3)', strokeWidth:1, strokeDasharray:'5 3' }}/>
                    <Line type="monotone" dataKey="count"
                      stroke="#5BD1B8" strokeWidth={3}
                      dot={{ r:5, fill:'#5BD1B8', stroke:'#0D1520', strokeWidth:2 }}
                      activeDot={{ r:8, fill:'#5BD1B8', stroke:'#0D1520', strokeWidth:2.5, filter:'url(#lg2)' }}
                      filter="url(#lg2)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
