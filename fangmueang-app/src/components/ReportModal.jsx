import { useState, useEffect } from 'react'

const CATEGORIES = ['ถนน/ทางเท้า','น้ำท่วม','ขยะ','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ']
const ICONS = { 'ถนน/ทางเท้า':'🛣️','น้ำท่วม':'🌊','ขยะ':'🗑️','ไฟส่องสว่าง':'💡','ความปลอดภัย':'🔒','อื่นๆ':'📋' }

export default function ReportModal({ onClose }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [desc, setDesc] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t) }, [])

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300) }

  const handleSubmit = () => {
    if (!category) return
    setSent(true)
  }

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:1000,
      display:'flex',alignItems:'center',justifyContent:'center',
      background: visible ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
      backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
      transition:'all 0.3s ease'
    }} onClick={e => { if(e.target===e.currentTarget) handleClose() }}>
      <div style={{
        background:'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(13,32,68,0.98))',
        border:'1px solid rgba(59,130,246,0.3)',
        borderRadius:24,width:480,maxWidth:'90vw',
        boxShadow:'0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(59,130,246,0.1)',
        opacity:visible?1:0,
        transform:visible?'scale(1) translateY(0)':'scale(0.9) translateY(20px)',
        transition:'all 0.3s ease',
        overflow:'hidden'
      }}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.1))',borderBottom:'1px solid rgba(59,130,246,0.2)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#3b82f6,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 16px rgba(59,130,246,0.4)'}}>
              📢
            </div>
            <div>
              <h2 style={{color:'white',fontWeight:800,fontSize:18,margin:0}}>แจ้งปัญหาในพื้นที่</h2>
              <p style={{color:'#64748b',fontSize:12,margin:0}}>ผ่าน Traffy Fondue Platform</p>
            </div>
          </div>
          <button onClick={handleClose} style={{width:32,height:32,borderRadius:8,background:'rgba(51,65,85,0.6)',border:'1px solid rgba(71,85,105,0.4)',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.2)';e.currentTarget.style.color='#fca5a5'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(51,65,85,0.6)';e.currentTarget.style.color='#94a3b8'}}
          >✕</button>
        </div>

        <div style={{padding:24}}>
          {sent ? (
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{fontSize:64,marginBottom:16,animation:'float 2s ease-in-out infinite'}}>✅</div>
              <h3 style={{color:'#34d399',fontWeight:800,fontSize:20,marginBottom:8}}>ขอบคุณที่แจ้งปัญหา!</h3>
              <p style={{color:'#64748b',fontSize:14,marginBottom:24}}>ปัญหาของคุณจะถูกส่งต่อไปยัง กทม. ผ่าน Traffy Fondue</p>
              <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                <a
                  href="https://www.traffy.in.th/" target="_blank" rel="noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#3b82f6,#06b6d4)',color:'white',textDecoration:'none',padding:'10px 20px',borderRadius:12,fontWeight:700,fontSize:14,boxShadow:'0 4px 16px rgba(59,130,246,0.4)'}}
                >
                  🌐 ไปที่ Traffy Fondue
                </a>
                <button onClick={handleClose} style={{background:'rgba(51,65,85,0.6)',border:'1px solid rgba(71,85,105,0.4)',color:'#94a3b8',padding:'10px 20px',borderRadius:12,cursor:'pointer',fontSize:14}}>
                  ปิด
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Category picker */}
              <p style={{color:'#94a3b8',fontSize:13,marginBottom:12,fontWeight:600}}>1. เลือกประเภทปัญหา</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    display:'flex',flexDirection:'column',alignItems:'center',gap:6,
                    padding:'12px 8px',borderRadius:12,cursor:'pointer',
                    background: category===c ? 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(6,182,212,0.2))' : 'rgba(30,41,59,0.6)',
                    border: category===c ? '1px solid rgba(59,130,246,0.6)' : '1px solid rgba(71,85,105,0.3)',
                    color: category===c ? 'white' : '#94a3b8',
                    fontSize:13,fontWeight:category===c?700:400,
                    transition:'all 0.2s',
                    transform: category===c ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: category===c ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                  }}>
                    <span style={{fontSize:22}}>{ICONS[c]}</span>
                    <span style={{textAlign:'center',lineHeight:1.3}}>{c}</span>
                  </button>
                ))}
              </div>

              {/* Description */}
              <p style={{color:'#94a3b8',fontSize:13,marginBottom:8,fontWeight:600}}>2. อธิบายปัญหาเพิ่มเติม (ไม่บังคับ)</p>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="เช่น ถนนมีหลุมลึกหน้าบ้านเลขที่ 123 ถนนลาดกระบัง..."
                rows={3}
                style={{
                  width:'100%',background:'rgba(30,41,59,0.6)',border:'1px solid rgba(71,85,105,0.4)',
                  borderRadius:12,padding:'12px 16px',color:'white',fontSize:13,resize:'none',
                  outline:'none',boxSizing:'border-box',fontFamily:'Sarabun,sans-serif',
                  transition:'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor='rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.borderColor='rgba(71,85,105,0.4)'}
              />

              {/* Traffy link */}
              <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:12,padding:'12px 16px',marginTop:16,marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>💡</span>
                <div style={{fontSize:12,color:'#64748b'}}>
                  สามารถแจ้งปัญหาได้โดยตรงที่{' '}
                  <a href="https://www.traffy.in.th/" target="_blank" rel="noreferrer" style={{color:'#60a5fa',textDecoration:'none',fontWeight:600}}>
                    traffy.in.th
                  </a>{' '}
                  หรือแอป Line OA @traffyfondue
                </div>
              </div>

              <div style={{display:'flex',gap:12}}>
                <button onClick={handleClose} style={{flex:1,padding:'12px',background:'rgba(30,41,59,0.6)',border:'1px solid rgba(71,85,105,0.4)',borderRadius:12,color:'#94a3b8',cursor:'pointer',fontSize:14}}>
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!category}
                  style={{
                    flex:2,padding:'12px',borderRadius:12,border:'none',
                    background: category ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'rgba(30,41,59,0.6)',
                    color: category ? 'white' : '#475569',
                    cursor: category ? 'pointer' : 'not-allowed',
                    fontWeight:700,fontSize:14,
                    boxShadow: category ? '0 4px 16px rgba(59,130,246,0.4)' : 'none',
                    transition:'all 0.2s'
                  }}
                >
                  📤 ส่งรายงาน
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
