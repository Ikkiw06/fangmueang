import { useState, useEffect } from 'react'

const TRAFFY_API = 'https://api.traffy.in.th/survey'

const TYPE_MAP = {
  'ถนน/ทางเท้า': 'ถนน/ทางเท้า',
  'ถนน': 'ถนน/ทางเท้า',
  'ทางเท้า': 'ถนน/ทางเท้า',
  'น้ำท่วม': 'น้ำท่วม',
  'น้ำ': 'น้ำท่วม',
  'ท่อ': 'น้ำท่วม',
  'ขยะ': 'ขยะ',
  'สุขาภิบาล': 'ขยะ',
  'ไฟส่องสว่าง': 'ไฟส่องสว่าง',
  'ไฟ': 'ไฟส่องสว่าง',
  'ความปลอดภัย': 'ความปลอดภัย',
  'อาชญากรรม': 'ความปลอดภัย',
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

function normalizeState(raw) {
  if (!raw) return 'รอดำเนินการ'
  if (raw.includes('เสร็จ') || raw.includes('แล้ว') || raw.includes('เรียบร้อย')) return 'ดำเนินการแล้ว'
  if (raw.includes('กำลัง') || raw.includes('ดำเนินการ') || raw.includes('อยู่ระหว่าง')) return 'กำลังดำเนินการ'
  return 'รอดำเนินการ'
}

async function fetchTraffyLive() {
  const LIMIT = 1000
  let offset = 0
  const allItems = []
  while (true) {
    const res = await fetch(TRAFFY_API + '?limit=' + LIMIT + '&offset=' + offset, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    const items = json.results ?? json.data ?? (Array.isArray(json) ? json : [])
    if (!items.length) break
    allItems.push(...items)
    if (items.length < LIMIT) break
    offset += LIMIT
    if (offset >= 50000) break
  }
  return allItems
}

function aggregateTraffy(items) {
  const districts = {}
  const dots = []

  items.forEach(function(item) {
    const district = item.district || ''
    if (!district) return
    const type  = normalizeType(item.type)
    const state = normalizeState(item.state || '')
    const coords = (item.coords && item.coords.coordinates) || null
    const days = item.finish_time && item.timestamp
      ? Math.max(0, (new Date(item.finish_time) - new Date(item.timestamp)) / 86400000)
      : null

    if (!districts[district]) {
      districts[district] = { total: 0, resolved: 0, days_sum: 0, days_count: 0, types: {} }
    }
    const d = districts[district]
    d.total++
    if (state === 'ดำเนินการแล้ว') d.resolved++
    if (days !== null) { d.days_sum += days; d.days_count++ }
    d.types[type] = (d.types[type] || 0) + 1

    if (coords && coords[1] && coords[0]) {
      dots.push([coords[1], coords[0], type, state, district])
    }
  })

  let totalAll = 0, resolvedAll = 0, daysAll = 0, daysCount = 0
  const districtOut = {}

  Object.entries(districts).forEach(function([name, d]) {
    const avg_days = d.days_count > 0 ? Math.round(d.days_sum / d.days_count * 10) / 10 : 9
    districtOut[name] = {
      total: d.total,
      resolved: d.resolved,
      avg_days: avg_days,
      top_problems: Object.entries(d.types)
        .map(function([type, count]) {
          return { type: type, count: count, resolve_rate: Math.round(d.resolved / Math.max(d.total, 1) * 1000) / 1000 }
        })
        .sort(function(a, b) { return b.count - a.count }),
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
        resolve_rate: Math.round(resolvedAll / Math.max(totalAll, 1) * 1000) / 1000,
        avg_days: Math.round(daysAll / Math.max(daysCount, 1) * 10) / 10,
      },
      problem_types: ['ถนน/ทางเท้า', 'น้ำท่วม', 'ขยะ', 'ไฟส่องสว่าง', 'ความปลอดภัย', 'อื่นๆ'],
      districts: districtOut,
    },
    dots: dots,
  }
}

export function useData() {
  const [data,      setData]      = useState(null)
  const [liveDots,  setLiveDots]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [source,    setSource]    = useState('static')

  useEffect(function() {
    let cancelled = false

    async function load() {
      // 1. Try Traffy live API (works if CORS headers are open)
      try {
        const items = await fetchTraffyLive()
        if (cancelled) return
        if (items.length > 100) {
          const result = aggregateTraffy(items)
          setData(result.data)
          setLiveDots(result.dots)
          setSource('live')
          setLoading(false)
          return
        }
      } catch (_) {
        // CORS or network blocked — fall through to static
      }

      // 2. Fallback: static /data.json
      try {
        const res = await fetch('/data.json')
        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
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
    return function() { cancelled = true }
  }, [])

  return { data: data, liveDots: liveDots, loading: loading, error: error, source: source }
}
