(()=>{
const RETAIL_ID='a03ea548-3542-400e-bc0a-abe7914b8bed';
if(!location.pathname.toLowerCase().endsWith('course-view.html')||new URLSearchParams(location.search).get('id')!==RETAIL_ID)return;
const PUBLIC_TITLE='Retail Management & Team Leadership — Advanced Professional Short Course';
function ensureMeta(name,content){let el=document.querySelector(`meta[name="${name}"]`);if(!el){el=document.createElement('meta');el.name=name;document.head.appendChild(el)}el.content=content}
function css(){if(document.getElementById('retailStage6Css'))return;const s=document.createElement('style');s.id='retailStage6Css';s.textContent=`
body.retailPremiumReady #courseCategory{background:#eef4ff;color:#071d49}body.retailPremiumReady #courseDuration{background:#fff4cf;color:#7b5a10}body.retailPremiumReady #courseTitle{letter-spacing:-.02em}body.retailPremiumReady .r2module summary:focus-visible,body.retailPremiumReady .r5heroPrimary:focus-visible,body.retailPremiumReady .r5heroSecondary:focus-visible,body.retailPremiumReady .r4primary:focus-visible,body.retailPremiumReady .r4secondary:focus-visible{outline:3px solid #d4a72c;outline-offset:3px}body.retailPremiumReady .r2module[open]{box-shadow:0 10px 24px rgba(7,29,73,.06)}body.retailPremiumReady .r4price strong{letter-spacing:-.02em}@media(max-width:700px){body.retailPremiumReady #courseTitle{font-size:26px}.rpoGlance strong{font-size:17px}.r3metric strong{font-size:17px}}
`;document.head.appendChild(s)}
async function build(){css();for(let i=0;i<50;i++){if(document.body.classList.contains('retailPremiumReady'))break;await new Promise(r=>setTimeout(r,160))}if(!document.body.classList.contains('retailPremiumReady')||document.body.classList.contains('retailPremiumAudited'))return;
const title=document.getElementById('courseTitle');if(title)title.textContent=PUBLIC_TITLE;document.title=`${PUBLIC_TITLE} | Funda Online Academy`;
const category=document.getElementById('courseCategory');if(category)category.textContent='Retail Management';const duration=document.getElementById('courseDuration');if(duration)duration.textContent='8 Weeks';const price=document.getElementById('coursePrice');if(price)price.textContent='R3,900';
ensureMeta('description','Study Retail Management & Team Leadership through 8 management modules and 64 structured lessons covering operations, customer experience, people leadership, retail finance, stock control, POS and practical management application.');
const image=document.getElementById('courseImage');if(image)image.alt=`${PUBLIC_TITLE} course overview`;
const curriculum=document.getElementById('retailCurriculum');if(curriculum)curriculum.setAttribute('aria-label','Retail Management course curriculum');document.querySelectorAll('.r2module summary').forEach((summary,i)=>{summary.setAttribute('aria-label',`Open Module ${i+1} curriculum summary`)});
const enrolButtons=[document.getElementById('enrollBtn'),document.getElementById('retailEnrollNow'),document.querySelector('#retailHeroActions button')].filter(Boolean);enrolButtons.forEach(b=>b.setAttribute('aria-label','Start enrollment for Retail Management and Team Leadership'));
const expected=['retailPremiumIntro','retailPremiumAbout','retailWhoFor','retailOutcomes','retailCurriculum','retailHowLearn','retailAssessment','retailWorkplace','retailSupport','retailCertificate','retailClassification','retailFee'];const missing=expected.filter(id=>!document.getElementById(id));if(missing.length)console.warn('Retail premium overview QA: missing sections',missing);else console.info('Retail premium overview QA passed: all 12 premium content sections present');
document.body.classList.add('retailPremiumAudited');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();