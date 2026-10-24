(()=>{
'use strict';
if(window.FundaCoursePaymentOptions)return;

function numberOf(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

function weeksOf(duration){
  if(typeof duration==='number'&&Number.isFinite(duration))return duration;
  const match=String(duration??'').match(/\d+(?:[.,]\d+)?/);
  return match?Number(match[0].replace(',','.')):0;
}

function rand(value,forceDecimals=false){
  const n=numberOf(value);
  if(n===null)return'Contact us';
  const cents=Math.round(n*100);
  const absolute=Math.abs(cents);
  const whole=Math.floor(absolute/100).toLocaleString('en-US').replace(/,/g,' ');
  const fraction=String(absolute%100).padStart(2,'0');
  const hasCents=absolute%100!==0;
  return`R${cents<0?'-':''}${whole}${forceDecimals||hasCents?'.'+fraction:''}`;
}

function randFromCents(cents){
  const whole=Number(cents)/100;
  return rand(whole,Math.abs(cents)%100!==0);
}

function describe(price,duration){
  const amount=numberOf(price);
  const weeks=weeksOf(duration);
  if(amount===null||amount<0){
    return{
      type:'contact',count:0,label:'Payment details',value:'Contact us',
      note:'Payment options are confirmed during enrolment.',fullPaymentAvailable:false
    };
  }

  if(amount<1000){
    return{
      type:'full',count:1,label:'Full payment',value:rand(amount),
      note:'One payment required',fullPaymentAvailable:true
    };
  }

  const totalCents=Math.round(amount*100);
  if(amount>=2000&&weeks>=8){
    const lowCents=Math.floor(totalCents/3);
    const highCents=Math.ceil(totalCents/3);
    const equal=lowCents===highCents;
    return{
      type:'three',count:3,label:'Three instalments',
      value:equal?`3 × ${randFromCents(lowCents)}`:`${randFromCents(lowCents)}–${randFromCents(highCents)} each`,
      note:equal?'Three equal payments · full payment also available':'Three payments · final cents are balanced at enrolment',
      fullPaymentAvailable:true
    };
  }

  const lowCents=Math.floor(totalCents/2);
  const highCents=Math.ceil(totalCents/2);
  const equal=lowCents===highCents;
  return{
    type:'two',count:2,label:'Two instalments',
    value:equal?`2 × ${randFromCents(lowCents)}`:`${randFromCents(lowCents)}–${randFromCents(highCents)} each`,
    note:equal?'Two equal payments · full payment also available':'Two payments · final cents are balanced at enrolment',
    fullPaymentAvailable:true
  };
}

window.FundaCoursePaymentOptions=Object.freeze({describe,rand,weeksOf});
})();

(()=>{
'use strict';
function addOfficialAcademyInformation(){
  const path=location.pathname.replace(/\/+$/,'');
  if(path!==''&&path!=='/index.html')return;
  if(document.getElementById('official-academy-information'))return;
  const main=document.getElementById('main-content');
  if(!main)return;
  const section=document.createElement('section');
  section.id='official-academy-information';
  section.className='bg-white border-y border-slate-200';
  section.setAttribute('aria-labelledby','officialAcademyInfoHeading');
  section.innerHTML=`<div class="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16"><div class="text-center max-w-3xl mx-auto"><p class="text-[10px] tracking-[.18em] font-extrabold text-[#b58216]">OFFICIAL ACADEMY INFORMATION</p><h2 id="officialAcademyInfoHeading" class="mt-2 text-3xl sm:text-4xl font-extrabold text-[#06152f]">Funda Online Academy (Pty) Ltd</h2><p class="mt-4 text-[15px] sm:text-base leading-7 text-slate-700">Funda Online Academy (Pty) Ltd is an independent South African 100% online learning provider offering practical, career-focused courses. Learning, enrolment, assessment and student support are delivered online.</p></div><div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"><div class="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p class="text-[10px] tracking-[.13em] font-extrabold text-[#8a6412]">LEARNING MODEL</p><p class="mt-2 text-sm font-extrabold text-[#06152f]">100% Online</p><p class="mt-1 text-sm leading-6 text-slate-600">No physical campus or walk-in learning centre.</p></div><div class="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p class="text-[10px] tracking-[.13em] font-extrabold text-[#8a6412]">OFFICIAL WEBSITE</p><a class="mt-2 block text-sm font-extrabold text-[#0b2f70] underline" href="https://fundaonlineacademy.co.za/">fundaonlineacademy.co.za</a></div><div class="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p class="text-[10px] tracking-[.13em] font-extrabold text-[#8a6412]">OFFICIAL EMAIL</p><a class="mt-2 block text-sm font-extrabold text-[#0b2f70] underline break-all" href="mailto:info@fundaonlineacademy.co.za">info@fundaonlineacademy.co.za</a></div><div class="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p class="text-[10px] tracking-[.13em] font-extrabold text-[#8a6412]">WHATSAPP</p><a class="mt-2 block text-sm font-extrabold text-[#0b2f70] underline" href="https://wa.me/27699608590" target="_blank" rel="noopener noreferrer">069 960 8590</a></div><div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2 lg:col-span-2"><p class="text-[10px] tracking-[.13em] font-extrabold text-[#8a6412]">COMPANY REGISTRATION</p><p class="mt-2 text-sm font-extrabold text-[#06152f]">2023/830451/07</p><p class="mt-1 text-sm leading-6 text-slate-600">South African registered company.</p></div></div></div>`;
  const identity=document.getElementById('academy-identity');
  if(identity)main.insertBefore(section,identity);else main.appendChild(section);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addOfficialAcademyInformation,{once:true});else addOfficialAcademyInformation();
})();

(()=>{
'use strict';
const path=location.pathname.replace(/\/+$/,'');
if(path!=='/course-view.html')return;
const robots=document.querySelector('meta[name="robots"]');
if(!robots)return;
const courseId=(new URLSearchParams(location.search).get('id')||'').trim();
robots.setAttribute('content',courseId?'index,follow,max-image-preview:large':'noindex,follow');
})();

(()=>{
'use strict';
function simplifyAcademyMessageAttribution(){
  const path=location.pathname.replace(/\/+$/,'');
  if(path!==''&&path!=='/index.html')return;
  const section=document.getElementById('ceo-message');
  if(!section)return;
  section.querySelectorAll('p').forEach(p=>{
    const text=p.textContent.replace(/\s+/g,' ').trim();
    if(text==='A MESSAGE FROM THE HEAD OF ACADEMICS'||text==='— Head of Academics')p.remove();
  });
  const paragraphs=[...section.querySelectorAll('p')];
  const signature=paragraphs.find(p=>p.textContent.replace(/\s+/g,' ').trim()==='FUNDA ONLINE ACADEMY');
  if(signature)signature.textContent='-Funda Online Academy';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',simplifyAcademyMessageAttribution,{once:true});else simplifyAcademyMessageAttribution();
})();
