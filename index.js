// DEAL! ปิดงบรายเดือน — Cloudflare Worker
// v2: Basic Auth + KV team sync + server-preload snapshot
import PAGE_B64 from "./page.js";

const PREFIX = "close:";
const META_KEY = PREFIX + "__meta";

const noStoreHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  "pragma": "no-cache",
};

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: noStoreHeaders });

let _bytes = null;
function pageBytes() {
  if (!_bytes) _bytes = Uint8Array.from(atob(PAGE_B64), (c) => c.charCodeAt(0));
  return _bytes;
}


function monthRank(label) {
  const text = String(label || "").trim().toLowerCase();
  const months = [
    ["มกราคม","ม.ค","มค"],["กุมภาพันธ์","ก.พ","กพ"],["มีนาคม","มี.ค","มีค"],
    ["เมษายน","เม.ย","เมย"],["พฤษภาคม","พ.ค","พค"],["มิถุนายน","มิ.ย","มิย"],
    ["กรกฎาคม","ก.ค","กค"],["สิงหาคม","ส.ค","สค"],["กันยายน","ก.ย","กย"],
    ["ตุลาคม","ต.ค","ตค"],["พฤศจิกายน","พ.ย","พย"],["ธันวาคม","ธ.ค","ธค"]
  ];
  let month = 0;
  for (let i = 0; i < months.length; i++) {
    if (months[i].some((x) => text.includes(x))) { month = i + 1; break; }
  }
  const nums = text.match(/\d{4}/g) || [];
  let year = nums.length ? Number(nums[nums.length - 1]) : 0;
  if (year > 2400) year -= 543;
  return year * 100 + month;
}

async function readMeta(kv) {
  try {
    const raw = await kv.get(META_KEY);
    if (!raw) return { months: [], last: null, updatedAt: 0, revision: null };
    const meta = JSON.parse(raw);
    return {
      months: Array.isArray(meta.months) ? meta.months : [],
      last: meta.last || null,
      updatedAt: Number(meta.updatedAt) || 0,
      revision: meta.revision || null,
    };
  } catch {
    return { months: [], last: null, updatedAt: 0, revision: null };
  }
}

async function writeMeta(kv, meta) {
  await kv.put(META_KEY, JSON.stringify(meta));
}

async function buildSnapshot(kv) {
  let meta = await readMeta(kv);
  let months = meta.months.slice();

  // Migration path for old data created before the meta key existed.
  if (!months.length) {
    const list = await kv.list({ prefix: PREFIX });
    months = list.keys
      .map((k) => k.name)
      .filter((name) => name !== META_KEY)
      .map((name) => name.slice(PREFIX.length))
      .sort((a, b) => monthRank(a) - monthRank(b) || a.localeCompare(b, "th"));
  }

  const data = {};
  const validMonths = [];
  for (const m of months) {
    const raw = await kv.get(PREFIX + m);
    if (!raw) continue;
    try {
      data[m] = JSON.parse(raw);
      validMonths.push(m);
    } catch {}
  }

  const last = meta.last && data[meta.last]
    ? meta.last
    : (validMonths.length ? validMonths[validMonths.length - 1] : null);

  return {
    months: validMonths,
    data,
    last,
    updatedAt: Number(meta.updatedAt) || 0,
    revision: meta.revision || null,
  };
}

function authOK(request, env) {
  const u = env.AUTH_USER, p = env.AUTH_PASS;
  if (!u || !p) return { configured: false, ok: false };
  const expected = "Basic " + btoa(`${u}:${p}`);
  const got = request.headers.get("Authorization") || "";
  let ok = got.length === expected.length;
  for (let i = 0; i < expected.length; i++) {
    ok = ok & (got.charCodeAt(i) === expected.charCodeAt(i));
  }
  return { configured: true, ok: !!ok };
}

export default {
  async fetch(request, env) {
    const auth = authOK(request, env);
    if (!auth.configured) {
      return new Response("ยังไม่ได้ตั้ง AUTH_USER / AUTH_PASS", { status: 500 });
    }
    if (!auth.ok) {
      return new Response("กรุณาเข้าสู่ระบบ", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="DEAL Close", charset="UTF-8"' },
      });
    }

    const url = new URL(request.url);
    const kv = env.DEAL_CLOSE;

    if (!kv) {
      return json({ error: "ยังไม่ได้ bind KV: DEAL_CLOSE" }, 500);
    }

    // Health check for debugging.
    if (url.pathname === "/api/ping") {
      const meta = await readMeta(kv);
      return json({ ok: true, binding: "DEAL_CLOSE", ...meta });
    }

    // Team data API.
    if (url.pathname === "/api/data") {
      if (request.method === "GET") {
        const m = url.searchParams.get("month");
        if (m) {
          const raw = await kv.get(PREFIX + m);
          return json(raw ? JSON.parse(raw) : null);
        }
        return json(await buildSnapshot(kv));
      }

      if (request.method === "PUT") {
        const m = (url.searchParams.get("month") || "").trim();
        if (!m) return json({ error: "ต้องระบุ ?month=" }, 400);

        const body = await request.text();
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          return json({ error: "body ไม่ใช่ JSON" }, 400);
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return json({ error: "ข้อมูลเดือนไม่ถูกต้อง" }, 400);
        }

        await kv.put(PREFIX + m, JSON.stringify(parsed));

        const oldMeta = await readMeta(kv);
        const months = oldMeta.months.filter((x) => x && x !== m);
        months.push(m);
        const updatedAt = Date.now();
        const revision = `${updatedAt}-${crypto.randomUUID().slice(0, 8)}`;
        const meta = { months, last: m, updatedAt, revision };
        await writeMeta(kv, meta);

        return json({ ok: true, month: m, updatedAt, revision });
      }

      if (request.method === "DELETE") {
        const m = (url.searchParams.get("month") || "").trim();
        if (!m) return json({ error: "ต้องระบุ ?month=" }, 400);

        await kv.delete(PREFIX + m);
        const oldMeta = await readMeta(kv);
        const months = oldMeta.months.filter((x) => x && x !== m);
        const last = oldMeta.last === m ? (months[months.length - 1] || null) : oldMeta.last;
        const updatedAt = Date.now();
        const revision = `${updatedAt}-${crypto.randomUUID().slice(0, 8)}`;
        await writeMeta(kv, { months, last, updatedAt, revision });

        return json({ ok: true, deleted: m, months, last, updatedAt, revision });
      }

      return json({ error: "method not allowed" }, 405);
    }

    // Server-preload the latest cloud snapshot into every fresh page load.
    const snapshot = await buildSnapshot(kv);
    const safeSnapshot = JSON.stringify(snapshot).replace(/</g, "\\u003c");
    const baseResponse = new Response(pageBytes(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
        "pragma": "no-cache",
      },
    });

    return new HTMLRewriter()
      .on("head", {
        element(el) {
          el.append(`<script>window.__DEAL_CLOUD__=${safeSnapshot};</script>`, { html: true });
        },
      })
      .transform(baseResponse);
  },
};
