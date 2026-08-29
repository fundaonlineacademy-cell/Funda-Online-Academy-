(()=>{
const RETAIL_ID='a03ea548-3542-400e-bc0a-abe7914b8bed';
if(!location.pathname.toLowerCase().endsWith('course-view.html')||new URLSearchParams(location.search).get('id')!==RETAIL_ID)return;
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
(async()=>{try{await load('retail-premium-overview-stage1.js?v=20260829a');await load('retail-premium-overview-stage2.js?v=20260829a');await load('retail-premium-overview-stage3.js?v=20260829a');await load('retail-premium-overview-stage4.js?v=20260829a');await load('retail-premium-overview-stage5.js?v=20260829a');await load('retail-premium-overview-stage6.js?v=20260829a')}catch(e){console.error('Retail premium overview failed to load',e)}})();
})();