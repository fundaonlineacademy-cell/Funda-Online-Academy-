(()=>{
const identity={
 motto:'Learn. Grow. Achieve.',
 vision:'To become a trusted and accessible online learning institution that empowers people through quality education, practical knowledge and opportunities for lifelong growth.',
 mission:'Funda Online Academy exists to make quality education accessible through flexible, affordable and student-centred online learning. We equip our students with relevant knowledge, practical skills and confidence to improve their lives, advance their careers and contribute meaningfully to their communities.',
 purpose:'Our purpose is to remove barriers to learning and create opportunities for people to develop themselves regardless of their location, background or circumstances.',
 values:['Accessibility','Excellence','Integrity','Innovation','Student Success','Respect','Accountability'],
 commitment:'Every member of Funda Online Academy is responsible for protecting the quality, integrity and reputation of the Academy while providing professional, respectful and responsive service to every student.',
 objectives:['Expand access to flexible online learning','Deliver relevant, quality learning experiences','Support student completion and success','Use digital innovation to improve learning','Build a trusted and sustainable academy']
};
window.FUNDA_ACADEMY_IDENTITY=identity;
const css=`.funda-identity{font-family:Arial,Helvetica,sans-serif;margin:28px 0;border:1px solid #d7c48a;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 10px 30px rgba(3,16,31,.08)}.funda-identity-head{background:linear-gradient(135deg,#03101f,#0a2442);color:#fff;padding:24px}.funda-identity-kicker{color:#d4af58;text-transform:uppercase;letter-spacing:1.5px;font-size:11px;font-weight:800}.funda-identity-head h2{margin:6px 0 4px;font-size:24px}.funda-identity-motto{color:#ead28e;font-weight:700}.funda-identity-body{padding:22px;background:#fffdf7}.funda-identity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.funda-identity-card{background:#fff;border:1px solid #ece5d2;border-radius:14px;padding:18px}.funda-identity-card h3{margin:0 0 8px;color:#071b31;font-size:16px}.funda-identity-card p{margin:0;color:#435064;line-height:1.65;font-size:13px}.funda-values{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.funda-value{background:#071b31;color:#f1d889;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:700}.funda-objectives{margin:8px 0 0;padding-left:18px;color:#435064;font-size:13px;line-height:1.7}@media(max-width:700px){.funda-identity-grid{grid-template-columns:1fr}.funda-identity-head{padding:20px}.funda-identity-head h2{font-size:20px}.funda-identity-body{padding:14px}}`;
function markup(compact=false){return `<section class="funda-identity" id="academy-identity"><div class="funda-identity-head"><div class="funda-identity-kicker">Our Academy Identity</div><h2>What Funda Online Academy Stands For</h2><div class="funda-identity-motto">${identity.motto}</div></div><div class="funda-identity-body"><div class="funda-identity-grid"><article class="funda-identity-card"><h3>Our Vision</h3><p>${identity.vision}</p></article><article class="funda-identity-card"><h3>Our Mission</h3><p>${identity.mission}</p></article>${compact?'':`<article class="funda-identity-card"><h3>Our Purpose</h3><p>${identity.purpose}</p></article><article class="funda-identity-card"><h3>Our Core Values</h3><div class="funda-values">${identity.values.map(v=>`<span class="funda-value">${v}</span>`).join('')}</div></article><article class="funda-identity-card"><h3>Our Strategic Objectives</h3><ul class="funda-objectives">${identity.objectives.map(v=>`<li>${v}</li>`).join('')}</ul></article><article class="funda-identity-card"><h3>Our Commitment</h3><p>${identity.commitment}</p></article>`}</div></div></section>`}
function installStyle(){if(document.getElementById('funda-identity-style'))return;const s=document.createElement('style');s.id='funda-identity-style';s.textContent=css;document.head.appendChild(s)}
function mount(){installStyle();if(document.getElementById('academy-identity'))return;const path=location.pathname.toLowerCase();let target=null,compact=false;if(path.endsWith('/admin-v2.html')||path.endsWith('admin-v2.html')){target=document.querySelector('main')||document.getElementById('main');}else if(path.endsWith('/dashboard.html')||path.endsWith('dashboard.html')){target=document.querySelector('main')||document.querySelector('.main-content')||document.body;}else if(path.endsWith('/staff-portal.html')||path.endsWith('staff-portal.html')){target=document.querySelector('main')||document.body;}else if(path.endsWith('/ambassador-portal-v2.html')||path.endsWith('ambassador-portal-v2.html')){target=document.querySelector('footer');}else if(path.endsWith('/courses-public.html')||path.endsWith('courses-public.html')||path==='/'||path.endsWith('/index.html')){target=document.querySelector('footer');compact=true;}if(!target)return;const box=document.createElement('div');box.innerHTML=markup(compact);const section=box.firstElementChild;if(target.tagName==='FOOTER')target.parentNode.insertBefore(section,target);else target.appendChild(section)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,700));else setTimeout(mount,700);
})();

