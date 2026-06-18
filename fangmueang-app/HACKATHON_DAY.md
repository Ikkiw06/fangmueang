# 🏆 คู่มือวันแข่ง Hackathon — แฟงเมือง (Fang Mueang)

> อัปเดต: June 2026 | โปรเจกต์: Bangkok District Problem Dashboard

---

## ภาพรวมแต่ละ Phase

| ช่วงเวลา | Phase | เป้าหมาย |
|---|---|---|
| 08:00–09:00 | 🔧 Setup | เครื่องพร้อม ทีมพร้อม |
| 09:00–12:00 | ⚙️ Core Build | ฟีเจอร์หลักทำงานครบ |
| 12:00–13:00 | 🍽️ พัก / Buffer | แก้บัค เติมพลัง |
| 13:00–16:00 | ✨ Polish | UI สวย Demo ลื่น |
| 16:00–17:30 | 🎤 Presentation Prep | สไลด์ + ซักซ้อม |
| 17:30–18:00 | 🚀 Submit & Deploy | Deploy Netlify / Vercel |
| 18:00+ | 🎯 Pitching | นำเสนอต่อกรรมการ |

---

## 08:00–09:00 | 🔧 Setup

### เป้าหมาย: ทุกอย่างพร้อมก่อนเริ่มเขียนโค้ด

**ทำทันทีที่นั่งลง (15 นาที)**
```
cd C:\fangmueang\fangmueang-app
npm run dev
```
- เปิด localhost:5173 ตรวจว่า app ขึ้น ✅
- เปิด VS Code: `code .`
- เปิด browser DevTools ค้างไว้ (F12 → Console)
- เปิด tab สำรอง: localhost:5173 อีกอัน

**เช็ค Git (5 นาที)**
```
git status
git add .
git commit -m "hackathon start - baseline"
git push
```

**แบ่งงานทีม (10 นาที)**
| คน | หน้าที่หลัก |
|---|---|
| คน 1 | แมพ + ข้อมูล GeoJSON / data.json |
| คน 2 | UI Components (KPI, Charts) |
| คน 3 | Presentation + Demo script |

**เตรียม browser tabs ที่ต้องใช้**
- localhost:5173 (app)
- https://traffy.in.th (อ้างอิงข้อมูล)
- https://netlify.com (deploy)
- Google Slides / Canva (สไลด์)

---

## 09:00–12:00 | ⚙️ Core Build (3 ชั่วโมง)

### เป้าหมาย: ทุก feature ทำงานได้ ยังไม่ต้องสวยมาก

### 09:00–09:45 | แมพ + ข้อมูล
**วิธีทำ:**
1. ตรวจ map แสดงครบ 50 เขตไหม → เปิด DevTools → Network → กด F5 → ดู bangkok_districts.geojson โหลด 200 OK
2. ถ้าแมพไม่ขึ้น → เช็ค console error → ส่วนใหญ่คือ import Leaflet CSS หาย
3. ทดสอบคลิกแต่ละเขต → ต้องขึ้น DistrictDetail ด้านล่าง
4. ทดสอบ Filter Bar → คลิก "น้ำท่วม" → แมพสีต้องเปลี่ยน

```jsx
// ถ้าแมพไม่ re-render ตาม filter ให้เช็ค key prop:
<GeoJSON key={selectedType + selectedDistrict} ... />
```

### 09:45–10:30 | KPI + Charts
**วิธีทำ:**
1. ตรวจ KPI 4 card ขึ้นครบ (ร้องเรียนทั้งหมด / แก้ไขแล้ว / เขตที่มีปัญหามาก / อัตราแก้ไข)
2. ตรวจตัวเลข countUp animation เล่น
3. ตรวจ ProblemChart แสดง bar แต่ละประเภทปัญหา
4. ทดสอบ: คลิกเขตบนแมพ → ProblemChart เปลี่ยนข้อมูล

**ถ้า chart ไม่ update:**
```jsx
// เช็คว่า prop ส่งถูกไหม
console.log('selectedDistrict:', selectedDistrict)
```

### 10:30–11:15 | DistrictDetail
**วิธีทำ:**
1. คลิกเขตใดก็ได้ → scroll ลงมาดู DistrictDetail
2. ตรวจ: แสดงชื่อเขต / ปัญหาหลัก / % แก้ไข / กราฟ monthly
3. ตรวจ % resolve_rate แต่ละประเภทปัญหาแสดงถูก (double bar)
4. ทดสอบ badge สี: เขียว ≥70% / เหลือง ≥50% / แดง <50%

