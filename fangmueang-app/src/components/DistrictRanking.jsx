import { useState } from 'react'
import { calcScore, getGrade } from '../utils/score'

const SORT_OPTIONS = [
  { key: 'score',    label: 'คะแนน' },
  { key: 'total',    label: 'จำนวนเรื่อง' },
  { key: 'resolve',  label: 'อัตราแก้ไข' },
  { key: 'days',     label: 'วันเฉลี่ย' },
]

export default function DistrictRanking({ districts, cityAvg, onSelectDistrict }) {
  const [sort,   setSort]   = useState('score')
  const [asc,    setAsc]    = useState(false)
  const [show,   setShow]   = useState('all')   // 'all' | 'top' | 'bot'
  const [search, setSearch] = useState('')

  if (!districts || Object.keys(districts).length === 0) return null

  /* Build ranked list */
  const rows = Object.entries(districts).map(([name, d]) => {
    const score    = calcScore(d, cityAvg)
    const grade    = getGrade(score)
    const resolve  = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
    return { name, score, grade, total: d.total || 0, resolve, days: Math.round(d.avg_days || 0) }
  })

  const sorted = [...rows].sort((a, b) => {
    const va = a[sort] ?? -1
    const vb = b[sort] ?? -1
    return asc ? va - vb : vb - va
  })

  const filtered  = search
    ? sorted.filter(r => r.name.includes(search.trim()))
    : sorted
  const displayed = search ? filtered
                  : show === 'top' ? sorted.slice(0, 10)
                  : show === 'bot' ? sorted.slice(-10).reverse()
                  : sorted

  const cityAvgScore = Math.round(rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.filter(r => r.score !== null).length)
  const cityGrade    = getGrade(cityAvgScore)

  return (
    <section style={{
      background: 'var(--panel)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius)', padding: '18px 20px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
              จัดอันดับสุขภาพเมืองรายเขต
            </h2>
            {/* City average badge */}
            <div style={{
              background: cityGrade.bg, border: `1px solid ${cityGrade.color}40`,
              borderRadius: 8, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: cityGrade.color, fontFamily: 'IBM Plex Mono,monospace' }}>
                {cityGrade.grade}
              </span>
              <span style={{ fontSize: 10, color: 'var(--faint)' }}>ค่าเฉลี่ยเมือง</span>
            </div>
          </div>
          <div style={{ color: 'var(--faint)', fontSize: 12, marginTop: 3 }}>
            คะแนนจาก % แก้ไข + ความเร็ว · Traffy Fondue data
          </div>
        </div>

        {/* Search box */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="ค้นหาเขต..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'var(--panel2)', border: '1px solid var(--line)',
                borderRadius: 8, padding: '5px 10px 5px 28px',
                color: 'var(--ink)', fontSize: 12, fontFamily: 'inherit',
                outline: 'none', width: 130,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--mint-d)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
            <span style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              fontSize: 12, color: 'var(--faint)', pointerEvents: 'none',
            }}>🔍</span>
          </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { k: 'all', label: `ทั้งหมด (${rows.length})` },
            { k: 'top', label: '🏆 Top 10' },
            { k: 'bot', label: '⚠️ Bottom 10' },
          ].map(o => (
            <button key={o.k} onClick={() => setShow(o.k)} style={{
              background: show === o.k ? 'var(--mint-d)' : 'none',
              color: show === o.k ? '#fff' : 'var(--faint)',
              border: `1px solid ${show === o.k ? 'var(--mint-d)' : 'var(--line)'}`,
              borderRadius: 999, padding: '4px 12px', fontSize: 11,
              fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {o.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Sort bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--faint)', marginRight: 4 }}>เรียงตาม:</span>
        {SORT_OPTIONS.map(o => (
          <button key={o.key} onClick={() => {
            if (sort === o.key) setAsc(!asc)
            else { setSort(o.key); setAsc(false) }
          }} style={{
            background: sort === o.key ? 'var(--panel2)' : 'none',
            color: sort === o.key ? 'var(--ink)' : 'var(--faint)',
            border: `1px solid ${sort === o.key ? 'var(--mint-d)' : 'var(--line)'}`,
            borderRadius: 8, padding: '3px 10px', fontSize: 11,
            fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {o.label}
            {sort === o.key && <span style={{ fontSize: 9 }}>{asc ? '▲' : '▼'}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              {['#', 'เขต', 'คะแนน', 'เรื่อง', 'แก้ไข', 'เฉลี่ย'].map(h => (
                <th key={h} style={{
                  textAlign: h === '#' || h === 'คะแนน' || h === 'เรื่อง' || h === 'แก้ไข' || h === 'เฉลี่ย' ? 'right' : 'left',
                  padding: '6px 8px', color: 'var(--faint)', fontWeight: 500, fontSize: 11,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r, i) => {
              const rank = sort === 'score' && !asc ? i + 1
                         : sorted.findIndex(x => x.name === r.name) + 1
              const rrColor = r.resolve >= 70 ? '#5BD1B8' : r.resolve >= 50 ? '#E9C46A' : '#E63946'

              return (
                <tr
                  key={r.name}
                  onClick={() => onSelectDistrict(r.name)}
                  style={{
                    borderBottom: '1px solid rgba(42,56,72,0.5)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Rank */}
                  <td style={{ padding: '8px 8px', color: 'var(--faint)', textAlign: 'right', width: 28, fontSize: 11 }}>
                    {rank <= 3 && sort === 'score' && !asc
                      ? ['🥇','🥈','🥉'][rank - 1]
                      : rank}
                  </td>

                  {/* Name */}
                  <td style={{ padding: '8px 8px', color: 'var(--ink)', fontWeight: 500 }}>
                    เขต{r.name}
                  </td>

                  {/* Score + Grade badge */}
                  <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <span style={{
                        background: r.grade.bg,
                        border: `1px solid ${r.grade.color}50`,
                        color: r.grade.color,
                        borderRadius: 6, padding: '1px 7px',
                        fontSize: 11, fontWeight: 800,
                        fontFamily: 'IBM Plex Mono,monospace',
                      }}>
                        {r.grade.grade}
                      </span>
                      <span style={{ color: 'var(--muted)', fontFamily: 'IBM Plex Mono,monospace', fontSize: 12 }}>
                        {r.score ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Total */}
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'IBM Plex Mono,monospace', color: 'var(--muted)' }}>
                    {r.total.toLocaleString()}
                  </td>

                  {/* Resolve rate + bar */}
                  <td style={{ padding: '8px 8px', textAlign: 'right', minWidth: 80 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <div style={{
                        width: 48, height: 4, background: 'var(--line)',
                        borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                      }}>
                        <div style={{
                          width: `${r.resolve}%`, height: '100%',
                          background: rrColor, borderRadius: 4,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ color: rrColor, fontFamily: 'IBM Plex Mono,monospace', fontSize: 12 }}>
                        {r.resolve}%
                      </span>
                    </div>
                  </td>

                  {/* Avg days */}
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'IBM Plex Mono,monospace', color: 'var(--muted)', fontSize: 12 }}>
                    {r.days} วัน
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Grade legend */}
      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)',
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: 'var(--faint)' }}>เกณฑ์คะแนน:</span>
        {[
          { g: 'A', c: '#5BD1B8', l: '75+ ดีเยี่ยม' },
          { g: 'B', c: '#89CFF0', l: '60–74 ดี' },
          { g: 'C', c: '#E9C46A', l: '45–59 พอใช้' },
          { g: 'D', c: '#F4A261', l: '30–44 ต้องปรับ' },
          { g: 'F', c: '#E63946', l: '<30 วิกฤต' },
        ].map(x => (
          <div key={x.g} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              background: `${x.c}20`, border: `1px solid ${x.c}50`,
              color: x.c, borderRadius: 4, padding: '0 5px',
              fontSize: 10, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace',
            }}>{x.g}</span>
            <span style={{ fontSize: 10, color: 'var(--faint)' }}>{x.l}</span>
          </div>
        ))}
      </div>

    </section>
  )
}
