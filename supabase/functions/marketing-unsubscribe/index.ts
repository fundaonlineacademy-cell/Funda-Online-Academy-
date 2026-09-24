import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async(req:Request)=>{
 try{
  const u=new URL(req.url),token=u.searchParams.get("token")||"";
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  if(!token)return new Response("<h2>Invalid unsubscribe link</h2>",{status:400,headers:{"Content-Type":"text/html"}});

  const now=new Date().toISOString();
  const subscriber=await admin.from("marketing_subscribers")
    .update({unsubscribed_at:now,updated_at:now})
    .eq("unsubscribe_token",token)
    .select("email")
    .maybeSingle();
  if(subscriber.error)throw subscriber.error;

  let matched=!!subscriber.data;
  if(!matched){
    const former=await admin.from("former_student_contacts")
      .update({unsubscribed_at:now,updated_at:now})
      .eq("unsubscribe_token",token)
      .select("email")
      .maybeSingle();
    if(former.error)throw former.error;
    matched=!!former.data;
  }

  if(!matched)return new Response("<h2>This unsubscribe link is invalid or expired.</h2>",{status:404,headers:{"Content-Type":"text/html"}});
  return new Response('<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f8fd;color:#183153;padding:40px"><div style="max-width:560px;margin:auto;background:white;border:1px solid #d9e4f2;border-radius:16px;padding:28px"><h2>Funda Online Academy</h2><p>You have been unsubscribed from promotional emails.</p><p>If you currently have an active Academy account, you may still receive essential account, enrolment, payment, security and service communications.</p></div></body></html>',{headers:{"Content-Type":"text/html"}});
 }catch(e){
  console.error(e);
  return new Response("<h2>Unable to process unsubscribe request.</h2>",{status:500,headers:{"Content-Type":"text/html"}});
 }
});