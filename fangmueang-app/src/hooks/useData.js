import { useState, useEffect } from 'react'

// ── Traffy Fondue Public API (Bangkok / BMA) ──────────────────────────────────
const TRAFFY_URL = 'https://publicapi.traffy.in.th/share/teamchadchart/getproblem'
const PAGE_SIZE  = 1000

// ── Type normalisation ────────────────────────────────────────────────────────
const TYPE_MAP = [
  { keys: ['ถนน', 'ทางเท้า', 'ผิวจราจร', 'สะพาน', 'อุโมงค์'],    out: 'ถนน/ทางเท้า' },
  { keys: ['น้ำท่วม', 'ท่อ', 'ระบายน้ำ', 'คลอง', 'น้ำ'],           out: 'น้ำท่วม' },
  { keys: ['ขยะ', 'สุขาภิบาล', 'กลิ่น', 'แมลง', 'สิ่งปฏิกูล'],    out: 'ขยะ' },
  { keys: ['ไฟ', 'แสงสว่าง', 'ไฟฟ้า', 'หลอด'],                      out: 'ไฟส่องสว่าง' },
  { keys: ['ความปลอดภัย', 'อาชญากรรม', 'ยาเสพติด', 'ทะเลาะ'],      out: 'ความปลอดภัย' },
]

function normalizeType(raw) {
  const vals = Array.isArray(raw) ? raw : (raw ? [String(raw)] : [])
  const combined = vals.join(' ')
  for (const { keys, out } of TYPE_MAP) {
    if (keys.some(k => combined.includes(k))) return out
  }
  return 'อื่นๆ'
}

// ── State normalisation ───────────────────────────────────────────────────────
const DONE_KEYWORDS = ['เสร็จ', 'แล้ว', 'เรียบร้อย', 'ปิด', 'resolved', 'done']
function isDone(state) {
  if (!state) return false
  return DONE_KEYWORDS.some(k => state.includes(k))
}

// ── District name: strip "เขต" prefix ────────────────────────────────────────
function districtName(raw) {
  if (!raw) return ''
  return raw.replace(/^เขต/, '').trim()
}

// ── Month label (Thai short) ──────────────────────────────────────────────────
const MONTH_LABEL = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                     'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

// ── Fetch a single page ───────────────────────────────────────────────────────
async function fetchPage(offset, start, end) {
  const url = new URL(TRAFFY_URL)
  url.searchParams.set('limit',  PAGE_SIZE)
  url.searchParams.set('offset', offset)
  if (start) url.searchParams.set('start', start)
  if (end)   url.searchParams.set('end',   end)
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Traffy API ' + res.status)
  return res.json()
}

// ── Fetch all pages (parallel batches of 5) ───────────────────────────────────
async function fetchAllPages(start, end, onProgress) {
  // Page 0 → get total
  const first = await fetchPage(0, start, end)
  const total = first.total ?? first.count ?? 0
  const items = first.results ?? first.data ?? (Array.isArray(first) ? first : [])
  if (!total || !items.length) throw new Error('Traffy returned 0 records')

  onProgress?.(items.length, total)

  const pages = Math.ceil(total / PAGE_SIZE)
  const all   = [...items]

  // Fetch remaining pages in batches of 5 parallel requests
  for (let batch = 1; batch < pages; batch += 5) {
    const ends = Math.min(batch + 5, pages)
    const fetches = []
    for (let p = batch; p < ends; p++) fetches.push(fetchPage(p * PAGE_SIZE, start, end))
    const results = await Promise.all(fetches)
    for (const r of results) {
      const rows = r.results ?? r.data ?? (Array.isArray(r) ? r : [])
      all.push(...rows)
    }
    onProgress?.(all.length, total)
  }

  return all
}

