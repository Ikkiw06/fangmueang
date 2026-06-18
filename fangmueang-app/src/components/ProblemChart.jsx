import { useState, useEffect } from 'react'

const CAT_COLORS = {
  'ถนน/ทางเท้า':'#E58A53',
  'น้ำท่วม':     '#4F9FE0',
  'ขยะ':         '#6FC18A',
  'ไฟส่องสว่าง':'#E9C46A',
  'ความปลอดภัย':'#D14B3C',
  'อื่นๆ':       '#8DA0B4',
}

/* Resolve-rate badge color */
function rrColor(rr) {
  if (rr >= 70) return { fg:'#5BD1B8', bg:'rgba(91,209,184,0.1)', border:'rgba(91,209,184,0.25)' }
  if (rr >= 50) return { fg:'#E9C46A', bg:'rgba(233,196,106,0.1)', border:'rgba(233,196,106,0.25)' }
  return { fg:'#EB4D4B', bg:'rgba(235,77,75,0.1)', border:'rgba(235,77,75,0.25)' }
}

/* Animated bar for a problem type */
function TypeRow({ label, count, resolveRate, max, color, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(max > 0 ? Math.max(3, (count / max) * 100) : 0), 80 + delay)
    return () => clearTimeout(t)
  }, [count, max])

  const rr  = Math.round(resolveRate * 100)
  const col = rrColor(rr)

  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:9, height:9, borderRadius:3, background:color, display:'inline-block', flexShrink:0 }}/>
          <span style={{ fontSize:13, color:'var(--ink)' }}>{label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, fontFamily:'IBM Plex Mono,monospace', color:'var(--muted)' }}>
            {count.toLocaleString()}
          </span>
          <span style={{
            fontSize:11, fontWeight:600, fontFamily:'IBM Plex Mono,monospace',
            color: col.fg, background: col.bg, border:`1px solid ${col.border}`,
            padding:'2px 7px', borderRadius:99, minWidth:44, textAlign:'center',
          }}>
            {rr}%
          </span>
        </div>
      </div>
      {/* Total bar */}
      <div style={{ height:8, background:'var(--panel2)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:99, background:color, width:`${w}%`, transition:'width 0.55s ease', opacity:0.85 }}/>
      </div>
      {/* Resolve sub-bar */}
      <div style={{ height:3, background:'transparent', borderRadius:99, overflow:'hidden', marginTop:2 }}>
        <div style={{
          height:'100%', borderRadius:99, background:col.fg,
          width:`${w * resolveRate}%`, transition:'width 0.75s ease 0.1s', opacity:0.5,
        }}/>
      </div>
    </div>
  )
}

/* Clickable district row for the ranking list */
function DistrictRow({ name, total, resolveRate, rank, onClick, isSelected }) {
  const [hov, setHov] = useState(false)
  const rr  = Math.round(resolveRate * 100)
  const col = rrColor(rr)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'6px 10px',
        borderRadius:9, cursor:'pointer',
        background: isSelected ? 'rgba(91,209,184,0.08)' : hov ? 'var(--panel2)' : 'transparent',
        border: `1px solid ${isSelected ? 'rgba(91,209,184,0.3)' : 'transparent'}`,
        transition:'all 0.15s',
      }}>
      <span style={{
        fontSize:10, color:'var(--faint)', fontFamily:'IBM Plex Mono,monospace',
        width:18, textAlign:'right', flexShrink:0,
      }}>{rank}</span>
      <span style={{
        flex:1, fontSize:13,
        color: isSelected ? 'var(--mint)' : hov ? 'var(--ink)' : 'var(--ink)',
        fontWeight: isSelected ? 700 : 400,
      }}>
        เขต{name}
      </span>
      <span style={{
        fontSize:12, fontFamily:'IBM Plex Mono,monospace', color:'var(--muted)',
      }}>
        {total.toLocaleString()}
      </span>
      <span style={{
        fontSize:11, fontWeight:600, fontFamily:'IBM Plex Mono,monospace',
        color: col.fg, minWidth:38, textAlign:'right',
      }}>
        {rr}%
      </span>
    </div>
  )
}

