import { useState, useEffect } from 'react'
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Choropleth palette ─────────────────────────────── */
const BUCKETS = ['#1B6CA8','#2196A6','#E9C46A','#F4A261','#E63946']
const LABELS  = ['น้อยมาก','น้อย','ปานกลาง','มาก','มากมาก']

function getBucket(count, max) {
  if (!count || max <= 0) return null
  const i = Math.min(4, Math.floor((count / max) * 5 - 1e-9))
  return BUCKETS[Math.max(0, i)]
}

/* ── Dot type config ────────────────────────────────── */
const TYPE_CONFIG = {
  'ถนน/ทางเท้า': { color:'#F4A261', icon:'🛣️', grad:'linear-gradient(135deg,#3D2008,#8B4513)', desc:'ถนน ทางเท้า หรือพื้นผิวชำรุด' },
  'ขยะ':         { color:'#6FC18A', icon:'🗑️', grad:'linear-gradient(135deg,#0D2B1A,#1A5C35)', desc:'ขยะตกค้างหรือปัญหาสุขาภิบาล' },
  'น้ำท่วม':     { color:'#4F9FE0', icon:'🌊', grad:'linear-gradient(135deg,#071828,#0D47A1)', desc:'น้ำท่วม ท่อระบายอุดตัน' },
  'ไฟส่องสว่าง': { color:'#E9C46A', icon:'💡', grad:'linear-gradient(135deg,#2A1E00,#7A5800)', desc:'ไฟฟ้าสาธารณะดับหรือชำรุด' },
  'ความปลอดภัย': { color:'#E63946', icon:'🚨', grad:'linear-gradient(135deg,#2A0808,#8B1010)', desc:'เหตุที่เป็นอันตรายต่อความปลอดภัย' },
  'อื่นๆ':       { color:'#8DA0B4', icon:'📌', grad:'linear-gradient(135deg,#131A24,#253040)', desc:'ปัญหาทั่วไปในพื้นที่' },
}
function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG['อื่นๆ']
}

/* ── Fetch dots from local file ─────────────────────── */
async function fetchAllDots(onProgress) {
  const res  = await fetch('/dots.json')
  if (!res.ok) throw new Error('dots.json not found')
  const json = await res.json()
  const dots = json.dots || []
  onProgress(dots.length, dots.length)
  return dots.map(d => ({ lat:d[0], lng:d[1], type:d[2], state:d[3], district:d[4], photo: d[5] || '' }))
}

