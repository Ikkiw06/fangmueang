export function calcScore(district, cityAvg) {
  if (!district || !district.total) return 0
  const resolved  = district.resolved || 0
  const total     = district.total    || 1
  const avgDays   = district.avg_days || 0
  const cityDays  = cityAvg?.avg_days || 9

  const resolveScore = (resolved / total) * 100
  const speedScore   = Math.max(0, Math.min(100, 50 + (cityDays - avgDays) * 2))

  return Math.round(resolveScore * 0.6 + speedScore * 0.4)
}

export function getGrade(score) {
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  if (score >= 45) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

export function getGradeColor(grade) {
  const map = { A:'#5BD1B8', B:'#6FC18A', C:'#E9C46A', D:'#E58A53', F:'#E63946' }
  return map[grade] || '#8DA0B4'
}

/* Used by DistrictDetail header badge */
export function getGradeInfo(score) {
  const grade = getGrade(score)
  const color = getGradeColor(grade)
  const labels = { A:'ดีเยี่ยม', B:'ดี', C:'พอใช้', D:'ต้องปรับปรุง', F:'วิกฤต' }
  return { grade, color, label: labels[grade] || '—', bg: `${color}1A` }
}
