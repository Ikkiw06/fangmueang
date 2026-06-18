import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet'
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
};

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
        ring.forEach(c => { lng += c[0]; lat += c[1]; count++ })
      })
    })
  }
  return count > 0 ? [lat / count, lng / count] : null
=======
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
>>>>>>> main
}

export default function DistrictMap({ districts = {}, selectedDistrict, onSelectDistrict }) {
  const [geoData, setGeoData] = useState(null)
<<<<<<< HEAD
  const [loadError, setLoadError] = useState(false)
  const [mapMode, setMapMode] = useState('admin')

  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.innerHTML = mapStyles
    document.head.appendChild(styleElement)
    return () => { document.head.removeChild(styleElement) }
  }, [])
=======
>>>>>>> main

  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setGeoData(d))
      .catch(() => {})
  }, [])

  const styleFeature = (feature) => {
    const name = feature.properties.dname || feature.properties.name
    const isSelected = name === selectedDistrict

    return {
<<<<<<< HEAD
      fillColor: isSelected ? '#3b82f6' : 'transparent',
      fillOpacity: isSelected ? 0.25 : 0,
      weight: isSelected ? 2.5 : 0,
      color: isSelected ? '#3b82f6' : 'transparent',
=======
      fillColor: getBucket(count, max),
      weight: isSelected ? 2.5 : 1,
      color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
      fillOpacity: isSelected ? 1 : 0.85,
>>>>>>> main
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0
<<<<<<< HEAD

    layer.bindTooltip(`
      <div style="font-family:Sarabun,sans-serif;padding:6px 10px;">
        <strong style="color:#93c5fd;font-size:13px">เขต${name}</strong><br/>
        <span style="color:#94a3b8;font-size:11px">ร้องเรียน </span>
        <strong style="color:white;font-size:12px">${count.toLocaleString()}</strong>
        <span style="color:#94a3b8;font-size:11px"> ครั้ง</span>
      </div>
    `, { sticky: true, opacity: 1, className: 'custom-tooltip' })

    layer.on({
      click: () => onSelectDistrict(name),
      mouseover: e => {
        e.target.setStyle({
          fillColor: '#3b82f6',
          fillOpacity: 0.25,
          weight: 2,
          color: '#2563eb'
        })
      },
      mouseout: e => {
        e.target.setStyle(styleFeature(feature))
      },
    })
  }

  return (
    <div style={{
      background: '#0f172a',
      overflow: 'hidden', // 👈 จุดสำคัญ: บังคับตัดขอบตัวแผนที่ฐานไม่ให้ทะลุความโค้งมนออกมา
      height: 460,
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',

      // 🛠️ ปรับเปลี่ยนมุมกรอบตรงนี้ให้เว้าโค้งแบบพรีเมียมอสมมาตร (สไตล์เหลี่ยมสลับมนลึก)
      borderTopLeftRadius: '16px',       // ขอบบนซ้าย มนปกติ
      borderTopRightRadius: '40px',      // ขอบบนขวา เว้าลึกรับกับหน้าต่างข้อมูล
      borderBottomRightRadius: '16px',   // ขอบล่างขวา มนปกติ
      borderBottomLeftRadius: '48px',    // ขอบล่างซ้าย เว้าลึกเป็นพิเศษเพิ่มมิติไหลลื่น

      border: '1px solid rgba(255, 255, 255, 0.05)' // เติมเส้นขอบกล่องบาง ๆ เพื่อความคมชัด
    }}>

      {/* ปุ่มสลับโหมดแผนที่ (ปรับปุ่มให้มนขึ้นตามดีไซน์ใหม่) */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', gap: 6, background: 'rgba(15,23,42,0.9)',
        backdropFilter: 'blur(12px)', border: '1px solid rgba(71,85,105,0.3)',
        borderRadius: '12px', padding: 4
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

      <MapContainer
        center={[13.756, 100.502]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url={mapMode === 'admin' ? "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"}
          attribution='&copy; CARTO'
        />
        {geoData && (
          <GeoJSON
            key={mapMode + selectedDistrict + JSON.stringify(Object.keys(districts)).slice(0, 60)}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {geoData && geoData.features.map((feature, i) => {
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
      </MapContainer>
    </div>
=======
    const rr = d ? Math.round((d.resolved / d.total) * 100) : 0

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
      <div>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          แผนที่ปัญหารายเขต
        </h2>
        <div style={{ color: 'var(--faint)', fontSize: 12, marginTop: 2 }}>
          คลิกที่เขตเพื่อดูรายละเอียด
        </div>
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
      </div>

      {/* Map */}
      <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', minHeight: 400, position: 'relative' }}>
        <MapContainer
          center={[13.756, 100.502]}
          zoom={10}
          zoomControl={true}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: 400, background: '#0E141C' }}
        >
          {/* NO TileLayer — pure dark background */}
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
>>>>>>> main
  )
}