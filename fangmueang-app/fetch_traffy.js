/**
 * fetch_traffy.js — ดึงข้อมูลจริงจาก Traffy Fondue Public API (GeoJSON v1)
 *
 * รัน (ทดสอบ — ดู field structure): node fetch_traffy.js --test
 * รัน (จริง — บันทึก data.json):    node fetch_traffy.js
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IS_TEST   = process.argv.includes('--test')

/* ─── Config ─────────────────────────────────────────── */
const API_BASE  = 'https://publicapi.traffy.in.th/teamchadchart-stat-api/geojson/v1'
const PAGE_SIZE = 1000
const MAX_PAGES = 100       // max 100,000 records
const OUT_FILE  = join(__dirname, 'public', 'data.json')

/* ─── Bangkok 50 เขต ──────────────────────────────────── */
const BKK_DISTRICTS = new Set([
  'พระนคร','สัมพันธวงศ์','ป้อมปราบศัตรูพ่าย','บางรัก','ปทุมวัน','ราชเทวี','พญาไท','ดุสิต',
  'บางซื่อ','จตุจักร','ดอนเมือง','หลักสี่','บางเขน','ดินแดง','ห้วยขวาง','คลองเตย',
  'ลาดพร้าว','สายไหม','วัฒนา','บางกะปิ','บางกอกใหญ่','ตลิ่งชัน','ทวีวัฒนา','วังทองหลาง',
  'บางพลัด','บางกอกน้อย','หนองแขม','บางแค','บึงกุ่ม','คันนายาว','ภาษีเจริญ','คลองสามวา',
  'บางนา','มีนบุรี','ประเวศ','สะพานสูง','พระโขนง','สวนหลวง','จอมทอง','ราษฎร์บูรณะ',
  'ทุ่งครุ','คลองสาน','ธนบุรี','บางบอน','บางขุนเทียน','สาทร','บางคอแหลม','ยานนาวา',
  'ลาดกระบัง','หนองจอก',
])

/* ─── Type mapping ────────────────────────────────────── */
const TYPE_KEYWORDS = [
  [['ถนน','ทางเท้า','ทางเดิน','ฟุตบาท','ผิวจราจร','จราจร'],   'ถนน/ทางเท้า'],
  [['น้ำท่วม','น้ำขัง','ระบายน้ำ','ท่อระบาย'],                 'น้ำท่วม'],
  [['ขยะ','กวาดขยะ','เก็บขยะ','มูลฝอย'],                       'ขยะ'],
  [['ไฟ','แสงสว่าง','โคมไฟ','หลอดไฟ','ไฟฟ้า'],                 'ไฟส่องสว่าง'],
  [['ความปลอดภัย','อาชญากรรม','ยาเสพติด','อันตราย'],           'ความปลอดภัย'],
]

/* state_type_latest = "finish" → resolved */
const RESOLVED_STATE_TYPES = new Set(['finish', 'finished'])
const RESOLVED_STATES = new Set([
  'เสร็จสิ้น','แก้ไขแล้ว','ดำเนินการแล้ว','resolved','closed','done',
])

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

/* ─── Helpers ─────────────────────────────────────────── */
function normalizeType(props) {
  // Try problem_type_fondue array first, then ai.type, then ai.categories
  const candidates = [
    ...(props.problem_type_fondue || []),
    props.ai?.type,
    ...(props.ai?.categories?.map(c => c.category) || []),
  ].filter(Boolean)

  for (const raw of candidates) {
    const r = String(raw).trim()
    for (const [keywords, label] of TYPE_KEYWORDS) {
      if (keywords.some(k => r.includes(k))) return label
    }
  }
  return 'อื่นๆ'
}

function normalizeDistrict(props) {
  const raw = props.district || ''
  const clean = String(raw).trim().replace(/^เขต\s*/, '')
  return BKK_DISTRICTS.has(clean) ? clean : null
}

function isResolved(props) {
  if (RESOLVED_STATE_TYPES.has(props.state_type_latest)) return true
  const s = String(props.state || '').trim()
  return RESOLVED_STATES.has(s)
}

function getDays(props) {
  // duration_minutes_finished = minutes from report to resolution
  if (props.duration_minutes_finished) return props.duration_minutes_finished / 1440
  if (props.duration_minutes_total)    return props.duration_minutes_total / 1440
  return 0
}

/* ─── Test mode ───────────────────────────────────────── */
if (IS_TEST) {
  console.log('🔍 TEST MODE — ดึง 5 records เพื่อดู structure\n')
  const res  = await fetch(`${API_BASE}?limit=5`)
  const json = await res.json()

  console.log('=== API Response keys ===')
  console.log(Object.keys(json))
  console.log('total:', json.total || json.count_total)

  const features = json.features || []
  if (features.length > 0) {
    const p = features[0].properties
    console.log('\n=== First record properties keys ===')
    console.log(Object.keys(p))
    console.log('\n=== Sample ===')
    console.log('district:', p.district)
    console.log('state:', p.state)
    console.log('state_type_latest:', p.state_type_latest)
    console.log('problem_type_fondue:', p.problem_type_fondue)
    console.log('ai.type:', p.ai?.type)
    console.log('timestamp:', p.timestamp)
    console.log('duration_minutes_finished:', p.duration_minutes_finished)

    console.log('\n=== All 5 records (district + state) ===')
    features.forEach((f, i) => {
      const pp = f.properties
      console.log(`  [${i}] district="${pp.district}" state="${pp.state}" state_type="${pp.state_type_latest}" type="${pp.problem_type_fondue}"`)
    })
  }
  process.exit(0)
}

