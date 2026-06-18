/**
 * fetch_traffy.js — ดึงข้อมูลจริงจาก Traffy Fondue Public API
 * รัน: node fetch_traffy.js
 * output: public/data.json
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/* ─── Config ─────────────────────────────────────────── */
const API_BASE   = 'https://publicapi.traffy.in.th/share/teamchadchart/survey'
const PAGE_SIZE  = 1000          // records per request
const MAX_PAGES  = 60            // safety cap (60,000 records max)
const OUT_FILE   = join(__dirname, 'public', 'data.json')

/* ─── Bangkok 50 districts (strip "เขต") ─────────────── */
const BKK_DISTRICTS = new Set([
  'พระนคร','สัมพันธวงศ์','ป้อมปราบศัตรูพ่าย','บางรัก','ปทุมวัน','ราชเทวี','พญาไท','ดุสิต',
  'บางซื่อ','จตุจักร','ดอนเมือง','หลักสี่','บางเขน','ดินแดง','ห้วยขวาง','คลองเตย',
  'ลาดพร้าว','สายไหม','วัฒนา','บางกะปิ','บางกอกใหญ่','ตลิ่งชัน','ทวีวัฒนา','วังทองหลาง',
  'บางพลัด','บางกอกน้อย','หนองแขม','บางแค','บึงกุ่ม','คันนายาว','ภาษีเจริญ','คลองสามวา',
  'บางนา','มีนบุรี','ประเวศ','สะพานสูง','พระโขนง','สวนหลวง','จอมทอง','ราษฎร์บูรณะ',
  'ทุ่งครุ','คลองสาน','ธนบุรี','บางบอน','บางขุนเทียน','สาทร','บางคอแหลม','ยานนาวา',
  'ลาดกระบัง','หนองจอก',
])

/* ─── Problem type mapping ────────────────────────────── */
const TYPE_MAP = {
  'ถนน':         'ถนน/ทางเท้า',
  'ทางเท้า':     'ถนน/ทางเท้า',
  'ทางเดิน':     'ถนน/ทางเท้า',
  'น้ำท่วม':     'น้ำท่วม',
  'น้ำขัง':      'น้ำท่วม',
  'ระบายน้ำ':    'น้ำท่วม',
  'ขยะ':         'ขยะ',
  'ไฟ':          'ไฟส่องสว่าง',
  'ไฟฟ้า':       'ไฟส่องสว่าง',
  'แสงสว่าง':    'ไฟส่องสว่าง',
  'ความปลอดภัย': 'ความปลอดภัย',
  'อาชญากรรม':  'ความปลอดภัย',
  'ยาเสพติด':   'ความปลอดภัย',
}

const RESOLVED_STATES = new Set(['เสร็จสิ้น', 'แก้ไขแล้ว', 'ดำเนินการแล้ว'])

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

/* ─── Helpers ─────────────────────────────────────────── */
function normalizeType(raw) {
  if (!raw) return 'อื่นๆ'
  const r = raw.trim()
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (r.includes(key)) return val
  }
  return 'อื่นๆ'
}

function normalizeDistrict(raw) {
  if (!raw) return null
  const r = raw.trim().replace(/^เขต/, '').trim()
  return BKK_DISTRICTS.has(r) ? r : null
}

function daysBetween(t1, t2) {
  const d = (new Date(t2) - new Date(t1)) / 86400000
  return d > 0 ? d : 0
}

