import { useState, useEffect } from 'react'
import { MapContainer, GeoJSON, useMap, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const mapStyles = `
  .leaflet-div-icon.district-label-marker {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  .district-label-text-admin {
    font-family: 'Sarabun', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
  .district-label-text-analytics {
    font-family: 'Sarabun', sans-serif;
    font-size: 10px;
    font-weight: 600;
    color: #cbd5e1;
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
  .custom-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .custom-tooltip::before {
    display: none !important;
  }
`

const CENTRAL_NUMBERS = {
  'คลองสาน': 1, 'ธนบุรี': 2, 'บางคอแหลม': 3, 'สาทร': 4, 'บางรัก': 5, 'ปทุมวัน': 6,
  'สัมพันธวงศ์': 7, 'ป้อมปราบศัตรูพ่าย': 8, 'พระนคร': 9
}

// แถบสีความหนาแน่นปัญหา: ต่ำ -> สูง
const BUCKETS = ['#4ECDC4', '#45B7D1', '#F9CA24', '#F0932B', '#EB4D4B']
const LABELS = ['น้อยมาก', 'น้อย', 'ปานกลาง', 'มาก', 'มากมาก']

function getCentroid(geometry) {
  if (!geometry) return null
  let lat = 0, lng = 0, count = 0
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => {
      ring.forEach(c => { lng += c[0]; lat += c[1]; count++ })
    })
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => {
      poly.forEach(ring => {
        ring.forEach(c => {
          ring.forEach(c2 => { lng += c2[0]; lat += c2[1]; count++ })
        })
      })
    })
  }
  return count > 0 ? [lat / count, lng / count] : null
}

function getBucket(count, max) {
  if (!count || max <= 0) return '#1C2B3A'
  const r = count / max
  const i = Math.min(4, Math.floor(r * 5 - 1e-9))
  return BUCKETS[Math.max(0, i)]
}

// ดึงแผนที่ให้พอดีกับสัดส่วนขอบเขตของกรุงเทพฯ โดยอัตโนมัติ
function FitBounds({ geoData }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData) return
    try {
      const bounds = L.geoJSON(geoData).getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16], animate: false })
    } catch (e) { console.error(e) }
  }, [geoData, map])
  return null
}

