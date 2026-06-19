// ── โซนภูมิศาสตร์ กรุงเทพฯ ──────────────────────────────────────────────────
export const ZONE_MAP = {
  'พระนคร':              'กลางเมือง',
  'ป้อมปราบศัตรูพ่าย':   'กลางเมือง',
  'สัมพันธวงศ์':          'กลางเมือง',
  'บางรัก':              'กลางเมือง',
  'สาทร':                'กลางเมือง',
  'บางคอแหลม':           'กลางเมือง',
  'ยานนาวา':             'กลางเมือง',
  'คลองสาน':             'กลางเมือง',
  'บางกอกน้อย':          'กลางเมือง',
  'บางกอกใหญ่':          'กลางเมือง',
  'ธนบุรี':              'กลางเมือง',
  'ดุสิต':               'กลางเมือง',
  'คลองเตย':             'กลางเมือง',
  'วัฒนา':               'กลางเมือง',
  'จตุจักร':             'กรุงเทพเหนือ',
  'ลาดพร้าว':            'กรุงเทพเหนือ',
  'ห้วยขวาง':            'กรุงเทพเหนือ',
  'วังทองหลาง':          'กรุงเทพเหนือ',
  'ดอนเมือง':            'กรุงเทพเหนือ',
  'สายไหม':              'กรุงเทพเหนือ',
  'บางเขน':              'กรุงเทพเหนือ',
  'หลักสี่':             'กรุงเทพเหนือ',
  'บางซื่อ':             'กรุงเทพเหนือ',
  'มีนบุรี':             'กรุงเทพตะวันออก',
  'หนองจอก':             'กรุงเทพตะวันออก',
  'ลาดกระบัง':           'กรุงเทพตะวันออก',
  'สะพานสูง':            'กรุงเทพตะวันออก',
  'คันนายาว':            'กรุงเทพตะวันออก',
  'คลองสามวา':           'กรุงเทพตะวันออก',
  'บางกะปิ':             'กรุงเทพตะวันออก',
  'บึงกุ่ม':             'กรุงเทพตะวันออก',
  'สาวหัว':              'กรุงเทพตะวันออก',
  'ตลิ่งชัน':            'กรุงเทพตะวันตก',
  'ทวีวัฒนา':            'กรุงเทพตะวันตก',
  'บางแค':               'กรุงเทพตะวันตก',
  'ภาษีเจริญ':           'กรุงเทพตะวันตก',
  'หนองแขม':             'กรุงเทพตะวันตก',
  'บางบอน':              'กรุงเทพตะวันตก',
  'บางขุนเทียน':         'กรุงเทพใต้',
  'จอมทอง':              'กรุงเทพใต้',
  'ราษฎร์บูรณะ':         'กรุงเทพใต้',
  'ทุ่งครุ':             'กรุงเทพใต้',
  'พระโขนง':             'กรุงเทพตะวันออกเฉียงใต้',
  'บางนา':               'กรุงเทพตะวันออกเฉียงใต้',
  'สวนหลวง':             'กรุงเทพตะวันออกเฉียงใต้',
  'ประเวศ':              'กรุงเทพตะวันออกเฉียงใต้',
  'พัฒนาการ':            'กรุงเทพตะวันออกเฉียงใต้',
}

// ── ฤดูฝน: พฤษภาคม–ตุลาคม (เดือน 5–10) ─────────────────────────────────────
const now           = new Date()
const CURRENT_MONTH = now.getMonth() + 1            // 1–12
export const IS_RAINY_SEASON = CURRENT_MONTH >= 5 && CURRENT_MONTH <= 10
// เดือนพีค (ก.ค.–ก.ย.): น้ำท่วมรุนแรงที่สุด
export const IS_PEAK_FLOOD   = CURRENT_MONTH >= 7 && CURRENT_MONTH <= 9

// ── คำนวณแนวโน้มรายเดือน (linear regression) ─────────────────────────────────
export function computeTrend(monthly = []) {
  if (!monthly || monthly.length < 2) return { slope:0, pctChange:0, lastCount:0, prevAvg:0, rising:false }

  const recent = monthly.slice(-6)
  const counts = recent.map(m => m.count)

  const last    = counts[counts.length - 1]
  const prevAvg = counts.slice(0, -1).reduce((s, v) => s + v, 0) / (counts.length - 1)

  const n      = counts.length
  const xMean  = (n - 1) / 2
  const yMean  = counts.reduce((s, y) => s + y, 0) / n
  const num    = counts.reduce((s, y, i) => s + (i - xMean) * (y - yMean), 0)
  const den    = counts.reduce((s, _, i) => s + (i - xMean) ** 2, 0)
  const slope  = den > 0 ? num / den : 0

  const pctChange = prevAvg > 0 ? ((last - prevAvg) / prevAvg) * 100 : 0
  const last3     = counts.slice(-3)
  const rising    = last3.length === 3 && last3[1] > last3[0] && last3[2] > last3[1]

  return { slope, pctChange, lastCount: last, prevAvg, rising }
}

