(()=>{"use strict";
const RULES=[
["Truthful information","Provide accurate personal, identity, course and payment information. False or altered documents may be investigated and the application may be declined."],
["Your account is personal","Do not share your login details or allow another person to study, submit work or complete assessments using your account."],
["Do your own work","Assessments and coursework must be your own. Plagiarism, copied answers, impersonation or dishonest assistance is not allowed."],
["Protect Academy material","Do not copy, sell, publish or distribute Funda course material, assessments, answers or protected learning resources without permission."],
["Respectful communication","Communicate respectfully with staff and other students. Threats, harassment, abusive language or misuse of support channels is not acceptable."],
["Payments must be genuine","Submit genuine proof of payment. Payment screenshots or documents may be verified before course access is approved."],
["Legacy evidence must be genuine","Legacy Upgrade claims remain provisional until Funda completes its final investigation of the old certificate/evidence and payment."],
["Use support responsibly","When reporting a problem, explain it clearly and attach screenshots or evidence where requested. Do not create repeated or false tickets."],
["Course access follows approval","Registration or payment alone does not automatically activate a course. Required verification and final approval must be completed."],
["Certificates must be earned","Certificates are issued only after the applicable course, assessment and administrative completion requirements are satisfied."],
["Keep your details current","Keep your email, mobile number and other important contact information up to date."],
["No guaranteed employment","Funda develops practical skills and may provide career or workplace support, but completing a course does not guarantee employment, income or a particular job outcome."],
["Platform misuse","Fraud, attempted system interference, false documentation or serious misuse may result in restricted access while the matter is fairly investigated."]
];
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function add(){
 if(document.getElementById("fundaStudentHouseRules"))return;
 const host=document.getElementById("dashboardContent");
 if(!host)return;
 const card=document.createElement("section");card.id="fundaStudentHouseRules";card.className="bg-white rounded-3xl border border-[#dbe6f2] shadow-sm p-5 md:p-6 mt-6 mb-2";
 card.innerHTML='<div class="flex items-start justify-between gap-4"><div><p class="text-[10px] font-extrabold tracking-[.18em] uppercase text-[#b38b2e]">Student Conduct</p><h2 class="text-xl font-extrabold text-[#071D49] mt-1">Student House Rules</h2><p class="text-sm text-slate-500 mt-2">Simple rules that protect you, other students and Funda Online Academy.</p></div><button id="openStudentRules" class="shrink-0 rounded-xl bg-[#071D49] text-white px-4 py-3 text-xs font-bold">View Rules</button></div>';
 host.insertAdjacentElement("beforeend",card);
 const modal=document.createElement("div");modal.id="studentRulesModal";modal.className="hidden fixed inset-0 z-[99999] bg-slate-950/70 p-4 overflow-y-auto";
 modal.innerHTML='<div class="max-w-3xl mx-auto my-5 bg-white rounded-3xl overflow-hidden shadow-2xl"><div class="bg-[#071D49] text-white p-6 flex justify-between gap-4"><div><p class="text-[10px] uppercase tracking-[.18em] text-[#e4c36a] font-bold">Funda Online Academy</p><h2 class="text-2xl font-extrabold mt-1">Student House Rules</h2><p class="text-xs text-slate-300 mt-2">Please follow these rules whenever you use the Academy platform or services.</p></div><button id="closeStudentRules" class="h-10 px-4 rounded-xl bg-white/10 text-white text-xs font-bold">Close</button></div><div class="p-5 md:p-6"><div class="space-y-3">'+RULES.map((r,i)=>'<div class="rounded-2xl border border-slate-200 p-4"><div class="flex gap-3"><div class="w-7 h-7 shrink-0 rounded-full bg-[#eef4fb] text-[#071D49] flex items-center justify-center text-xs font-extrabold">'+(i+1)+'</div><div><h3 class="font-extrabold text-sm text-[#071D49]">'+esc(r[0])+'</h3><p class="text-xs text-slate-600 mt-1 leading-5">'+esc(r[1])+'</p></div></div></div>').join("")+'</div><div class="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-5"><b>Important:</b> Funda may investigate suspected fraud, academic dishonesty, false documentation or serious misuse before making a final decision. Reviews should follow the applicable Academy policies and a fair process.</div></div></div>';
 document.body.appendChild(modal);
 const open=()=>{modal.classList.remove("hidden");document.body.style.overflow="hidden"};
 const close=()=>{modal.classList.add("hidden");document.body.style.overflow=""};
 card.querySelector("#openStudentRules").onclick=open;modal.querySelector("#closeStudentRules").onclick=close;modal.onclick=e=>{if(e.target===modal)close()};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(add,0));else setTimeout(add,0);
})();