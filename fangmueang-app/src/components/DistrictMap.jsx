import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function getColor(count, max) {
  if (!count || count === 0) return '#1e293b'
  const r = count / (max || 1)
  if (r > 0.8) return '#1d4ed8'
  if (r > 0.6) return '#2563eb'
  if (r > 0.4) return '#3b82f6'
  if (r > 0.2) return '#60a5fa'
  return '#93c5fd'
}

export default function DistrictMap({ districts, selectedDistrict, onSelectDistrict }) {
  const [geoData, setGeoData] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(d => setGeoData(d))
      .catch(() => setLoadError(true))
  }, [])

  const counts = Object.values(districts).map(d => d.total || 0)
  const max = Math.max(...counts, 1)

  const styleFeature = (feature) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0
    const isSelected = name === selectedDistrict
    return {
      fillColor: getColor(count, max),
      weight: isSelected ? 3 : 1,
      color: isSelected ? '#60a5fa' : '#334155',
      fillOpacity: isSelected ? 0.95 : 0.75,
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0
    layer.bindTooltip(`
      <div style="font-family:Sarabun,sans-serif;padding:8px 12px;background:rgba(15,23,42,0.95);border:1px solid rgba(59,130,246,0.4);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.5)">
        <strong style="color:#93c5fd;font-size:14px">เขต${name}</strong><br/>
        <span style="color:#64748b;font-size:12px">ร้องเรียน </span>
        <strong style="color:white;font-size:13px">${count.toLocaleString()}</strong>
        <span style="color:#64748b;font-size:12px"> ครั้ง</span>
      </div>
    `, { sticky: true, opacity: 1, className: '' })
    layer.on({
      click: () => onSelectDistrict(name),
      mouseover: e => { e.target.setStyle({ fillOpacity: 1, weight: 2.5, color: '#93c5fd' }) },
      mouseout: e => { e.target.setStyle(styleFeature(feature)) },
    })
  }

  const legendSteps = [
    { color: '#1d4ed8', label: `มาก (>${Math.round(max * 0.8)})` },
    { color: '#3b82f6', label: 'ปานกลาง' },
    { color: '#93c5fd', label: `น้อย (<${Math.round(max * 0.2)})` },
    { color: '#1e293b', label: 'ไม่มีข้อมูล' },
  ]

  return (
    <div style={{
      background:'rgba(15,23,42,0.8)',backdropFilter:'blur(16px)',
      border:'1px solid rgba(59,130,246,0.15)',borderRadius:16,
      overflow:'hidden',height:460,position:'relative',
      boxShadow:'0 8px 32px rgba(0,0,0,0.3)'
    }}>
      {/* Top overlay */}
      <div style={{position:'absolute',top:12,left:12,zIndex:1000,background:'rgba(15,23,42,0.9)',backdropFilter:'blur(12px)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:12,padding:'8px 14px',pointerEvents:'none'}}>
        <p style={{color:'white',fontWeight:700,fontSize:13,margin:'0 0 2px'}}>🗺️ แผนที่กรุงเทพฯ</p>
        <p style={{color:'#64748b',fontSize:11,margin:0}}>คลิกเขตเพื่อดูรายละเอียด</p>
      </div>

      {/* Legend */}
      <div style={{position:'absolute',bottom:12,right:12,zIndex:1000,background:'rgba(15,23,42,0.9)',backdropFilter:'blur(12px)',border:'1px solid rgba(71,85,105,0.3)',borderRadius:12,padding:'10px 14px',pointerEvents:'none'}}>
        <p style={{color:'#64748b',fontSize:11,fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>จำนวนร้องเรียน</p>
        {legendSteps.map(s => (
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
            <div style={{width:12,height:12,borderRadius:3,background:s.color,border:'1px solid rgba(71,85,105,0.5)'}}/>
            <span style={{fontSize:11,color:'#94a3b8'}}>{s.label}</span>
          </div>
        ))}
      </div>

      {loadError && (
        <div style={{position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',zIndex:999,background:'rgba(234,179,8,0.15)',border:'1px solid rgba(234,179,8,0.4)',borderRadius:10,padding:'6px 14px',fontSize:12,color:'#fde68a',pointerEvents:'none'}}>
          ⚠️ ไม่พบ GeoJSON — แผนที่ยังใช้งานได้แต่ไม่มีขอบเขตเขต
        </div>
      )}

      <MapContainer center={[13.756, 100.502]} zoom={10} style={{height:'100%',width:'100%',background:'#0f172a'}} zoomControl={true}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
        {geoData && (
          <GeoJSON
            key={selectedDistrict + JSON.stringify(Object.keys(districts)).slice(0,60)}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  )
}