### 11:15–12:00 | ReportModal + Final Check
**วิธีทำ:**
1. กดปุ่ม "แจ้งปัญหา" → Modal เปิด
2. เลือก category → กดส่ง → success animation
3. **Full flow test:** เปิดหน้าเว็บใหม่ → ใช้ทุก feature ต่อเนื่อง 1 รอบ
4. เช็ค mobile: DevTools → Toggle device toolbar (Ctrl+Shift+M) → ดูว่าพังไหม

**บันทึก bug ที่เจอ** (อย่าแก้ทันที ทำรายการก่อน):
```
Bug list:
[ ] ...
[ ] ...
```

---

## 12:00–13:00 | 🍽️ พัก / Buffer

**ช่วงนี้ทำ 2 อย่างเท่านั้น:**

1. **กินข้าว** — สมองต้องการพลัง อย่าข้าม
2. **แก้ bug จาก list** — เรียงตาม impact: อะไรทำให้ demo พังก่อน

**Triage bug อย่างไร:**
| ระดับ | ตัวอย่าง | ทำไหม? |
|---|---|---|
| 🔴 Critical | แมพไม่แสดง / หน้าขาว | ทำทันที |
| 🟡 Major | ตัวเลขผิด / tooltip หาย | ถ้าเวลาพอ |
| 🟢 Minor | สีไม่ตรง / ขนาด font | ข้ามได้ |

---

## 13:00–16:00 | ✨ Polish (3 ชั่วโมง)

### เป้าหมาย: ทำให้ดูดีพอที่กรรมการจะ WOW

### 13:00–13:45 | UI Polish
**วิธีทำ:**
1. เปิดหน้าเว็บ → screenshot ไว้ก่อน
2. ดู spacing: อะไรดูแน่นเกิน / เบาบางเกิน → เพิ่ม padding/margin
3. ตรวจ font sizes: หัวข้อใหญ่พอไหม ตัวเลข KPI เด่นพอไหม
4. ตรวจสี hover state ทุกปุ่ม

**Quick wins ที่ทำได้เร็ว:**
```css
/* เพิ่ม transition ทุกที่ที่ hover */
transition: all 0.15s ease;

/* ทำให้ตัวเลขเด่น */
font-family: 'IBM Plex Mono', monospace;
```

### 13:45–14:30 | Data Story
**สิ่งที่กรรมการต้องการเห็น = insight ที่น่าสนใจ**

ปรับ data.json ให้มี pattern ที่น่าสนใจ:
- เขตขนาดใหญ่ (ลาดกระบัง, หนองจอก) → ร้องเรียนมาก
- เขตใจกลาง (ปทุมวัน, พระนคร) → ถนน/ทางเท้าสูง
- เขตรอบนอก → น้ำท่วมสูง
- บางเขต → % แก้ไขต่ำมาก → แสดงให้เห็นช่องว่าง

**เพิ่ม insight card (ถ้าเวลาพอ):**
```jsx
// ใน KpiPanel หรือ ProblemChart เพิ่ม highlight:
<div style={{...}}>
  ⚠️ เขตที่แก้ไขช้าที่สุด: <strong>มีนบุรี</strong> เฉลี่ย 14.2 วัน
</div>
```

### 14:30–15:15 | Demo Flow Rehearsal
**ซักซ้อม demo ให้ลื่น 3 นาที:**

```
1. เปิดหน้าเว็บ (3 วิ)
   "นี่คือ แฟงเมือง ระบบติดตามปัญหาของกรุงเทพมหานคร"

2. ชี้ KPI cards (20 วิ)
   "รวมร้องเรียน X เรื่อง แก้ไขแล้ว X%"

3. คลิก filter "น้ำท่วม" (15 วิ)
   "กรองดูเฉพาะปัญหาน้ำท่วม เขตสีแดงคือมีปัญหามาก"

4. คลิกเขต มีนบุรี (30 วิ)
   "เขตมีนบุรีมีร้องเรียนสูง แต่แก้ไขเพียง X% ใช้เวลาเฉลี่ย X วัน"

5. แสดง DistrictDetail (30 วิ)
   "เห็นว่าปัญหาน้ำท่วมแก้ไขน้อยที่สุด สะท้อนช่องว่างการบริการ"

6. กด "แจ้งปัญหา" (20 วิ)
   "ประชาชนสามารถแจ้งปัญหาได้โดยตรง"

7. สรุป (30 วิ)
   "ระบบช่วยให้กทม.เห็นภาพรวม จัดสรรงบประมาณ แก้ปัญหาได้ตรงจุด"
```

### 15:15–16:00 | Buffer + Last Polish
- แก้ทุกอย่างที่ดูแย่จากการซักซ้อม
- Commit code:
```
git add .
git commit -m "polish: UI improvements and demo flow"
git push
```

---

## 16:00–17:30 | 🎤 Presentation Prep

### โครงสร้างสไลด์ (ไม่เกิน 10 สไลด์)

