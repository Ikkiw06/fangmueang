import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CAT_COLORS = {
  'ถนน/ทางเท้า':'#E58A53','น้ำท่วม':'#4F9FE0','ขยะ':'#6FC18A',
  'ไฟส่องสว่าง':'#E9C46A','ความปลอดภัย':'#D14B3C','อื่นๆ':'#8DA0B4',
}

/* ── Tooltip: trend chart ──────────────────────────── */
const TrendTT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const count    = payload.find(p => p.dataKey === 'count')?.value    || 0
  const resolved = payload.find(p => p.dataKey === 'resolved')?.value || 0
  const pct = count > 0 ? Math.round(resolved / count * 100) : 0
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--line)',
      borderRadius:10, padding:'10px 14px', minWidth:140,
      boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize:11, color:'var(--faint)', marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
          <span style={{ fontSize:11, color:'#5BD1B8' }}>● ร้องเรียน</span>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)', fontFamily:'IBM Plex Mono,monospace' }}>{count.toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
          <span style={{ fontSize:11, color:'#F9CA24' }}>● แก้ไขแล้ว</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#F9CA24', fontFamily:'IBM Plex Mono,monospace' }}>{resolved.toLocaleString()}</span>
        </div>
        <div style={{ borderTop:'1px solid var(--line)', marginTop:4, paddingTop:4, fontSize:11, color:'var(--faint)' }}>
          แก้ไข <span style={{ color: pct>=70?'#5BD1B8':pct>=50?'#F9CA24':'#EB4D4B', fontWeight:700 }}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}

/* ── Tooltip: resolve bar chart ───────────────────── */
const ResolveTT = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--line)',
      borderRadius:10, padding:'10px 14px',
      boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize:12, color:'var(--ink)', fontWeight:600, marginBottom:4 }}>{d.type}</div>
      <div style={{ fontSize:12, color: d.rr>=70?'#5BD1B8':d.rr>=50?'#E9C46A':'#EB4D4B', fontWeight:700 }}>
        แก้ไขแล้ว {d.rr}%
      </div>
      <div style={{ fontSize:11, color:'var(--faint)', marginTop:2 }}>
        {d.count.toLocaleString()} เรื่อง
      </div>
    </div>
  )
}

/* ── Tooltip: donut ───────────────────────────────── */
const DonutTT = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--line)',
      borderRadius:10, padding:'10px 14px',
      boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
        <span style={{ width:10, height:10, borderRadius:3, background:d.payload.fill, display:'inline-block' }}/>
        <span style={{ fontSize:12, color:'var(--ink)', fontWeight:600 }}>{d.name}</span>
      </div>
      <div style={{ fontSize:13, color:'var(--ink)', fontWeight:700, fontFamily:'IBM Plex Mono,monospace' }}>
        {d.value.toLocaleString()} เรื่อง
      </div>
      <div style={{ fontSize:11, color:'var(--faint)' }}>{d.payload.pct}% ของทั้งหมด</div>
    </div>
  )
}

/* ── KPI card ─────────────────────────────────────── */
function KpiBox({ label, value, unit, sub, subColor }) {
  return (
    <div style={{
      background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:11, padding:'13px 15px',
    }}>
      <div style={{ fontSize:12, color:'var(--faint)' }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, marginTop:4, fontFamily:'IBM Plex Mono,monospace', color:'var(--ink)' }}>
        {value}<small style={{ fontSize:14, color:'var(--muted)', fontWeight:400 }}> {unit}</small>
      </div>
      {sub && <div style={{ fontSize:12, marginTop:6, color:subColor, fontWeight:600 }}>{sub}</div>}
    </div>
  )
}

/* ── Custom donut label ───────────────────────────── */
const DonutLabel = ({ cx, cy, name, total }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
    <tspan x={cx} dy="-8" style={{ fontSize:11, fill:'#64778C' }}>เรื่องร้องเรียน</tspan>
    <tspan x={cx} dy="22" style={{ fontSize:18, fontWeight:700, fill:'#E7EEF5', fontFamily:'IBM Plex Mono,monospace' }}>
      {total.toLocaleString()}
    </tspan>
  </text>
)