/* ─── Fetch all records ───────────────────────────────── */
async function fetchAll() {
  const records = []
  let offset = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}`
    process.stdout.write(`\rกำลังดึงข้อมูล... ${records.length.toLocaleString()} records`)

    let res
    try {
      res = await fetch(url)
      if (!res.ok) { console.error(`\nHTTP ${res.status} — หยุด`); break }
    } catch (e) {
      console.error(`\nNetwork error: ${e.message}`); break
    }

    const json = await res.json()

    // Traffy API returns { results: [...] } or just [...]
    const batch = Array.isArray(json) ? json : (json.results || json.data || [])
    if (!batch.length) break

    records.push(...batch)
    if (batch.length < PAGE_SIZE) break  // last page
    offset += PAGE_SIZE
  }

  console.log(`\nดึงมาได้ ${records.length.toLocaleString()} records`)
  return records
}

/* ─── Process ─────────────────────────────────────────── */
function process(records) {
  // district → { total, resolved, totalDays, resolvedCount, types:{}, monthly:{} }
  const dist = {}

  let now = Date.now()
  let cutoff12m = new Date()
  cutoff12m.setFullYear(cutoff12m.getFullYear() - 1)

  for (const r of records) {
    const dname = normalizeDistrict(r.district || r.address_district || r.subdistrict)
    if (!dname) continue

    const ts      = r.timestamp || r.created_at || r.date
    const tsDate  = ts ? new Date(ts) : null
    if (!tsDate || tsDate < cutoff12m) continue  // keep last 12 months

    const type     = normalizeType(r.type || r.problem_type_detail || r.problem_type)
    const state    = r.state || r.status || ''
    const resolved = RESOLVED_STATES.has(state)
    const lastAct  = r.last_activity || r.updated_at || ts
    const days     = resolved ? daysBetween(ts, lastAct) : 0

    if (!dist[dname]) {
      dist[dname] = { total:0, resolved:0, totalDays:0, resolvedCount:0, types:{}, monthly:{} }
    }
    const d = dist[dname]
    d.total++
    if (resolved) { d.resolved++; d.totalDays += days; d.resolvedCount++ }

    // problem types
    if (!d.types[type]) d.types[type] = { count:0, resolved:0 }
    d.types[type].count++
    if (resolved) d.types[type].resolved++

    // monthly (last 12 months)
    if (tsDate) {
      const key = `${tsDate.getFullYear()}-${tsDate.getMonth()}`
      if (!d.monthly[key]) d.monthly[key] = { year:tsDate.getFullYear(), month:tsDate.getMonth(), count:0, resolved:0 }
      d.monthly[key].count++
      if (resolved) d.monthly[key].resolved++
    }
  }

  /* ── Build output ── */
  let cityTotal = 0, cityResolved = 0, cityDays = 0, cityResolvedCount = 0

  const districts = {}
  for (const [name, d] of Object.entries(dist)) {
    cityTotal         += d.total
    cityResolved      += d.resolved
    cityDays          += d.totalDays
    cityResolvedCount += d.resolvedCount

    const avgDays = d.resolvedCount > 0 ? +(d.totalDays / d.resolvedCount).toFixed(1) : 0

    const top_problems = Object.entries(d.types)
      .map(([type, v]) => ({
        type,
        count:        v.count,
        resolve_rate: v.count > 0 ? +(v.resolved / v.count).toFixed(3) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // monthly: sort by year+month, take last 12, label with Thai month
    const monthly = Object.values(d.monthly)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .slice(-12)
      .map(m => ({ month: MONTHS_TH[m.month], count: m.count, resolved: m.resolved }))

    districts[name] = {
      total:        d.total,
      resolved:     d.resolved,
      avg_days:     avgDays,
      top_problems,
      monthly,
    }
  }

  const cityAvgDays = cityResolvedCount > 0 ? +(cityDays / cityResolvedCount).toFixed(1) : 0

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
      avg_days:     cityAvgDays,
    },
    problem_types: ['ถนน/ทางเท้า','น้ำท่วม','ขยะ','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ'],
    districts,
  }
}

/* ─── Main ────────────────────────────────────────────── */
const records = await fetchAll()

if (records.length === 0) {
  console.error('ไม่ได้รับข้อมูล — ตรวจสอบ internet connection หรือ API endpoint')
  process.exit(1)
}

console.log('กำลัง process ข้อมูล...')
const output = process(records)

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')

console.log(`✅ บันทึกแล้ว: public/data.json`)
console.log(`   เขตที่มีข้อมูล: ${Object.keys(output.districts).length} เขต`)
console.log(`   เรื่องร้องเรียนทั้งหมด: ${output.metadata.total.toLocaleString()}`)
console.log(`   อัตราแก้ไข: ${Math.round(output.city_avg.resolve_rate * 100)}%`)
console.log(`   เวลาเฉลี่ย: ${output.city_avg.avg_days} วัน/เรื่อง`)
