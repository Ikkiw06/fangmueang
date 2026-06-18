import { useState, useEffect } from 'react'

const CATS = [
  { icon:'🛣️', label:'ถนน/ทางเท้า', color:'#E58A53' },
  { icon:'🌊', label:'น้ำท่วม',       color:'#4F9FE0' },
  { icon:'🗑️', label:'ขยะ',           color:'#6FC18A' },
  { icon:'💡', label:'ไฟส่องสว่าง',  color:'#E9C46A' },
  { icon:'🚨', label:'ความปลอดภัย',  color:'#D14B3C' },
  { icon:'📌', label:'อื่นๆ',          color:'#8DA0B4' },
]

const DISTRICTS = [
  'พระนคร','สัมพันธวงศ์','ป้อมปราบศัตรูพ่าย','บางรัก','ปทุมวัน','ราชเทวี','พญาไท','ดุสิต',
  'บางซื่อ','จตุจักร','ดอนเมือง','หลักสี่','บางเขน','ดินแดง','ห้วยขวาง','คลองเตย',
  'ลาดพร้าว','สายไหม','วัฒนา','บางกะปิ','บางกอกใหญ่','ตลิ่งชัน','ทวีวัฒนา','วังทองหลาง',
  'บางพลัด','บางกอกน้อย','หนองแขม','บางแค','บึงกุ่ม','คันนายาว','ภาษีเจริญ','คลองสามวา',
  'บางนา','มีนบุรี','ประเวศ','สะพานสูง','พระโขนง','สวนหลวง','จอมทอง','ราษฎร์บูรณะ',
  'ทุ่งครุ','คลองสาน','ธนบุรี','บางบอน','บางขุนเทียน','สาทร','บางคอแหลม','ยานนาวา',
  'ลาดกระบัง','หนองจอก',
]

const FIELD = {
  width:'100%', boxSizing:'border-box',
  background:'var(--panel2)', border:'1px solid var(--line)',
  borderRadius:10, padding:'9px 13px',
  color:'var(--ink)', fontSize:13, fontFamily:'inherit',
  outline:'none', transition:'border-color 0.15s',
}

