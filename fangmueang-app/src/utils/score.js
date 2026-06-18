<<<<<<< HEAD
/**
 * Urban Health Score — composite per-district grade
 * Traffy Fondue shows individual complaints; we show EFFICIENCY + VOLUME analysis.
 *
 * Score (0–100):
 *   60% → Resolution rate (แก้ไขได้จริง)
 *   40% → Speed vs city average (เร็วกว่าเฉลี่ยเมือง)
 */

export function calcScore(district, cityAvg) {
  const total    = district.total || 0
  const resolved = district.resolved || 0
  const avgDays  = district.avg_days || 0
  const cityDays = cityAvg?.avg_days || 30

  if (total === 0) return null  // no data

  // Resolution rate score: 0–100
  const resolveScore = (resolved / total) * 100

  // Speed score: city avg as baseline (50 pts). Each day faster/slower = ±2 pts
  const speedScore = Math.max(0, Math.min(100, 50 + (cityDays - avgDays) * 2))
=======
export function calcScore(district, cityAvg) {
  if (!district || !district.total) return 0
  const resolved     = district.resolved || 0
  const total        = district.total    || 1
  const avgDays      = district.avg_days || 0
  const cityDays     = cityAvg?.avg_days || 9

  const resolveScore = (resolved / total) * 100
  const speedScore   = Math.max(0, Math.min(100, 50 + (cityDays - avgDays) * 2))
>>>>>>> kiw

  return Math.round(resolveScore * 0.6 + speedScore * 0.4)
}

export function getGrade(score) {
<<<<<<< HEAD
  if (score === null) return { grade: '—', color: '#4A5568', label: 'ไม่มีข้อมูล', bg: 'rgba(74,85,104,0.15)' }
  if (score >= 75) return { grade: 'A', color: '#5BD1B8', label: 'ดีเยี่ยม',       bg: 'rgba(91,209,184,0.12)' }
  if (score >= 60) return { grade: 'B', color: '#89CFF0', label: 'ดี',              bg: 'rgba(137,207,240,0.12)' }
  if (score >= 45) return { grade: 'C', color: '#E9C46A', label: 'พอใช้',           bg: 'rgba(233,196,106,0.12)' }
  if (score >= 30) return { grade: 'D', color: '#F4A261', label: 'ต้องปรับปรุง',   bg: 'rgba(244,162,97,0.12)'  }
  return              { grade: 'F', color: '#E63946', label: 'วิกฤต',             bg: 'rgba(230,57,70,0.12)'   }
=======
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  if (score >= 45) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

export function getGradeColor(grade) {
  const map = { A:'#5BD1B8', B:'#6FC18A', C:'#E9C46A', D:'#E58A53', F:'#E63946' }
  return map[grade] || '#8DA0B4'
>>>>>>> kiw
}
