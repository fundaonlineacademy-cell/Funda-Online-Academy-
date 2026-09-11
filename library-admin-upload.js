(()=>{
if(!/library-admin\.html$/i.test(location.pathname))return;
const wait=()=>new Promise(r=>setTimeout(r,60));
const el=id=>document.getElementById(id);
function addUploadUI(){
 const url=el('fUrl'),cover=el('fCover');
 if(!url||el('fFileUpload'))return;
 const fileWrap=document.createElement('div');fileWrap.className='col-span-full field';fileWrap.innerHTML='<div style="font-size:10px;font-weight:800;color:#06152f;margin-bottom:6px">Upload Library File</div><input id="fFileUpload" type="file" accept=".pdf,.epub,.doc,.docx,.txt,application/pdf,application/epub+zip" style="font-size:10px"><div id="fFileStatus" style="font-size:8px;color:#718096;margin-top:5px">PDF/EPUB/DOCX up to 50 MB. Uploading will securely store the resource.</div>';url.parentNode.insertBefore(fileWrap,url);
 const coverWrap=document.createElement('div');coverWrap.className='col-span-full field';coverWrap.innerHTML='<div style="font-size:10px;font-weight:800;color:#06152f;margin-bottom:6px">Upload Cover Image</div><input id="fCoverUpload" type="file" accept="image/jpeg,image/png,image/webp" style="font-size:10px"><div id="fCoverStatus" style="font-size:8px;color:#718096;margin-top:5px">JPG/PNG/WEBP up to 5 MB.</div>';cover.parentNode.insertBefore(coverWrap,cover);
 url.placeholder='External resource URL (optional if uploading a file)';
}
function addGovernanceUI(){
 const desc=el('fDesc');if(!desc||el('fSourceType'))return;
 const box=document.createElement('div');box.className='col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3';box.innerHTML=`
 <select id="fSourceType" class="field"><option value="">Source type *</option><option value="funda_original">Funda original</option><option value="official_government">Official government</option><option value="official_or_intergovernmental">Official / intergovernmental</option><option value="academic_oer">Academic open education</option><option value="open_textbook">Open textbook</option><option value="open_education">Open education</option><option value="external_reference">External professional reference</option></select>
 <select id="fRights" class="field"><option value="">Rights / access status *</option><option value="academy_owned_original">Academy-owned original</option><option value="external_link_only">External link only</option><option value="link_to_official_source">Link to official source</option><option value="official_publication">Official publication</option><option value="open_license">Open licence</option><option value="verified_open_license">Verified open licence</option><option value="verified_open_access">Verified open access</option></select>
 <select id="fQuality" class="field"><option value="pending_review">Pending quality review</option><option value="approved">Approved</option><option value="rejected">Rejected / hold</option></select>
 <label class="field flex items-center gap-2"><input id="fVerified" type="checkbox"> Source and rights independently verified</label>
 <textarea id="fReviewNotes" class="field sm:col-span-2 min-h-16" placeholder="Quality / source review notes"></textarea>
 <div class="sm:col-span-2" style="font-size:9px;line-height:1.55;color:#667085;background:#fff9e8;border:1px solid #ead49a;border-radius:9px;padding:9px 11px"><b style="color:#76570b">Publishing safeguard:</b> a resource cannot be published until its source and rights are verified and its quality status is Approved.</div>`;
 desc.parentNode.insertBefore(box,desc);
}
function resetGovernance(){addGovernanceUI();if(el('fSourceType'))el('fSourceType').value='';if(el('fRights'))el('fRights').value='';if(el('fQuality'))el('fQuality').value='pending_review';if(el('fVerified'))el('fVerified').checked=false;if(el('fReviewNotes'))el('fReviewNotes').value=''}
function populateGovernance(id){addGovernanceUI();const x=(typeof R!=='undefined'&&Array.isArray(R))?R.find(r=>String(r.id)===String(id)):null;if(!x)return;if(el('fSourceType'))el('fSourceType').value=x.source_type||'';if(el('fRights'))el('fRights').value=x.rights_status||'';if(el('fQuality'))el('fQuality').value=x.quality_status||'pending_review';if(el('fVerified'))el('fVerified').checked=!!x.source_verified_at;if(el('fReviewNotes'))el('fReviewNotes').value=x.review_notes||''}
async function boot(){
 addUploadUI();addGovernanceUI();
 const oldOpen=window.openForm,oldEdit=window.edit,oldSave=window.save;
 if(typeof oldOpen==='function')window.openForm=function(){oldOpen();setTimeout(()=>{addUploadUI();resetGovernance();let f=el('fFileUpload'),c=el('fCoverUpload');if(f)f.value='';if(c)c.value=''},0)};
 if(typeof oldEdit==='function')window.edit=function(id){oldEdit(id);setTimeout(()=>{addUploadUI();populateGovernance(id)},0)};
 if(typeof oldSave!=='function')return;
 window.save=async function(){
   const db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
   const file=el('fFileUpload')?.files?.[0]||null,cover=el('fCoverUpload')?.files?.[0]||null;
   const external=(el('fUrl')?.value||'').trim(),title=(el('fTitle')?.value||'').trim(),category=(el('fCategory')?.value||'').trim();
   const access=el('fAccess')?.value||'all_students',course=el('fCourse')?.value||null;
   const sourceType=el('fSourceType')?.value||'',rights=el('fRights')?.value||'',quality=el('fQuality')?.value||'pending_review',verified=!!el('fVerified')?.checked,reviewNotes=(el('fReviewNotes')?.value||'').trim()||null;
   const requestedStatus=el('fStatus')?.value||'draft';
   if(!title||!category)return alert('Title and category are required.');
   if(!file&&!external)return alert('Upload a Library file or provide an external resource URL.');
   if(access==='course_only'&&!course)return alert('Choose the course for this restricted resource.');
   if(!sourceType||!rights)return alert('Choose the source type and rights/access status before saving.');
   if(requestedStatus==='published'&&(!verified||quality!=='approved'))return alert('This resource cannot be published yet. Verify the source and rights, then set Quality Status to Approved.');
   const beforeIds=new Set((typeof R!=='undefined'&&Array.isArray(R)?R:[]).map(x=>String(x.id)));
   const editingId=(typeof editing!=='undefined'&&editing)?String(editing):null;
   const stageNew=(!editingId&&requestedStatus==='published');
   let filePath=null,coverPath=null;
   try{
     if(file){
       const ext=(file.name.split('.').pop()||'bin').toLowerCase(),safe=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'resource';
       filePath=`${new Date().getFullYear()}/${Date.now()}-${safe}.${ext}`;
       const s=el('fFileStatus');if(s)s.textContent='Uploading secure Library file…';
       const up=await db.storage.from('library-files').upload(filePath,file,{upsert:false,cacheControl:'3600'});if(up.error)throw up.error;
       el('fUrl').value=`secure:${filePath}`;
       const fmt=el('fFormat');if(fmt){const map={pdf:'PDF',epub:'EPUB',doc:'DOCX',docx:'DOCX',txt:'WEB'};if(map[ext])fmt.value=map[ext]}
       if(s)s.textContent='Secure file uploaded.';
     }
     if(cover){
       const ext=(cover.name.split('.').pop()||'jpg').toLowerCase(),safe=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'cover';
       coverPath=`${new Date().getFullYear()}/${Date.now()}-${safe}.${ext}`;
       const s=el('fCoverStatus');if(s)s.textContent='Uploading cover…';
       const up=await db.storage.from('library-covers').upload(coverPath,cover,{upsert:false,cacheControl:'86400'});if(up.error)throw up.error;
       el('fCover').value=db.storage.from('library-covers').getPublicUrl(coverPath).data.publicUrl;
       if(s)s.textContent='Cover uploaded.';
     }
     if(stageNew)el('fStatus').value='draft';
     await oldSave();
     if(stageNew)el('fStatus').value=requestedStatus;
     await wait();
     let resourceId=editingId;
     if(!resourceId&&typeof R!=='undefined'&&Array.isArray(R)){
       const created=R.find(x=>x?.id&&!beforeIds.has(String(x.id)));
       resourceId=created?.id?String(created.id):null;
     }
     if(!resourceId)return;
     const now=new Date().toISOString();
     const patch={source_type:sourceType,rights_status:rights,quality_status:quality,source_verified_at:verified?now:null,reviewed_at:quality==='approved'?now:null,review_notes:reviewNotes,updated_at:now};
     if(filePath){patch.file_path=filePath;patch.file_url=null}
     if(coverPath)patch.cover_path=coverPath;
     if(stageNew){patch.publication_status='published';patch.is_active=true}
     const p=await db.from('library_resources').update(patch).eq('id',resourceId);if(p.error)throw p.error;
     if(typeof load==='function')await load();
   }catch(e){if(stageNew&&el('fStatus'))el('fStatus').value=requestedStatus;alert('Library resource save failed: '+(e?.message||e));}
 };
}
if(document.readyState==='complete')setTimeout(boot,50);else window.addEventListener('load',()=>setTimeout(boot,50),{once:true});
})();