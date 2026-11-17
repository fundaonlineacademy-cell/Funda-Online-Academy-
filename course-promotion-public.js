(()=>{
 'use strict';
 const key='funda:promotion:intent:v1';
 const valid=value=>/^[A-Z0-9]{4,32}$/.test(value);
 const normal=value=>String(value||'').trim().toUpperCase();
 let memory='';
 function rememberCode(value){const code=normal(value);memory=valid(code)?code:'';try{if(memory)sessionStorage.setItem(key,memory);else sessionStorage.removeItem(key);}catch(_){}return memory;}
 function pendingCode(){try{const value=normal(sessionStorage.getItem(key)||memory);return valid(value)?value:'';}catch(_){return memory;}}
 const supplied=new URLSearchParams(location.search).get('promo');
 if(supplied&&valid(normal(supplied)))rememberCode(supplied);
 const client=()=>window.__fundaSharedSupabaseClient||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
 async function loadOffer(code=null){const db=client();if(!db)return null;const {data,error}=await db.rpc('get_course_promotion_offer',{p_code:code||null});if(error)throw Error('Promotion details could not be loaded. Please try again.');return data;}
 function endsText(offer){return new Date(new Date(offer.ends_at).getTime()-1).toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric',timeZone:'Africa/Johannesburg'});}
 window.FundaCoursePromotion={pendingCode,rememberCode,loadOffer,endsText};
 async function render(){
  const box=document.querySelector('[data-course-promotion]');if(!box)return;
  try{
   const intent=pendingCode();let offer=await loadOffer(intent||null);
   if(!offer&&intent){rememberCode('');offer=await loadOffer();}
   if(!offer)return;
   const title=document.createElement('h2');title.textContent=`${offer.discount_percent}% off eligible courses`;
   const inner=document.createElement('div');const kicker=document.createElement('p');kicker.className='fpKicker';kicker.textContent=offer.name;
   const line=document.createElement('p');line.append('Use ');const code=document.createElement('code');code.textContent=offer.code;line.append(code,` at payment · Ends ${endsText(offer)}`);
   const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Offer and payment details';
   const terms=document.createElement('p');terms.textContent=`Applies to eligible new course enrolments at their normal fees, including additional courses. Full payment and qualifying instalments receive the same discount. Submit your application and full payment or first instalment by ${endsText(offer)}, 23:59 South African time. One code per application; previous-study benefits cannot be combined. Existing course balances are excluded. Later instalments retain the discounted total. Admissions and Finance approval is required.`;
   details.append(summary,terms);inner.append(kicker,title,line,details);
   const action=document.createElement('a');action.className='fpAction';action.href=`courses-public.html?promo=${encodeURIComponent(offer.code)}#courses`;action.textContent='Choose your course';
   action.addEventListener('click',()=>rememberCode(offer.code));box.replaceChildren(inner,action);box.className='fundaPromo';box.hidden=false;
   const remaining=new Date(offer.ends_at).getTime()-Date.now();if(remaining>0&&remaining<2147483647)setTimeout(()=>{box.hidden=true;},remaining);
  }catch(_){box.hidden=true;}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
