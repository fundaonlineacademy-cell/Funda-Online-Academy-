(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
if(!db)return;
let busy=false;
async function secureOpen(id,download){
 if(busy)return;busy=true;
 try{
   const q=await db.from('library_resources').select('id,title,file_path,file_url,is_downloadable').eq('id',id).maybeSingle();
   if(q.error)throw q.error;const x=q.data;if(!x)return alert('This Library resource is not available to your account.');
   if(download&&!x.is_downloadable)return alert('Downloads are not enabled for this resource.');
   if(x.file_path){
     const s=await db.storage.from('library-files').createSignedUrl(x.file_path,180,{download:download?x.title||'Funda-Library-Resource':undefined});
     if(s.error)throw s.error;
     window.open(s.data.signedUrl,'_blank','noopener');return;
   }
   if(x.file_url){window.open(x.file_url,'_blank','noopener');return;}
   alert('This resource has not been uploaded yet.');
 }catch(e){alert('Could not open this Library resource: '+(e?.message||e));}
 finally{busy=false}
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-open],[data-download]');if(!b)return;
 const id=b.dataset.open||b.dataset.download;if(!id)return;
 e.preventDefault();e.stopImmediatePropagation();secureOpen(id,!!b.dataset.download);
},true);
})();