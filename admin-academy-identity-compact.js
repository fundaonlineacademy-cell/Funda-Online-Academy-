(()=>{
'use strict';
if(window.__fundaAdminCompactAcademyIdentity)return;
window.__fundaAdminCompactAcademyIdentity=true;

const fallback={
  motto:'Learn. Grow. Achieve.',
  vision:'To become a trusted and accessible online learning institution that empowers people through quality education, practical knowledge and opportunities for lifelong growth.',
  mission:'Funda Online Academy exists to make quality education accessible through flexible, affordable and student-centred online learning. We equip our students with relevant knowledge, practical skills and confidence to improve their lives, advance their careers and contribute meaningfully to their communities.',
  purpose:'Our purpose is to remove barriers to learning and create opportunities for people to develop themselves regardless of their location, background or circumstances.',
  values:['Accessibility','Excellence','Integrity','Innovation','Student Success','Respect','Accountability'],
  commitment:'Every member of Funda Online Academy is responsible for protecting the quality, integrity and reputation of the Academy while providing professional, respectful and responsive service to every student.',
  objectives:['Expand access to flexible online learning','Deliver relevant, quality learning experiences','Support student completion and success','Use digital innovation to improve learning','Build a trusted and sustainable academy']
};

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const identity=()=>window.FUNDA_ACADEMY_IDENTITY||fallback;

function installStyle(){
  if(document.getElementById('fundaAdminIdentityCompactStyle'))return;
  const s=document.createElement('style');
  s.id='fundaAdminIdentityCompactStyle';
  s.textContent=`
    #fundaAdminAcademyIdentity{background:#fff;border:1px solid #dbe4ee;border-radius:16px;padding:16px;margin:14px 0 4px;box-shadow:0 6px 20px rgba(7,27,49,.06)}
    .fundaAdminIdentityRow{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
    .fundaAdminIdentityKicker{font-size:9px;font-weight:900;letter-spacing:.13em;color:#a27c24;text-transform:uppercase}
    #fundaAdminAcademyIdentity h3{margin:4px 0;color:#071b31;font-size:18px}
    #fundaAdminAcademyIdentity p{margin:0;color:#66758a;font-size:11px;line-height:1.5}
    .fundaAdminIdentityButton{border:0;border-radius:10px;background:#071b31;color:#fff;padding:10px 14px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}
    .fundaAdminIdentityModal{display:none;position:fixed;inset:0;z-index:100000;background:rgba(2,10,24,.75);padding:18px;overflow:auto}
    .fundaAdminIdentityDialog{max-width:940px;margin:20px auto;background:#f8fafc;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35)}
    .fundaAdminIdentityModalHead{background:linear-gradient(135deg,#03101f,#0a2442);color:#fff;padding:22px;display:flex;justify-content:space-between;gap:15px;align-items:flex-start}
    .fundaAdminIdentityModalKicker{font-size:9px;color:#d8b85e;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
    .fundaAdminIdentityModalHead h2{margin:5px 0 0;color:#fff!important;font-size:23px}
    .fundaAdminIdentityMotto{font-size:11px;color:#ead28e;margin:6px 0 0;font-weight:800}
    .fundaAdminIdentityClose{height:38px;border:0;border-radius:9px;background:rgba(255,255,255,.12);color:#fff;padding:0 13px;font-size:10px;font-weight:800;cursor:pointer}
    .fundaAdminIdentityBody{padding:16px;background:#fffdf8}
    .fundaAdminIdentityGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .fundaAdminIdentityDetail{background:#fff;border:1px solid #e8dfc7;border-radius:12px;padding:14px}
    .fundaAdminIdentityDetail h3{margin:0 0 6px;color:#071b31;font-size:14px}
    .fundaAdminIdentityDetail p,.fundaAdminIdentityDetail li{color:#435064;font-size:11px;line-height:1.6}
    .fundaAdminIdentityDetail p{margin:0}.fundaAdminIdentityDetail ul{margin:5px 0 0;padding-left:18px}
    .fundaAdminIdentityValues{display:flex;flex-wrap:wrap;gap:6px}
    .fundaAdminIdentityValues span{background:#071b31;color:#f1d889;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:800}
    @media(max-width:700px){
      .fundaAdminIdentityRow{align-items:stretch;flex-direction:column}
      .fundaAdminIdentityButton{width:100%}
      .fundaAdminIdentityGrid{grid-template-columns:1fr}
      .fundaAdminIdentityModalHead{padding:18px}
      .fundaAdminIdentityModalHead h2{font-size:20px}
    }
  `;
  document.head.appendChild(s);
}

function isDashboard(){
  const h=document.querySelector('#view h1');
  return !!h&&/business health overview/i.test(h.textContent||'');
}

function removeLegacyFullIdentity(){
  const legacy=document.getElementById('academy-identity');
  if(legacy)legacy.remove();
}

function ensureModal(){
  let modal=document.getElementById('fundaAdminIdentityModal');
  if(modal)return modal;
  const x=identity();
  modal=document.createElement('div');
  modal.id='fundaAdminIdentityModal';
  modal.className='fundaAdminIdentityModal';
  modal.innerHTML=`<div class="fundaAdminIdentityDialog" role="dialog" aria-modal="true" aria-labelledby="fundaAdminIdentityTitle">
    <div class="fundaAdminIdentityModalHead">
      <div>
        <div class="fundaAdminIdentityModalKicker">OUR ACADEMY IDENTITY</div>
        <h2 id="fundaAdminIdentityTitle">What Funda Online Academy Stands For</h2>
        <div class="fundaAdminIdentityMotto">${esc(x.motto)}</div>
      </div>
      <button class="fundaAdminIdentityClose" id="fundaAdminIdentityClose" type="button">Close</button>
    </div>
    <div class="fundaAdminIdentityBody">
      <div class="fundaAdminIdentityGrid">
        <article class="fundaAdminIdentityDetail"><h3>Our Vision</h3><p>${esc(x.vision)}</p></article>
        <article class="fundaAdminIdentityDetail"><h3>Our Mission</h3><p>${esc(x.mission)}</p></article>
        <article class="fundaAdminIdentityDetail"><h3>Our Purpose</h3><p>${esc(x.purpose)}</p></article>
        <article class="fundaAdminIdentityDetail"><h3>Our Core Values</h3><div class="fundaAdminIdentityValues">${(x.values||[]).map(v=>'<span>'+esc(v)+'</span>').join('')}</div></article>
        <article class="fundaAdminIdentityDetail"><h3>Our Strategic Objectives</h3><ul>${(x.objectives||[]).map(v=>'<li>'+esc(v)+'</li>').join('')}</ul></article>
        <article class="fundaAdminIdentityDetail"><h3>Our Commitment</h3><p>${esc(x.commitment)}</p></article>
      </div>
    </div>
  </div>`;
  document.body.appendChild(modal);
  const close=()=>{modal.style.display='none';document.body.style.overflow=''};
  modal.querySelector('#fundaAdminIdentityClose').onclick=close;
  modal.onclick=e=>{if(e.target===modal)close()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.style.display==='block')close()});
  return modal;
}

