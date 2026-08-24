# DEAL! · ปิดงบรายเดือน — Cloudflare Pages + รหัส + Auto-backup (KV)

เวอร์ชันขึ้นเว็บแบบครบ: **รหัสฝั่งเซิร์ฟเวอร์** (เหมือนระบบปันผล) + **เซฟขึ้นคลาวด์อัตโนมัติ** ทุกครั้งที่แก้ (ไม่หายแม้ล้าง browser / เปิดเครื่องอื่นก็เห็นข้อมูลชุดเดียวกัน)

## โครงไฟล์
```
deal-close/
├─ index.html                 ← ตัวระบบ + ตัวซิงค์ขึ้นคลาวด์
└─ functions/
   ├─ _middleware.js          ← เช็ครหัส (Basic Auth) ทุก request
   └─ api/
      └─ data.js              ← เก็บ/ดึงข้อมูลลง Cloudflare KV
```

## ขั้นตอนขึ้น Cloudflare Pages

### A. ขึ้นเว็บ + ตั้งรหัส
1. push โครงข้างบนขึ้น GitHub repo (แนะนำ **private**)
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → เลือก repo
3. Build: **Framework preset = None**, Build command เว้นว่าง, **Build output directory = `/`** → Deploy
4. **Settings → Variables and secrets** → เพิ่ม Secret 2 ตัว: `AUTH_USER`, `AUTH_PASS`

### B. เปิดระบบ backup อัตโนมัติ (KV) — สำคัญ
5. Cloudflare → **Storage & Databases → KV → Create namespace** ตั้งชื่อเช่น `deal-close-kv`
6. กลับมาที่ Pages project → **Settings → Bindings → Add → KV namespace**
   - **Variable name = `DEAL_CLOSE`** (ต้องชื่อนี้เป๊ะ)
   - เลือก namespace ที่เพิ่งสร้าง
7. **Retry deployment** 1 ครั้ง ให้ทุกอย่างเห็นค่าใหม่

เสร็จ! เปิดเว็บ → ใส่ user/pass → ใช้งาน ข้อมูลเซฟขึ้นคลาวด์เอง

## มันทำงานยังไง (backup + auto-save)
- ทุกครั้งที่แก้ข้อมูล ระบบเซฟลง browser **แล้วดันขึ้น Cloudflare KV อัตโนมัติ** (หน่วง ~1 วิ) — มุมขวาล่างมีป้าย “☁ เซฟขึ้นคลาวด์แล้ว”
- เปิดเว็บครั้งใหม่ / เครื่องใหม่ → **ดึงข้อมูลล่าสุดจากคลาวด์มาให้เอง**
- เก็บแยกราย “เดือน” — เปิดดูย้อนหลังได้ครบ
- ปุ่ม **JSON** (ใน UI) = backup แบบไฟล์ไว้เก็บเองอีกชั้น, **Excel** = ออกรายงาน

## เปลี่ยนรหัส
แก้ Secret `AUTH_USER` / `AUTH_PASS` ใน Cloudflare → retry deploy (ไม่ต้องแตะโค้ด)

## หมายเหตุ / ข้อจำกัด
- ถ้า **ยังไม่ได้ bind KV `DEAL_CLOSE`** ระบบยังใช้ได้ปกติ แต่เซฟแค่ใน browser (ป้ายจะขึ้น “โหลดคลาวด์ไม่ได้”) — ต้องทำข้อ B ให้ครบ
- ข้อมูลชนกันใช้ **last-write-wins** (ใครเซฟทีหลังทับ) — ทีมเล็กโอเค; ถ้าต้องแก้พร้อมกันหลายคนบ่อยๆ ค่อยเพิ่ม merge-before-save แบบ deal-dividend ทีหลังได้
- KV เหมาะกับขนาดข้อมูลนี้มาก (อ่านเร็ว ฟรี tier กว้าง)
