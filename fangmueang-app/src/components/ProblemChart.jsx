import { useMemo, useEffect, useState } from 'react'

const CAT_CONFIG = {
  'ถนน/ทางเท้า': { color:'#F4A261', glow:'rgba(244,162,97,0.4)',   icon:'🛣️', grad:'linear-gradient(90deg,#C96A1A,#F4A261,#FBBF7A)' },
  'น้ำท่วม':      { color:'#4F9FE0', glow:'rgba(79,159,224,0.4)',   icon:'🌊', grad:'linear-gradient(90deg,#0C4A7A,#4F9FE0,#7EC3F7)' },
  'ขยะ':          { color:'#6FC18A', glow:'rgba(111,193,138,0.4)',  icon:'🗑️', grad:'linear-gradient(90deg,#1A5E35,#6FC18A,#94D9A8)' },
  'ไฟส่องสว่าง':  { color:'#E9C46A', glow:'rgba(233,196,106,0.4)',  icon:'💡', grad:'linear-gradient(90deg,#9A7A10,#E9C46A,#F7DC8A)' },
  'ความปลอดภัย': { color:'#E05A6A', glow:'rgba(224,90,106,0.4)',   icon:'🚨', grad:'linear-gradient(90deg,#8B1020,#E05A6A,#F28090)' },
  'อื่นๆ':        { color:'#8DA0B4', glow:'rgba(141,160,180,0.3)',  icon:'📋', grad:'linear-gradient(90deg,#3A4E62,#8DA0B4,#AABECF)' },
}
const FALLBACK = { color:'#8DA0B4', glow:'rgba(141,160,180,0.2)', icon:'📋', grad:'linear-gradient(90deg,#3A4E62,#8DA0B4,#AABECF)' }

