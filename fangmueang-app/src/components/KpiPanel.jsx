import { useEffect, useState } from 'react'

function useCountUp(target, duration = 1200) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const raf = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setV(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target])
  return v
}

function KCard({ k, v, unit }) {
  const num = useCountUp(typeof v === 'number' ? v : 0)
  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--radius)', padding:'15px 16px', transition:'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor='var(--mint-d)'}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--line)'}>
      <div style={{ fontSize:12, color:'var(--faint)', marginBottom:7 }}>{k}</div>
      <div style={{ fontSize:26, fontWeight:600, fontFamily:'IBM Plex Mono, monospace' }}>
        {typeof v === 'number' ? num.toLocaleString() : v}
        {unit && <small style={{ fontSize:14, color:'var(--muted)', fontFamily:'IBM Plex Sans Thai,sans-serif', fontWeight:400 }}> {unit}</small>}
      </div>
    </div>
  )
}

export default function KpiPanel({ data, timeFactor = 1, selectedType }) {
  if (!data) return null
  const districts = data.districts || {}
  const total = Math.round((data.city_avg?.total || data.metadata?.total || 0) * timeFactor)
  const resolved = Math.round(Object.values(districts).reduce((s, d) => s + (d.resolved || 0), 0) * timeFactor)
  const rate = Math.round((data.city_avg?.resolve_rate || 0) * 100)
  const days = Math.round(data.city_avg?.avg_days || 0)

  // top problem type
  const agg = {}
  Object.values(districts).forEach(d => (d.top_problems || []).forEach(p => { agg[p.type] = (agg[p.type] || 0) + p.count }))
  const topType = Object.entries(agg).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const cards = [
    { k:'เรื่องร้องเรียน', v:total, unit:'ครั้ง' },
    { k:'แก้ไขแล้ว', v:rate, unit:'%' },
    { k:'เวลาเฉลี่ยในการแก้', v:days, unit:'วัน' },
    { k:'ปัญหาที่พบมากสุด', v:selectedType === 'ทั้งหมด' ? topType : selectedType, unit:null },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
      {cards.map(c => <KCard key={c.k} {...c} />)}
    </div>
  )
}
