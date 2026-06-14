const CAT_COLORS = {
  'ถนน/ทางเท้า':'#E58A53',
  'น้ำท่วม':     '#4F9FE0',
  'ขยะ':         '#6FC18A',
  'ไฟส่องสว่าง':'#E9C46A',
  'ความปลอดภัย':'#D14B3C',
  'อื่นๆ':       '#8DA0B4',
}

function BarRow({ label, n, max, color }) {
  const w = max > 0 ? Math.max(3, (n / max) * 100) : 0
  return (
    <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 60px', alignItems:'center', gap:10, margin:'9px 0' }}>
      <div style={{ fontSize:13, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
      <div style={{ height:13, background:'var(--panel2)', borderRadius:7, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:7, background:color, width:`${w}%`, transition:'width 0.5s ease' }}/>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', textAlign:'right', fontFamily:'IBM Plex Mono,monospace' }}>
        {n.toLocaleString()}
      </div>
    </div>
  )
}

export default function ProblemChart({ data, selectedDistrict, districts }) {
  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--radius)', padding:'16px 17px',
  }

  let rows = []
  let title = 'Top ปัญหาทั่วกรุงเทพฯ'
  let sub = 'แยกตามประเภท'

  if (selectedDistrict && districts?.[selectedDistrict]) {
    title = `ปัญหาในเขต${selectedDistrict}`
    sub = 'สัดส่วนแต่ละประเภท'
    rows = (districts[selectedDistrict].top_problems || [])
      .map(p => ({ label: p.type, n: p.count, color: CAT_COLORS[p.type] || '#8DA0B4' }))
      .sort((a, b) => b.n - a.n)
  } else {
    title = 'Top ปัญหาทั่วกรุงเทพฯ'
    const agg = {}
    Object.values(data?.districts || {}).forEach(d =>
      (d.top_problems || []).forEach(p => { agg[p.type] = (agg[p.type] || 0) + p.count })
    )
    rows = Object.entries(agg)
      .map(([type, n]) => ({ label: type, n, color: CAT_COLORS[type] || '#8DA0B4' }))
      .sort((a, b) => b.n - a.n)
  }

  const max = Math.max(...rows.map(r => r.n), 1)

  // top 5 districts by total for ranking
  const distRank = Object.entries(data?.districts || {})
    .map(([name, d]) => ({ name, n: d.total || 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
  const distMax = Math.max(...distRank.map(r => r.n), 1)

  return (
    <section style={CARD}>
      <h2 style={{ margin:'0 0 2px', fontSize:15, fontWeight:600 }}>{title}</h2>
      <div style={{ color:'var(--faint)', fontSize:12, marginBottom:14 }}>{sub}</div>
      <div>
        {rows.map(r => <BarRow key={r.label} {...r} max={max}/>)}
      </div>

      {!selectedDistrict && (
        <>
          <div style={{ borderTop:'1px solid var(--line)', margin:'16px 0 12px' }}/>
          <h2 style={{ margin:'0 0 2px', fontSize:15, fontWeight:600 }}>Top 5 เขตร้องเรียนมากสุด</h2>
          <div style={{ color:'var(--faint)', fontSize:12, marginBottom:10 }}>ทุกประเภทปัญหา</div>
          {distRank.map(r => (
            <BarRow key={r.name} label={r.name} n={r.n} max={distMax} color="var(--mint)"/>
          ))}
        </>
      )}
    </section>
  )
}
