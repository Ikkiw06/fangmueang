/**
 * fetch-traffy.mjs
 * รันด้วย: node scripts/fetch-traffy.mjs
 * ดึงข้อมูลทั้งหมดจาก Traffy Fondue API แล้วบันทึกเป็น public/data.json และ public/dots.json
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dir, '..', 'public')
const TRAFFY_API = 'https://api.traffy.in.th/survey'
const LIMIT = 1000

const TYPE_MAP = {
  'ถนน': 'ถนน/ทางเท้า', 'ทางเท้า': 'ถนน/ทางเท้า', 'ถนน/ทางเท้า': 'ถนน/ทางเท้า',
  'น้ำท่วม': 'น้ำท่วม', 'น้ำ': 'น้ำท่วม', 'ท่อ': 'น้ำท่วม',
  'ขยะ': 'ขยะ', 'สุขาภิบาล': 'ขยะ',
  'ไฟส่องสว่าง': 'ไฟส่องสว่าง', 'ไฟ': 'ไฟส่องสว่าง', 'ไฟฟ้า': 'ไฟส่องสว่าง',
  'ความปลอดภัย': 'ความปลอดภัย', 'อาชญากรรม': 'ความปลอดภัย',
}
function normalizeType(raw) {
  if (!raw) return 'อื่นๆ'
  const types = Array.isArray(raw) ? raw : [raw]
  for (const t of types) {
    const found = Object.entries(TYPE_MAP).find(([k]) => t.includes(k))
    if (found) return found[1]
  }
  return 'อื่นๆ'
}
function normalizeState(raw = '') {
  if (raw.includes('เสร็จ') || raw.includes('แล้ว') || raw.includes('เรียบร้อย')) return 'ดำเนินการแล้ว'
  if (raw.includes('กำลัง') || raw.includes('ดำเนินการ') || raw.includes('อยู่ระหว่าง')) return 'กำลังดำเนินการ'
  return 'รอดำเนินการ'
}

async function fetchAll() {
  let offset = 0
  const all = []
  process.stdout.write('Fetching from Traffy Fondue API')
  while (true) {
    const url = `${TRAFFY_API}?limit=${LIMIT}&offset=${offset}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`)
    const json = await res.json()
    const items = json.results ?? json.data ?? (Array.isArray(json) ? json : [])
    if (!items.length) break
    all.push(...items)
    process.stdout.write(` ${all.length}`)
    if (items.length < LIMIT) break
    offset += LIMIT
    if (offset >= 200000) break
  }
  console.log('\nTotal fetched:', all.length)
  return all
}

function aggregate(items) {
  const districts = {}
  const dots = []

  items.forEach(item => {
    const district = item.district || item.เขต || ''
    if (!district) return
    const type  = normalizeType(item.type || item.ประเภท)
    const state = normalizeState(item.state || item.สถานะ || '')
    const coords = item.coords?.coordinates || item.location?.coordinates || null
    const days = item.finish_time && item.timestamp
      ? Math.max(0, (new Date(item.finish_time) - new Date(item.timestamp)) / 86400000)
      : null

    if (!districts[district]) districts[district] = { total: 0, resolved: 0, days_sum: 0, days_count: 0, types: {} }
    const d = districts[district]
    d.total++
    if (state === 'ดำเนินการแล้ว') d.resolved++
    if (days !== null) { d.days_sum += days; d.days_count++ }
    d.types[type] = (d.types[type] || 0) + 1

    if (coords?.[1] && coords?.[0]) {
      dots.push([coords[1], coords[0], type, state, district])
    }
  })

  let totalAll = 0, resolvedAll = 0, daysAll = 0, daysCount = 0
  const districtOut = {}

  Object.entries(districts).forEach(([name, d]) => {
    const avg_days = d.days_count > 0 ? +(d.days_sum / d.days_count).toFixed(1) : 9
    districtOut[name] = {
      total: d.total, resolved: d.resolved, avg_days,
      top_problems: Object.entries(d.types)
        .map(([type, count]) => ({ type, count, resolve_rate: +(d.resolved / Math.max(d.total, 1)).toFixed(3) }))
        .sort((a, b) => b.count - a.count),
    }
    totalAll    += d.total
    resolvedAll += d.resolved
    daysAll     += avg_days
    daysCount++
  })

  return {
    data: {
      metadata: {
        total: totalAll,
        districts_count: Object.keys(districtOut).length,
        last_updated: new Date().toISOString().slice(0, 10),
        source: 'Traffy Fondue Live API',
      },
      city_avg: {
        total: totalAll,
        resolve_rate: +(resolvedAll / Math.max(totalAll, 1)).toFixed(3),
        avg_days: +(daysAll / Math.max(daysCount, 1)).toFixed(1),
      },
      problem_types: ['ถนน/ทางเท้า', 'น้ำท่วม', 'ขยะ', 'ไฟส่องสว่าง', 'ความปลอดภัย', 'อื่นๆ'],
      districts: districtOut,
    },
    dotsJson: { dots, fields: ['lat', 'lng', 'type', 'state', 'district'] },
  }
}

const items = await fetchAll()
const { data, dotsJson } = aggregate(items)

writeFileSync(join(PUBLIC, 'data.json'), JSON.stringify(data, null, 2), 'utf-8')
console.log(`✅ data.json — ${data.metadata.total} เรื่อง, ${data.metadata.districts_count} เขต`)

writeFileSync(join(PUBLIC, 'dots.json'), JSON.stringify(dotsJson), 'utf-8')
console.log(`✅ dots.json — ${dotsJson.dots.length} จุด`)
console.log('Done! รัน npm run dev เพื่อดูผลลัพธ์')
