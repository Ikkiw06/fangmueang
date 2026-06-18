import { useState } from 'react'

const CATS = [
  { id:'ทั้งหมด',     color:null },
  { id:'ถนน/ทางเท้า', color:'#E58A53' },
  { id:'น้ำท่วม',     color:'#4F9FE0' },
  { id:'ขยะ',         color:'#6FC18A' },
  { id:'ไฟส่องสว่าง', color:'#E9C46A' },
  { id:'ความปลอดภัย', color:'#D14B3C' },
  { id:'อื่นๆ',       color:'#8DA0B4' },
]

const TIMES = [
  { label:'ทั้งหมด', value:1 },
  { label:'12 เดือน', value:0.62 },
  { label:'6 เดือน', value:0.34 },
  { label:'3 เดือน', value:0.18 },
]

export default function FilterBar({ selected, onSelect, timeFactor, onTimeChange }) {
  const [hov,  setHov]  = useState(null)
  const [hovT, setHovT] = useState(null)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:18 }}>

      {/* Category chips */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--faint)', letterSpacing:'0.02em', whiteSpace:'nowrap' }}>ประเภท</span>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {CATS.map(c => {
            const active = selected === c.id
            const hover  = hov === c.id
            return (
              <button key={c.id}
                onClick={() => onSelect(c.id)}
                onMouseEnter={() => setHov(c.id)}
                onMouseLeave={() => setHov(null)}
                style={{
                  cursor:'pointer',
                  border: active ? '1px solid var(--mint)' : `1px solid ${hover ? 'var(--mint-d)' : 'var(--line)'}`,
                  background: active ? 'var(--mint)' : hover ? 'var(--panel2)' : 'var(--panel)',
                  color: active ? '#06231d' : hover ? 'var(--ink)' : 'var(--muted)',
                  padding:'5px 13px', borderRadius:999, fontSize:13,
                  fontFamily:'inherit', fontWeight: active ? 600 : 400,
                  display:'flex', alignItems:'center', gap:7,
                  transition:'all 0.15s',
                }}>
                {c.color && (
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, display:'inline-block', flexShrink:0 }}/>
                )}
                {c.id}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time period chips */}
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--faint)', letterSpacing:'0.02em', whiteSpace:'nowrap' }}>ช่วงเวลา</span>
        <div style={{
          display:'flex', gap:3,
          background:'var(--panel2)', border:'1px solid var(--line)',
          borderRadius:10, padding:'3px',
        }}>
          {TIMES.map(t => {
            const active = timeFactor === t.value
            const hover  = hovT === t.value
            return (
              <button key={t.value}
                onClick={() => onTimeChange(t.value)}
                onMouseEnter={() => setHovT(t.value)}
                onMouseLeave={() => setHovT(null)}
                style={{
                  cursor:'pointer',
                  border: 'none',
                  background: active ? 'var(--panel)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: active ? 'var(--mint)' : hover ? 'var(--ink)' : 'var(--faint)',
                  padding:'4px 13px', borderRadius:7, fontSize:12,
                  fontFamily:'inherit', fontWeight: active ? 600 : 400,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  transition:'all 0.15s',
                }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
