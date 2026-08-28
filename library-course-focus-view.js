(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
let active=false,hidden=[];
function styles(){if(document.getElementById('fundaCourseFocusCss'))return;const s=document.createElement('style');s.id='fundaCourseFocusCss';s.textContent=`
body.funda-course-focus #content>.card:first-child{display:none!important}
body.funda-course-focus #continueSection,body.funda-course-focus #recommendedSection,body.funda-course-focus #downloadSection{display:none!important}
body.funda-course-focus #fundaCourseSections{margin-top:0!important}
body.funda-course-focus .funda-course-view{margin-top:0!important;box-shadow:0 10px 28px rgba(3,11,29,.08)!important}
body.funda-course-focus .funda-course-view:before{content:'COURSE LIBRARY';display:block;font:800 9px Montserrat,sans-serif;letter-spacing:.14em;color:#b58a2c;margin-bottom:10px}
@media(max-width:760px){body.funda-course-focus main{padding-top:12px!important}.funda-course-view{scroll-margin-top:118px!important}.fcv-top{position:relative;flex-wrap:wrap}.fcv-back{order:3;margin:8px 0 0 62px!important}.fcv-title{font-size:16px!important;line-height:1.25!important}}
`;document.head.appendChild(s)}
function enterFocus(){styles();active=true;document.body.classList.add('funda-course-focus');const sec=document.getElementById('fundaCourseSections');if(!sec)return;requestAnimationFrame(()=>{const header=document.querySelector('header');const h=(header?.offsetHeight||80)+16;const y=sec.getBoundingClientRect().top+window.scrollY-h;window.scrollTo({top:Math.max(0,y),behavior:'smooth'})})}
function leaveFocus(){active=false;document.body.classList.remove('funda-course-focus');const sec=document.getElementById('fundaCourseSections');if(sec){requestAnimationFrame(()=>{const header=document.querySelector('header');const h=(header?.offsetHeight||80)+16;const y=sec.getBoundingClientRect().top+window.scrollY-h;window.scrollTo({top:Math.max(0,y),behavior:'smooth'})})}}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-funda2-course]')){setTimeout(enterFocus,0);return}
 if(e.target.closest('[data-funda2-back]')){setTimeout(leaveFocus,0);return}
},true);
window.addEventListener('pageshow',()=>{if(!document.querySelector('.funda-course-view'))leaveFocus()});
})();