/* ── Canvas dot layer ───────────────────────────────── */
function CanvasDotLayer({ dots }) {
  const map = useMap()

  useEffect(() => {
    if (!dots.length || !map) return

    // ── Render dots via canvas (no interactive events — we handle them ourselves) ──
    const renderer = L.canvas({ padding: 0.5 })
    const markers  = dots.map(d => {
      const cfg = getTypeConfig(d.type)
      return L.circleMarker([d.lat, d.lng], {
        renderer,
        radius: 4,
        interactive: false,          // disable per-marker events for performance
        color: 'rgba(0,0,0,0.4)', weight: 0.8,
        fillColor: cfg.color, fillOpacity: 0.85,
      })
    })
    const group = L.layerGroup(markers)
    group.addTo(map)

    // ── Tooltip div ──
    const tip = document.createElement('div')
    tip.style.cssText = 'position:absolute;z-index:9999;pointer-events:none;display:none;'
    map.getContainer().appendChild(tip)
    // Allow pointer events on touch (for close button)
    tip.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        tip.style.display = 'none'
        if (hoveredIdx !== -1) {
          markers[hoveredIdx].setRadius(4)
          markers[hoveredIdx].setStyle({ weight:0.8, color:'rgba(0,0,0,0.4)', fillOpacity:0.85 })
          hoveredIdx = -1
        }
      }
    })

    let hoveredIdx = -1

    function buildTipHtml(d, showClose = false) {
      const cfg = getTypeConfig(d.type)
      const stateColor = d.state === 'ดำเนินการแล้ว' ? '#5BD1B8'
                       : d.state === 'กำลังดำเนินการ' ? '#E9C46A' : '#E63946'
      const stateIcon  = d.state === 'ดำเนินการแล้ว' ? '✅' : d.state === 'กำลังดำเนินการ' ? '⏳' : '🔴'
      const photoHtml  = d.photo
        ? `<div style="width:100%;height:130px;overflow:hidden;background:#0D1117;">
             <img src="${d.photo}" style="width:100%;height:100%;object-fit:cover;display:block;"
               onerror="this.parentElement.style.display='none'"/>
           </div>`
        : `<div style="height:58px;background:${cfg.grad};
               display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
             <span style="font-size:22px;line-height:1;">${cfg.icon}</span>
             <span style="font-size:9px;color:rgba(255,255,255,0.6);">${cfg.desc}</span>
           </div>`
      const closeBtn = showClose
        ? `<button data-close="1"
              style="position:absolute;top:8px;right:8px;z-index:2;
                width:26px;height:26px;border-radius:50%;border:none;
                background:rgba(0,0,0,0.5);color:#fff;font-size:13px;
                cursor:pointer;line-height:1;pointer-events:auto;">✕</button>`
        : ''
      return `<div data-tip="1" style="position:relative;width:220px;background:#111827;
          border:1px solid rgba(255,255,255,0.15);
          border-radius:13px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.9);
          font-family:'IBM Plex Sans Thai',sans-serif;">
        ${closeBtn}
        ${photoHtml}
        <div style="padding:10px 13px 12px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:15px;">${cfg.icon}</span>
            <span style="font-size:13px;font-weight:700;color:#F0F6FF;">${d.type}</span>
          </div>
          <div style="font-size:11px;color:#8DA0B4;margin-bottom:8px;">📍 เขต${d.district}</div>
          <div style="display:inline-flex;align-items:center;gap:5px;
              background:${stateColor}22;border:1px solid ${stateColor}55;
              border-radius:99px;padding:3px 10px;">
            <span style="font-size:10px;">${stateIcon}</span>
            <span style="font-size:11px;font-weight:700;color:${stateColor};">${d.state}</span>
          </div>
        </div>
      </div>`
    }

    function posTip(mx, my, rect) {
      const tw = 236, th = d => d.photo ? 260 : 190
      const h  = th({ photo: true })
      const left = mx + tw + 18 > rect.width  ? mx - tw - 10 : mx + 14
      const top  = my + h  + 8  > rect.height ? my - h  - 8  : my - 8
      tip.style.left = left + 'px'
      tip.style.top  = top  + 'px'
    }

    // ── Detect touch device ──
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (isTouch) tip.style.pointerEvents = 'auto'

    // ── Native mousemove on map container — hit-test dots manually ──
    const THRESHOLD2       = 10 * 10  // hover: 10px radius
    const TOUCH_THRESHOLD2 = 28 * 28  // touch: 28px radius (finger-friendly)
    const mapEl = map.getContainer()
    const bounds_cache = { bounds: null, zoom: -1 }

    function getBoundsCache() {
      const zoom = map.getZoom()
      if (bounds_cache.zoom !== zoom) {
        bounds_cache.bounds = map.getBounds()
        bounds_cache.zoom   = zoom
      }
      return bounds_cache.bounds || map.getBounds()
    }

    function findNearest(mx, my, threshold2) {
      const vb = getBoundsCache()
      let bestIdx = -1, bestD2 = threshold2
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        if (d.lat < vb.getSouth() || d.lat > vb.getNorth()) continue
        if (d.lng < vb.getWest()  || d.lng > vb.getEast())  continue
        const pt = map.latLngToContainerPoint([d.lat, d.lng])
        const dx = pt.x - mx, dy = pt.y - my
        const d2 = dx*dx + dy*dy
        if (d2 < bestD2) { bestD2 = d2; bestIdx = i }
      }
      return bestIdx
    }

    function onMouseMove(e) {
      if (isTouch) return  // touch handled separately
      const rect = mapEl.getBoundingClientRect()
      const mx   = e.clientX - rect.left
      const my   = e.clientY - rect.top
      const bestIdx = findNearest(mx, my, THRESHOLD2)

      if (bestIdx === -1) {
        if (hoveredIdx !== -1) {
          markers[hoveredIdx].setRadius(4)
          markers[hoveredIdx].setStyle({ weight:0.8, color:'rgba(0,0,0,0.4)', fillOpacity:0.85 })
          hoveredIdx = -1
        }
        tip.style.display = 'none'
        return
      }

      if (bestIdx !== hoveredIdx) {
        if (hoveredIdx !== -1) {
          markers[hoveredIdx].setRadius(4)
          markers[hoveredIdx].setStyle({ weight:0.8, color:'rgba(0,0,0,0.4)', fillOpacity:0.85 })
        }
        hoveredIdx = bestIdx
        markers[hoveredIdx].setRadius(8)
        markers[hoveredIdx].setStyle({ weight:2, color:'rgba(255,255,255,0.75)', fillOpacity:1 })
        tip.innerHTML = buildTipHtml(dots[bestIdx])
      }

      tip.style.display = 'block'
      posTip(mx, my, rect)
    }

    function onMouseLeave() {
      if (isTouch) return
      if (hoveredIdx !== -1) {
        markers[hoveredIdx].setRadius(4)
        markers[hoveredIdx].setStyle({ weight:0.8, color:'rgba(0,0,0,0.4)', fillOpacity:0.85 })
        hoveredIdx = -1
      }
      tip.style.display = 'none'
    }

    // ── Touch tap to show tooltip (persistent) ──
    function onTouchStart(e) {
      const touch = e.touches[0]
      const rect  = mapEl.getBoundingClientRect()
      const mx    = touch.clientX - rect.left
      const my    = touch.clientY - rect.top
      const bestIdx = findNearest(mx, my, TOUCH_THRESHOLD2)

      if (bestIdx === -1) {
        // Tap away = close tooltip
        if (hoveredIdx !== -1) {
          markers[hoveredIdx].setRadius(4)
          markers[hoveredIdx].setStyle({ weight:0.8, color:'rgba(0,0,0,0.4)', fillOpacity:0.85 })
          hoveredIdx = -1
        }
        tip.style.display = 'none'
        return
      }

      if (bestIdx !== hoveredIdx) {
        if (hoveredIdx !== -1) {
          markers[hoveredIdx].setRadius(4)
          markers[hoveredIdx].setStyle({ weight:0.8, color:'rgba(0,0,0,0.4)', fillOpacity:0.85 })
        }
        hoveredIdx = bestIdx
        markers[hoveredIdx].setRadius(10)
        markers[hoveredIdx].setStyle({ weight:2.5, color:'rgba(255,255,255,0.8)', fillOpacity:1 })
        tip.innerHTML = buildTipHtml(dots[bestIdx], true)
      }

      // Position: if tap is in upper half → below tap; else above tap
      const isUpperHalf = my < rect.height / 2
      const tw = 236
      const th = dots[bestIdx].photo ? 280 : 210
      const left = Math.min(Math.max(mx - tw / 2, 8), rect.width - tw - 8)
      const top  = isUpperHalf ? my + 22 : my - th - 22
      tip.style.left = left + 'px'
      tip.style.top  = Math.max(4, top) + 'px'
      tip.style.display = 'block'
      e.stopPropagation()
    }

    mapEl.addEventListener('mousemove',  onMouseMove)
    mapEl.addEventListener('mouseleave', onMouseLeave)
    mapEl.addEventListener('touchstart', onTouchStart, { passive: true })

    return () => {
      group.remove()
      mapEl.removeEventListener('mousemove',  onMouseMove)
      mapEl.removeEventListener('mouseleave', onMouseLeave)
      mapEl.removeEventListener('touchstart', onTouchStart)
      if (tip.parentNode) tip.parentNode.removeChild(tip)
    }
  }, [dots, map])

  return null
}

