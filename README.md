# DEAL! · ปิดงบรายเดือน — Cloudflare **Worker** (แก้ให้รหัสขึ้นแล้ว)

> ทำไมของเดิมรหัสไม่ขึ้น: URL เป็น `*.workers.dev` = deploy เป็น **Worker** แต่ `functions/_middleware.js` ทำงานเฉพาะบน **Pages** เท่านั้น เลยโดนข้าม
> เวอร์ชันนี้ย้าย auth + KV มาไว้ในตัว Worker เลย → รหัสทำงานแน่นอน

## โครงไฟล์
```
deal-close/
├─ wrangler.toml        ← ตั้งค่า Worker + ผูก KV
└─ src/
   ├─ index.js          ← Worker: เช็ครหัส + API เก็บข้อมูล + เสิร์ฟหน้าเว็บ
   └─ page.js           ← หน้าเว็บทั้งหน้า (ฝังในตัว)
```
> เอา 3 ไฟล์นี้ไปแทนของเดิมใน repo (ลบ `index.html` + โฟลเดอร์ `functions/` เดิมทิ้งได้)

## ต้องทำ 3 อย่าง

### 1) รหัส (มีอยู่แล้ว)
Secret `AUTH_USER` / `AUTH_PASS` ที่มึงตั้งไว้ ใช้ได้เลย ไม่ต้องทำใหม่

### 2) ผูก KV (สำหรับ backup อัตโนมัติ)
1. Cloudflare → **Storage & Databases → KV → Create namespace** (เช่นชื่อ `deal-close-kv`)
2. ก๊อป **Namespace ID** ที่ได้
3. เปิด `wrangler.toml` เอา id ไปวางแทน `ใส่_KV_NAMESPACE_ID_ตรงนี้`

### 3) Deploy
push ขึ้น GitHub repo เดิม → Cloudflare Workers Builds จะ build+deploy ให้เอง
(หรือถ้าใช้ CLI: `npx wrangler deploy`)

เสร็จ → เข้า `deal-close.organization-23c.workers.dev` → เบราว์เซอร์จะเด้งถามรหัสแล้ว 🎉

## เช็คว่าทำงานถูก
- เปิดเว็บ **ไม่ใส่รหัส / ใส่ผิด** → ขึ้น 401 เข้าไม่ได้ ✓
- ใส่ถูก → เข้าระบบ มุมขวาล่างมีป้าย **☁ เซฟขึ้นคลาวด์แล้ว** เวลาแก้ข้อมูล
- เปิดเครื่องอื่น/ล้าง browser → ข้อมูลยังอยู่ (ดึงจาก KV)

## ระบบ backup (เหมือนเดิม 3 ชั้น)
1. ☁ **Cloudflare KV** — เซฟอัตโนมัติทุกครั้งที่แก้ (แยกรายเดือน) = ตัวหลัก ไม่หาย
2. 💾 localStorage ในเครื่อง — สำรองตอนออฟไลน์
3. 📄 ปุ่ม **JSON** — โหลดไฟล์เก็บเองอีกชั้น

## หมายเหตุ
- ถ้ายังไม่ผูก KV (ข้าม step 2) เว็บยังใช้ได้ แต่เซฟแค่ในเครื่อง (ป้ายขึ้น "โหลดคลาวด์ไม่ได้")
- ข้อมูลชนกัน = last-write-wins (ทีมเล็กโอเค)
- แก้รหัส: ไปเปลี่ยน Secret `AUTH_USER`/`AUTH_PASS` ใน Cloudflare แล้ว deploy ใหม่
