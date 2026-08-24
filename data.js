// Cloudflare Pages Function — เก็บ/ดึงข้อมูลปิดงบ ลง Cloudflare KV (auto-backup)
// ต้อง bind KV namespace ชื่อ DEAL_CLOSE ใน Pages > Settings > Bindings
const PREFIX = "close:";
const jsonRes = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

export const onRequestGet = async ({ request, env }) => {
  const kv = env.DEAL_CLOSE;
  if (!kv) return jsonRes({ error: "ยังไม่ได้ bind KV: DEAL_CLOSE" }, 500);
  const month = new URL(request.url).searchParams.get("month");
  if (month) {
    const v = await kv.get(PREFIX + month);
    return jsonRes(v ? JSON.parse(v) : null);
  }
  // ไม่ระบุเดือน = ส่งทุกเดือน (ไว้ซิงค์ตอนเปิด)
  const list = await kv.list({ prefix: PREFIX });
  const months = list.keys.map((k) => k.name.slice(PREFIX.length)).sort();
  const data = {};
  for (const m of months) {
    const v = await kv.get(PREFIX + m);
    if (v) data[m] = JSON.parse(v);
  }
  return jsonRes({ months, data });
};

export const onRequestPut = async ({ request, env }) => {
  const kv = env.DEAL_CLOSE;
  if (!kv) return jsonRes({ error: "ยังไม่ได้ bind KV: DEAL_CLOSE" }, 500);
  const month = new URL(request.url).searchParams.get("month");
  if (!month) return jsonRes({ error: "ต้องระบุ ?month=" }, 400);
  const body = await request.text();
  try { JSON.parse(body); } catch { return jsonRes({ error: "body ไม่ใช่ JSON" }, 400); }
  await kv.put(PREFIX + month, body);
  return jsonRes({ ok: true, month });
};