export default function ReportModal({ onClose, defaultDistrict }) {
  const [visible,   setVisible]   = useState(false)
  const [step,      setStep]      = useState(1)   // 1=กรอกข้อมูล 2=ยืนยัน/redirect
  const [selected,  setSelected]  = useState(null)
  const [district,  setDistrict]  = useState(defaultDistrict || '')
  const [otherText, setOtherText] = useState('')
  const [desc,      setDesc]      = useState('')
  const [errors,    setErrors]    = useState({})
  const [hov,       setHov]       = useState(null)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t) }, [])

  const handleClose = () => { setVisible(false); setTimeout(onClose, 280) }

  const validate = () => {
    const e = {}
    if (!district) e.district = 'กรุณาเลือกเขต'
    if (!selected) e.selected = 'กรุณาเลือกประเภทปัญหา'
    if (selected === 'อื่นๆ' && !otherText.trim()) e.otherText = 'กรุณาระบุปัญหา'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) setStep(2) }

  const handleGoTraffy = () => {
    window.open('https://traffy.in.th', '_blank', 'noopener,noreferrer')
    handleClose()
  }

  const problemLabel = selected === 'อื่นๆ' ? otherText : selected

  const focus = e => e.target.style.borderColor = 'var(--mint-d)'
  const blur  = e => e.target.style.borderColor = 'var(--line)'

  return (
    <div onClick={e => e.target === e.currentTarget && handleClose()} style={{
      position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(6,10,16,0.76)', backdropFilter:'blur(8px)',
      opacity: visible ? 1 : 0, transition:'opacity 0.28s',
    }}>
      <div style={{
        width:460, maxWidth:'calc(100vw - 32px)', maxHeight:'92vh',
        background:'var(--panel)', border:'1px solid var(--line)',
        borderRadius:18, overflowY:'auto', overflowX:'hidden',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
        transition:'all 0.32s cubic-bezier(0.34,1.4,0.64,1)',
        boxShadow:'0 24px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ position:'sticky', top:0, height:3, background:'linear-gradient(90deg,transparent,var(--mint),transparent)', zIndex:1 }}/>

        <div style={{ padding:22 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>📢 แจ้งปัญหาในพื้นที่</h3>
              <div style={{ fontSize:11, color:'var(--faint)', marginTop:3 }}>
                ผ่านระบบ Traffy Fondue — แพลตฟอร์มของ กทม.
              </div>
            </div>
            <button onClick={handleClose} style={{
              background:'none', border:'1px solid var(--line)', color:'var(--muted)',
              borderRadius:8, padding:'3px 10px', fontFamily:'inherit', fontSize:12, cursor:'pointer',
            }}>ปิด ✕</button>
          </div>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:6, marginBottom:18, alignItems:'center' }}>
            {[1,2].map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  width:24, height:24, borderRadius:'50%', fontSize:11, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: step >= s ? 'var(--mint)' : 'var(--panel2)',
                  color: step >= s ? '#06231d' : 'var(--faint)',
                  border: step >= s ? 'none' : '1px solid var(--line)',
                  transition:'all 0.2s',
                }}>{s}</div>
                <span style={{ fontSize:11, color: step >= s ? 'var(--ink)' : 'var(--faint)' }}>
                  {s === 1 ? 'กรอกข้อมูล' : 'ส่งผ่าน Traffy'}
                </span>
                {s < 2 && <div style={{ width:24, height:1, background:'var(--line)' }}/>}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              {/* District */}
              <label style={{ fontSize:12, color:'var(--faint)', display:'block', marginBottom:6 }}>
                เขตที่พบปัญหา <span style={{ color:'#D14B3C' }}>*</span>
              </label>
              <div style={{ position:'relative', marginBottom: errors.district ? 4 : 14 }}>
                <select value={district}
                  onChange={e => { setDistrict(e.target.value); setErrors(p=>({...p,district:null})) }}
                  onFocus={focus} onBlur={blur}
                  style={{ ...FIELD, appearance:'none', cursor:'pointer', paddingRight:32,
                    borderColor: errors.district ? '#D14B3C' : 'var(--line)' }}>
                  <option value="" disabled>— เลือกเขต —</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>เขต{d}</option>)}
                </select>
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--faint)', pointerEvents:'none', fontSize:11 }}>▾</span>
              </div>
              {errors.district && <div style={{ fontSize:11, color:'#D14B3C', marginBottom:10 }}>{errors.district}</div>}

              {/* Category */}
              <label style={{ fontSize:12, color:'var(--faint)', display:'block', marginBottom:8 }}>
                ประเภทปัญหา <span style={{ color:'#D14B3C' }}>*</span>
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom: errors.selected ? 4 : 0 }}>
                {CATS.map(c => {
                  const active = selected === c.label
                  return (
                    <button key={c.label}
                      onClick={() => { setSelected(c.label); setErrors(p=>({...p,selected:null,otherText:null})) }}
                      onMouseEnter={() => setHov(c.label)} onMouseLeave={() => setHov(null)}
                      style={{
                        padding:'10px 8px', borderRadius:11, fontFamily:'inherit', cursor:'pointer',
                        border: active ? `1px solid ${c.color}80` : `1px solid ${hov===c.label?c.color+'40':'var(--line)'}`,
                        background: active ? `${c.color}18` : hov===c.label ? `${c.color}0a` : 'var(--panel2)',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                        transition:'all 0.15s',
                      }}>
                      <span style={{ fontSize:20 }}>{c.icon}</span>
                      <span style={{ fontSize:11, fontWeight:active?600:400, color:active?c.color:hov===c.label?'var(--ink)':'var(--muted)' }}>{c.label}</span>
                    </button>
                  )
                })}
              </div>
              {errors.selected && <div style={{ fontSize:11, color:'#D14B3C', marginTop:4, marginBottom:4 }}>{errors.selected}</div>}

              {/* อื่นๆ input */}
              {selected === 'อื่นๆ' && (
                <div style={{ marginTop:12 }}>
                  <label style={{ fontSize:12, color:'var(--faint)', display:'block', marginBottom:6 }}>
                    ระบุปัญหา <span style={{ color:'#D14B3C' }}>*</span>
                  </label>
                  <input type="text" value={otherText}
                    onChange={e => { setOtherText(e.target.value); setErrors(p=>({...p,otherText:null})) }}
                    onFocus={focus} onBlur={blur}
                    placeholder="เช่น ท่อระบายน้ำอุดตัน, ต้นไม้ล้ม..."
                    style={{ ...FIELD, borderColor: errors.otherText ? '#D14B3C' : 'var(--line)' }}/>
                  {errors.otherText && <div style={{ fontSize:11, color:'#D14B3C', marginTop:4 }}>{errors.otherText}</div>}
                </div>
              )}

              {/* Detail */}
              <div style={{ marginTop:14 }}>
                <label style={{ fontSize:12, color:'var(--faint)', display:'block', marginBottom:6 }}>รายละเอียดเพิ่มเติม</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="สถานที่ จุดสังเกต หรือข้อมูลที่เป็นประโยชน์..."
                  onFocus={focus} onBlur={blur}
                  style={{ ...FIELD, height:72, resize:'none', lineHeight:1.5 }}/>
              </div>

              <button onClick={handleNext} style={{
                width:'100%', marginTop:14, padding:'11px 0', borderRadius:11, border:'none',
                background:'var(--mint)', color:'#06231d', fontSize:13, fontWeight:700,
                fontFamily:'inherit', cursor:'pointer', transition:'opacity 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                ถัดไป →
              </button>
            </>
          ) : (
            <>
              {/* Step 2: confirm + go traffy */}
              <div style={{
                background:'var(--panel2)', border:'1px solid var(--line)',
                borderRadius:12, padding:'16px', marginBottom:16,
              }}>
                <div style={{ fontSize:12, color:'var(--faint)', marginBottom:10 }}>ข้อมูลที่จะแจ้ง</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:12, color:'var(--faint)', width:80 }}>เขต</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>เขต{district}</span>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:12, color:'var(--faint)', width:80 }}>ประเภท</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--mint)' }}>{problemLabel}</span>
                  </div>
                  {desc && (
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ fontSize:12, color:'var(--faint)', width:80 }}>รายละเอียด</span>
                      <span style={{ fontSize:13, color:'var(--ink)' }}>{desc}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Workflow note */}
              <div style={{
                background:'rgba(91,209,184,0.06)', border:'1px solid rgba(91,209,184,0.2)',
                borderRadius:10, padding:'12px 14px', marginBottom:16,
              }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--mint)', marginBottom:6 }}>
                  📋 ขั้นตอนหลังกดส่ง
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {[
                    '1. ระบบ Traffy Fondue บันทึกเรื่องและออก ticket',
                    '2. ส่งต่อให้เจ้าหน้าที่ กทม. รับผิดชอบพื้นที่',
                    '3. ทีมภาคสนามลงพื้นที่แก้ไข',
                    '4. เจ้าหน้าที่อัปเดต status → "แก้ไขแล้ว"',
                    '5. Fang Mueang แสดง % แก้ไขอัปเดตอัตโนมัติ',
                  ].map(s => (
                    <div key={s} style={{ fontSize:11, color:'var(--muted)' }}>{s}</div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:9 }}>
                <button onClick={() => setStep(1)} style={{
                  flex:1, padding:'10px 0', borderRadius:10,
                  border:'1px solid var(--line)', background:'var(--panel2)',
                  color:'var(--muted)', fontSize:13, fontFamily:'inherit', cursor:'pointer',
                  transition:'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--mint-d)'; e.currentTarget.style.color='var(--ink)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--muted)' }}>
                  ← แก้ไข
                </button>
                <button onClick={handleGoTraffy} style={{
                  flex:2, padding:'10px 0', borderRadius:10, border:'none',
                  background:'var(--mint)', color:'#06231d',
                  fontSize:13, fontWeight:700, fontFamily:'inherit', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  transition:'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                  ส่งผ่าน Traffy Fondue 🔗
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
