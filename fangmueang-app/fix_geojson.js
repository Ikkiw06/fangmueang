// node fix_geojson.js
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const GEO  = path.join(__dirname, 'public', 'bangkok_districts.geojson')
const DATA = path.join(__dirname, 'public', 'data.json')

// ── helpers ────────────────────────────────────────────────────────
let seed = 42
const rng = () => { seed = (seed*1664525+1013904223)&0xffffffff; return (seed>>>0)/0xffffffff }
const rnd = (lo,hi) => lo + rng()*(hi-lo)

function buildData(names) {
  const TYPES  = ['ถนน/ทางเท้า','น้ำท่วม','ขยะ','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ']
  const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const FLOOD = new Set(['มีนบุรี','คลองสามวา','หนองจอก','บางขุนเทียน','ลาดกระบัง','บางนา','ดอนเมือง','ตลิ่งชัน','ราษฎร์บูรณะ'])
  const ROAD  = new Set(['ลาดกระบัง','จตุจักร','ลาดพร้าว','บางเขน','ดอนเมือง','สายไหม','คันนายาว'])
  const TRASH = new Set(['คลองเตย','สัมพันธวงศ์','ป้อมปราบศัตรูพ่าย','ยานนาวา','บางคอแหลม'])
  const BIG   = new Set(['ลาดกระบัง','หนองจอก','คลองสามวา','บางขุนเทียน','สายไหม','บางเขน','ประเวศ'])

  const districts = {}
  for (const name of names) {
    const w    = BIG.has(name) ? 1.8 : 1.0
    const base = Math.floor((800 + rng()*1200)*w)
    const pw   = p => p==='น้ำท่วม' ? (FLOOD.has(name)?2.4:0.5)
                    : p==='ถนน/ทางเท้า' ? (ROAD.has(name)?2.0:1.1)
                    : p==='ขยะ' ? (TRASH.has(name)?2.2:0.8)
                    : 0.5+rng()*1.0
    const rawW  = Object.fromEntries(TYPES.map(t=>[t,pw(t)]))
    const tw    = Object.values(rawW).reduce((a,b)=>a+b,0)
    const counts= Object.fromEntries(TYPES.map(t=>[t,Math.max(10,Math.floor(base*rawW[t]/tw))]))
    const total = Object.values(counts).reduce((a,b)=>a+b,0)
    const rr    = rnd(0.58,0.90)
    const resolved = Math.floor(total*rr)
    const avg_days = Math.round(rnd(3.5,14.0)*10)/10
    const typeRes= Object.fromEntries(TYPES.map(t=>{
      let r = t==='ถนน/ทางเท้า'?rnd(0.45,0.78):t==='น้ำท่วม'?rnd(0.35,0.70)
             :t==='ไฟส่องสว่าง'?rnd(0.72,0.96):t==='ขยะ'?rnd(0.65,0.92)
             :t==='ความปลอดภัย'?rnd(0.55,0.83):rnd(0.60,0.88)
      return [t, Math.round(r*1000)/1000]
    }))
    const top_problems = TYPES.map(t=>({type:t,count:counts[t],resolve_rate:typeRes[t]})).sort((a,b)=>b.count-a.count)
    const bm = Math.floor(total/12)
    const monthly = MONTHS.map((month,i)=>{
      const cnt=Math.max(10,Math.floor(bm*(1+0.15*((i-6)/6))*(0.8+rng()*0.4)))
      return {month,count:cnt,resolved:Math.floor(cnt*rr)}
    })
    districts[name]={total,resolved,avg_days,top_problems,monthly}
  }
  const totalAll = Object.values(districts).reduce((s,d)=>s+d.total,0)
  return {
    metadata:{total:totalAll,districts_count:names.length,last_updated:'2024-12-31',source:'Traffy Fondue (demo)'},
    city_avg:{
      total:totalAll,
      resolve_rate:Math.round(Object.values(districts).reduce((s,d)=>s+d.resolved,0)/totalAll*1000)/1000,
      avg_days:Math.round(Object.values(districts).reduce((s,d)=>s+d.avg_days,0)/names.length*10)/10
    },
    problem_types:['ถนน/ทางเท้า','น้ำท่วม','ขยะ','ไฟส่องสว่าง','ความปลอดภัย','อื่นๆ'],
    districts
  }
}

