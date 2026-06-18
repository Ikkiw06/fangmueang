<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react'
import { MapContainer, GeoJSON, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Choropleth palette ──────────────────────────────── */
=======
import { useState, useEffect } from 'react'
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Choropleth palette ─────────────────────────────── */
>>>>>>> kiw
const BUCKETS = ['#1B6CA8','#2196A6','#E9C46A','#F4A261','#E63946']
const LABELS  = ['น้อยมาก','น้อย','ปานกลาง','มาก','มากมาก']

function getBucket(count, max) {
  if (!count || max <= 0) return null
<<<<<<< HEAD
  const r = count / max
  const i = Math.min(4, Math.floor(r * 5 - 1e-9))
  return BUCKETS[Math.max(0, i)]
}

/* ── Dot colors ──────────────────────────────────────── */
const DOT_COLORS = {
  'ถนน':'#F4A261','ทางเท้า':'#F4A261','น้ำ':'#4F9FE0','ท่อ':'#4F9FE0',
  'ขยะ':'#6FC18A','ไฟ':'#E9C46A','ต้นไม้':'#34D399','สัตว์':'#C084FC',
  'ความปลอดภัย':'#E63946',
}
function getDotColor(types) {
  if (!types?.length) return '#8DA0B4'
  const t = String(types[0] || '')
  for (const [k, c] of Object.entries(DOT_COLORS)) if (t.includes(k)) return c
  return '#8DA0B4'
}

/* ── Fetch dots from local file (fast, offline-ready) ── */
=======
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
>>>>>>> kiw
async function fetchAllDots(onProgress) {
  const res  = await fetch('/dots.json')
  if (!res.ok) throw new Error('dots.json not found')
  const json = await res.json()
  const dots = json.dots || []
  onProgress(dots.length, dots.length)
<<<<<<< HEAD
  // convert array format [lat, lng, type, state, district] → object
  return dots.map(d => ({
    lat: d[0], lng: d[1], type: d[2], state: d[3], district: d[4],
  }))
}

/* ── Canvas dot layer (fast — handles 50k+ dots) ─────── */
=======
  return dots.map(d => ({ lat:d[0], lng:d[1], type:d[2], state:d[3], district:d[4] }))
}

/* ── Canvas dot layer ───────────────────────────────── */
>>>>>>> kiw
function CanvasDotLayer({ dots }) {
  const map = useMap()

  useEffect(() => {
    if (!dots.length || !map) return

<<<<<<< HEAD
    const canvas  = L.canvas({ padding: 0.5 })
    const markers = dots.map(d => {
      const color = getDotColor([d.type])
      const m     = L.circleMarker(
        [d.lat, d.lng],
        { renderer: canvas, radius: 3, color, fillColor: color, fillOpacity: 0.82, weight: 0 }
      )
      const stateColor = d.state === 'ดำเนินการแล้ว' ? '#5BD1B8' : d.state === 'กำลังดำเนินการ' ? '#E9C46A' : '#E63946'
      m.bindTooltip(
        `<div style="font-family:'IBM Plex Sans Thai',sans-serif;padding:9px 12px;
          background:#0D1117;border:1px solid rgba(255,255,255,0.12);border-radius:10px;
          min-width:160px;box-shadow:0 6px 24px rgba(0,0,0,0.6);">
          <div style="color:#E7EEF5;font-size:12px;font-weight:700;margin-bottom:5px;
            display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};
              display:inline-block;flex-shrink:0;"></span>
            ${d.type}
          </div>
          <div style="color:#8DA0B4;font-size:11px;margin-bottom:3px;">📍 เขต${d.district}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;
            font-weight:600;background:${stateColor}22;color:${stateColor};border:1px solid ${stateColor}44;">
            ${d.state}
          </div>
        </div>`,
        { sticky: true, opacity: 1 }
      )
      return m
    })

    const group = L.featureGroup(markers)
    group.addTo(map)

    return () => { group.remove() }
  }, [dots, map])  // ← NOT zoom: layer created once, re-used across zoom levels
=======
    const markers = dots.map(d => {
      const cfg = getTypeConfig(d.type)
      const stateColor = d.state === 'ดำเนินการแล้ว' ? '#5BD1B8'
                       : d.state === 'กำลังดำเนินการ' ? '#E9C46A' : '#E63946'
      const stateIcon  = d.state === 'ดำเนินการแล้ว' ? '✅' : d.state === 'กำลังดำเนินการ' ? '⏳' : '🔴'

      const m = L.circleMarker([d.lat, d.lng], {
        radius: 5.5,
        color: 'rgba(0,0,0,0.5)', weight: 1,
        fillColor: cfg.color, fillOpacity: 0.88,
      })

      m.bindTooltip(
        `<div style="font-family:'IBM Plex Sans Thai',sans-serif;width:210px;
            background:#111827;border:1px solid rgba(255,255,255,0.12);
            border-radius:13px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.8);">
          <div style="height:72px;background:${cfg.grad};
              display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
              position:relative;">
            <span style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.7));">${cfg.icon}</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:0.05em;">${cfg.desc}</span>
          </div>
          <div style="padding:11px 13px 12px;">
            <div style="font-size:14px;font-weight:700;color:#F0F6FF;margin-bottom:4px;">${d.type}</div>
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:9px;">
              <span style="font-size:11px;color:#64778C;">📍</span>
              <span style="font-size:11px;color:#8DA0B4;">เขต${d.district}</span>
            </div>
            <div style="display:inline-flex;align-items:center;gap:6px;
                background:${stateColor}1A;border:1px solid ${stateColor}50;
                border-radius:99px;padding:3px 10px;">
              <span style="font-size:9px;">${stateIcon}</span>
              <span style="font-size:10px;font-weight:700;color:${stateColor};letter-spacing:0.03em;">${d.state}</span>
            </div>
          </div>
        </div>`,
        {
          sticky: true,
          opacity: 1,
          offset: [14, -6],
          direction: 'right',
          className: 'dot-tooltip',
        }
      )

      m.on('mouseover', function () {
        this.setRadius(9)
        this.setStyle({ weight: 2, color: 'rgba(255,255,255,0.6)', fillOpacity: 1 })
        this.openTooltip()
      })
      m.on('mouseout', function () {
        this.setRadius(5.5)
        this.setStyle({ weight: 1, color: 'rgba(0,0,0,0.5)', fillOpacity: 0.88 })
        this.closeTooltip()
      })

      return m
    })

    const group = L.layerGroup(markers)
    group.addTo(map)
    return () => group.remove()
  }, [dots, map])