export default function DistrictMap({ districts = {}, selectedDistrict, onSelectDistrict }) {
  const [geoData, setGeoData] = useState(null)
  const [mapMode, setMapMode] = useState('admin')

  // หาค่าสูงสุด (Max) ของเคสร้องเรียนเพื่อนำไปคำนวณระดับความหนาแน่นสี
  const maxCount = Object.values(districts).reduce((max, d) => Math.max(max, d?.total || 0), 0) || 1

  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.innerHTML = mapStyles
    document.head.appendChild(styleElement)
    return () => { document.head.removeChild(styleElement) }
  }, [])

  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setGeoData(d))
      .catch((err) => console.error(err))
  }, [])

  const styleFeature = (feature) => {
    const name = feature.properties.dname || feature.properties.name
    const isSelected = name === selectedDistrict
    const d = districts[name]
    const count = d?.total || 0

    if (mapMode === 'analytics') {
      // โหมดวิเคราะห์: ถมสีตามความหนาแน่น (Choropleth)
      return {
        fillColor: getBucket(count, maxCount),
        weight: isSelected ? 2.5 : 1,
        color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
        fillOpacity: isSelected ? 1 : 0.85,
      }
    } else {
      // โหมดปกติ: คลีนใสแจ๋ว ไฮไลท์เฉพาะเขตที่เลือก
      return {
        fillColor: isSelected ? '#3b82f6' : 'transparent',
        fillOpacity: isSelected ? 0.25 : 0,
        weight: isSelected ? 2.5 : 0,
        color: isSelected ? '#3b82f6' : 'transparent',
      }
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0
    const rr = d ? Math.round((d.resolved / d.total) * 100) : 0

    layer.bindTooltip(`
      <div style="font-family:'IBM Plex Sans Thai',sans-serif;padding:8px 14px;
        background:#0E141C; border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px; white-space: nowrap; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5)">
        <div style="color:#E7EEF5;font-size:13px;font-weight:600;margin-bottom:3px">เขต${name}</div>
        <div style="color:#8DA0B4;font-size:11px">
          ร้องเรียน <span style="color:#F9CA24;font-family:'IBM Plex Mono',monospace;font-size:13px">${count.toLocaleString()}</span> เรื่อง
        </div>
        <div style="color:#8DA0B4;font-size:11px">
          แก้ไขแล้ว <span style="color:#4ECDC4;font-family:'IBM Plex Mono',monospace">${rr}%</span>
        </div>
      </div>
    `, { sticky: true, opacity: 1, className: 'custom-tooltip' })

    layer.on({
      click: () => onSelectDistrict(name === selectedDistrict ? null : name),
      mouseover: e => {
        if (mapMode === 'admin') {
          e.target.setStyle({
            fillColor: '#3b82f6',
            fillOpacity: 0.25,
            weight: 2,
            color: '#2563eb'
          })
        } else {
          e.target.setStyle({
            fillOpacity: 1,
            weight: 2,
            color: 'rgba(255,255,255,0.8)',
          })
        }
      },
      mouseout: e => {
        e.target.setStyle(styleFeature(feature))
      },
    })
  }

  const CARD = {
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    // 🛠️ ปรับเปลี่ยนมุมกรอบตรงนี้ให้เว้าโค้งแบบพรีเมียมอสมมาตรตามดีไซน์ใหม่
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '40px',
    borderBottomRightRadius: '16px',
    borderBottomLeftRadius: '48px',
    padding: '16px 17px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    height: 520,
    overflow: 'hidden'
  }

  return (
    <section style={CARD}>
      {/* ส่วนควบคุมส่วนบน */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
            แผนที่ปัญหารายเขต
          </h2>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            คลิกที่เขตเพื่อดูรายละเอียด
          </div>
        </div>

        {/* ปุ่มสลับโหมดแผนที่ */}
        <div style={{
          display: 'flex', gap: 6, background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(71,85,105,0.3)', borderRadius: '12px', padding: 4
        }}>
          <button
            onClick={() => setMapMode('admin')}
            style={{
              background: mapMode === 'admin' ? '#3b82f6' : 'transparent',
              border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            🗺️ แผนที่เขต
          </button>
          <button
            onClick={() => setMapMode('analytics')}
            style={{
              background: mapMode === 'analytics' ? '#3b82f6' : 'transparent',
              border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            📊 ความหนาแน่น
          </button>
        </div>
      </div>

      {/* แถบสีสัญลักษณ์แสดงเฉพาะโหมดวิเคราะห์ */}
      {mapMode === 'analytics' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '4px 0' }}>
          {BUCKETS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: c }} />
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{LABELS[i]}</span>
            </div>
          ))}
        </div>
      )}

      {/* พื้นที่แสดงแผงแผนที่ */}
      <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
        <MapContainer
          center={[13.756, 100.502]}
          zoom={10}
          zoomControl={true}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#0E141C' }}
        >
          {geoData && (
            <>
              <FitBounds geoData={geoData} />
              <GeoJSON
                key={mapMode + '-' + selectedDistrict + '-' + Object.keys(districts).length}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />

              {/* เรนเดอร์ป้ายชื่อเขตลอยบนแผนที่ */}
              {geoData.features.map((feature, i) => {
                const name = feature.properties.dname || feature.properties.name
                const centroid = getCentroid(feature.geometry)
                if (!centroid) return null

                const isCentral = mapMode === 'admin' && CENTRAL_NUMBERS[name];
                const displayLabel = isCentral ? CENTRAL_NUMBERS[name].toString() : `เขต${name}`;

                return (
                  <Marker
                    key={`label-${mapMode}-${name}-${i}`}
                    position={centroid}
                    icon={L.divIcon({
                      className: 'district-label-marker',
                      html: `<div class="${mapMode === 'admin' ? 'district-label-text-admin' : 'district-label-text-analytics'}">${displayLabel}</div>`,
                      iconSize: [100, 20],
                      iconAnchor: [50, 10]
                    })}
                    interactive={false}
                  />
                )
              })}
            </>
          )}
        </MapContainer>

        {!geoData && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#0E141C', borderRadius: 10,
            color: '#94a3b8', fontSize: 13,
          }}>
            กำลังโหลดแผนที่…
          </div>
        )}
      </div>
    </section>
  )
}