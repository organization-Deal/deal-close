// Cloudflare Pages Function — บังคับใส่รหัส (Basic Auth) ก่อนเข้าทุกหน้า/ทุก API
// ใช้ Secret: AUTH_USER, AUTH_PASS (ตั้งใน Pages > Settings > Variables and secrets)
export const onRequest = async ({ request, env, next }) => {
  const user = env.AUTH_USER, pass = env.AUTH_PASS;
  if (!user || !pass) return new Response("ยังไม่ได้ตั้ง AUTH_USER / AUTH_PASS", { status: 500 });
  const expected = "Basic " + btoa(`${user}:${pass}`);
  const got = request.headers.get("Authorization") || "";
  let ok = got.length === expected.length;
  for (let i = 0; i < expected.length; i++) ok = ok & (got.charCodeAt(i) === expected.charCodeAt(i));
  if (!ok) return new Response("กรุณาเข้าสู่ระบบ", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="DEAL Close", charset="UTF-8"' } });
  return next();
};