>>>>>>> kiw

  return null
}

<<<<<<< HEAD
/* ── Zoom tracker ──────────────────────────────────────── */
function ZoomWatcherInner({ onZoom }) {
  const map = useMap()
  useMapEvents({ zoom: () => onZoom(map.getZoom()) })
  return null
}

/* ── FitBounds ─────────────────────────────────────────── */
=======
/* ── FitBounds ──────────────────────────────────────── */
>>>>>>> kiw
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

<<<<<<< HEAD
/* ── District labels ──────────────────────────────────── */
=======
/* ── District labels ────────────────────────────────── */
>>>>>>> kiw
function DistrictLabels({ geoData, districts, selectedDistrict }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData || !map) return
    const ms = []
    geoData.features.forEach(f => {
      const name = f.properties.dname || f.properties.name
      const d    = districts[name]
<<<<<<< HEAD
      const isSelected = name === selectedDistrict
      if (!isSelected && !(d?.total > 0)) return
      try {
        const center = L.geoJSON(f).getBounds().getCenter()
        const m = L.marker(center, {
          icon: L.divIcon({
            className: '',
            html: `<div style="font-family:'IBM Plex Sans Thai',sans-serif;
              font-size:${isSelected?11:9.5}px;font-weight:${isSelected?700:500};
              color:${isSelected?'#FFF':'rgba(231,238,245,0.85)'};
=======
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
>>>>>>> kiw
              text-shadow:0 1px 3px rgba(0,0,0,0.9);white-space:nowrap;
              pointer-events:none;transform:translate(-50%,-50%);">${name}</div>`,
            iconSize:[0,0], iconAnchor:[0,0],
          }),
          interactive: false,
<<<<<<< HEAD
          zIndexOffset: isSelected ? 1000 : 0,
=======
          zIndexOffset: isSel ? 1000 : 0,
>>>>>>> kiw
        })
        m.addTo(map); ms.push(m)
      } catch {}
    })
<<<<<<< HEAD
    return () => { ms.forEach(m => map.removeLayer(m)) }
  }, [geoData, districts, selectedDistrict, map])
  return null
}
=======
    return () => ms.forEach(m => map.removeLayer(m))
  }, [geoData, districts, selectedDistrict, map])
  return null
}

