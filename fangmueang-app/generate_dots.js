import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEO_PATH  = path.join(__dirname, 'public', 'bangkok_districts.geojson')
const DATA_PATH = path.join(__dirname, 'public', 'data.json')
const OUT_PATH  = path.join(__dirname, 'public', 'dots.json')
const MAX_PER_DISTRICT = 300

// Seeded PRNG
function seededRng(seed) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = seededRng(42)

const TYPES = ['ถนน/ทางเท้า','ขยะ','น้ำท่วม','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ']

function flattenRing(geometry) {
  const { type, coordinates: c } = geometry
  if (type === 'Polygon') return c[0]
  if (type === 'MultiPolygon') return c.reduce((a, b) => a[0].length >= b[0].length ? a : b)[0]
  return []
}

function pip(x, y, poly) {
  let inside = false, j = poly.length - 1
  for (let i = 0; i < poly.length; i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
    j = i
  }
  return inside
}

console.log('Reading GeoJSON and data...')
const geo  = JSON.parse(fs.readFileSync(GEO_PATH,  'utf8'))
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

const dots = []
for (const feat of geo.features) {
  const name = feat.properties.dname || feat.properties.name || ''
  const d    = data.districts?.[name]
  if (!d) continue
  const ring = flattenRing(feat.geometry)
  if (!ring.length) continue
  const xs = ring.map(p => p[0]), ys = ring.map(p => p[1])
  const minx = Math.min(...xs), maxx = Math.max(...xs)
  const miny = Math.min(...ys), maxy = Math.max(...ys)
  const total = d.total || 500
  const n     = Math.max(50, Math.min(MAX_PER_DISTRICT, Math.floor(total / 60)))
  const rr    = (d.resolved || 0) / Math.max(total, 1)
  let gen = 0, tries = 0
  while (gen < n && tries < n * 30) {
    tries++
    const x = minx + rand() * (maxx - minx)
    const y = miny + rand() * (maxy - miny)
    if (!pip(x, y, ring)) continue
    const tp = TYPES[Math.floor(rand() * TYPES.length)]
    const r  = rand()
    const st = r < rr * 0.9 ? 'ดำเนินการแล้ว' : r < rr * 0.9 + 0.12 ? 'กำลังดำเนินการ' : 'รอดำเนินการ'
    dots.push([+y.toFixed(5), +x.toFixed(5), tp, st, name])
    gen++
  }
  process.stdout.write(`\r  ${name}: ${gen} / total so far: ${dots.length}      `)
}

const out = JSON.stringify({ dots, fields: ['lat','lng','type','state','district'] })
fs.writeFileSync(OUT_PATH, out, 'utf8')
const mb = Buffer.byteLength(out, 'utf8') / 1024 / 1024
console.log(`\n✅ public/dots.json — ${mb.toFixed(2)} MB, ${dots.length} dots`)