// ── ดึง proportion ของประเภทปัญหาในเขต ───────────────────────────────────────
function typeRatio(district, typeName) {
  const prob = district.top_problems?.find(p => p.type === typeName)
  if (!prob || !district.total) return 0
  return prob.count / district.total
}

// ── ประเมินความเสี่ยงน้ำท่วม ─────────────────────────────────────────────────
// ใช้ proportion ของ น้ำท่วม × overall monthly trend × seasonal factor
function floodRiskScore(district, trend) {
  const ratio    = typeRatio(district, 'น้ำท่วม')
  if (ratio < 0.05) return 0                          // น้ำท่วมน้อยมาก ข้ามไป

  const seasonal = IS_PEAK_FLOOD ? 2.0 : IS_RAINY_SEASON ? 1.5 : 0.7
  const trendBonus = trend.rising ? 1.4 : trend.pctChange > 0 ? 1.0 : 0.5

  // score 0–100
  return Math.min(100, ratio * 200 * seasonal * trendBonus)
}

// ── ประเมินความเสี่ยงเหตุการณ์อันตราย ────────────────────────────────────────
function safetyRiskScore(district, trend) {
  const ratio = typeRatio(district, 'ความปลอดภัย')
  if (ratio < 0.08) return 0
  const trendBonus = trend.rising ? 1.5 : trend.pctChange > 20 ? 1.2 : 1.0
  return Math.min(100, ratio * 300 * trendBonus)
}

// ── ตรวจสอบหลายประเภทพุ่งพร้อมกัน (multi-hazard) ────────────────────────────
function multiHazardCount(district, trend) {
  // นับประเภทที่มี ratio > 10% และ overall trend rising
  if (!trend.rising && trend.pctChange < 20) return 0
  return (district.top_problems || [])
    .filter(p => p.count / Math.max(district.total, 1) > 0.10)
    .length
}

// ── สร้าง alert messages ──────────────────────────────────────────────────────
const SEASON_LABEL = IS_PEAK_FLOOD   ? '(ช่วงพีคฤดูฝน ก.ค.–ก.ย.)'
                   : IS_RAINY_SEASON  ? '(ฤดูฝน พ.ค.–ต.ค.)'
                   : ''

function buildFloodMsg(name, score, trend) {
  const pct = Math.abs(Math.round(trend.pctChange))
  if (score >= 70)
    return `🌊 เขต${name} — คาดว่าน้ำจะท่วม${SEASON_LABEL} รายงานน้ำท่วม${trend.rising ? 'เพิ่มขึ้นต่อเนื่อง' : `พุ่งขึ้น ${pct}%`}`
  return `🌧️ เขต${name} — เฝ้าระวังน้ำท่วม ${SEASON_LABEL} แนวโน้มรายงานเพิ่มขึ้น`
}

function buildSafetyMsg(name, score, trend) {
  const pct = Math.abs(Math.round(trend.pctChange))
  if (score >= 70)
    return `🚨 เขต${name} — เหตุการณ์อันตรายเพิ่มสูงขึ้น ${pct > 0 ? `+${pct}%` : ''}  ต้องการการเฝ้าระวัง`
  return `⚠️ เขต${name} — รายงานความปลอดภัยเพิ่มขึ้น ควรติดตามสถานการณ์`
}

function buildDisasterMsg(name, types) {
  const typeStr = types.slice(0, 3).join(' + ')
  return `🆘 เขต${name} — ภัยซ้อน: ${typeStr} เพิ่มขึ้นพร้อมกัน ${SEASON_LABEL}`
}

