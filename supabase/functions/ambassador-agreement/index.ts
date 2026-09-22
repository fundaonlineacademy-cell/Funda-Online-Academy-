import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Cache-Control":"no-store"
};

Deno.serve((req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ambassador Agreement Flow Updated</title><style>body{font-family:Arial,sans-serif;background:#f7f3e8;color:#17324a;margin:0}.wrap{max-width:720px;margin:40px auto;padding:20px}.card{background:#fff;border:1px solid #dcc98f;border-radius:18px;padding:28px}a{display:inline-block;margin-top:14px;padding:12px 16px;border-radius:10px;background:#17324a;color:#fff;text-decoration:none;font-weight:700}</style></head><body><div class="wrap"><div class="card"><h1>Ambassador agreement process updated</h1><p>Funda Online Academy now records the current Ambassador Programme Agreement and electronic signature inside the dedicated Ambassador application. This older agreement link is no longer used.</p><p>If you already submitted an application, use Ambassador Login to check your status. New applicants should start from the current Ambassador Programme page.</p><a href="https://fundaonlineacademy.co.za/ambassador-login.html">Ambassador Login</a></div></div></body></html>`;
  return new Response(html,{
    status:410,
    headers:{...cors,"Content-Type":"text/html; charset=utf-8"}
  });
});
