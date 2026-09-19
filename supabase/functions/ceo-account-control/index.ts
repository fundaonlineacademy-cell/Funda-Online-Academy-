import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'
};

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{...cors,'Content-Type':'application/json'}
  });
}

function avatarPath(value:unknown){
  const raw=String(value||'').trim();
  if(!raw)return '';
  try{
    const marker='/profile-avatars/';
    const i=raw.indexOf(marker);
    if(i>=0)return decodeURIComponent(raw.slice(i+marker.length).split('?')[0]);
    if(!/^https?:\/\//i.test(raw))return raw.replace(/^profile-avatars\//,'').replace(/^\/+/, '');
  }catch{}
  return '';
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const auth=req.headers.get('Authorization')||'';
    if(!auth.startsWith('Bearer '))return json({error:'Unauthorized'},401);

    const url=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const token=auth.slice(7);

    const userClient=createClient(url,anon,{
      global:{headers:{Authorization:auth}},
      auth:{persistSession:false,autoRefreshToken:false}
    });
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

    const {data:{user},error:userErr}=await admin.auth.getUser(token);
    if(userErr||!user)return json({error:'Invalid session'},401);

    const {data:isCeo,error:ceoErr}=await userClient.rpc('is_ceo');
    if(ceoErr||isCeo!==true)return json({error:'CEO authorisation is required.'},403);

    const body=await req.json();
    const target=String(body?.target_user_id||'').trim();
    const action=String(body?.action||'').trim().toLowerCase();
    const reason=String(body?.reason||'').trim();
    const confirmation=body?.confirmation==null?null:String(body.confirmation).trim();

    if(!target)return json({error:'Select an account.'},400);
    if(!['deactivate','reactivate','delete'].includes(action))return json({error:'Choose deactivate, reactivate or delete.'},400);
    if(reason.length<5)return json({error:'A clear reason of at least 5 characters is required.'},400);

    let avatar='';
    if(action==='delete'){
      const {data:profile,error:profileErr}=await admin
        .from('profiles')
        .select('id,avatar_url')
        .eq('id',target)
        .maybeSingle();
      if(profileErr)throw profileErr;
      avatar=avatarPath(profile?.avatar_url);
    }

    const {data,error}=await userClient.rpc('ceo_manage_account',{
      p_target_user_id:target,
      p_action:action,
      p_reason:reason,
      p_confirmation:confirmation
    });
    if(error)return json({error:error.message},400);

    let avatar_cleanup='not_applicable';
    if(action==='delete'&&avatar){
      const {error:removeErr}=await admin.storage.from('profile-avatars').remove([avatar]);
      avatar_cleanup=removeErr?'failed':'removed';
    }

    return json({ok:true,result:data,avatar_cleanup});
  }catch(e){
    return json({error:e?.message||'Unable to manage account'},400);
  }
});