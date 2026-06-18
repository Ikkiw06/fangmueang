/**
 * fetch_traffy.js — ดึงข้อมูลจริงจาก Traffy Fondue Public API
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
const API_BASE  = 'https://publicapi.traffy.in.th/share/teamchadchart/survey'
const PAGE_SIZE = 1000
const MAX_PAGES = 80        // max 80,000 records
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
  [['ถนน','ทางเท้า','ทางเดิน','ฟุตบาท','ผิวจราจร'],        'ถนน/ทางเท้า'],
  [['น้ำท่วม','น้ำขัง','ระบายน้ำ','ท่อระบาย'],              'น้ำท่วม'],
  [['ขยะ','กวาดขยะ','เก็บขยะ','มูลฝอย'],                    'ขยะ'],
  [['ไฟ','แสงสว่าง','โคมไฟ','หลอดไฟ'],                      'ไฟส่องสว่าง'],
  [['ความปลอดภัย','อาชญากรรม','ยาเสพติด','สารเสพติด','อันตราย'], 'ความปลอดภัย'],
]

const RESOLVED_STATES = new Set([
  'เสร็จสิ้น','แก้ไขแล้ว','ดำเนินการแล้ว','resolved','closed','done',
])

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

/* ─── Helpers ─────────────────────────────────────────── */
function normalizeType(raw) {
  if (!raw) return 'อื่นๆ'
  const r = String(raw).trim()
  for (const [keywords, label] of TYPE_KEYWORDS) {
    if (keywords.some(k => r.includes(k))) return label
  }
  return 'อื่นๆ'
}

function normalizeDistrict(record) {
  // Try multiple possible field names
  const candidates = [
    record.district,
    record.address_district,
    record.subdistrict,
  ].filter(Boolean)

  for (const raw of candidates) {
    const clean = String(raw).trim().replace(/^เขต\s*/, '')
    if (BKK_DISTRICTS.has(clean)) return clean
  }
  return null
}

function getField(record, ...keys) {
  for (const k of keys) if (record[k] !== undefined && record[k] !== null) return record[k]
  return null
}

function daysBetween(t1, t2) {
  if (!t1 || !t2) return 0
  const d = (new Date(t2) - new Date(t1)) / 86400000
  return d > 0 ? d : 0
}

/* ─── Test mode ───────────────────────────────────────── */
if (IS_TEST) {
  console.log('🔍 TEST MODE — ดึง 5 records เพื่อดู structure\n')
  const res  = await fetch(`${API_BASE}?limit=5`)
  const json = await res.json()
  const batch = Array.isArray(json) ? json : (json.results || json.data || [])

  console.log('=== API Response keys (top-level) ===')
  console.log(Object.keys(json))

  if (batch.length > 0) {
    console.log('\n=== First record keys ===')
    console.log(Object.keys(batch[0]))
    console.log('\n=== First record (sample) ===')
    console.log(JSON.stringify(batch[0], null, 2))
    console.log('\n=== District values (5 records) ===')
    batch.forEach((r, i) => {
      console.log(`  [${i}] district="${r.district}" address_district="${r.address_district}" state="${r.state || r.status}"`)
    })
  }
  process.exit(0)
}

/* ─── Fetch all ───────────────────────────────────────── */
async function fetchAll() {
  const records = []
  let offset = 0
  let totalCount = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}`
    process.stdout.write(`\r📥 ดึงข้อมูล... ${records.length.toLocaleString()}${totalCount ? ' / ' + totalCount.toLocaleString() : ''} records`)

    const res = await fetch(url)
    if (!res.ok) { console.error(`\n❌ HTTP ${res.status}`); break }

    const json  = await res.json()
    const batch = Array.isArray(json) ? json : (json.results || json.data || [])
    if (totalCount === null && json.count) totalCount = json.count

    if (!batch.length) break
    records.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  console.log(`\n✅ ดึงมาได้ ${records.length.toLocaleString()} records`)
  return records
}

/* ─── Process ─────────────────────────────────────────── */
function processRecords(records) {
  const dist = {}
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)  // last 12 months

  let skipped = 0

  for (const r of records) {
    const dname = normalizeDistrict(r)
    if (!dname) { skipped++; continue }

    const ts     = getField(r, 'timestamp', 'created_at', 'date', 'report_date')
    const tsDate = ts ? new Date(ts) : null
    if (!tsDate || isNaN(tsDate) || tsDate < cutoff) continue

    const rawType = getField(r, 'type', 'problem_type', 'problem_type_detail', 'category')
    const type    = normalizeType(rawType)
    const state   = String(getField(r, 'state', 'status') || '').trim()
    const resolved = RESOLVED_STATES.has(state)
    const lastAct  = getField(r, 'last_activity', 'updated_at', 'finished_at')
    const days     = resolved ? daysBetween(ts, lastAct) : 0

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
console.log('🚀 Fang Mueang — Traffy Fondue Data Fetcher\n')
const records = await fetchAll()

if (!records.length) {
  console.error('❌ ไม่ได้รับข้อมูล — ตรวจสอบ internet หรือลอง node fetch_traffy.js --test')
  process.exit(1)
}

console.log('⚙️  กำลัง process...')
const output = processRecords(records)

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')

const dm = Object.keys(output.districts).length
console.log(`\n✅ บันทึกแล้ว → public/data.json`)
console.log(`   เขตที่มีข้อมูล : ${dm}/50 เขต`)
console.log(`   ร้องเรียนทั้งหมด: ${output.metadata.total.toLocaleString()} เรื่อง`)
console.log(`   อัตราแก้ไข     : ${Math.round(output.city_avg.resolve_rate * 100)}%`)
console.log(`   เวลาเฉลี่ย     : ${output.city_avg.avg_days} วัน/เรื่อง`)
if (dm < 50) console.log(`\n⚠️  ข้อมูลครบ ${dm}/50 เขต — เขตที่เหลืออาจไม่มีเรื่องในช่วงนี้`)
