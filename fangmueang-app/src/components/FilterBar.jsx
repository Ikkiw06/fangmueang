import { useState } from 'react'

const CATS = [
  { id:'ทั้งหมด',    label:'ทั้งหมด',       color:null },
  { id:'ถนน/ทางเท้า', label:'ถนน/ทางเท้า', color:'#E58A53' },
  { id:'น้ำท่วม',    label:'น้ำท่วม',       color:'#4F9FE0' },
  { id:'ขยะ',       label:'ขยะ',           color:'#6FC18A' },
  { id:'ไฟส่องสว่าง',label:'ไฟส่องสว่าง',  color:'#E9C46A' },
  { id:'ความปลอดภัย',label:'ความปลอดภัย',  color:'#D14B3C' },
  { id:'อื่นๆ',     label:'อื่นๆ',          color:'#8DA0B4' },
]

export default function FilterBar({ selected, onSelect, timeFactor, onTimeChange }) {
  const [hov, setHov] = useState(null)
  const chip = (c) => {
    const active = selected === c.id
    const hover = hov === c.id
    return (
      <button key={c.id}
        onClick={() => onSelect(c.id)}
        onMouseEnter={() => setHov(c.id)}
        onMouseLeave={() => setHov(null)}
        style={{
          cursor:'pointer',
          border: active ? '1px solid var(--mint)' : `1px solid ${hover?'var(--mint-d)':'var(--line)'}`,
          background: active ? 'var(--mint)' : hover ? 'var(--panel2)' : 'var(--panel)',
          color: active ? '#06231d' : hover ? 'var(--ink)' : 'var(--muted)',
          padding:'6px 14px', borderRadius:999, fontSize:13,
          fontFamily:'inherit', fontWeight: active ? 600 : 400,
          display:'flex', alignItems:'center', gap:7,
          transition:'all 0.15s',
        }}>
        {c.color && <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, display:'inline-block', flexShrink:0 }}/>}
        {c.label}
      </button>
    )
  }

  return (
    <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center', marginBottom:18 }}>
      <span style={{ fontSize:12, color:'var(--faint)', letterSpacing:'0.02em' }}>ประเภทปัญหา</span>
      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
        {CATS.map(chip)}
      </div>
      <span style={{ fontSize:12, color:'var(--faint)', marginLeft:8 }}>ช่วงเวลา</span>
      <select value={timeFactor} onChange={e => onTimeChange(parseFloat(e.target.value))} style={{
        fontFamily:'inherit', background:'var(--panel)', color:'var(--ink)',
        border:'1px solid var(--line)', borderRadius:9, padding:'6px 11px', fontSize:13,
      }}>
        <option value={1}>ทั้งหมด</option>
        <option value={0.62}>12 เดือนล่าสุด</option>
        <option value={0.34}>6 เดือนล่าสุด</option>
        <option value={0.18}>3 เดือนล่าสุด</option>
      </select>
    </div>
  )
}
