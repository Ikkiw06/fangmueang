import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { calcScore, getGradeInfo } from '../utils/score'

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

/* ── Trend tooltip (count + resolved) ── */
function TrendTT({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const count    = payload.find(p => p.dataKey === 'count')?.value    || 0
  const resolved = payload.find(p => p.dataKey === 'resolved')?.value || 0
  const pct = count > 0 ? Math.round(resolved / count * 100) : 0
  return (
    <div style={{
      background:'#0D1520', border:'1px solid rgba(91,209,184,0.35)',
      borderRadius:10, padding:'11px 16px', minWidth:148,
      boxShadow:'0 10px 30px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontSize:11, color:'#64778C', marginBottom:7, fontWeight:600 }}>{label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
          <span style={{ fontSize:11, color:'#5BD1B8' }}>● ร้องเรียน</span>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)', fontFamily:'IBM Plex Mono,monospace' }}>{count.toLocaleString()}</span>
        </div>
        {resolved > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
            <span style={{ fontSize:11, color:'#F9CA24' }}>● แก้ไขแล้ว</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#F9CA24', fontFamily:'IBM Plex Mono,monospace' }}>{resolved.toLocaleString()}</span>
          </div>
        )}
        {resolved > 0 && (
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:3, paddingTop:5, fontSize:11, color:'#64778C' }}>
            แก้ไข <span style={{ color: pct>=70?'#5BD1B8':pct>=50?'#E9C46A':'#EB4D4B', fontWeight:700 }}>{pct}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export default function DistrictDetail({ district, name, cityAvg, onClose }) {
  const total       = district.total || 0
  const resolveRate = Math.round((district.resolved / Math.max(total, 1)) * 100)
  const cityRate    = Math.round((cityAvg?.resolve_rate || 0) * 100)
  const cityDays    = Math.round(cityAvg?.avg_days || 0)
  const distDays    = Math.round(district.avg_days || 0)
  const betterRate  = resolveRate >= cityRate
  const betterDays  = distDays <= cityDays
  const topProblems = (district.top_problems || []).slice(0, 6)
  const maxCount    = Math.max(...topProblems.map(p => p.count), 1)
  const trend       = (district.monthly || []).slice(-12)

  const score = calcScore(district, cityAvg)
  const grade = getGradeInfo(score)

  const trendAvg = trend.length
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
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {/* Urban Health Score badge */}
          <div style={{
            background: grade.bg, border:`2px solid ${grade.color}60`,
            borderRadius:14, padding:'8px 14px',
            display:'flex', flexDirection:'column', alignItems:'center',
            minWidth:58, flexShrink:0,
          }}>
            <span style={{ fontSize:28, fontWeight:900, lineHeight:1, color:grade.color, fontFamily:'IBM Plex Mono,monospace' }}>
              {grade.grade}
            </span>
            <span style={{ fontSize:9, color:grade.color, marginTop:2, fontWeight:600 }}>
              {score !== null ? score : '—'}
            </span>
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>เขต{name}</h2>
            <div style={{ color:grade.color, fontSize:12, fontWeight:600, marginTop:1 }}>{grade.label}</div>
            <div style={{ color:'var(--faint)', fontSize:11, marginTop:2 }}>
              {total.toLocaleString()} เรื่องร้องเรียน · เทียบค่าเฉลี่ยเมือง
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background:'none', border:'1px solid var(--line)', color:'var(--muted)',
          borderRadius:8, padding:'5px 14px', fontFamily:'inherit', fontSize:12, cursor:'pointer',
          transition:'all 0.15s', flexShrink:0,
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
                label:'อัตราแก้ไขรวม', value:`${resolveRate}%`,
                better: betterRate,
                delta: `${Math.abs(resolveRate - cityRate)}%`,
                city: `ค่าเฉลี่ยเมือง ${cityRate}%`,
              },
              {
                label:'เวลาเฉลี่ยในการแก้', value: distDays ? `${distDays} วัน` : '—',
                better: betterDays,
                delta: `${Math.abs(distDays - cityDays)} วัน`,
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

          {/* Area trend chart — count + resolved */}
          {trend.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>📈 แนวโน้มรายเดือน</div>
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:18, height:3, background:'#5BD1B8', borderRadius:99, boxShadow:'0 0 6px rgba(91,209,184,0.8)' }}/>
                    <span style={{ fontSize:10, color:'#5BD1B8', fontWeight:600 }}>ร้องเรียน</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:18, height:3, background:'#F9CA24', borderRadius:99, boxShadow:'0 0 6px rgba(249,202,36,0.7)' }}/>
                    <span style={{ fontSize:10, color:'#F9CA24', fontWeight:600 }}>แก้ไขแล้ว</span>
                  </div>
                </div>
              </div>

              <div style={{ height:260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top:10, right:20, bottom:8, left:10 }}>
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
                    <CartesianGrid stroke="rgba(42,56,72,0.7)" strokeDasharray="4 4"/>
                    {trendAvg > 0 && (
                      <ReferenceLine y={trendAvg} stroke="rgba(91,209,184,0.35)" strokeDasharray="8 4"
                        label={{ value:`เฉลี่ย ${trendAvg}`, position:'insideTopRight',
                          fill:'rgba(91,209,184,0.55)', fontSize:10 }}
                      />
                    )}
                    <XAxis dataKey="month"
                      tick={{ fill:'#8DA0B4', fontSize:10, fontFamily:'IBM Plex Sans Thai,sans-serif' }}
                      tickLine={false} axisLine={{ stroke:'rgba(42,56,72,0.9)' }}
                    />
                    <YAxis width={40} domain={['auto','auto']}
                      tick={{ fill:'#8DA0B4', fontSize:10, fontFamily:'IBM Plex Mono,monospace' }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v}
                    />
                    <Tooltip content={<TrendTT/>} cursor={{ stroke:'rgba(255,255,255,0.1)', strokeWidth:1 }}/>
                    <Area type="monotone" dataKey="resolved" stroke="#F9CA24" strokeWidth={2}
                      fill="url(#gradResolved)" dot={false}
                      activeDot={{ r:4, fill:'#F9CA24', stroke:'var(--panel)', strokeWidth:2 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#5BD1B8" strokeWidth={2.5}
                      fill="url(#gradCount)" dot={false}
                      activeDot={{ r:5, fill:'#5BD1B8', stroke:'var(--panel)', strokeWidth:2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Month-over-month summary */}
              {trend.length >= 2 && (() => {
                const first = trend[0], last = trend[trend.length - 1]
                const diff  = last.count - first.count
                const pct   = first.count > 0 ? Math.round(diff / first.count * 100) : 0
                return (
                  <div style={{
                    marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.07)',
                    display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
                  }}>
                    <span style={{ fontSize:11, color:'var(--faint)' }}>{first.month} → {last.month}</span>
                    <span style={{
                      fontSize:12, fontWeight:700, fontFamily:'IBM Plex Mono,monospace',
                      color: diff <= 0 ? '#5BD1B8' : '#EB4D4B',
                    }}>
                      {diff >= 0 ? '+' : ''}{pct}% {diff <= 0 ? '▼ ลดลง' : '▲ เพิ่มขึ้น'}
                    </span>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