// ── Aggregate raw records → dashboard schema ──────────────────────────────────
function aggregateTraffy(items) {
  const districts  = {}
  const dots       = []

  items.forEach(item => {
    const name = districtName(item.district || item.amphoe || '')
    if (!name) return

    const type   = normalizeType(item.type)
    const done   = isDone(item.state)
    const coords = item.coords?.coordinates            // [lng, lat]
    const photo  = (item.photo ?? [])[0] ?? ''

    // Resolution days
    let days = null
    if (done && item.finish_time && item.timestamp) {
      days = Math.max(0, (new Date(item.finish_time) - new Date(item.timestamp)) / 86400000)
    }

    // Monthly bucket (use timestamp month)
    let monthKey = null
    if (item.timestamp) {
      const d = new Date(item.timestamp)
      monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`
    }

    if (!districts[name]) {
      districts[name] = {
        total: 0, resolved: 0,
        days_sum: 0, days_count: 0,
        types: {},
        months: {},
      }
    }
    const d = districts[name]
    d.total++
    if (done) d.resolved++
    if (days !== null) { d.days_sum += days; d.days_count++ }
    d.types[type] = (d.types[type] || 0) + 1
    if (monthKey) {
      if (!d.months[monthKey]) d.months[monthKey] = { count: 0, resolved: 0 }
      d.months[monthKey].count++
      if (done) d.months[monthKey].resolved++
    }

    // Dot layer
    if (coords?.[1] && coords?.[0]) {
      dots.push([coords[1], coords[0], type, done ? 'ดำเนินการแล้ว' : 'รอดำเนินการ', name, photo])
    }
  })

  // ── Build output ──────────────────────────────────────────────────────────
  let totalAll = 0, resolvedAll = 0, daysSumAll = 0, daysCountAll = 0
  const districtOut = {}

  Object.entries(districts).forEach(([name, d]) => {
    const avg_days = d.days_count > 0
      ? Math.round((d.days_sum / d.days_count) * 10) / 10
      : 9

    // Monthly series — last 12 months sorted chronologically
    const monthly = Object.entries(d.months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, m]) => {
        const [, mm] = key.split('-')
        return { month: MONTH_LABEL[parseInt(mm) - 1], count: m.count, resolved: m.resolved }
      })

    districtOut[name] = {
      total:    d.total,
      resolved: d.resolved,
      avg_days,
      monthly,
      top_problems: Object.entries(d.types)
        .map(([type, count]) => ({
          type,
          count,
          resolve_rate: Math.round(d.resolved / Math.max(d.total, 1) * 1000) / 1000,
        }))
        .sort((a, b) => b.count - a.count),
    }

    totalAll     += d.total
    resolvedAll  += d.resolved
    daysSumAll   += avg_days
    daysCountAll++
  })

  const data = {
    metadata: {
      total:           totalAll,
      districts_count: Object.keys(districtOut).length,
      last_updated:    new Date().toISOString().slice(0, 10),
      source:          'Traffy Fondue Live API',
    },
    city_avg: {
      total:        totalAll,
      resolve_rate: Math.round(resolvedAll / Math.max(totalAll, 1) * 1000) / 1000,
      avg_days:     Math.round(daysSumAll / Math.max(daysCountAll, 1) * 10) / 10,
    },
    problem_types: ['ถนน/ทางเท้า', 'น้ำท่วม', 'ขยะ', 'ไฟส่องสว่าง', 'ความปลอดภัย', 'อื่นๆ'],
    districts: districtOut,
  }

  return { data, dots }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useData() {
  const [data,     setData]     = useState(null)
  const [liveDots, setLiveDots] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [source,   setSource]   = useState('static')
  const [progress, setProgress] = useState(0)   // 0–1

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Date range: last 12 months
      const now   = new Date()
      const end   = now.toISOString().slice(0, 10)
      const start = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().slice(0, 10)

      // ── 1. Try Traffy live API ──────────────────────────────────────────
      try {
        const items = await fetchAllPages(start, end, (loaded, total) => {
          if (!cancelled) setProgress(loaded / total)
        })
        if (cancelled) return
        if (items.length > 100) {
          const result = aggregateTraffy(items)
          setData(result.data)
          setLiveDots(result.dots)
          setSource('live')
          setLoading(false)
          return
        }
      } catch (err) {
        // CORS or network blocked — fall through to static JSON
        console.warn('Traffy live fetch failed:', err.message)
      }

      // ── 2. Fallback: static /data.json ─────────────────────────────────
      if (cancelled) return
      try {
        const res = await fetch('/data.json')
        if (!res.ok) throw new Error('โหลดข้อมูลสำรองไม่สำเร็จ')
        const d = await res.json()
        if (!cancelled) {
          setData(d)
          setSource('static')
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, liveDots, loading, error, source, progress }
}
