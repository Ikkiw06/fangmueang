// node rebuild_map.js  — no npm install needed
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const GEO  = path.join(__dirname, 'public', 'bangkok_districts.geojson')
const DATA = path.join(__dirname, 'public', 'data.json')

// ── Overpass download ──────────────────────────────────────────────
function fetchOverpass() {
  return new Promise((resolve, reject) => {
    const query = `[out:json][timeout:90];
area["name:en"="Bangkok"]["admin_level"="4"]->.bkk;
relation(area.bkk)["admin_level"="6"]["boundary"="administrative"];
out body;>;out skel qt;`
    const body = 'data=' + encodeURIComponent(query)
    const req = https.request({
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: { 'Content-Type':'application/x-www-form-urlencoded',
                 'Content-Length': Buffer.byteLength(body), 'User-Agent':'FangMueang/1.0' }
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
    })
    req.on('error', reject)
    req.write(body); req.end()
  })
}

// ── Ring assembly (proper OSM multipolygon algorithm) ─────────────
function pt(p) { return [p.lon, p.lat] }
function same(a, b) { return Math.abs(a[0]-b[0])<1e-7 && Math.abs(a[1]-b[1])<1e-7 }
function closed(r) { return r.length>=2 && same(r[0], r[r.length-1]) }

function assembleRings(ways) {
  const segments = ways.map(w => w.map(pt))
  const rings = []
  const used = new Array(segments.length).fill(false)

  for (let start = 0; start < segments.length; start++) {
    if (used[start]) continue
    used[start] = true
    let ring = [...segments[start]]

    let changed = true
    while (!closed(ring) && changed) {
      changed = false
      const tail = ring[ring.length - 1]
      for (let i = 0; i < segments.length; i++) {
        if (used[i]) continue
        const s = segments[i]
        if (same(tail, s[0])) {
          ring = ring.concat(s.slice(1))
          used[i] = true; changed = true; break
        } else if (same(tail, s[s.length-1])) {
          ring = ring.concat([...s].reverse().slice(1))
          used[i] = true; changed = true; break
        }
      }
    }

    if (!closed(ring)) ring.push(ring[0]) // force close
    if (ring.length >= 4) rings.push(ring)
  }
  return rings
}

// ── Convert OSM relation → GeoJSON feature ─────────────────────────
function relationToFeature(rel, wayMap) {
  const tags = rel.tags || {}
  const name = tags['name'] || tags['name:th'] || ''
  const outerWays = (rel.members || [])
    .filter(m => m.type==='way' && m.role==='outer' && wayMap[m.ref])
    .map(m => wayMap[m.ref])
  const innerWays = (rel.members || [])
    .filter(m => m.type==='way' && m.role==='inner' && wayMap[m.ref])
    .map(m => wayMap[m.ref])

  const outerRings = assembleRings(outerWays)
  const innerRings = assembleRings(innerWays)

  if (outerRings.length === 0) return null

  let geometry
  if (outerRings.length === 1) {
    // Simple polygon: [outer, ...holes]
    const coords = [outerRings[0], ...innerRings]
    geometry = { type: 'Polygon', coordinates: coords }
  } else {
    // MultiPolygon: one polygon per outer ring
    geometry = {
      type: 'MultiPolygon',
      coordinates: outerRings.map(outer => {
        // Assign inner rings to this outer (simple centroid check skipped — add all to first)
        return [outer]
      })
    }
    if (innerRings.length > 0) {
      geometry.coordinates[0].push(...innerRings)
    }
  }

  return { type: 'Feature', properties: { name, dname: name, osm_id: rel.id }, geometry }
}

// ── Main ───────────────────────────────────────────────────────────
console.log('⏳ Downloading Bangkok districts from OpenStreetMap (~30s)...')
const osm = await fetchOverpass()

// Build way lookup: id → node coordinates array
const nodeMap = {}
const wayData = {}
for (const el of osm.elements) {
  if (el.type === 'node') nodeMap[el.id] = [el.lon, el.lat]
}
for (const el of osm.elements) {
  if (el.type === 'way') {
    wayData[el.id] = (el.nodes || []).map(nid => {
      const n = nodeMap[nid]
      return n ? { lon: n[0], lat: n[1] } : null
    }).filter(Boolean)
  }
}

const relations = osm.elements.filter(e => e.type === 'relation')
console.log(`✅ ${relations.length} relations, building polygons...`)

