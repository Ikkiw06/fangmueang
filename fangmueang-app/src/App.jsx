import { useState, useRef } from 'react'
import FilterBar from './components/FilterBar'
import KpiPanel from './components/KpiPanel'
import DistrictMap from './components/DistrictMap'
import ProblemChart from './components/ProblemChart'
import DistrictDetail from './components/DistrictDetail'
import DistrictRanking from './components/DistrictRanking'
import ReportModal from './components/ReportModal'
import { useData } from './hooks/useData'

export default function App() {
  const { data, liveDots, loading, error, source } = useData()
  const [selectedType,     setSelectedType]     = useState('ทั้งหมด')
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [timeFactor,       setTimeFactor]       = useState(1)
  const [showReport,       setShowReport]       = useState(false)
  const detailRef = useRef(null)

  const handleSelectDistrict = (name) => {
    setSelectedDistrict(name)
    if (name) setTimeout(() => detailRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 80)
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ position:'relative', width:56, height:56, margin:'0 auto 16px' }}>
          <div style={{ position:'absolute', inset:0, border:'2px solid var(--line)', borderRadius:'50%' }}/>
          <div style={{ position:'absolute', inset:0, border:'2px solid transparent', borderTopColor:'var(--mint)', borderRadius:'50%', animation:'spin 0.9s linear infinite' }}/>
        </div>
        <p style={{ color:'var(--muted)', fontSize:13 }}>กำลังโหลดข้อมูล Traffy Fondue...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--faint)' }}>{error}</p>
    </div>
  )

  /* ── Data ── */
  const districts = data?.districts || {}
  const filteredDistricts = Object.entries(districts).reduce((acc, [name, d]) => {
    if (selectedType === 'ทั้งหมด') acc[name] = { ...d, total: Math.round((d.total || 0) * timeFactor) }
    else {
      const found = d.top_problems?.find(p => p.type === selectedType)
      acc[name] = { ...d, total: Math.round((found?.count || 0) * timeFactor) }
    }
    return acc
  }, {})

  /* ── Insights ── */
  const dList = Object.entries(districts)
  const worstResolve   = [...dList].sort((a,b) => (a[1].resolved/a[1].total) - (b[1].resolved/b[1].total))[0]
  const slowest        = [...dList].sort((a,b) => b[1].avg_days - a[1].avg_days)[0]
  const mostComplaints = [...dList].sort((a,b) => b[1].total - a[1].total)[0]
  const insights = [
    { icon:'🔴', label:'แก้ไขต่ำที่สุด',  value: worstResolve?.[0],   sub:`${Math.round((worstResolve?.[1].resolved/worstResolve?.[1].total)*100)}% resolution` },
    { icon:'⏱️', label:'ใช้เวลานานสุด',   value: slowest?.[0],        sub:`เฉลี่ย ${Math.round(slowest?.[1].avg_days || 0)} วัน/เรื่อง` },
    { icon:'📍', label:'ร้องเรียนมากสุด', value: mostComplaints?.[0], sub:`${(mostComplaints?.[1].total||0).toLocaleString()} เรื่อง` },
  ]

  /* ── Metadata ── */
  const isLive      = data?.metadata?.source?.includes('live')
  const lastUpdated = (() => {
    const d = data?.metadata?.last_updated
    if (!d) return null
    const [y, m] = d.split('-').map(Number)
    return `${['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][m]} ${y + 543}`
  })()

  const CHIP = { fontSize:11.5, color:'var(--faint)', border:'1px solid var(--line)', padding:'4px 10px', borderRadius:999 }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--ink)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'14px 12px 60px' }}>

        {/* ── Header ── */}
        <header className="app-header">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <h1 style={{ margin:0, fontSize:26, fontWeight:700, letterSpacing:'-0.02em' }}>ฟังเมือง</h1>
              <span style={{ ...CHIP, color:'var(--mint)', borderColor:'rgba(91,209,184,0.3)' }}>Beta</span>
            </div>
            <p style={{ margin:0, color:'var(--muted)', fontSize:13, lineHeight:1.6, maxWidth:'52ch' }}>
              Dashboard วิเคราะห์ปัญหาเมืองกรุงเทพฯ รายเขต — ข้อมูลจาก{' '}
              <a href="https://traffy.in.th" target="_blank" rel="noopener noreferrer"
                style={{ color:'var(--mint)', textDecoration:'none', fontWeight:600 }}>Traffy Fondue</a>
              {' '}· กดที่เขตเพื่อดูรายละเอียด
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {isLive ? (
              <span style={{ fontSize:11, color:'#5BD1B8', border:'1px solid rgba(91,209,184,0.4)',
                background:'rgba(91,209,184,0.08)', padding:'4px 10px', borderRadius:999,
                display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#5BD1B8',
                  animation:'pulse 2s ease-in-out infinite', display:'inline-block' }}/>
                LIVE
              </span>
            ) : (
              <span style={{ fontSize:11, color:'#E9C46A', border:'1px solid rgba(233,196,106,0.3)',
                background:'rgba(233,196,106,0.07)', padding:'4px 10px', borderRadius:999 }}>
                DEMO
              </span>
            )}
            {lastUpdated && <span style={{ ...CHIP, display: 'none' }} className="hide-mobile">📡 อัปเดต: {lastUpdated}</span>}
            <span style={CHIP}>{Object.keys(districts).length} เขต</span>
            <button onClick={() => setShowReport(true)} style={{
              background:'var(--mint)', color:'#06231d', border:'none',
              padding:'9px 18px', borderRadius:999, fontSize:13, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7,
              minHeight:40,
              boxShadow:'0 0 16px rgba(91,209,184,0.25)', transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none' }}>
              📢 แจ้งปัญหา
            </button>
          </div>
        </header>

        {/* ── Workflow banner ── */}
        <div className="workflow-banner">
          <span style={{ fontSize:11, color:'var(--faint)', whiteSpace:'nowrap', marginRight:12 }}>วงจรข้อมูล</span>
          {[
            { icon:'👤', text:'ประชาชนแจ้ง' },
            { icon:'📡', text:'Traffy Fondue' },
            { icon:'🏛️', text:'กทม. รับเรื่อง' },
            { icon:'🔧', text:'ทีมลงพื้นที่' },
            { icon:'✅', text:'อัปเดต status' },
            { icon:'📊', text:'Fang Mueang แสดงผล' },
          ].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'2px 10px', whiteSpace:'nowrap' }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <span style={{ fontSize:11, color: i===5 ? 'var(--mint)' : 'var(--muted)', fontWeight: i===5?600:400 }}>{s.text}</span>
              </div>
              {i < 5 && <span style={{ color:'var(--line)', fontSize:12 }}>›</span>}
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <FilterBar selected={selectedType} onSelect={setSelectedType} timeFactor={timeFactor} onTimeChange={setTimeFactor} />

        {/* ── KPIs ── */}
        <div style={{ marginBottom:16 }}>
          <KpiPanel data={data} timeFactor={timeFactor} selectedType={selectedType} />
        </div>

        {/* ── Insight bar ── */}
        <div className="insight-bar">
          {insights.map(ins => (
            <div key={ins.label} onClick={() => ins.value && handleSelectDistrict(ins.value)}
              style={{
                background:'var(--panel2)', border:'1px solid var(--line)',
                borderRadius:11, padding:'10px 14px', display:'flex', alignItems:'center', gap:12,
                cursor:'pointer', transition:'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--mint-d)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--line)'}>
              <span style={{ fontSize:22 }}>{ins.icon}</span>
              <div>
                <div style={{ fontSize:10, color:'var(--faint)', letterSpacing:'0.03em' }}>⚠ {ins.label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)', marginTop:1 }}>เขต{ins.value}</div>
                <div style={{ fontSize:11, color:'var(--mint)', marginTop:1 }}>{ins.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="main-grid">
          <DistrictMap
            districts={filteredDistricts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={handleSelectDistrict}
            liveDots={liveDots}
            dataSource={source}
          />
          <ProblemChart
            data={data}
            selectedDistrict={selectedDistrict}
            districts={districts}
            onSelectDistrict={handleSelectDistrict}
          />
        </div>

        {/* ── District Detail ── */}
        {selectedDistrict && districts[selectedDistrict] && (
          <div ref={detailRef} style={{ marginTop:16, scrollMarginTop:16 }}>
            <DistrictDetail
              district={districts[selectedDistrict]}
              name={selectedDistrict}
              cityAvg={data?.city_avg}
              onClose={() => setSelectedDistrict(null)}
            />
          </div>
        )}

        {/* ── District Ranking ── */}
        <div style={{ marginTop:16 }}>
          <DistrictRanking
            districts={districts}
            cityAvg={data?.city_avg}
            onSelectDistrict={handleSelectDistrict}
          />
        </div>

        {/* ── Footer ── */}
        <div style={{
          marginTop:32, paddingTop:16, borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8,
        }}>
          <span style={{ fontSize:11, color:'var(--faint)' }}>
            ข้อมูลเปิดจาก{' '}
            <a href="https://traffy.in.th" target="_blank" rel="noopener noreferrer"
              style={{ color:'var(--faint)', textDecoration:'underline' }}>Traffy Fondue</a>
            {' '}· Bangkok Open Data
          </span>
          <span style={{ fontSize:11, color:'var(--faint)' }}>HacKaTech 2025 · URBAN INNOVATION Track</span>
        </div>
      </div>

      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          defaultDistrict={selectedDistrict || ''}
        />
      )}
    </div>
  )
}