function openIdentity(){
  const modal=ensureModal();
  modal.style.display='block';
  document.body.style.overflow='hidden';
}

function ensureCard(){
  const host=document.getElementById('view');
  if(!host)return;
  if(!isDashboard()){
    document.getElementById('fundaAdminAcademyIdentity')?.remove();
    return;
  }

  let card=document.getElementById('fundaAdminAcademyIdentity');
  if(!card){
    card=document.createElement('section');
    card.id='fundaAdminAcademyIdentity';
    card.innerHTML=`<div class="fundaAdminIdentityRow">
      <div>
        <div class="fundaAdminIdentityKicker">OUR ACADEMY IDENTITY</div>
        <h3>What Funda Online Academy Stands For</h3>
        <p>Vision, mission, purpose, values, strategic objectives and our commitment to students and the Academy.</p>
      </div>
      <button class="fundaAdminIdentityButton" id="openAdminAcademyIdentity" type="button">View Academy Identity</button>
    </div>`;
    card.querySelector('#openAdminAcademyIdentity').onclick=openIdentity;
  }

  const rules=document.getElementById('fundaAdminHouseRules');
  if(rules&&rules.parentNode===host){
    if(card.parentNode!==host||card.previousElementSibling!==rules)rules.insertAdjacentElement('afterend',card);
  }else if(card.parentNode!==host){
    host.appendChild(card);
  }
}

function reconcile(){
  installStyle();
  removeLegacyFullIdentity();
  ensureCard();
}

function boot(){
  installStyle();
  const view=document.getElementById('view');
  const main=document.querySelector('main');
  if(view)new MutationObserver(()=>setTimeout(reconcile,60)).observe(view,{childList:true,subtree:false});
  if(main)new MutationObserver(()=>setTimeout(reconcile,60)).observe(main,{childList:true,subtree:false});
  reconcile();
  setTimeout(reconcile,800);
  setTimeout(reconcile,1500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();