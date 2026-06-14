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
  const [showReport, setShowReport] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:56,height:56,border:'3px solid #3b82f6',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}></div>
        <p style={{color:'#93c5fd',fontSize:16,fontWeight:500}}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
      <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:16,padding:32,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>⚠️</div>
        <p style={{color:'#fca5a5'}}>{error}</p>
      </div>
    </div>
  )

  const districts = data?.districts || {}

  const filteredDistricts = Object.entries(districts).reduce((acc, [name, d]) => {
    if (selectedType === 'ทั้งหมด') {
      acc[name] = d
    } else {
      const found = d.top_problems?.find(p => p.type === selectedType)
      acc[name] = { ...d, total: found?.count || 0 }
    }
    return acc
  }, {})

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#0d2044 40%,#0f172a 100%)',color:'white',fontFamily:'Sarabun,sans-serif'}}>
      {/* Header */}
      <header style={{
        position:'sticky',top:0,zIndex:50,
        background:'rgba(15,23,42,0.85)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(59,130,246,0.2)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{
              width:40,height:40,borderRadius:12,
              background:'linear-gradient(135deg,#3b82f6,#06b6d4)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:20,boxShadow:'0 0 20px rgba(59,130,246,0.4)',
              animation:'float 3s ease-in-out infinite'
            }}>🏙️</div>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,background:'linear-gradient(135deg,#60a5fa,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:0,lineHeight:1.2}}>
                ฟังเมือง
              </h1>
              <p style={{fontSize:11,color:'#64748b',margin:0}}>Bangkok Civic Intelligence • HacKaTech 2025</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',padding:'4px 12px',borderRadius:99,fontSize:12,color:'#34d399'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block',animation:'pulseGlow 2s infinite'}}></span>
              Live Data
            </div>
            <button
              onClick={() => setShowReport(true)}
              style={{
                background:'linear-gradient(135deg,#3b82f6,#06b6d4)',
                border:'none',borderRadius:10,padding:'8px 16px',
                color:'white',fontWeight:700,fontSize:13,cursor:'pointer',
                boxShadow:'0 4px 16px rgba(59,130,246,0.4)',
                transition:'all 0.2s',display:'flex',alignItems:'center',gap:6
              }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              📢 แจ้งปัญหา
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:1400,margin:'0 auto',padding:'24px',display:'flex',flexDirection:'column',gap:20}}>
        {/* Filter */}
        <div style={{opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(20px)',transition:'all 0.5s ease 0.1s'}}>
          <FilterBar selected={selectedType} onSelect={setSelectedType} />
        </div>

        {/* KPI */}
        <div style={{opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(20px)',transition:'all 0.5s ease 0.2s'}}>
          <KpiPanel data={data} />
        </div>

        {/* Map + Chart */}
        <div style={{
          display:'grid',gridTemplateColumns:'3fr 2fr',gap:20,
          opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(20px)',
          transition:'all 0.5s ease 0.3s'
        }}>
          <DistrictMap
            districts={filteredDistricts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
          />
          {selectedDistrict && districts[selectedDistrict] ? (
            <DistrictDetail
              district={districts[selectedDistrict]}
              name={selectedDistrict}
              cityAvg={data?.city_avg}
              onClose={() => setSelectedDistrict(null)}
            />
          ) : (
            <ProblemChart data={data} />
          )}
        </div>

        <footer style={{textAlign:'center',paddingTop:16,borderTop:'1px solid rgba(51,65,85,0.5)',fontSize:12,color:'#475569'}}>
          ข้อมูลจาก Traffy Fondue Open Data • HacKaTech 2025 URBAN Track
        </footer>
      </main>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  )
}
