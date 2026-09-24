import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const esc=(v:any)=>String(v??"").replace(/[&<>"\']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#39;"}[m]||m));
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:H});
 try{
  const auth=req.headers.get("Authorization")||"";
  const url=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await caller.auth.getUser();
  if(!user)return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:H});
  const admin=createClient(url,service);
  const {data:actor}=await admin.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(actor?.role!=="admin")return new Response(JSON.stringify({error:"Admin access required"}),{status:403,headers:H});
  const {data:deletedRows,error:deletedErr}=await admin.from("ceo_account_control_state").select("user_id").eq("status","deleted");if(deletedErr)throw deletedErr;
  const deletedIds=new Set((deletedRows||[]).map((x:any)=>String(x.user_id)));
  const b=await req.json();
  const subject=String(b.subject||"").trim(), body=String(b.body||"").trim(), audience=String(b.audience||"").trim(), type=b.message_type==="marketing"?"marketing":"operational";
  if(!subject||!body||!audience)return new Response(JSON.stringify({error:"subject, body and audience are required"}),{status:400,headers:H});
  const {data:cfg}=await admin.from("email_delivery_config").select("*").eq("singleton",true).maybeSingle();
  if(type==="marketing"&&cfg?.marketing_enabled===false)return new Response(JSON.stringify({error:"Marketing email delivery is disabled"}),{status:409,headers:H});
  if(type==="operational"&&cfg?.operational_enabled===false)return new Response(JSON.stringify({error:"Operational email delivery is disabled"}),{status:409,headers:H});
  let recipients:any[]=[];
  if(audience==="subscribers"){
    const q=await admin.from("marketing_subscribers").select("id,email,full_name,unsubscribe_token").eq("consent",true).is("unsubscribed_at",null); if(q.error)throw q.error;
    recipients=(q.data||[]).map((x:any)=>({id:null,email:x.email,name:x.full_name,unsubscribe_token:x.unsubscribe_token}));
    if(type!=="marketing")return new Response(JSON.stringify({error:"Subscribers are reserved for consent-based marketing email"}),{status:400,headers:H});
  }else if(audience==="all_students"){
    const q=await admin.from("profiles").select("id,email,full_name").eq("role","student");if(q.error)throw q.error;recipients=q.data||[];
  }else if(audience==="active_students"){
    const q=await admin.from("enrollments").select("student_id,status,enrollment_status"); if(q.error)throw q.error;
    const ids=[...new Set((q.data||[]).filter((x:any)=>["approved","active","enrolled","completed"].includes(String(x.status||x.enrollment_status||"").toLowerCase())).map((x:any)=>x.student_id).filter(Boolean))];
    if(ids.length){const p=await admin.from("profiles").select("id,email,full_name").in("id",ids);if(p.error)throw p.error;recipients=p.data||[]}
  }else if(audience==="course"){
    if(!b.course_id)return new Response(JSON.stringify({error:"course_id required"}),{status:400,headers:H});
    const q=await admin.from("enrollments").select("student_id,status,enrollment_status").eq("course_id",b.course_id); if(q.error)throw q.error;
    const ids=[...new Set((q.data||[]).filter((x:any)=>["approved","active","enrolled","completed"].includes(String(x.status||x.enrollment_status||"").toLowerCase())).map((x:any)=>x.student_id).filter(Boolean))];
    if(ids.length){const p=await admin.from("profiles").select("id,email,full_name").in("id",ids);if(p.error)throw p.error;recipients=p.data||[]}
  }else if(audience==="student"){
    if(!b.recipient_id)return new Response(JSON.stringify({error:"recipient_id required"}),{status:400,headers:H});
    const q=await admin.from("profiles").select("id,email,full_name").eq("id",b.recipient_id).eq("role","student").maybeSingle();if(q.error)throw q.error;if(q.data)recipients=[q.data];
  }else if(audience==="staff"){
    const q=await admin.from("profiles").select("id,email,full_name").in("role",["staff","admin","manager"]);if(q.error)throw q.error;recipients=q.data||[];
  }else if(audience==="ambassadors"){
    const q=await admin.from("ambassador_programme_applications").select("email,full_name").eq("status","approved");if(q.error)throw q.error;recipients=(q.data||[]).map((x:any)=>({id:null,email:x.email,name:x.full_name}));
  }else if(audience==="former_students"){
    if(type!=="marketing")return new Response(JSON.stringify({error:"Former student outreach must use the marketing email channel"}),{status:400,headers:H});
    const q=await admin.from("former_student_contacts").select("email,full_name,unsubscribe_token").eq("active",true).is("unsubscribed_at",null);if(q.error)throw q.error;
    const current=await admin.from("profiles").select("email").eq("role","student");if(current.error)throw current.error;
    const currentEmails=new Set((current.data||[]).map((x:any)=>String(x.email||"").trim().toLowerCase()).filter(Boolean));
    recipients=(q.data||[]).filter((x:any)=>!currentEmails.has(String(x.email||"").trim().toLowerCase())).map((x:any)=>({id:null,email:x.email,name:x.full_name,unsubscribe_token:x.unsubscribe_token,former_student:true}));
  }else if(audience==="all_funda"){
    const p=await admin.from("profiles").select("id,email,full_name").in("role",["student","staff","admin","manager"]);if(p.error)throw p.error;
    const a=await admin.from("ambassador_programme_applications").select("email,full_name").eq("status","approved");if(a.error)throw a.error;
    recipients=[...(p.data||[]),...(a.data||[]).map((x:any)=>({id:null,email:x.email,name:x.full_name}))];
  }else return new Response(JSON.stringify({error:"Unsupported audience"}),{status:400,headers:H});
  const seen=new Set<string>();recipients=recipients.filter((r:any)=>{const e=String(r.email||"").trim().toLowerCase(),id=String(r.id||"");if(!e||e.endsWith("@deleted.funda.invalid")||(id&&deletedIds.has(id))||seen.has(e))return false;seen.add(e);r.email=e;return true});
  const messageKey=String(b.message_key||crypto.randomUUID());
  for(const r of recipients){
    const marketingReason=r.former_student?'You are receiving this because you previously studied with Funda Online Academy.':'You are receiving this because you opted in to Funda Online Academy marketing emails.';
    const unsubscribe=type==="marketing"&&r.unsubscribe_token?'<p style="font-size:11px;color:#718096;margin-top:18px">'+marketingReason+' <a href="'+url+'/functions/v1/marketing-unsubscribe?token='+encodeURIComponent(r.unsubscribe_token)+'">Unsubscribe</a></p>':'';
    const html='<!doctype html><html><body style="margin:0;background:#f3f7fb;font-family:Arial,sans-serif;color:#17304f"><div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #dce6f0;border-radius:18px;overflow:hidden"><div style="background:#071d49;color:#fff;padding:22px 26px"><div style="font-size:11px;letter-spacing:2px;color:#e1bf67;font-weight:700">FUNDA ONLINE ACADEMY</div><h1 style="font-size:21px;margin:7px 0 0">'+esc(subject)+'</h1></div><div style="padding:26px"><p style="font-size:14px;line-height:1.75;white-space:pre-line">'+esc(body)+'</p><p style="font-size:12px;color:#718096;margin-top:24px">Funda Online Academy · Learn. Grow. Achieve.</p>'+unsubscribe+'</div></div></body></html>';
    await admin.from("email_outbox").upsert({message_key:messageKey,message_type:type,audience,recipient_user_id:r.id||null,recipient_email:r.email,recipient_name:r.name||r.full_name||null,subject,body_text:body,body_html:html,created_by:user.id,updated_at:new Date().toISOString()},{onConflict:"message_key,recipient_email",ignoreDuplicates:true});
  }
  const providerKey=Deno.env.get("RESEND_API_KEY");
  const from=Deno.env.get("ACADEMY_EMAIL_FROM")||((cfg?.from_name||"Funda Online Academy")+" <"+(cfg?.from_email||"notifications@fundaonlineacademy.co.za")+">");
  if(!providerKey)return new Response(JSON.stringify({ok:false,provider_missing:true,queued:recipients.length,message_key:messageKey,from}),{status:503,headers:H});
  const {data:pending,error:pe}=await admin.from("email_outbox").select("*").eq("message_key",messageKey).in("status",["pending","failed"]).limit(100);if(pe)throw pe;
  let sent=0,failed=0;
  for(const e of pending||[]){
    await admin.from("email_outbox").update({status:"sending",attempts:(e.attempts||0)+1,updated_at:new Date().toISOString()}).eq("id",e.id);
    const payload:any={from,to:[e.recipient_email],subject:e.subject,html:e.body_html,text:e.body_text}; if(cfg?.reply_to)payload.reply_to=cfg.reply_to;
    const rr=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+providerKey,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const out=await rr.json().catch(()=>({}));
    if(rr.ok){sent++;await admin.from("email_outbox").update({status:"sent",provider:"resend",provider_message_id:out.id||null,sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq("id",e.id)}
    else{failed++;await admin.from("email_outbox").update({status:"failed",provider:"resend",last_error:JSON.stringify(out).slice(0,1000),updated_at:new Date().toISOString()}).eq("id",e.id)}
  }
  return new Response(JSON.stringify({ok:failed===0,queued:recipients.length,sent,failed,message_key:messageKey,from}),{status:failed?207:200,headers:H});
 }catch(e){return new Response(JSON.stringify({error:e instanceof Error?e.message:String(e)}),{status:500,headers:H})}
});