/* ── FitBounds ──────────────────────────────────────── */
function FitBounds({ geoData }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData) return
    try {
      const b = L.geoJSON(geoData).getBounds()
      if (b.isValid()) map.fitBounds(b, { padding:[16,16], animate:false })
    } catch {}
  }, [geoData, map])
  return null
}

/* ── District labels ────────────────────────────────── */
function DistrictLabels({ geoData, districts, selectedDistrict }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData || !map) return
    const ms = []
    geoData.features.forEach(f => {
      const name = f.properties.dname || f.properties.name
      const d    = districts[name]
      const isSel = name === selectedDistrict
      if (!isSel && !(d?.total > 0)) return
      try {
        const c = L.geoJSON(f).getBounds().getCenter()
        const m = L.marker(c, {
          icon: L.divIcon({
            className: '',
            html: `<div style="font-family:'IBM Plex Sans Thai',sans-serif;
              font-size:${isSel?11:9.5}px;font-weight:${isSel?700:500};
              color:${isSel?'#FFF':'rgba(231,238,245,0.8)'};
              text-shadow:0 1px 3px rgba(0,0,0,0.9);white-space:nowrap;
              pointer-events:none;transform:translate(-50%,-50%);">${name}</div>`,
            iconSize:[0,0], iconAnchor:[0,0],
          }),
          interactive: false,
          zIndexOffset: isSel ? 1000 : 0,
        })
        m.addTo(map); ms.push(m)
      } catch {}
    })
    return () => ms.forEach(m => map.removeLayer(m))
  }, [geoData, districts, selectedDistrict, map])
  return null
}

