(()=>{
'use strict';
if(!/(^|\/)dashboard\.html$/i.test(location.pathname))return;
if(window.__fundaStudentHeaderFooterSearch)return;
window.__fundaStudentHeaderFooterSearch=true;

const SUPPORT_EMAIL='info@fundaonlineacademy.co.za';
const aliases={
 dashboard:'home overview account activity status',
 orientation:'guide help navigation how to use portal',
 courses:'course courses learning study enrolment enrollment',
 progress:'progress completion roadmap outstanding',
 assessments:'assessment assessments test quiz formative summative',
 materials:'study materials textbook documents resources',
 resources:'digital library library resources',
 results:'results marks provisional academic results',
 certificates:'certificate certificates readiness achievement',
 calendar:'calendar dates reminders schedule holidays',
 payments:'payment payments balance fees proof finance',
 career:'career workplace employment opportunities cv',
 communication:'communication messages inbox announcements notices',
 faq:'faq faqs questions answers help',
 academic:'academic support learning support',
 support:'support ticket technical help assistance',
 profile:'profile personal details account',
 security:'security password login account security',
 voice:'your voice feedback complaint compliment suggestion'
};

function esc(v){
 return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function installStyle(){
 if(document.getElementById('studentHeaderFooterSearchStyle'))return;
 const style=document.createElement('style');
 style.id='studentHeaderFooterSearchStyle';
 style.textContent='\
body.sdV2>header .h-\\[72px\\]{position:relative}\
.studentHeaderSearchWrap{position:relative;order:3;flex:1 1 420px;max-width:560px;min-width:220px;margin:0 auto}\
.studentHeaderSearchIcon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#bdd0e4;font-size:18px;font-weight:900;pointer-events:none;z-index:2}\
.studentGlobalSearch{width:100%;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.10);color:#fff!important;-webkit-text-fill-color:#fff!important;caret-color:#fff!important;padding:0 42px;font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;font-size:13px;font-weight:700;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}\body.sdV2>header .studentGlobalSearch,body.sdV2>header .studentGlobalSearch:focus,body.sdV2>header .studentGlobalSearch:active,body.sdV2>header .studentGlobalSearch:not(:placeholder-shown){color:#fff!important;-webkit-text-fill-color:#fff!important;caret-color:#fff!important}\
.studentGlobalSearch::placeholder{color:#b7c6d8!important;-webkit-text-fill-color:#b7c6d8!important;opacity:1}\
.studentGlobalSearch:focus{border-color:#e2bd62;background:rgba(255,255,255,.14);box-shadow:0 0 0 3px rgba(226,189,98,.12)}\
.studentGlobalSearch::-webkit-search-cancel-button{filter:invert(1);opacity:.75}\
.studentHeaderSearchResults{display:none;position:absolute;top:50px;left:0;right:0;z-index:160;max-height:390px;overflow:auto;background:#fff;border:1px solid #d9e2ef;border-radius:13px;box-shadow:0 18px 45px rgba(7,23,47,.22);padding:7px}\
.studentHeaderSearchResults.open{display:block}\
.studentHeaderSearchResult{display:block;width:100%;border:0;background:#fff;border-radius:9px;padding:10px 11px;text-align:left;color:#07172f;font-family:inherit;cursor:pointer}\
.studentHeaderSearchResult:hover,.studentHeaderSearchResult:focus{background:#eef4ff;outline:none}\
.studentHeaderSearchResult b{display:block;font-size:13px;line-height:1.3}\
.studentHeaderSearchResult span{display:block;margin-top:3px;color:#687b90;font-size:10px;line-height:1.35}\
.studentHeaderSearchEmpty{padding:13px;color:#66798e;font-size:11px;text-align:center}\
#studentHeaderSearchButton{display:none;place-items:center;width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:20px;font-weight:900;cursor:pointer}\
body.sdV2>header #sdMenu{order:1}\
body.sdV2>header .h-\\[72px\\]>a{order:2}\
body.sdV2>header .h-\\[72px\\]>.studentHeaderSearchWrap{order:3}\
body.sdV2>header .h-\\[72px\\]>.flex.items-center.gap-2{order:4!important;margin-left:0!important}\
.studentFooterEmailLink{color:#dbeafe;text-decoration:none;font-weight:700}\
.studentFooterEmailLink:hover,.studentFooterEmailLink:focus{text-decoration:underline;color:#fff}\
@media(max-width:999px){.studentHeaderSearchWrap{max-width:420px;flex-basis:280px}.studentGlobalSearch{font-size:12px}}\
@media(max-width:760px){\
 .studentHeaderSearchWrap{display:none;position:absolute;left:0;right:0;top:64px;max-width:none;min-width:0;margin:0;padding:10px;background:#06152f;border:1px solid rgba(255,255,255,.12);border-radius:0 0 14px 14px;box-shadow:0 18px 35px rgba(2,15,35,.24)}\
 .studentHeaderSearchWrap.mobile-open{display:block}\
 #studentHeaderSearchButton{display:inline-grid}\
 .studentHeaderSearchResults{top:58px;left:10px;right:10px}\
 body.sdV2>header .h-\\[72px\\]>.flex.items-center.gap-2{margin-left:auto!important}\
}\
@media(max-width:420px){body.sdV2>header #logoutButton{padding:10px 13px!important;font-size:12px!important}#studentHeaderSearchButton{width:40px;height:40px}}';
 document.head.appendChild(style);
}

function buildIndex(){
 const items=[];
 document.querySelectorAll('#sdSide .sdNavGroup').forEach(group=>{
  const groupLabel=(group.querySelector('.sdNavLabel')?.textContent||'Student Portal').trim();
  group.querySelectorAll('[data-sd-key]').forEach(link=>{
   const key=link.dataset.sdKey||'';
   const label=(link.querySelector('span:last-child')?.textContent||link.textContent||key).trim();
   const href=link.getAttribute('href')||'';
   items.push({
    key,label,detail:groupLabel,href,link,
    haystack:(label+' '+groupLabel+' '+key+' '+href+' '+(aliases[key]||'')).toLowerCase()
   });
  });
 });
 return items;
}

function installSearch(){
 const header=document.querySelector('body>header');
 const row=header?.querySelector('.h-\\[72px\\]');
 const controls=row?.querySelector('.flex.items-center.gap-2');
 if(!header||!row||!controls||!document.getElementById('sdSide'))return false;
 installStyle();

 let wrap=document.getElementById('studentHeaderSearchWrap');
 if(!wrap){
  wrap=document.createElement('div');
  wrap.id='studentHeaderSearchWrap';
  wrap.className='studentHeaderSearchWrap';
  wrap.innerHTML='<span class="studentHeaderSearchIcon" aria-hidden="true">⌕</span><input id="studentGlobalSearch" class="studentGlobalSearch" type="search" autocomplete="off" placeholder="Search Student Portal…" aria-label="Search Student Portal" aria-controls="studentHeaderSearchResults" aria-expanded="false"><div id="studentHeaderSearchResults" class="studentHeaderSearchResults" role="listbox" aria-label="Student Portal search results"></div>';
  row.insertBefore(wrap,controls);
 }

 let mobileButton=document.getElementById('studentHeaderSearchButton');
 if(!mobileButton){
  mobileButton=document.createElement('button');
  mobileButton.id='studentHeaderSearchButton';
  mobileButton.type='button';
  mobileButton.setAttribute('aria-label','Search Student Portal');
  mobileButton.setAttribute('aria-controls','studentHeaderSearchWrap');
  mobileButton.setAttribute('aria-expanded','false');
  mobileButton.textContent='⌕';
  controls.insertBefore(mobileButton,controls.firstChild);
 }

 const input=document.getElementById('studentGlobalSearch');
 const box=document.getElementById('studentHeaderSearchResults');
 if(!input||!box)return false;
 if(input.dataset.ready==='1')return true;
 input.dataset.ready='1';
 let current=[];

 const closeResults=()=>{
  box.classList.remove('open');
  box.innerHTML='';
  input.setAttribute('aria-expanded','false');
  current=[];
 };
 const closeMobile=()=>{
  wrap.classList.remove('mobile-open');
  mobileButton.setAttribute('aria-expanded','false');
  closeResults();
 };
 const openItem=item=>{
  if(!item)return;
  input.value='';
  closeResults();
  closeMobile();
  if(item.link&&document.contains(item.link))item.link.click();
  else if(item.href)location.href=item.href;
 };
 const render=()=>{
  const query=input.value.trim().toLowerCase();
  if(!query){closeResults();return;}
  const terms=query.split(/\s+/).filter(Boolean);
  current=buildIndex().filter(item=>terms.every(term=>item.haystack.includes(term))).slice(0,8);
  if(!current.length){
   box.innerHTML='<div class="studentHeaderSearchEmpty">No matching Student Portal item found.</div>';
  }else{
   box.innerHTML=current.map((item,index)=>'<button class="studentHeaderSearchResult" type="button" role="option" data-student-search-index="'+index+'"><b>'+esc(item.label)+'</b><span>'+esc(item.detail)+'</span></button>').join('');
   box.querySelectorAll('[data-student-search-index]').forEach(button=>{
    button.addEventListener('click',()=>openItem(current[Number(button.dataset.studentSearchIndex)]));
   });
  }
  box.classList.add('open');
  input.setAttribute('aria-expanded','true');
 };

 input.addEventListener('input',render);
 input.addEventListener('focus',()=>{if(input.value.trim())render();});
 input.addEventListener('keydown',event=>{
  if(event.key==='Enter'){
   event.preventDefault();
   if(current[0])openItem(current[0]);
   else render();
  }else if(event.key==='Escape'){
   closeMobile();
   mobileButton.focus();
  }
 });
 mobileButton.addEventListener('click',()=>{
  const willOpen=!wrap.classList.contains('mobile-open');
  if(willOpen){
   wrap.classList.add('mobile-open');
   mobileButton.setAttribute('aria-expanded','true');
   setTimeout(()=>input.focus(),0);
  }else closeMobile();
 });
 document.addEventListener('click',event=>{
  if(!event.target.closest('#studentHeaderSearchWrap')&&!event.target.closest('#studentHeaderSearchButton'))closeResults();
 });
 window.addEventListener('resize',()=>{
  if(innerWidth>760){
   wrap.classList.remove('mobile-open');
   mobileButton.setAttribute('aria-expanded','false');
  }
 });
 return true;
}

function installFooterEmail(){
 const footer=document.querySelector('body>footer');
 if(!footer)return false;
 if(footer.querySelector('a[href="mailto:'+SUPPORT_EMAIL+'"]'))return true;
 const supportHeading=[...footer.querySelectorAll('h3')].find(h=>h.textContent.trim().toLowerCase()==='student support');
 const column=supportHeading?.parentElement;
 if(!column)return false;
 const whatsapp=[...column.querySelectorAll('p')].find(p=>/whatsapp/i.test(p.textContent));
 const email=document.createElement('p');
 email.className='mt-2 text-sm text-blue-100';
 email.innerHTML='Email: <a class="studentFooterEmailLink" href="mailto:'+SUPPORT_EMAIL+'">'+SUPPORT_EMAIL+'</a>';
 if(whatsapp)whatsapp.insertAdjacentElement('afterend',email);
 else column.appendChild(email);
 return true;
}

function boot(){
 let tries=0;
 const timer=setInterval(()=>{
  tries+=1;
  const searchReady=installSearch();
  const footerReady=installFooterEmail();
  if((searchReady&&footerReady)||tries>=30)clearInterval(timer);
 },120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();