function cleanGeo(geo) {
  const SKIP = ['สมุทรสาคร','สมุทรปราการ','นนทบุรี','ปทุมธานี','นครปฐม','อำเภอ']
  geo.features = geo.features
    .filter(f => !SKIP.some(s => (f.properties.name||'').includes(s)))
    .map((f,i) => {
      const clean = (f.properties.name||'').replace(/^เขต/,'').trim()
      return {...f, properties:{dname:clean,name:clean,id:i+1}}
    })
  return geo
}

function convertOSM(elements) {
  const features = elements.map((rel,i)=>{
    const tags = rel.tags||{}
    const name = tags['name']||tags['name:th']||`เขต${i+1}`
    const outerMembers = rel.members?.filter(m=>m.type==='way'&&m.role==='outer')||[]
    let coords=[]
    for (const m of outerMembers) {
      const wc=(m.geometry||[]).map(p=>[p.lon,p.lat])
      if (!coords.length){coords=wc;continue}
      const last=coords[coords.length-1],first=wc[0],last2=wc[wc.length-1]
      if (Math.abs(last[0]-first[0])<0.001&&Math.abs(last[1]-first[1])<0.001)
        coords=coords.concat(wc.slice(1))
      else if (Math.abs(last[0]-last2[0])<0.001&&Math.abs(last[1]-last2[1])<0.001)
        coords=coords.concat([...wc].reverse().slice(1))
      else coords=coords.concat(wc)
    }
    if (coords.length>0&&(coords[0][0]!==coords[coords.length-1][0]||coords[0][1]!==coords[coords.length-1][1]))
      coords.push(coords[0])
    return {type:'Feature',properties:{name,dname:name,id:i+1,osm_id:rel.id},geometry:{type:'Polygon',coordinates:[coords]}}
  }).filter(f=>f.geometry.coordinates[0].length>=4)
  return {type:'FeatureCollection',features}
}

// ── main ───────────────────────────────────────────────────────────
async function main() {
  let geo = null

  // 1. Try reading existing file
  if (fs.existsSync(GEO)) {
    try {
      geo = JSON.parse(fs.readFileSync(GEO,'utf8'))
      console.log(`📂 Existing GeoJSON loaded (${geo.features?.length} features)`)
    } catch(e) {
      console.log(`⚠️  Existing file corrupted (${e.message}) — re-downloading...`)
    }
  }

  // 2. Download fresh if needed
  if (!geo) {
    geo = await download()
  }

  // 3. Clean names & remove non-Bangkok
  geo = cleanGeo(geo)
  const names = geo.features.map(f=>f.properties.name)
  console.log(`✅ GeoJSON: ${names.length} districts`)
  names.forEach(n=>console.log(`   ${n}`))

  fs.writeFileSync(GEO, JSON.stringify(geo,null,2),'utf8')
  console.log('✅ GeoJSON saved')

  // 4. Rebuild data.json
  const data = buildData(names)
  fs.writeFileSync(DATA, JSON.stringify(data,null,2),'utf8')
  console.log(`✅ data.json: ${names.length} districts, total=${data.metadata.total.toLocaleString()}`)
  console.log('\n🎉 Done! Refresh localhost:5173')
}

function download() {
  return new Promise((resolve,reject)=>{
    const query=`[out:json][timeout:60];area["name:en"="Bangkok"]["admin_level"="4"]->.bkk;rel(area.bkk)["admin_level"="6"]["boundary"="administrative"];out geom;`
    const postData=`data=${encodeURIComponent(query)}`
    const req=https.request({
      hostname:'overpass-api.de',path:'/api/interpreter',method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(postData),'User-Agent':'FangMueang/1.0'}
    },res=>{
      let buf=''
      res.on('data',c=>buf+=c)
      res.on('end',()=>{
        try{
          const osm=JSON.parse(buf)
          console.log(`✅ Downloaded ${osm.elements?.length} relations from OSM`)
          resolve(convertOSM(osm.elements||[]))
        }catch(e){reject(e)}
      })
    })
    req.on('error',reject)
    req.write(postData)
    req.end()
    console.log('⏳ Downloading from OpenStreetMap (~20s)...')
  })
}

main().catch(e=>{console.error('❌',e.message);process.exit(1)})
