import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Cache-Control':'no-store'
};

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
}

function oneTimeAccessCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let body='';
  for(const b of bytes) body+=alphabet[b%alphabet.length];
  return 'FOA-SEC-'+body.slice(0,5)+'-'+body.slice(5);
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);

  try{
    const auth=req.headers.get('Authorization')||'';
    if(!auth.startsWith('Bearer '))return json({error:'Unauthorized'},401);

    const url=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const token=auth.slice(7);

    const caller=createClient(url,anon,{
      global:{headers:{Authorization:auth}},
      auth:{persistSession:false,autoRefreshToken:false}
    });
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

    const {data:{user},error:userErr}=await admin.auth.getUser(token);
    if(userErr||!user)return json({error:'Invalid session'},401);

    const {data:actor,error:actorErr}=await admin
      .from('profiles')
      .select('id,role')
      .eq('id',user.id)
      .maybeSingle();
    if(actorErr||!actor)return json({error:'Account profile not found'},403);

    const {data:hrAccess}=await admin
      .from('staff_access_assignments')
      .select('access_level,active')
      .eq('profile_id',user.id)
      .eq('department','Human Resources')
      .eq('active',true)
      .maybeSingle();

    const mayRotate=String(actor.role||'').toLowerCase()==='admin'
      || String(hrAccess?.access_level||'').toLowerCase()==='manager';
    if(!mayRotate)return json({error:'Administrator or HR manager authority is required'},403);

    const body=await req.json().catch(()=>({}));
    const targetId=String(body.profile_id||'').trim();
    if(!targetId)return json({error:'Staff account is required'},400);

    const {data:target,error:targetErr}=await admin
      .from('profiles')
      .select('id,role,full_name,email,staff_number')
      .eq('id',targetId)
      .maybeSingle();
    if(targetErr||!target)return json({error:'Staff account not found'},404);

    const targetRole=String(target.role||'').toLowerCase();
    if(targetRole==='admin' && target.id!==user.id){
      return json({error:'An administrator may rotate only their own administrator access code'},403);
    }
    if(!['admin','staff'].includes(targetRole))return json({error:'Staff or administrator account required'},400);

    const {data:state}=await admin
      .from('ceo_account_control_state')
      .select('status')
      .eq('user_id',target.id)
      .maybeSingle();
    if(String(state?.status||'').toLowerCase()==='deleted'){
      return json({error:'A deleted account cannot receive an access code'},400);
    }

    const access_code=oneTimeAccessCode();
    const {error:setErr}=await admin.rpc('set_staff_access_code',{
      p_profile_id:target.id,
      p_access_code:access_code,
      p_actor_id:user.id
    });
    if(setErr)throw setErr;

    return json({
      ok:true,
      profile_id:target.id,
      staff_number:target.staff_number||null,
      access_code,
      notice:'This Access Code is shown once. Share it securely with the staff member.'
    });
  }catch(e){
    return json({error:e instanceof Error?e.message:String(e)},400);
  }
});
