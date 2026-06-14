import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const BUCKETS = ['#274156','#3E7D74','#E9C46A','#E58A53','#D14B3C']

function getBucket(count, max) {
  if (!count || max <= 0) return '#1C2734'
  const r = count / max
  const i = Math.min(4, Math.floor(r * 5 - 1e-9))
  return BUCKETS[Math.max(0, i)]
}

export default function DistrictMap({ districts, selectedDistrict, onSelectDistrict }) {
  const [geoData, setGeoData] = useState(null)

  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setGeoData(d))
      .catch(() => {})
  }, [])

  const counts = Object.values(districts).map(d => d.total || 0)
  const max = Math.max(...counts, 1)

  const styleFeature = (feature) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0
    const isSelected = name === selectedDistrict
    return {
      fillColor: getBucket(count, max),
      weight: isSelected ? 2 : 0.8,
      color: isSelected ? '#5BD1B8' : '#2A3848',
      fillOpacity: isSelected ? 1 : 0.82,
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0
    layer.bindTooltip(`
      <div style="font-family:'IBM Plex Sans Thai',sans-serif;padding:6px 12px;background:#161F2B;border:1px solid #2A3848;border-radius:9px;white-space:nowrap">
        <strong style="color:#E7EEF5;font-size:13px">เขต${name}</strong><br/>
        <span style="color:#64778C;font-size:11px">ร้องเรียน </span>
        <strong style="color:#5BD1B8;font-size:13px;font-family:'IBM Plex Mono',monospace">${count.toLocaleString()}</strong>
      </div>
    `, { sticky: true, opacity: 1 })
    layer.on({
      click: () => onSelectDistrict(name === selectedDistrict ? null : name),
      mouseover: e => e.target.setStyle({ fillOpacity: 1, weight: 1.5, color: '#5BD1B8' }),
      mouseout: e => e.target.setStyle(styleFeature(feature)),
    })
  }

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--radius)',
    padding:'16px 17px', display:'flex', flexDirection:'column',
  }

  const legendSteps = [
    { color:'#274156', label:'น้อย' },
    { color:'#3E7D74', label:'' },
    { color:'#E9C46A', label:'ปานกลาง' },
    { color:'#E58A53', label:'' },
    { color:'#D14B3C', label:'มาก' },
  ]

  return (
    <section style={CARD}>
      <h2 style={{ margin:'0 0 2px', fontSize:15, fontWeight:600 }}>แผนที่ปัญหารายเขต</h2>
      <div style={{ color:'var(--faint)', fontSize:12, marginBottom:12 }}>คลิกที่เขตเพื่อดูรายละเอียด</div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--faint)', marginBottom:10 }}>
        <span>น้อย</span>
        {legendSteps.map((s,i) => <i key={i} style={{ width:20, height:9, borderRadius:2, background:s.color, display:'inline-block' }}/>)}
        <span>มาก</span>
      </div>

      {/* Map */}
      <div style={{ flex:1, borderRadius:10, overflow:'hidden', minHeight:380 }}>
        <MapContainer center={[13.756, 100.502]} zoom={10}
          style={{ height:'100%', width:'100%', minHeight:380, background:'var(--bg)' }} zoomControl>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'/>
          {geoData && (
            <GeoJSON
              key={selectedDistrict + JSON.stringify(Object.keys(districts)).slice(0,40)}
              data={geoData} style={styleFeature} onEachFeature={onEachFeature}/>
          )}
        </MapContainer>
      </div>
    </section>
  )
}
