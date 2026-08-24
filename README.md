# DEAL! · ปิดงบรายเดือน — Cloudflare Worker

โครงไฟล์ (วางที่ root ทั้งหมด **ไม่ต้องมีโฟลเดอร์**):
```
wrangler.toml   ← ตั้งค่า Worker + ผูก KV
index.js        ← Worker: เช็ครหัส + API เก็บข้อมูล + เสิร์ฟหน้าเว็บ
page.js         ← หน้าเว็บทั้งหน้า (ฝังในตัว)
README.md       ← ไฟล์นี้
```

## วิธีขึ้น (ทำครั้งเดียว)
1. **repo ต้องเป็น Private** (มีข้อมูลการเงินฝังใน page.js)
2. ตั้ง Secret ใน Cloudflare Worker: `AUTH_USER`, `AUTH_PASS`
3. สร้าง KV namespace → เอา id ใส่ใน `wrangler.toml` (แทน `ใส่_KV_NAMESPACE_ID_ตรงนี้`)
4. push 4 ไฟล์นี้ขึ้น repo → Cloudflare deploy อัตโนมัติ
5. เข้าเว็บ → เบราว์เซอร์เด้งถามรหัส

## backup 3 ชั้น
- ☁ Cloudflare KV (อัตโนมัติ ทุกครั้งที่แก้) — ตัวหลัก
- 💾 localStorage ในเครื่อง
- 📄 ปุ่ม JSON โหลดไฟล์เก็บเอง
