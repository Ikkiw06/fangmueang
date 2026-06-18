import { useState, useEffect } from 'react'

const CATS = [
  { icon:'🛣️', label:'ถนน/ทางเท้า', color:'#E58A53' },
  { icon:'🌊', label:'น้ำท่วม',       color:'#4F9FE0' },
  { icon:'🗑️', label:'ขยะ',           color:'#6FC18A' },
  { icon:'💡', label:'ไฟส่องสว่าง',  color:'#E9C46A' },
  { icon:'🚨', label:'ความปลอดภัย',  color:'#D14B3C' },
  { icon:'📌', label:'อื่นๆ',          color:'#8DA0B4' },
]

export default function ReportModal({ onClose }) {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState(null)
  const [desc, setDesc] = useState('')
  const [success, setSuccess] = useState(false)
  const [hov, setHov] = useState(null)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t) }, [])

  const handleClose = () => { setVisible(false); setTimeout(onClose, 280) }
  const handleSubmit = () => { setSuccess(true); setTimeout(handleClose, 2000) }

  return (
    <div onClick={e => e.target === e.currentTarget && handleClose()} style={{
      position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(6,10,16,0.72)', backdropFilter:'blur(8px)',
      opacity: visible ? 1 : 0, transition:'opacity 0.28s',
    }}>
      <div style={{
        width:440, maxWidth:'calc(100vw - 32px)',
        background:'var(--panel)', border:'1px solid var(--line)',
        borderRadius:18, overflow:'hidden',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
        transition:'all 0.32s cubic-bezier(0.34,1.4,0.64,1)',
        boxShadow:'0 24px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Top accent */}
        <div style={{ height:2, background:'linear-gradient(90deg,transparent,var(--mint),transparent)' }}/>
        <div style={{ padding:22 }}>
          {success ? (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ fontSize:48, marginBottom:12, animation:'float 2s ease-in-out infinite' }}>✅</div>
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--ink)', margin:'0 0 8px' }}>ส่งเรื่องร้องเรียนแล้ว!</h3>
              <p style={{ fontSize:13, color:'var(--faint)', margin:0 }}>ขอบคุณที่ร่วมพัฒนากรุงเทพฯ 🙏</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>📢 แจ้งปัญหา</h3>
                <button onClick={handleClose} style={{
                  background:'none', border:'1px solid var(--line)', color:'var(--muted)',
                  borderRadius:8, padding:'3px 10px', fontFamily:'inherit', fontSize:12, cursor:'pointer',
                }}>ปิด ✕</button>
              </div>

              <div style={{ fontSize:12, color:'var(--faint)', marginBottom:10 }}>เลือกประเภทปัญหา</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                {CATS.map(c => {
                  const active = selected === c.label
                  const hover = hov === c.label
                  return (
                    <button key={c.label}
                      onClick={() => setSelected(c.label)}
                      onMouseEnter={() => setHov(c.label)}
                      onMouseLeave={() => setHov(null)}
                      style={{
                        padding:'11px 8px', borderRadius:11, fontFamily:'inherit', cursor:'pointer',
                        border: active ? `1px solid ${c.color}80` : `1px solid ${hover ? c.color+'40' : 'var(--line)'}`,
                        background: active ? `${c.color}18` : hover ? `${c.color}0a` : 'var(--panel2)',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                        transition:'all 0.15s',
                      }}>
                      <span style={{ fontSize:20 }}>{c.icon}</span>
                      <span style={{ fontSize:11.5, fontWeight: active ? 600 : 400, color: active ? c.color : hover ? 'var(--ink)' : 'var(--muted)' }}>{c.label}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ fontSize:12, color:'var(--faint)', marginBottom:8 }}>รายละเอียด (ไม่บังคับ)</div>
              <textarea value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="อธิบายปัญหา สถานที่ หรือข้อมูลเพิ่มเติม..."
                style={{
                  width:'100%', height:84, resize:'none', boxSizing:'border-box',
                  background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:10,
                  padding:'10px 13px', color:'var(--ink)', fontSize:13, fontFamily:'inherit',
                  outline:'none', lineHeight:1.5, transition:'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor='var(--mint-d)'}
                onBlur={e => e.target.style.borderColor='var(--line)'}
              />

              <div style={{ display:'flex', gap:9, marginTop:14 }}>
                <a href="https://traffy.in.th" target="_blank" rel="noopener noreferrer"
                  style={{
                    flex:1, padding:'10px 0', borderRadius:10,
                    border:'1px solid var(--line)', background:'var(--panel2)',
                    color:'var(--muted)', fontSize:13, textDecoration:'none',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--muted)' }}>
                  🔗 Traffy Fondue
                </a>
                <button onClick={handleSubmit} disabled={!selected}
                  style={{
                    flex:1, padding:'10px 0', borderRadius:10, border:'none',
                    background: selected ? 'var(--mint)' : 'var(--panel2)',
                    color: selected ? '#06231d' : 'var(--faint)',
                    fontSize:13, fontWeight: selected ? 600 : 400,
                    fontFamily:'inherit', cursor: selected ? 'pointer' : 'not-allowed',
                    transition:'all 0.15s',
                  }}>
                  ส่งเรื่องร้องเรียน →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