/* ─── Fetch all ───────────────────────────────────────── */
async function fetchAll() {
  const features = []
  let offset = 0
  let totalCount = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}`
    process.stdout.write(`\r📥 ดึงข้อมูล... ${features.length.toLocaleString()}${totalCount ? ' / ~' + totalCount.toLocaleString() : ''} records`)

    const res = await fetch(url)
    if (!res.ok) { console.error(`\n❌ HTTP ${res.status}`); break }

    const json = await res.json()
    const batch = json.features || []

    if (totalCount === null && (json.total || json.count_total)) {
      totalCount = json.total || json.count_total
    }

    if (!batch.length) break
    features.push(...batch)

    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  console.log(`\n✅ ดึงมาได้ ${features.length.toLocaleString()} records`)
  return features
}

/* ─── Process ─────────────────────────────────────────── */
function processFeatures(features) {
  const dist = {}
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)  // last 12 months

  let skipped = 0

  for (const f of features) {
    const props  = f.properties || {}
    const dname  = normalizeDistrict(props)
    if (!dname) { skipped++; continue }

    const ts     = props.timestamp
    const tsDate = ts ? new Date(ts) : null
    if (!tsDate || isNaN(tsDate) || tsDate < cutoff) continue

    const type     = normalizeType(props)
    const resolved = isResolved(props)
    const days     = resolved ? getDays(props) : 0

    if (!dist[dname]) dist[dname] = { total:0, resolved:0, totalDays:0, resolvedCount:0, types:{}, monthly:{} }
    const d = dist[dname]
    d.total++
    if (resolved) { d.resolved++; d.totalDays += days; d.resolvedCount++ }

    if (!d.types[type]) d.types[type] = { count:0, resolved:0 }
    d.types[type].count++
    if (resolved) d.types[type].resolved++

    const mkey = `${tsDate.getFullYear()}-${tsDate.getMonth()}`
    if (!d.monthly[mkey]) d.monthly[mkey] = { year:tsDate.getFullYear(), m:tsDate.getMonth(), count:0, resolved:0 }
    d.monthly[mkey].count++
    if (resolved) d.monthly[mkey].resolved++
  }

  console.log(`   (ข้ามที่ไม่ใช่ กทม.: ${skipped.toLocaleString()} records)`)

  let cityTotal = 0, cityResolved = 0, cityDays = 0, cityRC = 0
  const districts = {}

  for (const [name, d] of Object.entries(dist)) {
    cityTotal    += d.total
    cityResolved += d.resolved
    cityDays     += d.totalDays
    cityRC       += d.resolvedCount

    const avgDays = d.resolvedCount > 0 ? +(d.totalDays / d.resolvedCount).toFixed(1) : 0

    const top_problems = Object.entries(d.types)
      .map(([type, v]) => ({
        type,
        count:        v.count,
        resolve_rate: v.count > 0 ? +(v.resolved / v.count).toFixed(3) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const monthly = Object.values(d.monthly)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.m - b.m)
      .slice(-12)
      .map(m => ({ month: MONTHS_TH[m.m], count: m.count, resolved: m.resolved }))

    districts[name] = { total: d.total, resolved: d.resolved, avg_days: avgDays, top_problems, monthly }
  }

  return {
    metadata: {
      total:           cityTotal,
      districts_count: Object.keys(districts).length,
      last_updated:    new Date().toISOString().slice(0, 10),
      source:          'Traffy Fondue (live)',
    },
    city_avg: {
      total:        cityTotal,
      resolve_rate: cityTotal > 0 ? +(cityResolved / cityTotal).toFixed(3) : 0,
      avg_days:     cityRC > 0 ? +(cityDays / cityRC).toFixed(1) : 0,
    },
    problem_types: ['ถนน/ทางเท้า','น้ำท่วม','ขยะ','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ'],
    districts,
  }
}

/* ─── Main ────────────────────────────────────────────── */
console.log('🚀 Fang Mueang — Traffy Fondue Data Fetcher (GeoJSON v1)\n')
const features = await fetchAll()

if (!features.length) {
  console.error('❌ ไม่ได้รับข้อมูล — ลอง: node fetch_traffy.js --test')
  process.exit(1)
}

console.log('⚙️  กำลัง process...')
const output = processFeatures(features)

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')

const dm = Object.keys(output.districts).length
console.log(`\n✅ บันทึกแล้ว → public/data.json`)
console.log(`   เขตที่มีข้อมูล : ${dm}/50 เขต`)
console.log(`   ร้องเรียนทั้งหมด: ${output.metadata.total.toLocaleString()} เรื่อง`)
console.log(`   อัตราแก้ไข     : ${Math.round(output.city_avg.resolve_rate * 100)}%`)
console.log(`   เวลาเฉลี่ย     : ${output.city_avg.avg_days} วัน/เรื่อง`)
if (dm < 50) console.log(`\n⚠️  ข้อมูลครบ ${dm}/50 เขต — เขตที่เหลืออาจไม่มีเรื่องในช่วงนี้`)
