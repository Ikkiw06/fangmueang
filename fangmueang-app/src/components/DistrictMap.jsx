import { useState, useEffect } from 'react'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// vibrant palette: low → high
const BUCKETS = ['#4ECDC4','#45B7D1','#F9CA24','#F0932B','#EB4D4B']
const LABELS  = ['น้อยมาก','น้อย','ปานกลาง','มาก','มากมาก']

function getBucket(count, max) {
  if (!count || max <= 0) return '#1C2B3A'
  const r = count / max
  const i = Math.min(4, Math.floor(r * 5 - 1e-9))
  return BUCKETS[Math.max(0, i)]
}

// Auto-fit map to Bangkok bounds
function FitBounds({ geoData }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData) return
    try {
      const bounds = L.geoJSON(geoData).getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16], animate: false })
    } catch {}
  }, [geoData, map])
  return null
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
  const max    = Math.max(...counts, 1)

  const styleFeature = (feature) => {
    const name       = feature.properties.dname || feature.properties.name
    const d          = districts[name]
    const count      = d?.total || 0
    const isSelected = name === selectedDistrict
    return {
      fillColor:   getBucket(count, max),
      weight:      isSelected ? 2.5 : 1,
      color:       isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
      fillOpacity: isSelected ? 1 : 0.85,
    }
  }

  const onEachFeature = (feature, layer) => {
    const name  = feature.properties.dname || feature.properties.name
    const d     = districts[name]
    const count = d?.total || 0
    const rr    = d ? Math.round((d.resolved / d.total) * 100) : 0

    layer.bindTooltip(`
      <div style="font-family:'IBM Plex Sans Thai',sans-serif;padding:8px 14px;
        background:#0E141C;border:1px solid rgba(255,255,255,0.15);
        border-radius:10px;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.5)">
        <div style="color:#E7EEF5;font-size:13px;font-weight:600;margin-bottom:3px">เขต${name}</div>
        <div style="color:#8DA0B4;font-size:11px">
          ร้องเรียน <span style="color:#F9CA24;font-family:'IBM Plex Mono',monospace;font-size:13px">${count.toLocaleString()}</span> เรื่อง
        </div>
        <div style="color:#8DA0B4;font-size:11px">
          แก้ไขแล้ว <span style="color:#4ECDC4;font-family:'IBM Plex Mono',monospace">${rr}%</span>
        </div>
      </div>
    `, { sticky: true, opacity: 1 })

    layer.on({
      click: () => onSelectDistrict(name === selectedDistrict ? null : name),
      mouseover: e => e.target.setStyle({
        fillOpacity: 1,
        weight: 2,
        color: 'rgba(255,255,255,0.8)',
      }),
      mouseout: e => e.target.setStyle(styleFeature(feature)),
    })
  }

  /* Selected district stats overlay */
  const selData   = selectedDistrict ? districts[selectedDistrict] : null
  const selCount  = selData?.total || 0
  const selRr     = selData ? Math.round((selData.resolved / selData.total) * 100) : 0
  const selDays   = Math.round(selData?.avg_days || 0)
  const rrColor   = selRr >= 70 ? '#5BD1B8' : selRr >= 50 ? '#E9C46A' : '#EB4D4B'

  const CARD = {
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '16px 17px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  return (
    <section style={CARD}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            แผนที่ปัญหารายเขต
          </h2>
          <div style={{ color: 'var(--faint)', fontSize: 12, marginTop: 2 }}>
            {selectedDistrict
              ? `เลือก: เขต${selectedDistrict} · คลิกอีกครั้งเพื่อยกเลิก`
              : 'คลิกที่เขตเพื่อดูรายละเอียด'}
          </div>
        </div>
        {/* Quick stats badge when selected */}
        {selData && (
          <div style={{
            background:'var(--panel2)', border:'1px solid var(--line)',
            borderRadius:10, padding:'6px 12px', textAlign:'right',
          }}>
            <div style={{ fontSize:10, color:'var(--faint)', marginBottom:2 }}>เขต{selectedDistrict}</div>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--ink)' }}>
                  {selCount.toLocaleString()}
                </div>
                <div style={{ fontSize:10, color:'var(--faint)' }}>เรื่อง</div>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:rrColor }}>
                  {selRr}%
                </div>
                <div style={{ fontSize:10, color:'var(--faint)' }}>แก้ไขแล้ว</div>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--ink)' }}>
                  {selDays}
                </div>
                <div style={{ fontSize:10, color:'var(--faint)' }}>วัน/เรื่อง</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {BUCKETS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              display: 'inline-block', width: 12, height: 12,
              borderRadius: 3, background: c,
            }} />
            <span style={{ fontSize: 10, color: 'var(--faint)' }}>{LABELS[i]}</span>
          </div>
        ))}
        {selectedDistrict && (
          <button
            onClick={() => onSelectDistrict(null)}
            style={{
              marginLeft:'auto', background:'none',
              border:'1px solid var(--line)', color:'var(--faint)',
              borderRadius:7, padding:'3px 9px', fontSize:11,
              fontFamily:'inherit', cursor:'pointer',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--faint)' }}
          >
            ยกเลิก ✕
          </button>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', minHeight: 380, position: 'relative' }}>
        <MapContainer
          center={[13.756, 100.502]}
          zoom={10}
          zoomControl={true}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: 380, background: '#0E141C' }}
        >
          {geoData && (
            <>
              <FitBounds geoData={geoData} />
              <GeoJSON
                key={selectedDistrict + '-' + Object.keys(districts).length}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            </>
          )}
        </MapContainer>

        {/* Loading overlay */}
        {!geoData && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#0E141C', borderRadius: 10,
            color: 'var(--faint)', fontSize: 13,
          }}>
            กำลังโหลดแผนที่…
          </div>
        )}
      </div>
    </section>
  )
}
