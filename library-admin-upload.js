(()=>{
if(!/library-admin\.html$/i.test(location.pathname))return;
const wait=()=>new Promise(r=>setTimeout(r,0));
function addUploadUI(){
 const url=document.getElementById('fUrl'),cover=document.getElementById('fCover');
 if(!url||document.getElementById('fFileUpload'))return;
 const fileWrap=document.createElement('div');fileWrap.className='col-span-full field';fileWrap.innerHTML='<div style="font-size:10px;font-weight:800;color:#06152f;margin-bottom:6px">Upload Library File</div><input id="fFileUpload" type="file" accept=".pdf,.epub,.doc,.docx,.txt,application/pdf,application/epub+zip" style="font-size:10px"><div id="fFileStatus" style="font-size:8px;color:#718096;margin-top:5px">PDF/EPUB/DOCX up to 50 MB. Uploading will securely store the resource.</div>';url.parentNode.insertBefore(fileWrap,url);
 const coverWrap=document.createElement('div');coverWrap.className='col-span-full field';coverWrap.innerHTML='<div style="font-size:10px;font-weight:800;color:#06152f;margin-bottom:6px">Upload Cover Image</div><input id="fCoverUpload" type="file" accept="image/jpeg,image/png,image/webp" style="font-size:10px"><div id="fCoverStatus" style="font-size:8px;color:#718096;margin-top:5px">JPG/PNG/WEBP up to 5 MB.</div>';cover.parentNode.insertBefore(coverWrap,cover);
 url.placeholder='External resource URL (optional if uploading a file)';
}
async function boot(){
 addUploadUI();
 const oldOpen=window.openForm,oldEdit=window.edit,oldSave=window.save;
 if(typeof oldOpen==='function')window.openForm=function(){oldOpen();setTimeout(()=>{addUploadUI();let f=document.getElementById('fFileUpload'),c=document.getElementById('fCoverUpload');if(f)f.value='';if(c)c.value=''},0)};
 if(typeof oldEdit==='function')window.edit=function(id){oldEdit(id);setTimeout(addUploadUI,0)};
 if(typeof oldSave!=='function')return;
 window.save=async function(){
   const db=window.db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
   const file=document.getElementById('fFileUpload')?.files?.[0]||null,cover=document.getElementById('fCoverUpload')?.files?.[0]||null;
   const external=(document.getElementById('fUrl')?.value||'').trim();
   if(!file&&!external)return alert('Upload a Library file or provide an external resource URL.');
   const title=(document.getElementById('fTitle')?.value||'resource').trim();
   let filePath=null,coverPath=null,coverUrl=null;
   try{
     if(file){
       const ext=(file.name.split('.').pop()||'bin').toLowerCase(),safe=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'resource';
       filePath=`${new Date().getFullYear()}/${Date.now()}-${safe}.${ext}`;
       const s=document.getElementById('fFileStatus');if(s)s.textContent='Uploading secure Library file…';
       const up=await db.storage.from('library-files').upload(filePath,file,{upsert:false,cacheControl:'3600'});if(up.error)throw up.error;
       document.getElementById('fUrl').value='';
       const fmt=document.getElementById('fFormat');if(fmt){const map={pdf:'PDF',epub:'EPUB',doc:'DOCX',docx:'DOCX',txt:'WEB'};if(map[ext])fmt.value=map[ext]}
       if(s)s.textContent='Secure file uploaded.';
     }
     if(cover){
       const ext=(cover.name.split('.').pop()||'jpg').toLowerCase(),safe=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'cover';
       coverPath=`${new Date().getFullYear()}/${Date.now()}-${safe}.${ext}`;
       const s=document.getElementById('fCoverStatus');if(s)s.textContent='Uploading cover…';
       const up=await db.storage.from('library-covers').upload(coverPath,cover,{upsert:false,cacheControl:'86400'});if(up.error)throw up.error;
       coverUrl=db.storage.from('library-covers').getPublicUrl(coverPath).data.publicUrl;
       document.getElementById('fCover').value=coverUrl;
       if(s)s.textContent='Cover uploaded.';
     }
     await oldSave();
     if(filePath||coverPath){
       await wait();
       const q=await db.from('library_resources').select('id').eq('title',title).order('updated_at',{ascending:false}).limit(1).maybeSingle();
       if(q.data?.id){const patch={};if(filePath)patch.file_path=filePath;if(coverPath)patch.cover_path=coverPath;await db.from('library_resources').update(patch).eq('id',q.data.id)}
     }
   }catch(e){alert('Upload failed: '+(e?.message||e));}
 };
}
if(document.readyState==='complete')setTimeout(boot,50);else window.addEventListener('load',()=>setTimeout(boot,50),{once:true});
})();