export default function ProblemChart({ data, selectedDistrict, districts, onSelectDistrict }) {
  /* ── Aggregate problem types city-wide ── */
  const cityTypeAgg      = {}
  const cityTypeResolved = {}
  Object.values(data?.districts || {}).forEach(d =>
    (d.top_problems || []).forEach(p => {
      cityTypeAgg[p.type]      = (cityTypeAgg[p.type] || 0) + p.count
      cityTypeResolved[p.type] = (cityTypeResolved[p.type] || 0) + Math.round(p.count * p.resolve_rate)
    })
  )
  const cityTypes = Object.entries(cityTypeAgg)
    .map(([type, count]) => ({
      type, count,
      resolveRate: (cityTypeResolved[type] || 0) / count,
    }))
    .sort((a, b) => b.count - a.count)
  const typeMax = Math.max(...cityTypes.map(t => t.count), 1)

  /* ── District ranking top 10 ── */
  const distRank = Object.entries(data?.districts || {})
    .map(([name, d]) => ({
      name,
      total:       d.total || 0,
      resolveRate: (d.resolved || 0) / Math.max(d.total, 1),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)',
    borderRadius:'var(--radius)', padding:'16px 17px',
    display:'flex', flexDirection:'column',
  }
  const DIVIDER = { borderTop:'1px solid var(--line)', margin:'14px 0 10px' }
  const SECTION_HEADER = { fontSize:12, color:'var(--faint)', fontWeight:600, letterSpacing:'0.03em', marginBottom:8 }

  /* ── District view ── */
  if (selectedDistrict && districts?.[selectedDistrict]) {
    const d    = districts[selectedDistrict]
    const rows = [...(d.top_problems || [])].sort((a, b) => b.count - a.count)
    const max  = Math.max(...rows.map(r => r.count), 1)

    return (
      <section style={CARD}>
        <div style={{ marginBottom:12 }}>
          <h2 style={{ margin:'0 0 2px', fontSize:15, fontWeight:600 }}>ปัญหาในเขต{selectedDistrict}</h2>
          <div style={{ color:'var(--faint)', fontSize:12 }}>
            สัดส่วนแต่ละประเภท · <span style={{ color:'var(--mint)' }}>% = อัตราแก้ไขแล้ว</span>
          </div>
        </div>

        {rows.map((r, i) => (
          <TypeRow
            key={r.type}
            label={r.type}
            count={r.count}
            resolveRate={r.resolve_rate}
            max={max}
            color={CAT_COLORS[r.type] || '#8DA0B4'}
            delay={i * 60}
          />
        ))}

        <div style={DIVIDER}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={SECTION_HEADER}>Top 10 เขต · คลิกเพื่อเปรียบเทียบ</div>
          <div style={{ display:'flex', gap:12, fontSize:10, color:'var(--faint)' }}>
            <span>เรื่อง</span><span>แก้ไข%</span>
          </div>
        </div>
        {distRank.map((r, i) => (
          <DistrictRow
            key={r.name} {...r} rank={i + 1}
            onClick={() => onSelectDistrict?.(r.name === selectedDistrict ? null : r.name)}
            isSelected={r.name === selectedDistrict}
          />
        ))}
      </section>
    )
  }

  /* ── City-wide view ── */
  return (
    <section style={CARD}>
      <div style={{ marginBottom:12 }}>
        <h2 style={{ margin:'0 0 2px', fontSize:15, fontWeight:600 }}>ปัญหาตามประเภท</h2>
        <div style={{ color:'var(--faint)', fontSize:12 }}>
          ทั่วกรุงเทพฯ · <span style={{ color:'var(--mint)' }}>% = อัตราแก้ไขแล้ว</span>
        </div>
      </div>

      {cityTypes.map((t, i) => (
        <TypeRow
          key={t.type}
          label={t.type}
          count={t.count}
          resolveRate={t.resolveRate}
          max={typeMax}
          color={CAT_COLORS[t.type] || '#8DA0B4'}
          delay={i * 60}
        />
      ))}

      <div style={{ ...DIVIDER, marginBottom: 8 }}/>
      <div style={{ fontSize:11, color:'var(--faint)', textAlign:'center', padding:'8px 0' }}>
        ↓ ดูจัดอันดับเขตทั้งหมดด้านล่าง
      </div>
    </section>
  )
}