/* ════════════════════════════════════════════════════ */
export default function DistrictMap({ districts, selectedDistrict, onSelectDistrict }) {
  const [geoData,     setGeoData]     = useState(null)
  const [mapMode,     setMapMode]     = useState('choropleth')
  const [dots,        setDots]        = useState([])
  const [dotsLoading, setDotsLoading] = useState(false)
  const [dotsError,   setDotsError]   = useState(false)
>>>>>>> kiw

/* ════════════════════════════════════════════════════════ */
export default function DistrictMap({ districts, selectedDistrict, onSelectDistrict }) {
  const [geoData,      setGeoData]      = useState(null)
  const [mapMode,      setMapMode]      = useState('choropleth')
  const [dots,         setDots]         = useState([])
  const [dotsLoaded,   setDotsLoaded]   = useState(0)
  const [dotsTotal,    setDotsTotal]    = useState(null)
  const [dotsLoading,  setDotsLoading]  = useState(false)
  const [dotsError,    setDotsError]    = useState(false)
  useEffect(() => {
    fetch('/bangkok_districts.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setGeoData(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mapMode !== 'dots' || dots.length > 0 || dotsLoading) return
<<<<<<< HEAD
    setDotsLoading(true)
    setDotsError(false)
    fetchAllDots((loaded, total) => {
      setDotsLoaded(loaded)
      if (total) setDotsTotal(total)
    })
      .then(all => { setDots(all); setDotsLoaded(all.length) })
=======
    setDotsLoading(true); setDotsError(false)
    fetchAllDots(() => {})
      .then(all => setDots(all))
>>>>>>> kiw
      .catch(() => setDotsError(true))
      .finally(() => setDotsLoading(false))
  }, [mapMode])

  const counts = Object.values(districts).map(d => d.total || 0)
  const max    = Math.max(...counts, 1)

  const styleFeature = (feature) => {
    const name       = feature.properties.dname || feature.properties.name
    const d          = districts[name]
<<<<<<< HEAD
    const count      = d?.total || 0
    const isSelected = name === selectedDistrict
    const fill       = getBucket(count, max)
    return {
      fillColor:   fill || 'rgba(255,255,255,0.04)',
      weight:      isSelected ? 2 : 0.8,
      color:       isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.22)',
      fillOpacity: fill ? (isSelected ? 0.78 : 0.62) : 0.12,
=======
    const isSelected = name === selectedDistrict
    const fill       = getBucket(d?.total || 0, max)
    return {
      fillColor:   fill || 'rgba(255,255,255,0.04)',
      weight:      isSelected ? 2 : 0.8,
      color:       isSelected ? '#FFF' : 'rgba(255,255,255,0.22)',
      fillOpacity: fill ? (isSelected ? 0.80 : 0.63) : 0.12,
>>>>>>> kiw
    }
  }

  const onEachFeature = (feature, layer) => {
    const name  = feature.properties.dname || feature.properties.name
    const d     = districts[name]
    const count = d?.total || 0
<<<<<<< HEAD
    const rr    = d && d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
=======
    const rr    = d?.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
>>>>>>> kiw
    const days  = Math.round(d?.avg_days || 0)
    const rrC   = rr >= 70 ? '#5BD1B8' : rr >= 50 ? '#E9C46A' : '#E63946'
    layer.bindTooltip(`
      <div style="font-family:'IBM Plex Sans Thai',sans-serif;padding:10px 14px;
        background:#0D1117;border:1px solid rgba(255,255,255,0.12);border-radius:10px;
        white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,0.6)">
<<<<<<< HEAD
        <div style="color:#E7EEF5;font-size:13px;font-weight:700;margin-bottom:6px;">
          เขต${name}
        </div>
        <div style="display:grid;grid-template-columns:auto auto;gap:2px 12px">
=======
        <div style="color:#E7EEF5;font-size:13px;font-weight:700;margin-bottom:6px">เขต${name}</div>
        <div style="display:grid;grid-template-columns:auto auto;gap:2px 14px">
>>>>>>> kiw
          <span style="color:#8DA0B4;font-size:11px">ร้องเรียน</span>
          <span style="color:#F9CA24;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600">${count.toLocaleString()} เรื่อง</span>
          <span style="color:#8DA0B4;font-size:11px">แก้ไขแล้ว</span>
          <span style="color:${rrC};font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600">${rr}%</span>
          <span style="color:#8DA0B4;font-size:11px">เฉลี่ย</span>
<<<<<<< HEAD
          <span style="color:#A0B8CC;font-family:'IBM Plex Mono',monospace;font-size:12px">${days} วัน/เรื่อง</span>
=======
          <span style="color:#A0B8CC;font-family:'IBM Plex Mono',monospace;font-size:12px">${days} วัน</span>
>>>>>>> kiw
        </div>
      </div>
    `, { sticky: true, opacity: 1 })
    layer.on({
      click:     () => onSelectDistrict(name === selectedDistrict ? null : name),
<<<<<<< HEAD
      mouseover: e  => { e.target.setStyle({ fillOpacity:0.9, weight:2, color:'rgba(255,255,255,0.7)' }); e.target.bringToFront() },
=======
      mouseover: e  => { e.target.setStyle({ fillOpacity:0.92, weight:2, color:'rgba(255,255,255,0.7)' }); e.target.bringToFront() },
>>>>>>> kiw
      mouseout:  e  => e.target.setStyle(styleFeature(feature)),
    })
  }

<<<<<<< HEAD
  const selData  = selectedDistrict ? districts[selectedDistrict] : null
  const selCount = selData?.total || 0
  const selRr    = selData && selData.total > 0 ? Math.round((selData.resolved / selData.total) * 100) : 0
  const selDays  = Math.round(selData?.avg_days || 0)
  const rrColor  = selRr >= 70 ? '#5BD1B8' : selRr >= 50 ? '#E9C46A' : '#E63946'
=======
  const selData = selectedDistrict ? districts[selectedDistrict] : null
>>>>>>> kiw

  const CARD = {
    background:'var(--panel)', border:'1px solid var(--line)',
    borderRadius:'var(--radius)', padding:'16px 17px',
    display:'flex', flexDirection:'column', gap:10,
  }

  /* Loading progress % */
  const loadPct = dotsTotal ? Math.min(99, Math.round((dotsLoaded / dotsTotal) * 100)) : null

  return (
    <section style={CARD}>
<<<<<<< HEAD
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--ink)' }}>
            {mapMode === 'choropleth' ? 'แผนที่ปัญหารายเขต' : 'จุดปัญหาจาก Traffy (live)'}
          </h2>
          <div style={{ color:'var(--faint)', fontSize:12, marginTop:2 }}>
            {mapMode === 'choropleth'
              ? (selectedDistrict ? `เลือก: เขต${selectedDistrict} · คลิกอีกครั้งเพื่อยกเลิก` : 'คลิกที่เขตเพื่อดูรายละเอียด')
              : dotsLoading
                ? `⏳ กำลังโหลดจุดปัญหา...`
                : dotsError
                  ? '❌ โหลดไม่สำเร็จ'
                  : `${dots.length.toLocaleString()} จุด · hover เพื่อดูรายละเอียด`}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {/* Mode toggle */}
          <div style={{ display:'flex', background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:3, gap:2 }}>
            {[
              { key:'choropleth', label:'🗺️ รายเขต'   },
              { key:'dots',       label:'📍 จุดปัญหา' },
            ].map(m => (
=======

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
              : `${dots.length.toLocaleString()} จุด · hover เพื่อดูรายละเอียด`}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {/* mode toggle */}
          <div style={{ display:'flex', background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:3, gap:2 }}>
            {[{ key:'choropleth', label:'🗺️ รายเขต' }, { key:'dots', label:'📍 จุดปัญหา' }].map(m => (
>>>>>>> kiw
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

<<<<<<< HEAD
          {selData && mapMode === 'choropleth' && (
            <div style={{ background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10, padding:'6px 12px', textAlign:'right' }}>
              <div style={{ fontSize:10, color:'var(--faint)', marginBottom:2 }}>เขต{selectedDistrict}</div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                {[
                  { v: selCount.toLocaleString(), u:'เรื่อง',   c:'var(--ink)' },
                  { v: `${selRr}%`,               u:'แก้ไขแล้ว', c:rrColor     },
                  { v: selDays,                   u:'วัน/เรื่อง', c:'var(--ink)' },
                ].map(x => (
                  <div key={x.u}>
                    <div style={{ fontSize:16, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:x.c }}>{x.v}</div>
=======
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
>>>>>>> kiw
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
<<<<<<< HEAD
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
=======
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
>>>>>>> kiw
          {BUCKETS.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:12, height:12, borderRadius:3, background:c }}/>
              <span style={{ fontSize:10, color:'var(--faint)' }}>{LABELS[i]}</span>
            </div>
          ))}
          {selectedDistrict && (
            <button onClick={() => onSelectDistrict(null)} style={{
<<<<<<< HEAD
              marginLeft:'auto', background:'none', border:'1px solid var(--line)', color:'var(--faint)',
              borderRadius:7, padding:'3px 9px', fontSize:11, fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--faint)' }}>
              ยกเลิก ✕
            </button>
=======
              marginLeft:'auto', background:'none', border:'1px solid var(--line)',
              color:'var(--faint)', borderRadius:7, padding:'3px 9px',
              fontSize:11, fontFamily:'inherit', cursor:'pointer',
            }}>ยกเลิก ✕</button>
>>>>>>> kiw
          )}
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
<<<<<<< HEAD
          {[
            { label:'ถนน/ทางเท้า', color:'#F4A261' },
            { label:'น้ำ/ท่อ',     color:'#4F9FE0' },
            { label:'ขยะ',         color:'#6FC18A' },
            { label:'ไฟฟ้า',       color:'#E9C46A' },
            { label:'ต้นไม้',      color:'#34D399' },
            { label:'สัตว์',       color:'#C084FC' },
            { label:'อื่นๆ',       color:'#8DA0B4' },
          ].map(x => (
            <div key={x.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:x.color }}/>
              <span style={{ fontSize:10, color:'var(--faint)' }}>{x.label}</span>
            </div>
          ))}
          {dotsLoading && loadPct !== null && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:80, height:4, background:'var(--line)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${loadPct}%`, height:'100%', background:'var(--mint)', borderRadius:4, transition:'width 0.3s' }}/>
              </div>
              <span style={{ fontSize:10, color:'var(--mint)', fontFamily:'IBM Plex Mono,monospace' }}>{loadPct}%</span>
            </div>
          )}
          {!dotsLoading && dots.length > 0 && (
            <span style={{ fontSize:10, color:'var(--faint)', marginLeft:'auto' }}>
              {dots.length.toLocaleString()} จุด · hover เพื่อดูรายละเอียด
            </span>
          )}
=======
          {Object.entries(TYPE_CONFIG).map(([label, cfg]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:cfg.color }}/>
              <span style={{ fontSize:10, color:'var(--faint)' }}>{label}</span>
            </div>
          ))}
>>>>>>> kiw
        </div>
      )}

      {/* Map */}
      <div className="map-container">
        <MapContainer
<<<<<<< HEAD
          center={[13.756, 100.502]}
          zoom={10}
          zoomControl={true}
          scrollWheelZoom={true}
          style={{ height:'100%', width:'100%', minHeight:280, background:'#0D1117' }}
=======
          center={[13.756, 100.502]} zoom={10}
          zoomControl scrollWheelZoom
          style={{ height:'100%', width:'100%', minHeight:400, background:'#0D1117' }}
>>>>>>> kiw
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
<<<<<<< HEAD

=======
>>>>>>> kiw
              {mapMode === 'choropleth' && (
                <>
                  <GeoJSON
                    key={selectedDistrict + '-' + Object.keys(districts).length}
<<<<<<< HEAD
                    data={geoData}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
=======
                    data={geoData} style={styleFeature} onEachFeature={onEachFeature}
>>>>>>> kiw
                  />
                  <DistrictLabels geoData={geoData} districts={districts} selectedDistrict={selectedDistrict} />
                </>
              )}
<<<<<<< HEAD

              {mapMode === 'dots' && (
                <>
                  <GeoJSON
                    key="dot-outline"
                    data={geoData}
                    style={() => ({ fillColor:'transparent', fillOpacity:0, weight:0.7, color:'rgba(255,255,255,0.2)' })}
=======
              {mapMode === 'dots' && (
                <>
                  <GeoJSON key="outline" data={geoData}
                    style={() => ({ fillColor:'transparent', fillOpacity:0, weight:0.7, color:'rgba(255,255,255,0.18)' })}
>>>>>>> kiw
                  />
                  {dots.length > 0 && <CanvasDotLayer dots={dots} />}
                </>
              )}
            </>
          )}
        </MapContainer>

<<<<<<< HEAD
        {(!geoData || (mapMode === 'dots' && dotsLoading && dots.length === 0)) && (
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            background:'rgba(13,17,23,0.9)', borderRadius:10, gap:12,
          }}>
            <div style={{ color:'var(--faint)', fontSize:13 }}>
              {dotsLoading ? `📡 โหลดข้อมูล Traffy... ${dotsLoaded.toLocaleString()} จุด` : 'กำลังโหลดแผนที่…'}
            </div>
            {dotsLoading && loadPct !== null && (
              <div style={{ width:160, height:4, background:'var(--line)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${loadPct}%`, height:'100%', background:'var(--mint)', borderRadius:4, transition:'width 0.3s' }}/>
              </div>
            )}
          </div>
        )}

        <div style={{ position:'absolute', bottom:6, right:8, zIndex:1000, fontSize:9, color:'rgba(141,160,180,0.5)', pointerEvents:'none' }}>
=======
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
>>>>>>> kiw
          © OpenStreetMap · © CARTO · Traffy Fondue
        </div>
      </div>
    </section>
  )
}
