(()=>{
if(window.__fundaAmbassadorPublicLink)return;window.__fundaAmbassadorPublicLink=true;
const path=location.pathname.toLowerCase();if(!/(^|\/)(index|courses-public|course-view|employers|ambassadors|login)\.html$/.test(path)&&!path.endsWith('/'))return;
function navStyle(){if(document.getElementById('fundaAmbassadorNavStyle'))return;let s=document.createElement('style');s.id='fundaAmbassadorNavStyle';s.textContent='@media(max-width:900px){header a[data-ambassador-login-link="1"]{display:none!important}}@media(max-width:720px){#ambassadorHomePromo>div{grid-template-columns:1fr!important}#ambassadorHomePromo a{width:100%}}';document.head.appendChild(s)}
function make(ref,label='Ambassadors'){
  const n=document.createElement('a');n.href='ambassadors.html';n.dataset.ambassadorLink='1';n.textContent=label;n.className=ref?.className||'';n.style.color=ref?.style?.color||'';return n;
}
function addNav(){
  navStyle();
  if(/ambassadors\.html$/.test(path))return;
  const header=document.querySelector('header');if(!header)return;

  if(/courses-public\.html$/.test(path)){
    const course=header.querySelector('a[href="#courses"]');
    const primary=course?.parentElement;
    if(primary){
      let links=[...primary.querySelectorAll('a[href="ambassadors.html"]')];
      let link=links.shift();links.forEach(x=>x.remove());
      if(!link){const contact=primary.querySelector('a[href="#contact"]');link=make(contact||course);(contact||course)?.insertAdjacentElement(contact?'beforebegin':'afterend',link)}
      if(link)link.dataset.ambassadorLink='1';
    }
    const mobile=document.getElementById('mobileMenu')?.firstElementChild;
    if(mobile){
      let links=[...mobile.querySelectorAll('a[href="ambassadors.html"]')];let link=links.shift();links.forEach(x=>x.remove());
      if(!link){const contact=[...mobile.querySelectorAll('a')].find(a=>a.getAttribute('href')==='#contact');link=make(contact||mobile.querySelector('a'));link.className='block px-3 py-2.5 font-semibold';if(contact)mobile.insertBefore(link,contact);else mobile.appendChild(link)}
      if(link)link.dataset.ambassadorLink='1';
    }
    header.querySelectorAll('a[data-ambassador-login-link="1"]').forEach(a=>a.remove());
    return;
  }

  document.querySelectorAll('header a').forEach(a=>{
    let t=(a.textContent||'').trim().toLowerCase();
    if(t!=='contact'&&t!=='login'&&t!=='student login')return;
    if(a.parentElement?.querySelector('a[data-ambassador-link],a[href="ambassadors.html"]'))return;
    let n=make(a);
    if(t==='login'||t==='student login')n.dataset.ambassadorLoginLink='1';
    a.insertAdjacentElement('beforebegin',n);
  });
}
function separateApplicationFlow(){
  if(!/ambassadors\.html$/.test(path))return;
  const wire=()=>{
    const start=document.getElementById('cpStart');
    if(start&&!start.dataset.dedicatedApplication){
      const clean=start.cloneNode(true);
      clean.dataset.dedicatedApplication='1';
      clean.addEventListener('click',()=>{
        const query=location.search||'';
        location.href='ambassador-application.html'+query;
      });
      start.replaceWith(clean);
    }
    document.getElementById('cpFormWrap')?.remove();
  };
  wire();
  if(!window.__fundaAmbassadorApplicationObserver){
    window.__fundaAmbassadorApplicationObserver=new MutationObserver(wire);
    window.__fundaAmbassadorApplicationObserver.observe(document.documentElement,{childList:true,subtree:true});
  }
}
function addHome(){if(!(/index\.html$/.test(path)||path.endsWith('/'))||document.getElementById('ambassadorHomePromo'))return;let employer=document.getElementById('employerHomePromo'),business=document.getElementById('business'),anchor=employer||business;if(!anchor)return;let s=document.createElement('section');s.id='ambassadorHomePromo';s.style.cssText='padding:38px 20px;background:linear-gradient(135deg,#eef1f0,#fff4dc,#f5dbe4);border-bottom:1px solid #e2d5b5';s.innerHTML='<div style="max-width:1120px;margin:auto;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center"><div><div style="font-size:10px;font-weight:900;letter-spacing:.16em;color:#9a711c">CREATORS & EDUCATION AMBASSADORS</div><h2 style="font-family:Source Sans 3,Arial,sans-serif;color:#21384d;font-size:clamp(23px,4vw,32px);margin:6px 0">Grow with Funda Online Academy while helping people discover practical learning.</h2><p style="color:#5e6b78;line-height:1.7;margin:0">We welcome credible South African creators whose audiences care about skills, careers, business, youth development and practical growth.</p></div><a href="ambassadors.html" style="text-decoration:none;background:#21384d;color:white;padding:14px 18px;border-radius:13px;font-weight:800;text-align:center">Explore Ambassador Partnerships</a></div>';anchor.insertAdjacentElement('afterend',s)}
function addCourses(){if(!/courses-public\.html$/.test(path)||document.getElementById('ambassadorCoursesPromo'))return;let employer=document.getElementById('employerPublicPromo');if(!employer)return;let s=document.createElement('section');s.id='ambassadorCoursesPromo';s.style.cssText='padding:34px 16px;background:#fffaf0;border-bottom:1px solid #ead9aa';s.innerHTML='<div style="max-width:1120px;margin:auto;display:flex;justify-content:space-between;gap:20px;align-items:center;flex-wrap:wrap"><div><div style="font-size:10px;font-weight:900;letter-spacing:.15em;color:#9a711c">CREATE WITH FUNDA ONLINE ACADEMY</div><h3 style="font-family:Source Sans 3,Arial,sans-serif;color:#21384d;font-size:22px;margin:5px 0">Have an audience that cares about education, careers or practical skills?</h3><p style="color:#5e6b78;margin:0;max-width:760px">Apply for creator campaigns, referral partnerships or a longer-term Funda Online Academy Education Ambassador relationship.</p></div><a href="ambassadors.html" style="text-decoration:none;background:#21384d;color:#fff;padding:12px 16px;border-radius:12px;font-weight:800">Become a Funda Online Academy Ambassador</a></div>';employer.insertAdjacentElement('afterend',s)}
function run(){addNav();addHome();addCourses();separateApplicationFlow()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(run,250);setTimeout(run,800);setTimeout(run,1900)});else{setTimeout(run,100);setTimeout(run,500);setTimeout(run,1500)}
})();