// ── detectAlerts ─────────────────────────────────────────────────────────────
export function detectAlerts(districts = {}) {
  const districtAlerts = []
  const hazardAlerts   = []          // flood / safety / disaster
  const zoneTrends     = {}
  const zoneFlood      = {}          // zone → flood districts

  Object.entries(districts).forEach(([name, d]) => {
    const trend  = computeTrend(d.monthly)
    const zone   = ZONE_MAP[name] || 'อื่นๆ'
    const total  = d.total || 0
    const resolve = Math.round((d.resolved / Math.max(total, 1)) * 100)
    const topType = d.top_problems?.[0]?.type

    // ── 1. Flood risk ────────────────────────────────────────────────────────
    const fScore = floodRiskScore(d, trend)
    if (fScore >= 30) {
      const fSev = fScore >= 70 ? 'disaster' : fScore >= 50 ? 'critical' : 'warning'
      hazardAlerts.push({
        id:       `flood-${name}`,
        alertType:'flood',
        type:     'hazard',
        name, zone, total, resolve,
        severity: fSev,
        score:    fScore,
        trend,
        message:  buildFloodMsg(name, fScore, trend),
      })
      if (!zoneFlood[zone]) zoneFlood[zone] = []
      zoneFlood[zone].push({ name, fScore })
    }

    // ── 2. Safety / danger risk ──────────────────────────────────────────────
    const sScore = safetyRiskScore(d, trend)
    if (sScore >= 35) {
      hazardAlerts.push({
        id:       `safety-${name}`,
        alertType:'safety',
        type:     'hazard',
        name, zone, total, resolve,
        severity: sScore >= 70 ? 'critical' : 'warning',
        score:    sScore,
        trend,
        message:  buildSafetyMsg(name, sScore, trend),
      })
    }

    // ── 3. Multi-hazard disaster ─────────────────────────────────────────────
    const hCount = multiHazardCount(d, trend)
    if (hCount >= 3 && fScore >= 30) {
      const types = (d.top_problems || []).slice(0, 3).map(p => p.type)
      hazardAlerts.push({
        id:       `disaster-${name}`,
        alertType:'disaster',
        type:     'hazard',
        name, zone, total, resolve,
        severity: 'disaster',
        score:    100,
        trend,
        message:  buildDisasterMsg(name, types),
      })
    }

    // ── 4. General trend alert ───────────────────────────────────────────────
    const pct = trend.pctChange
    let sev = null
    if (pct >= 40 || (trend.rising && pct >= 20)) sev = 'critical'
    else if (pct >= 20 || trend.rising)            sev = 'warning'
    if (sev) {
      districtAlerts.push({
        id:      `district-${name}`,
        type:    'district',
        name, zone, topType, total, resolve,
        severity: sev,
        pctChange: pct,
        rising:  trend.rising,
        slope:   trend.slope,
        monthly: d.monthly,
        message: pct >= 40
          ? `เขต${name} — ${topType || 'ปัญหา'}พุ่งขึ้น ${Math.round(pct)}% ในเดือนที่ผ่านมา`
          : trend.rising
          ? `เขต${name} — ${topType || 'ปัญหา'} เพิ่มขึ้นต่อเนื่อง 3 เดือนซ้อน`
          : `เขต${name} — ${topType || 'ปัญหา'} เพิ่มขึ้น ${Math.round(pct)}% เทียบค่าเฉลี่ย`,
      })
      if (!zoneTrends[zone]) zoneTrends[zone] = []
      zoneTrends[zone].push({ name, pctChange: pct, topType, sev })
    }
  })

  // ── 5. Flood cluster: โซนที่มี ≥2 เขตเสี่ยงน้ำท่วมพร้อมกัน ────────────────
  const clusterAlerts = []
  Object.entries(zoneFlood).forEach(([zone, list]) => {
    if (list.length < 2) return
    const maxScore = Math.max(...list.map(l => l.fScore))
    const names    = list.sort((a,b) => b.fScore - a.fScore).map(l => l.name).slice(0, 4)
    clusterAlerts.push({
      id:       `floodcluster-${zone}`,
      type:     'cluster',
      alertType:'flood',
      zone,
      districts: names,
      count:    list.length,
      topTypes: ['น้ำท่วม'],
      severity: maxScore >= 70 ? 'disaster' : 'critical',
      message:  `🌊 ภัยน้ำท่วมกระจายวงกว้าง — โซน${zone}: เขต${names.join(', ')} ${list.length} เขตรายงานน้ำท่วมพร้อมกัน ${SEASON_LABEL}`,
    })
  })

  // General cluster
  Object.entries(zoneTrends).forEach(([zone, dList]) => {
    if (dList.length < 2) return
    const critical = dList.filter(d => d.sev === 'critical').length
    const names    = dList.map(d => d.name).slice(0, 4)
    const topTypes = [...new Set(dList.map(d => d.topType).filter(Boolean))].slice(0, 2)
    clusterAlerts.push({
      id:       `cluster-${zone}`,
      type:     'cluster',
      alertType:'general',
      zone,
      districts: names,
      count:    dList.length,
      topTypes,
      severity: critical >= 2 ? 'critical' : 'warning',
      message:  `โซน${zone} — เขต${names.join(', ')} มีแนวโน้มปัญหา${topTypes.join('/')}เพิ่มขึ้นพร้อมกัน`,
    })
  })

  // ── เรียงตาม priority ────────────────────────────────────────────────────────
  const SEV_ORDER = { disaster:0, critical:1, warning:2 }
  const sortBySev = arr => arr.sort((a,b) => {
    const d = (SEV_ORDER[a.severity]??3) - (SEV_ORDER[b.severity]??3)
    return d !== 0 ? d : (b.score || b.pctChange || 0) - (a.score || a.pctChange || 0)
  })

  return {
    hazardAlerts:   sortBySev(hazardAlerts),
    districtAlerts: sortBySev(districtAlerts),
    clusterAlerts:  sortBySev(clusterAlerts),
    isRainySeason:  IS_RAINY_SEASON,
    isPeakFlood:    IS_PEAK_FLOOD,
  }
}
