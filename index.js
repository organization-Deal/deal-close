// DEAL! ปิดงบรายเดือน — Cloudflare Worker (auth + KV backup + เสิร์ฟหน้าเว็บในตัว)
import PAGE_B64 from "./page.js";
const PREFIX = "close:";
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

let _bytes = null;
function pageBytes() {
  if (!_bytes) _bytes = Uint8Array.from(atob(PAGE_B64), (c) => c.charCodeAt(0));
  return _bytes;
}

export default {
  async fetch(request, env) {
    // ---- 1) เช็ครหัส (Basic Auth) ----
    const u = env.AUTH_USER, p = env.AUTH_PASS;
    if (!u || !p) return new Response("ยังไม่ได้ตั้ง AUTH_USER / AUTH_PASS", { status: 500 });
    const expected = "Basic " + btoa(`${u}:${p}`);
    const got = request.headers.get("Authorization") || "";
    let ok = got.length === expected.length;
    for (let i = 0; i < expected.length; i++) ok = ok & (got.charCodeAt(i) === expected.charCodeAt(i));
    if (!ok)
      return new Response("กรุณาเข้าสู่ระบบ", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="DEAL Close", charset="UTF-8"' },
      });

    // ---- 2) API เก็บ/ดึงข้อมูล (KV) ----
    const url = new URL(request.url);
    if (url.pathname === "/api/data") {
      const kv = env.DEAL_CLOSE;
      if (!kv) return json({ error: "ยังไม่ได้ bind KV: DEAL_CLOSE" }, 500);
      if (request.method === "GET") {
        const m = url.searchParams.get("month");
        if (m) {
          const v = await kv.get(PREFIX + m);
          return json(v ? JSON.parse(v) : null);
        }
        const list = await kv.list({ prefix: PREFIX });
        const months = list.keys.map((k) => k.name.slice(PREFIX.length)).sort();
        const data = {};
        for (const mm of months) {
          const v = await kv.get(PREFIX + mm);
          if (v) data[mm] = JSON.parse(v);
        }
        return json({ months, data });
      }
      if (request.method === "PUT") {
        const m = url.searchParams.get("month");
        if (!m) return json({ error: "ต้องระบุ ?month=" }, 400);
        const body = await request.text();
        try { JSON.parse(body); } catch { return json({ error: "body ไม่ใช่ JSON" }, 400); }
        await kv.put(PREFIX + m, body);
        return json({ ok: true, month: m });
      }
      return json({ error: "method not allowed" }, 405);
    }

    // ---- 3) หน้าเว็บ ----
    return new Response(pageBytes(), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
