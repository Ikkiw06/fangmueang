import { useState, useMemo } from 'react'
import { detectAlerts } from '../utils/trend'

const SEV = {
  disaster:{ bg:'rgba(180,20,20,0.12)',border:'rgba(220,50,50,0.5)',dot:'#FF3B3B',pulse:true,
    badge:{ bg:'rgba(220,50,50,0.18)',color:'#FF3B3B',text:'🆘 ภัยพิบัติ' }},
  critical:{ bg:'rgba(214,58,58,0.08)',border:'rgba(214,58,58,0.35)',dot:'#D63A3A',pulse:false,
    badge:{ bg:'rgba(214,58,58,0.15)',color:'#FF6B6B',text:'🔴 เร่งด่วน' }},
  warning:{ bg:'rgba(233,196,106,0.07)',border:'rgba(233,196,106,0.28)',dot:'#E9C46A',pulse:false,
    badge:{ bg:'rgba(233,196,106,0.12)',color:'#E9C46A',text:'🟡 เฝ้าระวัง' }},
}

const ZONE_ICON = {
  'กลางเมือง':'🏙️','กรุงเทพเหนือ':'🧭',
  'กรุงเทพตะวันออก':'🌅','กรุงเทพตะวันตก':'🌇',
  'กรุงเทพใต้':'🌊','กรุงเทพตะวันออกเฉียงใต้':'🗺️',
}

function Spark({ monthly, color }) {
  const counts = (monthly || []).slice(-6).map(m => m.count)
  if (counts.length < 2) return null
  const max = Math.max(...counts, 1), min = Math.min(...counts, 0)
  const W = 54, H = 20, r = max - min || 1
  const pts = counts.map((v,i)=>`${(i/(counts.length-1))*W},${H-((v-min)/r)*(H-2)+1}`).join(' ')
  const [lx,ly] = pts.split(' ').slice(-1)[0].split(',')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible',flexShrink:0}}>
      <polyline points={pts} fill='none' stroke={color} strokeWidth={1.5}
        strokeLinejoin='round' strokeLinecap='round'
        style={{filter:`drop-shadow(0 0 3px ${color}90)`}}/>
      <circle cx={lx} cy={ly} r={2.5} fill={color}/>
    </svg>
  )
}

function ScoreBar({ score, color }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <div style={{flex:1,height:4,background:'var(--panel2)',borderRadius:99,overflow:'hidden',minWidth:50}}>
        <div style={{height:'100%',borderRadius:99,background:color,width:`${Math.round(score)}%`,
          transition:'width 0.8s ease',boxShadow:`0 0 6px ${color}80`}}/>
      </div>
      <span style={{fontSize:10,fontFamily:'IBM Plex Mono,monospace',color,fontWeight:700,whiteSpace:'nowrap'}}>
        {Math.round(score)}
      </span>
    </div>
  )
}