| สไลด์ | หัวข้อ | เนื้อหา |
|---|---|---|
| 1 | Cover | ชื่อโปรเจกต์ + ชื่อทีม |
| 2 | ปัญหา | กรุงเทพมีร้องเรียน X เรื่อง/ปี — ติดตามยาก |
| 3 | Solution | แฟงเมือง = dashboard แบบ real-time |
| 4 | Demo Screenshot | หน้าหลัก annotated |
| 5 | แมพ | choropleth แสดง hotspot |
| 6 | District Detail | per-type resolve rate |
| 7 | ข้อมูล/Insight | 3 insight น่าสนใจ |
| 8 | Tech Stack | React / Leaflet / Traffy Fondue |
| 9 | Impact | ประโยชน์ต่อ กทม. / ประชาชน |
| 10 | Next Steps | อะไรทำต่อได้ถ้ามีเวลา |

**วิธีทำสไลด์เร็ว:**
- ใช้ Canva → "Pitch Deck" template สีเข้ม
- หรือ Google Slides → ธีม "Black"
- screenshot app ใส่ทุกสไลด์ที่เกี่ยวกับ UI

### คำถามที่กรรมการมักถาม + คำตอบ

**Q: ข้อมูลได้มาจากไหน?**
A: "Traffy Fondue ซึ่งเป็น open platform ของ กทม. ที่ประชาชนแจ้งปัญหา เราดึง API มาประมวลผลและ visualize"

**Q: ข้อมูล real-time ไหม?**
A: "ตอนนี้เป็น demo dataset ที่สร้างจากโครงสร้างข้อมูลจริงของ Traffy Fondue ถ้า deploy จริงสามารถ connect API ได้เลย"

**Q: ต่างจาก dashboard ที่มีอยู่ยังไง?**
A: "Traffy Fondue มีแค่รายการ ไม่มี visualization รายเขต ระบบเราแสดง resolution rate per district per problem type ซึ่งช่วยให้เห็น gap ที่ซ่อนอยู่"

**Q: scale ได้ไหม?**
A: "โครงสร้างรองรับทุกจังหวัดในไทย แค่เปลี่ยน GeoJSON และ data source"

---

## 17:30–18:00 | 🚀 Submit & Deploy

### Deploy ขึ้น Netlify (15 นาที)

```bash
# 1. Build
cd C:\fangmueang\fangmueang-app
npm run build

# 2. ตรวจ dist folder ขึ้นไหม
ls dist/

# 3. Deploy via Netlify CLI (ถ้ามี)
npx netlify deploy --prod --dir=dist

# หรือ drag dist/ folder ไปที่ netlify.com/drop
```

**ถ้า build error:**
```bash
# ดู error message → ส่วนใหญ่คือ import ผิด
npm run build 2>&1 | head -30
```

**ถ้า map ไม่ขึ้นบน Netlify:**
- ตรวจ public/bangkok_districts.geojson อยู่ใน git
- ตรวจ public/data.json อยู่ใน git
```bash
git add public/
git commit -m "add public data files"
git push
```

### Final Checklist ก่อนส่ง
```
[ ] localhost:5173 ทำงานปกติ
[ ] netlify URL เปิดได้
[ ] แมพแสดงครบ 50 เขต
[ ] คลิกเขตแสดง detail
[ ] filter ทำงาน
[ ] ปุ่มแจ้งปัญหาทำงาน
[ ] mobile view ไม่พัง
[ ] สไลด์พร้อม
[ ] demo script ซักซ้อมแล้ว
```

---

## 🎯 Tips วันแข่ง

### ถ้าเวลาไม่พอ → ตัดสิ่งเหล่านี้ออก (ไม่กระทบคะแนน)
- animation ซับซ้อน
- dark/light mode toggle  
- pagination บน chart
- แผนที่ zoom animation

### ถ้ามีเวลาเหลือ → เพิ่มสิ่งเหล่านี้ (เพิ่มคะแนน)
- เชื่อม Traffy Fondue API จริง
- export รายงาน PDF
- เปรียบเทียบเขตแบบ side-by-side
- notification เมื่อเขตมีปัญหาวิกฤต

### สิ่งที่ห้ามทำ
- ❌ เริ่ม refactor โค้ดใหญ่วันแข่ง
- ❌ เปลี่ยน library กลางดึก
- ❌ ลบ feature ที่ทำงานแล้วแม้จะไม่สวย
- ❌ ไม่ commit เก็บไว้

### Git workflow วันแข่ง
```bash
# commit ทุก 1-2 ชั่วโมง
git add .
git commit -m "feat: [สิ่งที่ทำ]"
git push

# ถ้าพัง roll back ได้
git log --oneline
git checkout [hash] -- src/components/DistrictMap.jsx
```

---

*สู้ๆ ทีม แฟงเมือง! 🏆*