(()=>{
  function syncLearningTabColours(){
    document.querySelectorAll('.learning-tab[role="tab"]').forEach(tab=>{
      const active=tab.getAttribute('aria-selected')==='true';
      tab.style.setProperty('color',active?'#ffffff':'#06152f','important');
      tab.style.setProperty('background-color',active?'#06152f':'#ffffff','important');
      tab.querySelectorAll('.tab-label').forEach(label=>label.style.setProperty('color',active?'#ffffff':'#06152f','important'));
      const icon=tab.querySelector('.tab-icon');
      if(icon){
        icon.style.setProperty('color','#06152f','important');
        icon.style.setProperty('background-color',active?'#c99a2e':'#f1f5f9','important');
      }
    });
  }
  function bindLearningTabColours(){
    const list=document.querySelector('[role="tablist"][aria-label="Learning packages"]');
    if(!list)return;
    syncLearningTabColours();
    list.addEventListener('click',()=>setTimeout(syncLearningTabColours,0));
    new MutationObserver(syncLearningTabColours).observe(list,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindLearningTabColours);else bindLearningTabColours();
})();

(()=>{
  if(!/admin-v2\.html$/i.test(location.pathname)) return;
  if(document.querySelector('script[data-funda-communication-v2]')) return;
  const s=document.createElement('script');
  s.dataset.fundaCommunicationV2='1';
  s.src='admin-communication-v2.js?v=20260828-comm-hotfix-'+Date.now();
  document.head.appendChild(s);
})();

(()=>{
  if(!/ambassador-portal-v2\.html$/i.test(location.pathname))return;
  function installCeoAmbassadorMessage(){
    if(document.getElementById('ambassador-ceo-message'))return;
    const quickPanel=document.querySelector('.section[data-section="dashboard"] .quickPanel')||document.querySelector('.quickPanel');
    if(!quickPanel)return;
    if(!document.getElementById('ambassador-ceo-message-style')){
      const style=document.createElement('style');
      style.id='ambassador-ceo-message-style';
      style.textContent=`
        .ambCeoMessage{position:relative;overflow:hidden;margin-top:14px;border:1px solid rgba(226,189,98,.55);border-radius:17px;background:radial-gradient(circle at 88% 10%,rgba(226,189,98,.20),transparent 30%),linear-gradient(135deg,#07172f,#0b2b49 62%,#173f62);color:#fff;padding:25px 27px;box-shadow:0 14px 34px rgba(7,23,47,.16)}
        .ambCeoMessage:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#f2d98f,#c99a2e)}
        .ambCeoKicker{color:#e8c96f;font-size:9px;font-weight:900;letter-spacing:.19em;text-transform:uppercase;margin-bottom:8px}
        .ambCeoMessage h2{margin:0;color:#fff!important;font-size:24px;line-height:1.2;letter-spacing:-.02em}
        .ambCeoBody{max-width:980px;margin-top:14px;color:#e5edf4;font-size:13px;line-height:1.75}
        .ambCeoBody p{margin:0 0 11px}.ambCeoBody p:last-child{margin-bottom:0}
        .ambCeoCharge{margin:17px 0 0;padding:13px 15px;border-left:3px solid #e2bd62;background:rgba(255,255,255,.07);border-radius:0 10px 10px 0;color:#fff;font-weight:800;font-size:13px;line-height:1.6}
        .ambCeoSign{margin-top:17px;color:#f0d98f;font-size:11px;line-height:1.55;font-weight:800}.ambCeoSign span{display:block;color:#c8d5e0;font-weight:600}
        @media(max-width:560px){.ambCeoMessage{padding:21px 19px;margin-top:12px}.ambCeoMessage h2{font-size:21px}.ambCeoBody{font-size:12px;line-height:1.7}.ambCeoCharge{font-size:12px}}
      `;
      document.head.appendChild(style);
    }
    const section=document.createElement('section');
    section.id='ambassador-ceo-message';
    section.className='ambCeoMessage';
    section.innerHTML=`
      <div class="ambCeoKicker">A MESSAGE FROM THE CEO</div>
      <h2>Carry the Funda Online Academy name with purpose.</h2>
      <div class="ambCeoBody">
        <p>Being an Ambassador is not simply about sharing a referral link. You are carrying the reputation of Funda Online Academy into your community, your audience and every conversation where our name appears.</p>
        <p>Influence creates opportunity only when it is built on trust. Represent this Academy with accuracy, discipline and integrity. Do not promise what we cannot guarantee, and never sacrifice credibility for a commission. The strongest Ambassadors build relationships that last because people believe what they say.</p>
        <p>Every learner you introduce to Funda Online Academy should feel that they were guided toward a genuine opportunity to grow. Your success will be measured not only by the students you refer, but by the professionalism, consistency and responsibility with which you represent this institution.</p>
        <div class="ambCeoCharge">Build your name carefully. Protect our name fiercely. Create value consistently. Commission should become the result of trust — never the substitute for it.</div>
        <p style="margin-top:14px">Together, we are not merely promoting courses. We are opening doors, strengthening ambition and helping people move forward with purpose.</p>
      </div>
      <div class="ambCeoSign">— Chief Executive Officer<span>Funda Online Academy</span></div>`;
    quickPanel.parentNode.insertBefore(section,quickPanel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installCeoAmbassadorMessage);else installCeoAmbassadorMessage();
})();