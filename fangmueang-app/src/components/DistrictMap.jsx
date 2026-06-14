import { useState, useEffect } from 'react'
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
}

export default function DistrictMap({ districts = {}, selectedDistrict, onSelectDistrict }) {
  const [geoData, setGeoData] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [mapMode, setMapMode] = useState('admin')

  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.innerHTML = mapStyles
    document.head.appendChild(styleElement)
    return () => { document.head.removeChild(styleElement) }
  }, [])

  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(d => setGeoData(d))
      .catch(() => setLoadError(true))
  }, [])

  const styleFeature = (feature) => {
    const name = feature.properties.dname || feature.properties.name
    const isSelected = name === selectedDistrict

    return {
      fillColor: isSelected ? '#3b82f6' : 'transparent',
      fillOpacity: isSelected ? 0.25 : 0,
      weight: isSelected ? 2.5 : 0,
      color: isSelected ? '#3b82f6' : 'transparent',
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.dname || feature.properties.name
    const d = districts[name]
    const count = d?.total || 0

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
  )
}