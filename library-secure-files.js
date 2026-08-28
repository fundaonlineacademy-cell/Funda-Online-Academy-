(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
if(!db)return;
let busy=false,user=null;
async function loadUser(){if(user)return user;const s=await db.auth.getSession();user=s.data.session?.user||null;return user}
async function logDownload(id){
 const u=await loadUser();if(!u)return;
 const now=new Date().toISOString();
 const q=await db.from('library_activity').select('*').eq('student_id',u.id).eq('resource_id',id).order('updated_at',{ascending:false}).limit(1);
 const old=q.data?.[0]||null;
 if(old){
   // Keep reading/completion progress intact. Download is an access event, not a new reading state.
   await db.from('library_activity').update({last_opened_at:now,updated_at:now}).eq('id',old.id);
 }else{
   await db.from('library_activity').insert({student_id:u.id,resource_id:id,activity_type:'downloaded',progress_percent:0,last_opened_at:now,updated_at:now});
 }
}
async function secureOpen(id,download){
 if(busy)return;busy=true;
 try{
   const q=await db.from('library_resources').select('id,title,file_path,file_url,is_downloadable').eq('id',id).eq('is_active',true).eq('publication_status','published').maybeSingle();
   if(q.error)throw q.error;const x=q.data;if(!x)return alert('This Library resource is not available to your account.');
   if(download&&!x.is_downloadable)return alert('Downloads are not enabled for this resource.');
   let url=null;
   if(x.file_path){
     const s=await db.storage.from('library-files').createSignedUrl(x.file_path,180,{download:download?x.title||'Funda-Library-Resource':undefined});
     if(s.error)throw s.error;url=s.data.signedUrl;
   }else url=x.file_url||null;
   if(!url)return alert('This resource has not been uploaded yet.');
   if(download)await logDownload(id);
   window.open(url,'_blank','noopener');
 }catch(e){alert('Could not open this Library resource: '+(e?.message||e));}
 finally{busy=false}
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-download]');if(!b||!b.dataset.download)return;
 e.preventDefault();e.stopImmediatePropagation();secureOpen(b.dataset.download,true);
},true);
window.FundaLibrarySecureFiles={download:id=>secureOpen(id,true)};
})();