const SKIP = ['สมุทรสาคร','สมุทรปราการ','นนทบุรี','ปทุมธานี','นครปฐม','อำเภอ']
const features = relations
  .map(rel => relationToFeature(rel, wayData))
  .filter(f => f && f.properties.name.includes('เขต') && !SKIP.some(s => f.properties.name.includes(s)))
  .map((f, i) => {
    const clean = f.properties.name.replace(/^เขต/, '').trim()
    return { ...f, properties: { name: clean, dname: clean, id: i+1 } }
  })

console.log(`✅ ${features.length} Bangkok districts:`)
features.forEach(f => console.log(`   ${f.properties.name}`))

fs.writeFileSync(GEO, JSON.stringify({ type:'FeatureCollection', features }), 'utf8')
console.log('✅ GeoJSON saved')

// ── Rebuild data.json ──────────────────────────────────────────────
const names = features.map(f => f.properties.name)
let seed = 42
const rng = () => { seed=(seed*1664525+1013904223)&0xffffffff; return (seed>>>0)/0xffffffff }
const rnd = (lo,hi) => lo + rng()*(hi-lo)
const TYPES  = ['ถนน/ทางเท้า','น้ำท่วม','ขยะ','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ']
const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const FLOOD = new Set(['มีนบุรี','คลองสามวา','หนองจอก','บางขุนเทียน','ลาดกระบัง','บางนา','ดอนเมือง','ตลิ่งชัน','ราษฎร์บูรณะ'])
const ROAD  = new Set(['ลาดกระบัง','จตุจักร','ลาดพร้าว','บางเขน','ดอนเมือง','สายไหม','คันนายาว'])
const TRASH = new Set(['คลองเตย','สัมพันธวงศ์','ป้อมปราบศัตรูพ่าย','ยานนาวา','บางคอแหลม'])
const BIG   = new Set(['ลาดกระบัง','หนองจอก','คลองสามวา','บางขุนเทียน','สายไหม','บางเขน','ประเวศ'])
const districts = {}
for (const name of names) {
  const w = BIG.has(name)?1.8:1.0
  const base = Math.floor((800+rng()*1200)*w)
  const pw = p => p==='น้ำท่วม'?(FLOOD.has(name)?2.4:0.5):p==='ถนน/ทางเท้า'?(ROAD.has(name)?2.0:1.1):p==='ขยะ'?(TRASH.has(name)?2.2:0.8):0.5+rng()*1.0
  const rawW = Object.fromEntries(TYPES.map(t=>[t,pw(t)]))
  const tw = Object.values(rawW).reduce((a,b)=>a+b,0)
  const counts = Object.fromEntries(TYPES.map(t=>[t,Math.max(10,Math.floor(base*rawW[t]/tw))]))
  const total = Object.values(counts).reduce((a,b)=>a+b,0)
  const rr = rnd(0.58,0.90)
  const typeRes = Object.fromEntries(TYPES.map(t=>{
    const r = t==='ถนน/ทางเท้า'?rnd(0.45,0.78):t==='น้ำท่วม'?rnd(0.35,0.70):t==='ไฟส่องสว่าง'?rnd(0.72,0.96):t==='ขยะ'?rnd(0.65,0.92):t==='ความปลอดภัย'?rnd(0.55,0.83):rnd(0.60,0.88)
    return [t, Math.round(r*1000)/1000]
  }))
  const top_problems = TYPES.map(t=>({type:t,count:counts[t],resolve_rate:typeRes[t]})).sort((a,b)=>b.count-a.count)
  const bm = Math.floor(total/12)
  const monthly = MONTHS.map((month,i)=>{ const c=Math.max(10,Math.floor(bm*(1+0.15*((i-6)/6))*(0.8+rng()*0.4))); return {month,count:c,resolved:Math.floor(c*rr)} })
  districts[name]={total,resolved:Math.floor(total*rr),avg_days:Math.round(rnd(3.5,14.0)*10)/10,top_problems,monthly}
}
const totalAll = Object.values(districts).reduce((s,d)=>s+d.total,0)
fs.writeFileSync(DATA, JSON.stringify({
  metadata:{total:totalAll,districts_count:names.length,last_updated:'2024-12-31',source:'Traffy Fondue (demo)'},
  city_avg:{total:totalAll,resolve_rate:Math.round(Object.values(districts).reduce((s,d)=>s+d.resolved,0)/totalAll*1000)/1000,avg_days:Math.round(Object.values(districts).reduce((s,d)=>s+d.avg_days,0)/names.length*10)/10},
  problem_types:TYPES, districts
}), 'utf8')
console.log(`✅ data.json: ${names.length} districts, total=${totalAll.toLocaleString()}`)
console.log('\n🎉 Done! Now refresh localhost:5173')