function AlertCard({ alert, districts, onSelect }) {
  const cfg   = SEV[alert.severity] || SEV.warning
  const isClu = alert.type === 'cluster'
  const isHaz = alert.type === 'hazard'
  const barColor = alert.alertType==='flood' ? '#4F9FE0'
                 : alert.alertType==='safety' ? '#E05A6A'
                 : alert.alertType==='disaster' ? '#FF3B3B' : cfg.dot
  return (
    <div
      onClick={() => !isClu && alert.name && onSelect?.(alert.name)}
      style={{
        background:cfg.bg, border:`1px solid ${cfg.border}`,
        borderRadius:10, padding:'11px 14px',
        cursor: isClu ? 'default' : 'pointer',
        transition:'border-color 0.15s',
        animation: cfg.pulse ? 'borderPulse 2s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={e => !isClu && (e.currentTarget.style.borderColor=cfg.dot)}
      onMouseLeave={e => !isClu && (e.currentTarget.style.borderColor=cfg.border)}
    >
      <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:isHaz||(!isClu&&!isHaz)?7:0}}>
        <span style={{
          flexShrink:0, fontSize:10, fontWeight:700, letterSpacing:'0.05em',
          background:cfg.badge.bg, color:cfg.badge.color,
          padding:'2px 8px', borderRadius:999, whiteSpace:'nowrap', marginTop:1,
          ...(cfg.pulse ? {animation:'pulse 1.5s ease-in-out infinite'} : {}),
        }}>{cfg.badge.text}</span>
        <span style={{fontSize:12.5,color:'var(--ink)',lineHeight:1.55,flex:1}}>
          {alert.message}
        </span>
      </div>

      {isHaz && (
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:100}}>
            <div style={{fontSize:10.5,color:'var(--faint)',marginBottom:4}}>ระดับความเสี่ยง</div>
            <ScoreBar score={alert.score} color={barColor}/>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:11,color:'var(--faint)'}}>{ZONE_ICON[alert.zone]||'📍'} {alert.zone}</span>
            <span style={{fontSize:11,color:'var(--faint)'}}>{alert.total?.toLocaleString()} เรื่อง</span>
            <span style={{fontSize:11,color:alert.resolve>=70?'#5BD1B8':alert.resolve>=50?'#E9C46A':'#E63946'}}>
              ✅ {alert.resolve}%
            </span>
          </div>
          <Spark monthly={districts?.[alert.name]?.monthly} color={barColor}/>
        </div>
      )}

      {!isClu && !isHaz && (
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',gap:8,flex:1,flexWrap:'wrap'}}>
            <span style={{fontSize:11,color:'var(--faint)'}}>{ZONE_ICON[alert.zone]||'📍'} {alert.zone}</span>
            <span style={{fontSize:11,color:'var(--faint)'}}>{alert.total?.toLocaleString()} เรื่อง</span>
            <span style={{fontSize:11,color:alert.resolve>=70?'#5BD1B8':alert.resolve>=50?'#E9C46A':'#E63946'}}>
              ✅ {alert.resolve}%
            </span>
          </div>
          <Spark monthly={alert.monthly} color={cfg.dot}/>
        </div>
      )}

      {isClu && (
        <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center',marginTop:6}}>
          <span style={{fontSize:11,color:'var(--faint)'}}>{ZONE_ICON[alert.zone]||'🗺️'} พื้นที่ใกล้เคียง:</span>
          {alert.districts.map(n => (
            <button key={n}
              onClick={e=>{e.stopPropagation();onSelect?.(n)}}
              style={{
                fontSize:11,padding:'2px 8px',borderRadius:999,cursor:'pointer',
                border:`1px solid ${cfg.border}`,background:cfg.bg,
                color:'var(--muted)',fontFamily:'inherit',transition:'all 0.12s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.color='var(--ink)';e.currentTarget.style.borderColor=cfg.dot}}
              onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.borderColor=cfg.border}}
            >เขต{n}</button>
          ))}
          {alert.count > alert.districts.length && (
            <span style={{fontSize:11,color:'var(--faint)'}}>+{alert.count-alert.districts.length} เขต</span>
          )}
        </div>
      )}
    </div>
  )
}

function SeasonBanner({ isPeakFlood, isRainySeason }) {
  if (!isRainySeason) return null
  return (
    <div style={{
      display:'flex',alignItems:'center',gap:9,
      background:isPeakFlood?'rgba(79,159,224,0.12)':'rgba(79,159,224,0.07)',
      border:`1px solid ${isPeakFlood?'rgba(79,159,224,0.4)':'rgba(79,159,224,0.2)'}`,
      borderRadius:9, padding:'8px 12px', marginBottom:10, fontSize:12,
    }}>
      <span style={{fontSize:18}}>{isPeakFlood?'🌧️':'⛅'}</span>
      <div>
        <span style={{color:'#7EC3F7',fontWeight:700}}>
          {isPeakFlood?'ช่วงพีคฤดูฝน (ก.ค.–ก.ย.)':'ฤดูฝน (พ.ค.–ต.ค.)'}
        </span>
        <span style={{color:'var(--faint)',marginLeft:6}}>
          — ความเสี่ยงน้ำท่วมสูงกว่าปกติ ระบบเพิ่มระดับแจ้งเตือน
        </span>
      </div>
    </div>
  )
}