/* ══════════════════════════════════════════════════ */
export default function DistrictDetail({ district, name, cityAvg, onClose }) {
  const total       = district.total || 0
  const resolved    = district.resolved || 0
  const resolveRate = Math.round((resolved / Math.max(total, 1)) * 100)
  const cityRate    = Math.round((cityAvg?.resolve_rate || 0) * 100)
  const cityDays    = Math.round(cityAvg?.avg_days || 0)
  const distDays    = Math.round(district.avg_days || 0)
  const betterRate  = resolveRate >= cityRate
  const betterDays  = distDays <= cityDays

  const topProblems  = (district.top_problems || []).slice(0, 6)
  const trend        = (district.monthly || []).slice(-12)  // all 12 months

  /* donut data */
  const donutData = topProblems.map(p => ({
    name: p.type,
    value: p.count,
    fill: CAT_COLORS[p.type] || '#8DA0B4',
    pct: total > 0 ? Math.round(p.count / total * 100) : 0,
  }))

  /* resolve bar data */
  const resolveBarData = topProblems.map(p => ({
    type: p.type,
    rr: Math.round(p.resolve_rate * 100),
    count: p.count,
    fill: CAT_COLORS[p.type] || '#8DA0B4',
  }))

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)',
    borderRadius:'var(--radius)', padding:'18px 20px', animation:'fade 0.3s ease',
  }

  return (
    <section style={CARD}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>เขต{name}</h2>
          <div style={{ color:'var(--faint)', fontSize:12, marginTop:3 }}>
            สรุปปัญหา · เทียบค่าเฉลี่ยเมือง · ข้อมูลจาก Traffy Fondue
          </div>
        </div>
        <button onClick={onClose} style={{
          background:'none', border:'1px solid var(--line)', color:'var(--muted)',
          borderRadius:8, padding:'4px 12px', fontFamily:'inherit', fontSize:12, cursor:'pointer',
          transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--muted)' }}>
          ปิด ✕
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="detail-kpi">
        <KpiBox
          label="อัตราแก้ไขรวม"
          value={`${resolveRate}%`} unit=""
          sub={`${betterRate?'▲ ดีกว่า':'▼ ต่ำกว่า'}ค่าเฉลี่ย ${Math.abs(resolveRate-cityRate)}% (เมือง ${cityRate}%)`}
          subColor={betterRate ? '#5BD1B8' : '#F08C7A'}
        />
        <KpiBox
          label="เวลาเฉลี่ยในการแก้"
          value={distDays || '—'} unit="วัน"
          sub={`${betterDays?'▲ เร็วกว่า':'▼ ช้ากว่า'}ค่าเฉลี่ย ${Math.abs(distDays - cityDays)} วัน (เมือง ${cityDays} วัน)`}
          subColor={betterDays ? '#5BD1B8' : '#F08C7A'}
        />
      </div>

      {/* ── Charts row: Donut + Resolve bar ── */}
      <div className="chart-grid">

        {/* Donut chart */}
        <div style={{ background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>สัดส่วนประเภทปัญหา</div>
          <div style={{ fontSize:11, color:'var(--faint)', marginBottom:12 }}>% ของเรื่องร้องเรียนทั้งหมด</div>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={100}
                  animationDuration={800}
                >
                  {donutData.map((d, i) => (
                    <Cell key={i} fill={d.fill} opacity={0.9}/>
                  ))}
                </Pie>
                <Tooltip content={<DonutTT/>}/>
                {/* Center label */}
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize:11, fill:'#64778C' }}>เรื่องทั้งหมด</text>
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize:18, fontWeight:700, fill:'#E7EEF5', fontFamily:'IBM Plex Mono,monospace' }}>
                  {total.toLocaleString()}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
            {donutData.map(d => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:9, height:9, borderRadius:3, background:d.fill, display:'inline-block', flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'var(--ink)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize:12, fontFamily:'IBM Plex Mono,monospace', color:'var(--faint)' }}>
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolve rate bar chart */}
        <div style={{ background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>อัตราแก้ไขแต่ละประเภท</div>
          <div style={{ fontSize:11, color:'var(--faint)', marginBottom:12 }}>
            เส้นแดงปะ = ค่าเฉลี่ยเมือง ({cityRate}%)
          </div>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resolveBarData}
                layout="vertical"
                margin={{ top:0, right:32, bottom:0, left:0 }}
              >
                <XAxis
                  type="number" domain={[0, 100]} hide
                />
                <YAxis
                  type="category" dataKey="type" width={76}
                  tick={{ fill:'#8DA0B4', fontSize:11, fontFamily:'IBM Plex Sans Thai,sans-serif' }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<ResolveTT/>} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
                <ReferenceLine
                  x={cityRate} stroke="#EB4D4B" strokeDasharray="4 3" strokeOpacity={0.7}
                />
                <Bar dataKey="rr" radius={[0, 6, 6, 0]} barSize={14} isAnimationActive={true} animationDuration={800}>
                  {resolveBarData.map((d, i) => (
                    <Cell key={i} fill={d.fill} opacity={0.85}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* stat summary */}
          <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--faint)' }}>ประเภทที่แก้ไขดีที่สุด</span>
            {(() => {
              const best = resolveBarData.reduce((a,b)=>a.rr>b.rr?a:b, resolveBarData[0]||{})
              return (
                <span style={{ fontSize:12, fontWeight:700, color:'#5BD1B8' }}>
                  {best?.type} ({best?.rr}%)
                </span>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ── Trend chart (12 months) ── */}
      {trend.length > 0 && (
        <div style={{ background:'var(--panel2)', borderRadius:12, padding:'14px 16px', border:'1px solid var(--line)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>แนวโน้มรายเดือน</div>
              <div style={{ fontSize:11, color:'var(--faint)' }}>{trend.length} เดือนล่าสุด · ร้องเรียน vs แก้ไขแล้ว</div>
            </div>
            <div style={{ display:'flex', gap:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:20, height:2, background:'#5BD1B8', display:'inline-block', borderRadius:2 }}/>
                <span style={{ fontSize:11, color:'var(--faint)' }}>ร้องเรียน</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:20, height:2, background:'#F9CA24', display:'inline-block', borderRadius:2 }}/>
                <span style={{ fontSize:11, color:'var(--faint)' }}>แก้ไขแล้ว</span>
              </div>
            </div>
          </div>

          <div style={{ height:150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top:8, right:4, bottom:0, left:4 }}>
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
                <XAxis
                  dataKey="month"
                  tick={{ fill:'#64778C', fontSize:10, fontFamily:'IBM Plex Sans Thai,sans-serif' }}
                  tickLine={false}
                  axisLine={{ stroke:'rgba(255,255,255,0.06)' }}
                />
                <YAxis hide domain={['auto','auto']}/>
                <Tooltip content={<TrendTT/>} cursor={{ stroke:'rgba(255,255,255,0.08)', strokeWidth:1 }}/>
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

          {/* Month-over-month change */}
          {trend.length >= 2 && (() => {
            const first = trend[0], last = trend[trend.length - 1]
            const diff  = last.count - first.count
            const pct   = first.count > 0 ? Math.round(diff / first.count * 100) : 0
            const avgRr = Math.round(
              trend.reduce((s, m) => s + (m.count > 0 ? m.resolved / m.count : 0), 0) / trend.length * 100
            )
            return (
              <div style={{
                marginTop:10, paddingTop:10, borderTop:'1px solid var(--line)',
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
              }}>
                <span style={{ fontSize:11, color:'var(--faint)' }}>
                  เดือนแรก ({first.month}) → ล่าสุด ({last.month})
                </span>
                <div style={{ display:'flex', gap:16 }}>
                  <span style={{
                    fontSize:12, fontWeight:700, fontFamily:'IBM Plex Mono,monospace',
                    color: diff <= 0 ? '#5BD1B8' : '#EB4D4B',
                  }}>
                    {diff >= 0 ? '+' : ''}{pct}% {diff <= 0 ? '▼ ลดลง' : '▲ เพิ่มขึ้น'}
                  </span>
                  <span style={{ fontSize:12, color:'var(--faint)', fontFamily:'IBM Plex Mono,monospace' }}>
                    เฉลี่ยแก้ไข <span style={{ color: avgRr>=70?'#5BD1B8':avgRr>=50?'#E9C46A':'#EB4D4B', fontWeight:700 }}>{avgRr}%</span>/เดือน
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

    </section>
  )
}
