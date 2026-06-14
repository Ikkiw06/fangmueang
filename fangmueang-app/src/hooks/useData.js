import { useState, useEffect } from 'react'

export function useData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data.json')
      .then(r => {
        if (!r.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
        return r.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}