const TYPES = [
  { label: 'ทั้งหมด',      icon: '🗺️', from:'#3b82f6', to:'#2563eb' },
  { label: 'ถนน/ทางเท้า', icon: '🛣️', from:'#f97316', to:'#ea580c' },
  { label: 'น้ำท่วม',      icon: '🌊', from:'#06b6d4', to:'#0891b2' },
  { label: 'ขยะ',          icon: '🗑️', from:'#10b981', to:'#059669' },
  { label: 'ไฟส่องสว่าง', icon: '💡', from:'#eab308', to:'#ca8a04' },
  { label: 'ความปลอดภัย', icon: '🔒', from:'#ef4444', to:'#dc2626' },
  { label: 'อื่นๆ',        icon: '📋', from:'#8b5cf6', to:'#7c3aed' },
]

export default function FilterBar({ selected, onSelect }) {
  return (
    <div style={{
      background:'rgba(15,23,42,0.7)',
      backdropFilter:'blur(16px)',
      border:'1px solid rgba(59,130,246,0.15)',
      borderRadius:16,padding:'16px 20px'
    }}>
      <p style={{fontSize:11,color:'#475569',marginBottom:12,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase'}}>
        กรองตามประเภทปัญหา
      </p>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {TYPES.map((t, i) => {
          const active = selected === t.label
          return (
            <button
              key={t.label}
              onClick={() => onSelect(t.label)}
              style={{
                display:'flex',alignItems:'center',gap:8,
                padding:'8px 16px',borderRadius:12,
                border: active ? 'none' : '1px solid rgba(71,85,105,0.5)',
                background: active
                  ? `linear-gradient(135deg,${t.from},${t.to})`
                  : 'rgba(30,41,59,0.6)',
                color: active ? 'white' : '#94a3b8',
                fontSize:13,fontWeight:active?700:500,
                cursor:'pointer',
                transform: active ? 'scale(1.05)' : 'scale(1)',
                boxShadow: active ? `0 4px 16px ${t.from}44` : 'none',
                transition:'all 0.2s ease',
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.background='rgba(51,65,85,0.8)'; e.currentTarget.style.color='white'; e.currentTarget.style.transform='scale(1.03)' }}
              onMouseLeave={e => { if(!active) { e.currentTarget.style.background='rgba(30,41,59,0.6)'; e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.transform='scale(1)' } }}
            >
              <span style={{fontSize:16}}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
