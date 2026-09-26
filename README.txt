DEAL Close — TEAM SYNC v2.1 + NO-RELOAD AUTOSAVE FIX

อัปเดตนี้แก้ Auto Save แล้วหน้าเว็บ Refresh เองระหว่างพิมพ์
- Auto Save ยังทำงานเหมือนเดิม
- Team Sync จะอัปเดตในหน้าเดิม ไม่ใช้ location.reload()
- Auto Sync จะไม่แทรกระหว่างที่กำลังโฟกัส input/textarea/select
- แก้ index timestamp ไม่ให้เปลี่ยนทุกครั้งที่ poll

DEAL Close — TEAM SYNC v2 + Mobile

อัปทับ GitHub 2 ไฟล์:
- index.js
- page.js

ไม่ต้องแก้ wrangler.toml

หลัง Deploy:
1) เครื่องเจ้าของที่มีข้อมูลเดิม เปิดเว็บก่อน
2) ต้องเห็น badge TEAM SYNC v2
3) กดปุ่ม "↑ ส่งข้อมูล" 1 ครั้ง เพื่อดันข้อมูล local เดิมขึ้น KV v2
4) เครื่องทีมเปิด/Refresh แล้วกด "↻ ซิงก์" ถ้ายังไม่เด้งเอง

ระบบใหม่:
- server preload ก่อน React เปิด
- explicit save เข้า /api/data
- meta: last / updatedAt / revision
- poll ทุก 8 วินาที + sync ตอน focus
- ลบเดือน sync ขึ้น cloud
- mobile responsive
- /api/ping ใช้ตรวจ KV metadata