/* ════════════════════════════════════════════════════ */
export default function DistrictMap({ districts, selectedDistrict, onSelectDistrict, liveDots, dataSource }) {
  const [geoData,     setGeoData]     = useState(null)
  const [mapMode,     setMapMode]     = useState('choropleth')
  const [staticDots,  setStaticDots]  = useState([])
  const [dotsLoading, setDotsLoading] = useState(false)
  const [dotsError,   setDotsError]   = useState(false)

  // Use live dots from Traffy API if available, else fall back to static file
  const dots = liveDots
    ? liveDots.map(d => ({ lat: d[0], lng: d[1], type: d[2], state: d[3], district: d[4], photo: d[5] || '' }))
    : staticDots

  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setGeoData(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Only load static dots if no live dots available
    if (liveDots || mapMode !== 'dots' || staticDots.length > 0 || dotsLoading) return
    setDotsLoading(true); setDotsError(false)
    fetchAllDots(() => {})
      .then(all => setStaticDots(all))
      .catch(() => setDotsError(true))
      .finally(() => setDotsLoading(false))
  }, [mapMode, liveDots])

  const counts = Object.values(districts).map(d => d.total || 0)
  const max    = Math.max(...counts, 1)

  const styleFeature = (feature) => {
    const name        = feature.properties.dname || feature.properties.name
    const d           = districts[name]
    const isSelected  = name === selectedDistrict
    const fill        = getBucket(d?.total || 0, max)
    return {
      fillColor:   fill || 'rgba(255,255,255,0.04)',
      weight:      isSelected ? 2 : 0.8,
      color:       isSelected ? '#FFF' : 'rgba(255,255,255,0.22)',
      fillOpacity: fill ? (isSelected ? 0.80 : 0.63) : 0.12,
    }
  }

  const onEachFeature = (feature, layer) => {
    const name  = feature.properties.dname || feature.properties.name
    const d     = districts[name]
    const count = d?.total || 0
    const rr    = d?.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
    const days  = Math.round(d?.avg_days || 0)
    const rrC   = rr >= 70 ? '#5BD1B8' : rr >= 50 ? '#E9C46A' : '#E63946'
    layer.bindTooltip(`
      <div style="font-family:'IBM Plex Sans Thai',sans-serif;padding:10px 14px;
        background:#0D1117;border:1px solid rgba(255,255,255,0.12);border-radius:10px;
        white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,0.6)">
        <div style="color:#E7EEF5;font-size:13px;font-weight:700;margin-bottom:6px">เขต${name}</div>
        <div style="display:grid;grid-template-columns:auto auto;gap:2px 14px">
          <span style="color:#8DA0B4;font-size:11px">ร้องเรียน</span>
          <span style="color:#F9CA24;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600">${count.toLocaleString()} เรื่อง</span>
          <span style="color:#8DA0B4;font-size:11px">แก้ไขแล้ว</span>
          <span style="color:${rrC};font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600">${rr}%</span>
          <span style="color:#8DA0B4;font-size:11px">เฉลี่ย</span>
          <span style="color:#A0B8CC;font-family:'IBM Plex Mono',monospace;font-size:12px">${days} วัน</span>
        </div>
      </div>
    `, { sticky: true, opacity: 1 })
    layer.on({
      click:     () => onSelectDistrict(name === selectedDistrict ? null : name),
      mouseover: e  => { e.target.setStyle({ fillOpacity:0.92, weight:2, color:'rgba(255,255,255,0.7)' }); e.target.bringToFront() },
      mouseout:  e  => e.target.setStyle(styleFeature(feature)),
    })
  }

  const selData = selectedDistrict ? districts[selectedDistrict] : null

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)',
    borderRadius:'var(--radius)', padding:'16px 17px',
    display:'flex', flexDirection:'column', gap:10,
  }

  return (
    <section style={CARD}>

      {/* Header + mode toggle */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
        <div>
          <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--ink)' }}>
            {mapMode === 'choropleth' ? 'แผนที่ปัญหารายเขต' : 'จุดปัญหาจาก Traffy Fondue'}
          </h2>
          <div style={{ color:'var(--faint)', fontSize:12, marginTop:2 }}>
            {mapMode === 'choropleth'
              ? (selectedDistrict ? `เลือก: เขต${selectedDistrict}` : 'คลิกเขตเพื่อดูรายละเอียด')
              : dotsLoading ? '⏳ กำลังโหลด...'
              : dotsError   ? '❌ โหลดไม่สำเร็จ'
              : `${dots.length.toLocaleString()} จุด · ${dataSource === 'live' ? '🟢 Traffy Live' : '📁 Static'} · แตะ/hover เพื่อดูรายละเอียด`}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {/* mode toggle */}
          <div style={{ display:'flex', background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:3, gap:2 }}>
            {[{ key:'choropleth', label:'🗺️ รายเขต' }, { key:'dots', label:'📍 จุดปัญหา' }].map(m => (
              <button key={m.key} onClick={() => setMapMode(m.key)} style={{
                background: mapMode === m.key ? 'var(--panel)' : 'transparent',
                color:      mapMode === m.key ? 'var(--mint)' : 'var(--faint)',
                border:'none', borderRadius:7, padding:'4px 12px', fontSize:11,
                fontFamily:'inherit', fontWeight: mapMode === m.key ? 600 : 400,
                cursor:'pointer', transition:'all 0.15s',
                boxShadow: mapMode === m.key ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}>{m.label}</button>
            ))}
          </div>

          {/* selected district mini-badge */}
          {selData && mapMode === 'choropleth' && (
            <div style={{ background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:'5px 12px' }}>
              <div style={{ fontSize:10, color:'var(--faint)' }}>เขต{selectedDistrict}</div>
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { v: selData.total.toLocaleString(), u:'เรื่อง' },
                  { v: `${Math.round(selData.resolved/selData.total*100)}%`, u:'แก้แล้ว', c: selData.resolved/selData.total >= 0.7 ? '#5BD1B8' : '#E9C46A' },
                ].map(x => (
                  <div key={x.u} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color: x.c || 'var(--ink)' }}>{x.v}</div>
                    <div style={{ fontSize:10, color:'var(--faint)' }}>{x.u}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {mapMode === 'choropleth' ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {BUCKETS.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:12, height:12, borderRadius:3, background:c }}/>
              <span style={{ fontSize:10, color:'var(--faint)' }}>{LABELS[i]}</span>
            </div>
          ))}
          {selectedDistrict && (
            <button onClick={() => onSelectDistrict(null)} style={{
              marginLeft:'auto', background:'none', border:'1px solid var(--line)',
              color:'var(--faint)', borderRadius:7, padding:'3px 9px',
              fontSize:11, fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--faint)' }}>
              ยกเลิก ✕
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {Object.entries(TYPE_CONFIG).map(([label, cfg]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:cfg.color }}/>
              <span style={{ fontSize:10, color:'var(--faint)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={[13.756, 100.502]} zoom={10}
          zoomControl scrollWheelZoom
          style={{ height:'100%', width:'100%', minHeight:400, background:'#0D1117' }}
          attributionControl={false}
        >
          {mapMode === 'dots' && (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd" maxZoom={19} opacity={0.85}
            />
          )}

          {geoData && (
            <>
              <FitBounds geoData={geoData} />
              {mapMode === 'choropleth' && (
                <>
                  <GeoJSON
                    key={selectedDistrict + '-' + Object.keys(districts).length}
                    data={geoData} style={styleFeature} onEachFeature={onEachFeature}
                  />
                  <DistrictLabels geoData={geoData} districts={districts} selectedDistrict={selectedDistrict} />
                </>
              )}
              {mapMode === 'dots' && (
                <>
                  <GeoJSON key="outline" data={geoData}
                    style={() => ({ fillColor:'transparent', fillOpacity:0, weight:0.7, color:'rgba(255,255,255,0.18)' })}
                  />
                  {dots.length > 0 && <CanvasDotLayer dots={dots} />}
                </>
              )}
            </>
          )}
        </MapContainer>

        {/* Loading overlay */}
        {(!geoData || (mapMode === 'dots' && dotsLoading)) && (
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(13,17,23,0.88)', borderRadius:10,
            color:'var(--faint)', fontSize:13,
          }}>
            {dotsLoading ? '⏳ กำลังโหลดจุดปัญหา...' : 'กำลังโหลดแผนที่…'}
          </div>
        )}

        <div style={{
          position:'absolute', bottom:6, right:8, zIndex:1000,
          fontSize:9, color:'rgba(141,160,180,0.45)', pointerEvents:'none',
        }}>
          © OpenStreetMap · © CARTO · Traffy Fondue
        </div>
      </div>
    </section>
  )
}