export default function AlertPanel({ districts = {}, onSelectDistrict }) {
  const [expanded,  setExpanded]  = useState(true)
  const [activeTab, setActiveTab] = useState('hazard')

  const { hazardAlerts, districtAlerts, clusterAlerts, isRainySeason, isPeakFlood } = useMemo(
    () => detectAlerts(districts), [districts]
  )

  const disasterCount = hazardAlerts.filter(a => a.severity === 'disaster').length
  const totalAlerts   = hazardAlerts.length + districtAlerts.length + clusterAlerts.length

  if (totalAlerts === 0 && !isRainySeason) return null

  const TABS = [
    { key:'hazard',  label:`⚠️ ภัย (${hazardAlerts.length})` },
    { key:'trend',   label:`📈 แนวโน้ม (${districtAlerts.length})` },
    { key:'cluster', label:`🗺️ Cluster (${clusterAlerts.length})` },
  ]
  const shown = activeTab==='hazard' ? hazardAlerts.slice(0,8)
              : activeTab==='trend'  ? districtAlerts.slice(0,8)
              : clusterAlerts.slice(0,6)

  return (
    <>
      <style>{`
        @keyframes borderPulse {
          0%,100%{box-shadow:0 0 8px rgba(220,50,50,0.2);}
          50%{box-shadow:0 0 20px rgba(220,50,50,0.5);}
        }
      `}</style>
      <div style={{background:'var(--panel)',border:'1px solid var(--line)',
        borderRadius:'var(--radius)',marginBottom:16,overflow:'hidden'}}>

        <div onClick={()=>setExpanded(v=>!v)} style={{
          display:'flex',alignItems:'center',gap:10,
          padding:'13px 16px',cursor:'pointer',
          borderBottom:expanded?'1px solid var(--line)':'none',
        }}>
          <div style={{position:'relative',width:28,height:28,flexShrink:0}}>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',
              background:'rgba(91,209,184,0.1)',border:'1px solid rgba(91,209,184,0.3)',
              animation:'pulse 2.5s ease-in-out infinite'}}/>
            <div style={{position:'absolute',inset:5,borderRadius:'50%',background:'var(--mint)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>🤖</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
              <span style={{fontSize:14,fontWeight:700}}>AI วิเคราะห์แนวโน้มและภัย</span>
              {disasterCount > 0 && (
                <span style={{fontSize:11,fontWeight:700,background:'rgba(220,50,50,0.18)',
                  color:'#FF3B3B',padding:'1px 8px',borderRadius:999,
                  animation:'pulse 1.5s ease-in-out infinite'}}>
                  🆘 {disasterCount} ภัยพิบัติ
                </span>
              )}
              {hazardAlerts.length > 0 && (
                <span style={{fontSize:11,background:'rgba(214,58,58,0.12)',
                  color:'#FF6B6B',padding:'1px 8px',borderRadius:999}}>
                  {hazardAlerts.length} แจ้งเตือนภัย
                </span>
              )}
              {isRainySeason && (
                <span style={{fontSize:11,background:'rgba(79,159,224,0.12)',
                  color:'#7EC3F7',padding:'1px 8px',borderRadius:999}}>
                  🌧️ ฤดูฝน
                </span>
              )}
            </div>
            <p style={{margin:'1px 0 0',fontSize:11,color:'var(--faint)'}}>
              วิเคราะห์ flood risk · safety risk · trend regression · cluster detection
            </p>
          </div>
          <span style={{color:'var(--faint)',fontSize:12,flexShrink:0}}>{expanded?'▲':'▼'}</span>
        </div>

        {expanded && (
          <div style={{padding:'12px 14px'}}>
            <SeasonBanner isRainySeason={isRainySeason} isPeakFlood={isPeakFlood}/>
            <div style={{display:'flex',gap:3,marginBottom:12,background:'var(--panel2)',
              border:'1px solid var(--line)',borderRadius:10,padding:3,overflowX:'auto'}}>
              {TABS.map(t => (
                <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                  fontSize:11.5,padding:'4px 11px',borderRadius:7,border:'none',
                  fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
                  transition:'all 0.15s',
                  background:  activeTab===t.key?'var(--panel)' :'transparent',
                  color:       activeTab===t.key?'var(--mint)'  :'var(--faint)',
                  fontWeight:  activeTab===t.key?700:400,
                  boxShadow:   activeTab===t.key?'0 1px 4px rgba(0,0,0,0.3)':'none',
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {shown.length === 0
                ? <p style={{fontSize:12,color:'var(--faint)',textAlign:'center',padding:'10px 0'}}>
                    {activeTab==='hazard'?'ไม่พบภัยในขณะนี้ ✓':'ไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์'}
                  </p>
                : shown.map(a => (
                    <AlertCard key={a.id} alert={a} districts={districts} onSelect={onSelectDistrict}/>
                  ))
              }
            </div>
            <p style={{margin:'10px 0 0',fontSize:10.5,color:'var(--faint)',textAlign:'right'}}>
              flood risk = type ratio × seasonal multiplier × trend slope
            </p>
          </div>
        )}
      </div>
    </>
  )
}
