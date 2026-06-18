import { useState, useEffect } from 'react'
import FilterBar from './components/FilterBar'
import KpiPanel from './components/KpiPanel'
import DistrictMap from './components/DistrictMap'
import ProblemChart from './components/ProblemChart'
import DistrictDetail from './components/DistrictDetail'
import ReportModal from './components/ReportModal'
import { useData } from './hooks/useData'

export default function App() {
  const { data, loading, error } = useData()
  const [selectedType, setSelectedType] = useState('ทั้งหมด')
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [timeFactor, setTimeFactor] = useState(1)
  const [showReport, setShowReport] = useState(false)

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ position:'relative', width:56, height:56, margin:'0 auto 16px' }}>
          <div style={{ position:'absolute', inset:0, border:'2px solid var(--line)', borderRadius:'50%' }}/>
          <div style={{ position:'absolute', inset:0, border:'2px solid transparent', borderTopColor:'var(--mint)', borderRadius:'50%', animation:'spin 0.9s linear infinite' }}/>
        </div>
        <p style={{ color:'var(--muted)', fontSize:13 }}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--faint)' }}>{error}</p>
    </div>
  )

  const districts = data?.districts || {}
  const filteredDistricts = Object.entries(districts).reduce((acc, [name, d]) => {
    if (selectedType === 'ทั้งหมด') acc[name] = { ...d, total: Math.round((d.total || 0) * timeFactor) }
    else {
      const found = d.top_problems?.find(p => p.type === selectedType)
      acc[name] = { ...d, total: Math.round((found?.count || 0) * timeFactor) }
    }
    return acc
  }, {})

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--ink)' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'22px 20px 60px' }}>

        {/* Header */}
        <header style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap', borderBottom:'1px solid var(--line)', paddingBottom:16, marginBottom:20 }}>
          <div>
            <h1 style={{ margin:0, fontSize:28, fontWeight:700, letterSpacing:'-0.01em' }}>
              ฟังเมือง <span style={{ color:'var(--mint)', fontWeight:600 }}>/ FangMueang</span>
            </h1>
            <p style={{ margin:'4px 0 0', color:'var(--muted)', fontSize:13, maxWidth:'46ch' }}>
              เปลี่ยนเรื่องร้องเรียนของคนกรุงเทพให้เป็นข้อมูลที่เข้าใจและใช้ตัดสินใจได้
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11.5, color:'var(--faint)', border:'1px solid var(--line)', padding:'5px 10px', borderRadius:999 }}>
              ข้อมูลจาก Traffy Fondue
            </span>
            <button onClick={() => setShowReport(true)} style={{
              background:'var(--mint)', color:'#06231d', border:'none',
              padding:'7px 16px', borderRadius:999, fontSize:13, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7,
              transition:'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              📢 แจ้งปัญหา
            </button>
          </div>
        </header>

        {/* Filters */}
        <FilterBar selected={selectedType} onSelect={setSelectedType} timeFactor={timeFactor} onTimeChange={setTimeFactor} />

        {/* KPIs */}
        <div style={{ marginBottom:20 }}>
          <KpiPanel data={data} timeFactor={timeFactor} selectedType={selectedType} />
        </div>

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:16 }}>
          <DistrictMap
            districts={filteredDistricts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
          />
          <ProblemChart data={data} selectedDistrict={selectedDistrict} districts={districts} />
        </div>

        {/* District Detail */}
        {selectedDistrict && districts[selectedDistrict] && (
          <div style={{ marginTop:16 }}>
            <DistrictDetail
              district={districts[selectedDistrict]}
              name={selectedDistrict}
              cityAvg={data?.city_avg}
              onClose={() => setSelectedDistrict(null)}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:24, color:'var(--faint)', fontSize:12, borderTop:'1px solid var(--line)', paddingTop:14 }}>
          ข้อมูลเปิดจาก Traffy Fondue · Bangkok Open Data · HacKaTech 2025 URBAN Track
        </div>
      </div>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  )
}
