(()=>{
if(!/course-view\.html$/i.test(location.pathname)||window.__fundaCourseViewRuntimeFix)return;
window.__fundaCourseViewRuntimeFix=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const arr=v=>{if(Array.isArray(v))return v;if(typeof v==='string'){try{const x=JSON.parse(v);if(Array.isArray(x))return x}catch(e){}return v.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}return[]};
const price=v=>{if(v===null||v===undefined||v==='')return'Contact us';const n=Number(v);return Number.isFinite(n)?`R${n.toLocaleString('en-ZA',{maximumFractionDigits:2})}`:String(v)};
const q=id=>document.getElementById(id);
function error(message){q('loading')?.classList.add('hidden');q('courseContent')?.classList.add('hidden');q('errorBox')?.classList.remove('hidden');if(q('errorMessage'))q('errorMessage').textContent=message||'Unable to load this course.'}
function render(course,modules){
 const title=course.title||course.name||'Untitled Course';
 q('loading')?.classList.add('hidden');q('errorBox')?.classList.add('hidden');q('courseContent')?.classList.remove('hidden');
 if(q('courseTitle'))q('courseTitle').textContent=title;
 if(q('courseDescription'))q('courseDescription').textContent=course.description||course.summary||'Course information will be available soon.';
 if(q('courseCategory'))q('courseCategory').textContent=course.category||course.course_category||'Professional Short Course';
 if(q('courseDuration'))q('courseDuration').textContent=course.duration||course.course_duration||'Self-paced';
 if(q('coursePrice'))q('coursePrice').textContent=price(course.price??course.amount??course.course_price);
 const img=q('courseImage'),fallback=q('heroFallbackText'),src=course.image_url||course.image||course.thumbnail_url||course.thumbnail||course.cover_image||'';
 if(img&&src){img.alt=title;img.onload=()=>{img.classList.remove('hidden');fallback?.classList.add('hidden')};img.onerror=()=>{img.classList.add('hidden');fallback?.classList.remove('hidden')};img.src=src}
 const outcomes=arr(course.learning_outcomes??course.learningOutcomes??course.outcomes),out=q('learningOutcomes');
 if(out)out.innerHTML=outcomes.length?outcomes.map(item=>`<div class="border border-[#dce6f2] rounded-2xl p-4 flex gap-3 items-start bg-[#fffaf0]"><span class="text-[#27805f] font-bold">✓</span><span class="text-sm text-slate-600">${esc(typeof item==='object'?(item.title||item.name||item.description||JSON.stringify(item)):item)}</span></div>`).join(''):'<div class="border border-[#dce6f2] rounded-2xl p-4 text-sm text-slate-500 bg-[#fffaf0]">Learning outcomes will be published here.</div>';
 const list=(modules||[]).map((m,i)=>({title:m.module_name||m.title||m.name||`Module ${i+1}`,description:m.description||m.summary||'',number:m.module_number||i+1}));
 if(q('moduleCount'))q('moduleCount').textContent=`${list.length} ${list.length===1?'module':'modules'}`;
 if(q('modules'))q('modules').innerHTML=list.length?list.map((m,i)=>`<div class="border border-[#dce6f2] rounded-2xl p-4 bg-[#fffaf0] flex gap-4"><div class="w-9 h-9 rounded-full bg-[#fff1c9] text-[#71520f] flex items-center justify-center font-extrabold text-sm shrink-0">${esc(m.number)}</div><div><h3 class="font-bold text-[#071D49]">${esc(m.title)}</h3>${m.description?`<p class="text-xs text-slate-500 mt-1 leading-5">${esc(m.description)}</p>`:''}</div></div>`).join(''):'<div class="border border-dashed border-[#c9d8eb] rounded-2xl p-5 text-sm text-slate-500 bg-[#fffaf0]">Module information will be available here.</div>';
 const enroll=`onboarding.html?course=${encodeURIComponent(course.id)}`;
 const btn=q('enrollBtn');if(btn&&!btn.dataset.runtimeFix){btn.dataset.runtimeFix='1';btn.addEventListener('click',async()=>{try{const client=window.__fundaCourseViewClient;if(!client)return location.href=`login.html?next=${encodeURIComponent(`course-view.html?id=${course.id}`)}`;const {data}=await client.auth.getSession();location.href=data?.session?enroll:`login.html?next=${encodeURIComponent(`course-view.html?id=${course.id}`)}`}catch(e){location.href=`login.html?next=${encodeURIComponent(`course-view.html?id=${course.id}`)}`}})}
 if(q('createAccountLink'))q('createAccountLink').href=`auth.html?next=${encodeURIComponent(enroll)}`;
 document.dispatchEvent(new CustomEvent('funda:course-view-ready',{detail:{course}}));
}
async function start(){
 const id=new URLSearchParams(location.search).get('id');if(!id)return error('No course was selected. Please return to the course catalogue.');
 for(let i=0;i<40&&!window.supabase;i++)await new Promise(r=>setTimeout(r,100));
 if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return error('Academy course service is temporarily unavailable. Please try again.');
 try{
  const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});window.__fundaCourseViewClient=client;
  const [cr,mr]=await Promise.all([client.from('courses').select('*').eq('id',id).maybeSingle(),client.from('course_modules').select('module_number,module_name,description').eq('course_id',id).order('module_number')]);
  if(cr.error)throw cr.error;if(!cr.data)throw new Error('This course could not be found.');render(cr.data,mr.error?[]:(mr.data||[]));
 }catch(e){console.error('Course overview runtime fix:',e);error(e?.message||'Unable to load this course.')}
}
function boot(){setTimeout(()=>{const loading=q('loading'),content=q('courseContent');if(content&&!content.classList.contains('hidden'))return;if(!loading)return;start()},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();