/* ── Donut chart (stroke-dasharray approach — most reliable) ── */
function DonutChart({ rows, total, size = 104 }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])

  const cx = size / 2, cy = size / 2
  const r = size * 0.34
  const C = 2 * Math.PI * r
  const sw = size * 0.155
  const GAP = 3 // degrees gap between slices

  let cumPct = 0
  const slices = rows.map((row, i) => {
    const pct  = row.n / total
    const deg  = pct * 360 - GAP
    const sDeg = pct * C - (GAP / 360) * C
    const offset = -(cumPct * C) + C / 4
    cumPct += pct
    const cfg = CAT_CONFIG[row.label] || FALLBACK
    return { ...row, pct, sDeg, offset, cfg }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0, overflow:'visible' }}>
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.cfg.color} strokeWidth={sw}
          strokeLinecap="butt"
          style={{
            strokeDasharray: `${mounted ? s.sDeg : 0} ${C}`,
            strokeDashoffset: s.offset,
            filter: `drop-shadow(0 0 5px ${s.cfg.glow})`,
            transition: `stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      ))}
      {/* center label */}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="var(--ink)"
        style={{ fontFamily:'IBM Plex Mono,monospace', fontSize: size * 0.165, fontWeight:700 }}>
        {total >= 1000 ? `${(total/1000).toFixed(1)}K` : total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--faint)"
        style={{ fontSize: size * 0.095 }}>
        เรื่องร้องเรียน
      </text>
    </svg>
  )
}

/* ── Animated bar row ── */
function BarRow({ label, n, max, pct, idx }) {
  const cfg = CAT_CONFIG[label] || FALLBACK
  const targetW = max > 0 ? Math.max(2, (n / max) * 100) : 0
  const [w, setW] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setW(targetW), idx * 70 + 40)
    return () => clearTimeout(t)
  }, [targetW, idx])

  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:13 }}>{cfg.icon}</span>
          <span style={{ fontSize:12, color:'var(--ink)', fontWeight:600 }}>{label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {pct != null && (
            <span style={{
              fontSize:10, fontWeight:700, color:cfg.color,
              background:`${cfg.color}15`, border:`1px solid ${cfg.color}35`,
              borderRadius:5, padding:'1px 7px', fontFamily:'IBM Plex Mono,monospace',
            }}>{pct}%</span>
          )}
          <span style={{ fontSize:11, color:'var(--muted)', fontFamily:'IBM Plex Mono,monospace', minWidth:52, textAlign:'right' }}>
            {n.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bar track */}
      <div style={{ height:13, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden', position:'relative' }}>
        {/* fill */}
        <div style={{
          position:'absolute', top:0, left:0, height:'100%', borderRadius:99,
          background: cfg.grad, width:`${w}%`,
          transition:'width 0.75s cubic-bezier(0.4,0,0.2,1)',
          boxShadow:`0 0 12px ${cfg.glow}`,
        }}/>
        {/* shimmer overlay */}
        <div style={{
          position:'absolute', top:0, left:0, height:'100%', width:'100%',
          background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)',
          backgroundSize:'200% 100%',
          animation:'shimmerBar 2.5s ease-in-out infinite',
          pointerEvents:'none',
        }}/>
      </div>
    </div>
  )
}

/* ── Status stacked bar ── */
function StatusBar({ resolved, inProgress, pending }) {
  const total = Math.max(resolved + inProgress + pending, 1)
  const pR = +(resolved   / total * 100).toFixed(1)
  const pI = +(inProgress / total * 100).toFixed(1)
  const pP = +(pending    / total * 100).toFixed(1)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const segments = [
    { pct: pR, c:'#5BD1B8', s:'0 0 8px rgba(91,209,184,0.6)',  label:'ดำเนินการแล้ว',  v:`${pR}%` },
    { pct: pI, c:'#E9C46A', s:'0 0 8px rgba(233,196,106,0.5)', label:'กำลังดำเนินการ', v:`${pI}%` },
    { pct: pP, c:'#E05A6A', s:'0 0 8px rgba(224,90,106,0.5)',  label:'รอดำเนินการ',    v:`${pP}%` },
  ]

  return (
    <div style={{ marginTop:14 }}>
      <div style={{ fontSize:10, color:'var(--faint)', marginBottom:7, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
        สถานะการแก้ไข
      </div>
      {/* stacked bar */}
      <div style={{ display:'flex', height:10, borderRadius:99, overflow:'hidden', gap:2 }}>
        {segments.map(s => (
          <div key={s.label} style={{
            flex: mounted ? s.pct : 0,
            background: s.c, boxShadow: s.s,
            transition:'flex 0.9s cubic-bezier(0.4,0,0.2,1)',
            minWidth: mounted && s.pct > 0 ? 3 : 0,
          }}/>
        ))}
      </div>
      {/* legend */}
      <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:99, background:s.c, boxShadow:`0 0 5px ${s.c}90`, flexShrink:0 }}/>
            <span style={{ fontSize:10, color:'var(--faint)' }}>{s.label}</span>
            <span style={{ fontSize:10, color:s.c, fontWeight:700, fontFamily:'IBM Plex Mono,monospace' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── District ranking row ── */
const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣']
const RANK_COLORS = ['#5BD1B8','#72B9F7','#E9C46A','#F4A261','#E05A6A']

function DistrictRow({ rank, name, n, max, color }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(max > 0 ? Math.max(2, (n/max)*100) : 0), rank * 90 + 100)
    return () => clearTimeout(t)
  }, [n, max, rank])
  return (
    <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 60px', gap:8, alignItems:'center', marginBottom:10 }}>
      <span style={{ fontSize:15, textAlign:'center' }}>{MEDALS[rank]}</span>
      <div>
        <div style={{ fontSize:11, color:'var(--ink)', fontWeight:500, marginBottom:3 }}>เขต{name}</div>
        <div style={{ height:7, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:99,
            background:`linear-gradient(90deg,${color}99,${color})`,
            width:`${w}%`, transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            boxShadow:`0 0 8px ${color}66`,
          }}/>
        </div>
      </div>
      <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' }}>
        {(n/1000).toFixed(1)}K
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export default function ProblemChart({ data, selectedDistrict, districts }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k + 1) }, [selectedDistrict])

  const { rows, title, sub, status, totalComplaints } = useMemo(() => {
    if (selectedDistrict && districts?.[selectedDistrict]) {
      const d   = districts[selectedDistrict]
      const rws = (d.top_problems || [])
        .map(p => ({ label: p.type, n: p.count }))
        .sort((a, b) => b.n - a.n)
      const tot = rws.reduce((s, r) => s + r.n, 0) || 1
      const resolved   = d.resolved || 0
      const total      = d.total    || 1
      const pending    = Math.round(total * 0.24)
      const inProgress = Math.max(0, total - resolved - pending)
      return {
        rows: rws.map(r => ({ ...r, pct: Math.round(r.n / tot * 100) })),
        title: `ปัญหาในเขต${selectedDistrict}`,
        sub: 'สัดส่วนแต่ละประเภทปัญหา',
        status: { resolved, inProgress, pending },
        totalComplaints: total,
      }
    }
    const agg = {}
    let st = { resolved: 0, inProgress: 0, pending: 0 }
    Object.values(data?.districts || {}).forEach(d => {
      ;(d.top_problems || []).forEach(p => { agg[p.type] = (agg[p.type] || 0) + p.count })
      const tot  = d.total    || 0
      const res  = d.resolved || 0
      const pend = Math.round(tot * 0.24)
      st.resolved   += res
      st.inProgress += Math.max(0, tot - res - pend)
      st.pending    += Math.max(0, pend)
    })
    const tot = Object.values(agg).reduce((s, n) => s + n, 0) || 1
    return {
      rows: Object.entries(agg)
        .map(([l, n]) => ({ label: l, n, pct: Math.round(n / tot * 100) }))
        .sort((a, b) => b.n - a.n),
      title: 'ประเภทปัญหาทั่วกรุงเทพฯ',
      sub: 'รวมทุก 50 เขต',
      status: st,
      totalComplaints: tot,
    }
  }, [data, selectedDistrict, districts])

  const max = Math.max(...rows.map(r => r.n), 1)

  const distRank = useMemo(() =>
    Object.entries(data?.districts || {})
      .map(([n, d]) => ({ name:n, n: d.total || 0 }))
      .sort((a, b) => b.n - a.n).slice(0, 5),
    [data]
  )
  const distMax = Math.max(...distRank.map(r => r.n), 1)

  return (
    <>
      <style>{`
        @keyframes shimmerBar {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <section key={key} style={{
        background:'var(--panel)', border:'1px solid var(--line)',
        borderRadius:'var(--radius)', padding:'18px 20px',
        animation:'fade 0.35s ease',
      }}>
        {/* Header row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:16 }}>
          <div>
            <h2 style={{ margin:'0 0 3px', fontSize:15, fontWeight:700 }}>
              {selectedDistrict ? '📍' : '📊'} {title}
            </h2>
            <div style={{ fontSize:11, color:'var(--faint)' }}>{sub}</div>
          </div>
          {/* Donut shows only in city-wide view — district view has it in DistrictDetail */}
          {rows.length > 1 && !selectedDistrict && (
            <DonutChart key={key} rows={rows} total={totalComplaints} size={100}/>
          )}
        </div>

        {/* Category bars */}
        <div key={`bars-${key}`}>
          {rows.map((r, i) => (
            <BarRow key={r.label} label={r.label} n={r.n} max={max} pct={r.pct} idx={i}/>
          ))}
        </div>

        {/* Status bar */}
        <StatusBar key={`st-${key}`} {...status}/>

        {/* Top 5 districts */}
        {!selectedDistrict && (
          <>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', margin:'16px 0 13px' }}/>
            <h2 style={{ margin:'0 0 2px', fontSize:13, fontWeight:700 }}>🏙️ Top 5 เขตร้องเรียนมากสุด</h2>
            <div style={{ fontSize:11, color:'var(--faint)', marginBottom:11 }}>รวมทุกประเภทปัญหา</div>
            {distRank.map((r, i) => (
              <DistrictRow key={r.name} rank={i} name={r.name} n={r.n} max={distMax} color={RANK_COLORS[i]}/>
            ))}
          </>
        )}
      </section>
    </>
  )
}
