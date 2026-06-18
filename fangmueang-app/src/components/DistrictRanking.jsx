import { useState, useMemo } from 'react'
import { calcScore, getGrade, getGradeColor } from '../utils/score'

const SORT_OPTIONS = [
  { key:'score',   label:'คะแนน' },
  { key:'total',   label:'เรื่องร้องเรียน' },
  { key:'resolve', label:'% แก้ไข' },
  { key:'days',    label:'วันเฉลี่ย' },
]

const FILTER_OPTIONS = [
  { key:'all',      label:'ทั้งหมด' },
  { key:'top10',    label:'Top 10' },
  { key:'bottom10', label:'Bottom 10' },
]

const GRADE_PILL = (grade) => {
  const color = getGradeColor(grade)
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:24, height:24, borderRadius:'50%', fontSize:11, fontWeight:800,
      background:`${color}20`, border:`1px solid ${color}55`, color,
      flexShrink:0, fontFamily:'IBM Plex Mono, monospace',
    }}>{grade}</span>
  )
}

export default function DistrictRanking({ districts, cityAvg, onSelectDistrict }) {
  const [sortBy,   setSortBy]   = useState('score')
  const [filterBy, setFilterBy] = useState('all')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(false)

  const rows = useMemo(() => {
    return Object.entries(districts).map(([name, d]) => {
      const score       = calcScore(d, cityAvg)
      const grade       = getGrade(score)
      const resolveRate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
      return { name, score, grade, resolveRate, total: d.total || 0, days: d.avg_days || 0 }
    })
  }, [districts, cityAvg])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortBy === 'score')   return b.score - a.score
      if (sortBy === 'total')   return b.total - a.total
      if (sortBy === 'resolve') return b.resolveRate - a.resolveRate
      if (sortBy === 'days')    return a.days - b.days
      return 0
    })
  }, [rows, sortBy])

  const filtered = useMemo(() => {
    let res = sorted
    if (filterBy === 'top10')    res = sorted.slice(0, 10)
    if (filterBy === 'bottom10') res = [...sorted].reverse().slice(0, 10).reverse()
    if (search.trim()) {
      const q = search.trim()
      res = res.filter(r => r.name.includes(q))
    }
    return res
  }, [sorted, filterBy, search])

  const displayed = expanded ? filtered : filtered.slice(0, 10)
  const maxTotal  = Math.max(...rows.map(r => r.total), 1)

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)',
    borderRadius:'var(--radius)', padding:'18px 20px',
  }
  const CHIP_BTN = (active) => ({
    background: active ? 'var(--panel)' : 'transparent',
    color:      active ? 'var(--mint)'  : 'var(--faint)',
    border:'none', borderRadius:7, padding:'4px 11px', fontSize:11,
    fontFamily:'inherit', fontWeight: active ? 600 : 400,
    cursor:'pointer', transition:'all 0.15s',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
  })

  return (
    <section style={CARD}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        <div>
          <h2 style={{ margin:0, fontSize:15, fontWeight:600 }}>🏆 อันดับ Urban Health Score</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--faint)' }}>
            คะแนนรวม = แก้ไข 60% + ความเร็ว 40% · คลิกเขตเพื่อดูรายละเอียด
          </p>
        </div>

        {/* Search */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาเขต..."
            style={{
              background:'var(--panel2)', border:'1px solid var(--line)',
              borderRadius:9, padding:'6px 12px 6px 30px',
              color:'var(--ink)', fontSize:12, fontFamily:'inherit',
              outline:'none', width:160,
            }}
            onFocus={e => e.target.style.borderColor='var(--mint-d)'}
            onBlur={e  => e.target.style.borderColor='var(--line)'}
          />
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--faint)', fontSize:12 }}>🔍</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        {/* Sort */}
        <div style={{ display:'flex', background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:3, gap:2 }}>
          {SORT_OPTIONS.map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key)} style={CHIP_BTN(sortBy === s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display:'flex', background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:3, gap:2 }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} onClick={() => setFilterBy(f.key)} style={CHIP_BTN(filterBy === f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--faint)' }}>
          {filtered.length} เขต
        </span>
      </div>

      {/* Grade legend */}
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        {[['A','≥75','เยี่ยม'],['B','≥60','ดี'],['C','≥45','ปานกลาง'],['D','≥30','ต้องปรับปรุง'],['F','<30','วิกฤต']].map(([g,r,l]) => (
          <div key={g} style={{ display:'flex', alignItems:'center', gap:5 }}>
            {GRADE_PILL(g)}
            <div style={{ fontSize:10, color:'var(--faint)' }}>
              <div>{l}</div>
              <div style={{ fontFamily:'IBM Plex Mono, monospace' }}>{r}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--line)' }}>
              {['#','เขต','เกรด','คะแนน','เรื่องร้องเรียน','% แก้ไข','วันเฉลี่ย'].map((h,i) => (
                <th key={h} style={{
                  padding:'7px 8px', textAlign: i===0?'center':'left',
                  color:'var(--faint)', fontWeight:600, fontSize:11,
                  whiteSpace:'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r, idx) => {
              const realIdx = filterBy === 'bottom10' ? sorted.length - displayed.length + idx : idx
              const rrC = r.resolveRate >= 70 ? '#5BD1B8' : r.resolveRate >= 50 ? '#E9C46A' : '#E63946'
              const barW = Math.max(3, (r.total / maxTotal) * 100)
              return (
                <tr key={r.name}
                  onClick={() => onSelectDistrict(r.name)}
                  style={{ borderBottom:'1px solid rgba(42,56,72,0.5)', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'9px 8px', textAlign:'center', color:'var(--faint)', fontSize:11, fontFamily:'IBM Plex Mono, monospace' }}>
                    {(realIdx + 1).toString().padStart(2,'0')}
                  </td>
                  <td style={{ padding:'9px 8px', color:'var(--ink)', fontWeight:500 }}>
                    เขต{r.name}
                  </td>
                  <td style={{ padding:'9px 8px' }}>
                    {GRADE_PILL(r.grade)}
                  </td>
                  <td style={{ padding:'9px 8px', fontFamily:'IBM Plex Mono, monospace', fontWeight:700, color: getGradeColor(r.grade) }}>
                    {r.score}
                  </td>
                  <td style={{ padding:'9px 8px', minWidth:120 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ flex:1, height:5, background:'var(--panel2)', borderRadius:99, overflow:'hidden', minWidth:60 }}>
                        <div style={{ height:'100%', background:'#4F9FE0', borderRadius:99, width:`${barW}%`, transition:'width 0.5s' }}/>
                      </div>
                      <span style={{ fontFamily:'IBM Plex Mono, monospace', color:'var(--muted)', fontSize:11, whiteSpace:'nowrap' }}>
                        {r.total.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding:'9px 8px', fontFamily:'IBM Plex Mono, monospace', fontWeight:600, color:rrC }}>
                    {r.resolveRate}%
                  </td>
                  <td style={{ padding:'9px 8px', fontFamily:'IBM Plex Mono, monospace', color:'var(--muted)' }}>
                    {Math.round(r.days)} วัน
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {filtered.length > 10 && (
        <button onClick={() => setExpanded(!expanded)} style={{
          width:'100%', marginTop:12, padding:'9px 0',
          background:'var(--panel2)', border:'1px solid var(--line)',
          borderRadius:9, color:'var(--muted)', fontSize:12, fontFamily:'inherit',
          cursor:'pointer', transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--muted)' }}>
          {expanded ? `▲ แสดงน้อยลง` : `▼ แสดงทั้งหมด ${filtered.length} เขต`}
        </button>
      )}
    </section>
  )
}
