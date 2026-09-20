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

    const now=new Date().toISOString();
    const {data:campaigns,error:listErr}=await admin
      .from("marketing_campaigns")
      .select("*")
      .eq("campaign_status","scheduled")
      .eq("channel","email")
      .not("scheduled_at","is",null)
      .lte("scheduled_at",now)
      .order("scheduled_at",{ascending:true})
      .limit(25);
    if(listErr)throw listErr;

    const {data:cfg}=await admin.from("email_delivery_config").select("*").eq("singleton",true).maybeSingle();
    const resendKey=Deno.env.get("RESEND_API_KEY")||"";
    const from=Deno.env.get("ACADEMY_EMAIL_FROM")||((cfg?.from_name||"Funda Online Academy")+" <"+(cfg?.from_email||"notifications@fundaonlineacademy.co.za")+">");
    let processed=0,published=0,failedCampaigns=0;

    for(const campaign of campaigns||[]){
      processed++;
      const messageKey="marketing-campaign-"+campaign.id;
      const {data:subscribers,error:subsErr}=await admin
        .from("marketing_subscribers")
        .select("email,full_name,unsubscribe_token")
        .eq("consent",true)
        .is("unsubscribed_at",null);
      if(subsErr)throw subsErr;

      const seen=new Set<string>();
      const recipients=(subscribers||[]).filter((r:any)=>{
        const email=clean(r.email).toLowerCase();
        if(!email||seen.has(email))return false;
        seen.add(email);
        r.email=email;
        return true;
      });

      for(const r of recipients){
        const unsubscribe='<p style="font-size:11px;color:#718096;margin-top:18px">You are receiving this because you opted in to Funda Online Academy marketing emails. <a href="'+url+'/functions/v1/marketing-unsubscribe?token='+encodeURIComponent(r.unsubscribe_token)+'">Unsubscribe</a></p>';
        const html='<!doctype html><html><body style="margin:0;background:#f3f7fb;font-family:Arial,sans-serif;color:#17304f"><div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #dce6f0;border-radius:18px;overflow:hidden"><div style="background:#071d49;color:#fff;padding:22px 26px"><div style="font-size:11px;letter-spacing:2px;color:#e1bf67;font-weight:700">FUNDA ONLINE ACADEMY</div><h1 style="font-size:21px;margin:7px 0 0">'+esc(campaign.headline||campaign.name)+'</h1></div><div style="padding:26px"><p style="font-size:14px;line-height:1.75;white-space:pre-line">'+esc(campaign.message||"")+'</p><p style="font-size:12px;color:#718096;margin-top:24px">Funda Online Academy · Learn. Grow. Achieve.</p>'+unsubscribe+'</div></div></body></html>';

        await admin.from("email_outbox").upsert({
          message_key:messageKey,
          message_type:"marketing",
          audience:"subscribers",
          recipient_user_id:null,
          recipient_email:r.email,
          recipient_name:r.full_name||null,
          subject:campaign.headline||campaign.name,
          body_text:campaign.message||"",
          body_html:html,
          created_by:campaign.created_by||null,
          updated_at:new Date().toISOString()
        },{onConflict:"message_key,recipient_email",ignoreDuplicates:true});
      }

      let sent=0,failed=0;

      if(cfg?.marketing_enabled===false){
        failed=recipients.length||1;
        await admin.from("marketing_campaigns").update({
          campaign_status:"failed",
          scheduled_at:null,
          updated_at:new Date().toISOString()
        }).eq("id",campaign.id);
        await admin.from("marketing_campaign_events").insert({
          campaign_id:campaign.id,
          event_type:"scheduled_email_failed",
          metadata:{sent:0,failed,queued:recipients.length,message_key:messageKey,error:"Marketing email delivery is disabled"}
        });
        failedCampaigns++;
        continue;
      }

      if(!resendKey){
        failed=recipients.length||1;
        await admin.from("marketing_campaigns").update({
          campaign_status:"failed",
          scheduled_at:null,
          updated_at:new Date().toISOString()
        }).eq("id",campaign.id);
        await admin.from("marketing_campaign_events").insert({
          campaign_id:campaign.id,
          event_type:"scheduled_email_failed",
          metadata:{sent:0,failed,queued:recipients.length,message_key:messageKey,error:"Email provider is not configured"}
        });
        failedCampaigns++;
        continue;
      }

      const {data:pending,error:pendingErr}=await admin.from("email_outbox")
        .select("*")
        .eq("message_key",messageKey)
        .in("status",["pending","failed"])
        .limit(500);
      if(pendingErr)throw pendingErr;

      for(const e of pending||[]){
        await admin.from("email_outbox").update({
          status:"sending",
          attempts:(e.attempts||0)+1,
          updated_at:new Date().toISOString()
        }).eq("id",e.id);

        const payload:any={from,to:[e.recipient_email],subject:e.subject,html:e.body_html,text:e.body_text};
        if(cfg?.reply_to)payload.reply_to=cfg.reply_to;

        const rr=await fetch("https://api.resend.com/emails",{
          method:"POST",
          headers:{Authorization:"Bearer "+resendKey,"Content-Type":"application/json"},
          body:JSON.stringify(payload)
        });
        const out=await rr.json().catch(()=>({}));

        if(rr.ok){
          sent++;
          await admin.from("email_outbox").update({
            status:"sent",
            provider:"resend",
            provider_message_id:out.id||null,
            sent_at:new Date().toISOString(),
            last_error:null,
            updated_at:new Date().toISOString()
          }).eq("id",e.id);
        }else{
          failed++;
          await admin.from("email_outbox").update({
            status:"failed",
            provider:"resend",
            last_error:JSON.stringify(out).slice(0,1000),
            updated_at:new Date().toISOString()
          }).eq("id",e.id);
        }
      }

      const finalStatus=failed>0&&sent===0?"failed":"published";
      const publishedAt=finalStatus==="published"?new Date().toISOString():null;
      await admin.from("marketing_campaigns").update({
        campaign_status:finalStatus,
        published_at:publishedAt,
        scheduled_at:null,
        updated_at:new Date().toISOString()
      }).eq("id",campaign.id);

      await admin.from("marketing_campaign_events").insert({
        campaign_id:campaign.id,
        event_type:"scheduled_email_delivery",
        metadata:{sent,failed,queued:recipients.length,message_key:messageKey,scheduled_at:campaign.scheduled_at}
      });

      if(finalStatus==="published")published++;
      else failedCampaigns++;
    }

    return new Response(JSON.stringify({ok:failedCampaigns===0,processed,published,failed_campaigns:failedCampaigns}),{status:failedCampaigns?207:200,headers:H});
  }catch(e){
    console.error(e);
    return new Response(JSON.stringify({error:e instanceof Error?e.message:String(e)}),{status:500,headers:H});
  }
});
