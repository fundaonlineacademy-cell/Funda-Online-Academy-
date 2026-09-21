import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"content-type,x-funda-dispatch-secret",
  "Content-Type":"application/json",
  "Cache-Control":"no-store"
};
const clean=(v:unknown)=>String(v??"").trim();
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]||m));

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:H});
  try{
    const url=Deno.env.get("SUPABASE_URL")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin=createClient(url,service,{auth:{persistSession:false}});

    const {data:dispatchCfg,error:dispatchErr}=await admin
      .from("academy_notification_config")
      .select("dispatch_secret")
      .eq("singleton",true)
      .single();
    if(dispatchErr||!dispatchCfg)return new Response(JSON.stringify({error:"Dispatch configuration unavailable"}),{status:503,headers:H});

    const supplied=req.headers.get("x-funda-dispatch-secret")||"";
    if(!supplied||supplied!==dispatchCfg.dispatch_secret)return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:H});

    const {data:deletedRows,error:deletedErr}=await admin.from("ceo_account_control_state").select("user_id").eq("status","deleted");if(deletedErr)throw deletedErr;
    const deletedIds=new Set((deletedRows||[]).map((x:any)=>String(x.user_id)));
    const now=new Date().toISOString();
    const {data:messages,error:listErr}=await admin
      .from("communications")
      .select("*")
      .eq("published",true)
      .eq("email_requested",true)
      .is("email_dispatched_at",null)
      .not("scheduled_at","is",null)
      .lte("scheduled_at",now)
      .in("email_delivery_status",["scheduled","pending"])
      .order("scheduled_at",{ascending:true})
      .limit(25);
    if(listErr)throw listErr;

    const {data:cfg}=await admin.from("email_delivery_config").select("*").eq("singleton",true).maybeSingle();
    const resendKey=Deno.env.get("RESEND_API_KEY")||"";
    const from=Deno.env.get("ACADEMY_EMAIL_FROM")||((cfg?.from_name||"Funda Online Academy")+" <"+(cfg?.from_email||"notifications@fundaonlineacademy.co.za")+">");

    let processed=0,sentMessages=0,failedMessages=0;

    for(const m of messages||[]){
      processed++;
      let recipients:any[]=[];
      const audience=clean(m.audience);

      if(audience==="all_students"){
        const q=await admin.from("profiles").select("id,email,full_name").eq("role","student");if(q.error)throw q.error;recipients=q.data||[];
      }else if(audience==="active_students"){
        const q=await admin.from("enrollments").select("student_id,status,enrollment_status");if(q.error)throw q.error;
        const ids=[...new Set((q.data||[]).filter((x:any)=>["approved","active","enrolled","completed"].includes(clean(x.status||x.enrollment_status).toLowerCase())).map((x:any)=>x.student_id).filter(Boolean))];
        if(ids.length){const p=await admin.from("profiles").select("id,email,full_name").in("id",ids);if(p.error)throw p.error;recipients=p.data||[]}
      }else if(audience==="course"){
        if(m.course_id){const q=await admin.from("enrollments").select("student_id,status,enrollment_status").eq("course_id",m.course_id);if(q.error)throw q.error;
          const ids=[...new Set((q.data||[]).filter((x:any)=>["approved","active","enrolled","completed"].includes(clean(x.status||x.enrollment_status).toLowerCase())).map((x:any)=>x.student_id).filter(Boolean))];
          if(ids.length){const p=await admin.from("profiles").select("id,email,full_name").in("id",ids);if(p.error)throw p.error;recipients=p.data||[]}}
      }else if(audience==="student"){
        if(m.recipient_id){const q=await admin.from("profiles").select("id,email,full_name").eq("id",m.recipient_id).eq("role","student").maybeSingle();if(q.error)throw q.error;if(q.data)recipients=[q.data]}
      }else if(audience==="staff"){
        const q=await admin.from("profiles").select("id,email,full_name").in("role",["staff","admin","manager"]);if(q.error)throw q.error;recipients=q.data||[];
      }else if(audience==="ambassadors"){
        const q=await admin.from("ambassador_programme_applications").select("email,full_name").eq("status","approved");if(q.error)throw q.error;recipients=(q.data||[]).map((x:any)=>({id:null,email:x.email,full_name:x.full_name}));
      }else if(audience==="all_funda"){
        const p=await admin.from("profiles").select("id,email,full_name").in("role",["student","staff","admin","manager"]);if(p.error)throw p.error;
        const a=await admin.from("ambassador_programme_applications").select("email,full_name").eq("status","approved");if(a.error)throw a.error;
        recipients=[...(p.data||[]),...(a.data||[]).map((x:any)=>({id:null,email:x.email,full_name:x.full_name}))];
      }

      const seen=new Set<string>();
      recipients=recipients.filter((r:any)=>{const email=clean(r.email).toLowerCase(),id=String(r.id||"");if(!email||email.endsWith("@deleted.funda.invalid")||(id&&deletedIds.has(id))||seen.has(email))return false;seen.add(email);r.email=email;return true});

      const messageKey="scheduled-communication-"+m.id;
      const html='<!doctype html><html><body style="margin:0;background:#f3f7fb;font-family:Arial,sans-serif;color:#17304f"><div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #dce6f0;border-radius:18px;overflow:hidden"><div style="background:#071d49;color:#fff;padding:22px 26px"><div style="font-size:11px;letter-spacing:2px;color:#e1bf67;font-weight:700">FUNDA ONLINE ACADEMY</div><h1 style="font-size:21px;margin:7px 0 0">'+esc(m.title)+'</h1></div><div style="padding:26px"><p style="font-size:14px;line-height:1.75;white-space:pre-line">'+esc(m.body)+'</p><p style="font-size:12px;color:#718096;margin-top:24px">Funda Online Academy · Learn. Grow. Achieve.</p></div></div></body></html>';

      for(const r of recipients){
        await admin.from("email_outbox").upsert({
          message_key:messageKey,
          message_type:"operational",
          audience,
          recipient_user_id:r.id||null,
          recipient_email:r.email,
          recipient_name:r.full_name||null,
          subject:m.title,
          body_text:m.body,
          body_html:html,
          created_by:m.created_by||null,
          updated_at:new Date().toISOString()
        },{onConflict:"message_key,recipient_email",ignoreDuplicates:true});
      }

      if(!resendKey){
        failedMessages++;
        await admin.from("communications").update({
          email_delivery_status:"failed",
          email_last_error:"Email provider is not configured.",
          updated_at:new Date().toISOString()
        }).eq("id",m.id);
        continue;
      }

      const {data:pending,error:pendingErr}=await admin.from("email_outbox")
        .select("*").eq("message_key",messageKey).in("status",["pending","failed"]).limit(500);
      if(pendingErr)throw pendingErr;

      for(const e of pending||[]){
        await admin.from("email_outbox").update({status:"sending",attempts:(e.attempts||0)+1,updated_at:new Date().toISOString()}).eq("id",e.id);
        const payload:any={from,to:[e.recipient_email],subject:e.subject,html:e.body_html,text:e.body_text};
        if(cfg?.reply_to)payload.reply_to=cfg.reply_to;
        const rr=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const out=await rr.json().catch(()=>({}));
        if(rr.ok){
          await admin.from("email_outbox").update({status:"sent",provider:"resend",provider_message_id:out.id||null,sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq("id",e.id);
        }else{
          await admin.from("email_outbox").update({status:"failed",provider:"resend",last_error:JSON.stringify(out).slice(0,1000),updated_at:new Date().toISOString()}).eq("id",e.id);
        }
      }

      const {data:finalRows}=await admin.from("email_outbox").select("status,last_error").eq("message_key",messageKey);
      const failed=(finalRows||[]).filter((x:any)=>x.status==="failed");
      if(failed.length){
        failedMessages++;
        await admin.from("communications").update({
          email_delivery_status:"failed",
          email_last_error:clean(failed[0]?.last_error||"Email delivery failed.").slice(0,1000),
          updated_at:new Date().toISOString()
        }).eq("id",m.id);
      }else{
        sentMessages++;
        await admin.from("communications").update({
          email_delivery_status:"sent",
          email_dispatched_at:new Date().toISOString(),
          email_last_error:null,
          updated_at:new Date().toISOString()
        }).eq("id",m.id);
      }
    }

    return new Response(JSON.stringify({ok:failedMessages===0,processed,sent_messages:sentMessages,failed_messages:failedMessages}),{status:failedMessages?207:200,headers:H});
  }catch(e){
    console.error(e);
    return new Response(JSON.stringify({error:e instanceof Error?e.message:String(e)}),{status:500,headers:H});
  }
});
