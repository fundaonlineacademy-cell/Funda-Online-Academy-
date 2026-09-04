(()=>{"use strict";
const RULES=[
["Protect student information","Access student IDs, passports, certificates, results and payment information only when required for authorised Academy work. Do not share it unnecessarily."],
["Use your own Admin account","Never share Admin passwords, sessions or verification codes. Actions must remain attributable to the authorised staff member who performed them."],
["Verify before approving","Do not approve an enrolment simply to speed up the process. Finance verification and any required legacy investigation must be complete before final course access."],
["Investigate Legacy claims","For Legacy Upgrade students, compare the submitted historical certificate/evidence, identity details, selected course and available Funda records before making the final legacy decision."],
["Do not bypass controls","Never manually open course access, change statuses or work around Finance, Admissions or verification safeguards to avoid the approved process."],
["Keep financial decisions traceable","Do not privately negotiate prices, discounts, refunds or commissions. Use approved rules and record the reason for authorised exceptions or adjustments."],
["Never falsify records","Do not alter results, certificates, payments, student categories, dates or enrolment information to create a false record."],
["Record decisions","Approval, decline, refund, investigation and exceptional decisions should leave an appropriate note or audit record."],
["Professional communication","Communicate clearly and respectfully with students, ambassadors, staff and partners. Do not make promises outside Funda's approved policies."],
["Make accurate public claims","Never promise guaranteed employment or claim accreditation, recognition, partnerships or benefits that Funda cannot substantiate."],
["Handle complaints properly","Record and investigate complaints, technical issues and suspected fraud. Do not delete or hide inconvenient records to conceal mistakes."],
["Secure devices and documents","Lock or sign out of unattended devices and do not retain sensitive student documents on personal devices unless specifically authorised and necessary."],
["Conflicts and misuse","Do not use student information for personal purposes. Disclose conflicts of interest involving students, ambassadors, suppliers or partners."],
["Remove unnecessary access","Staff or contractors who no longer require a system permission should have that access removed promptly."]
];
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function add(){
 if(document.getElementById("fundaAdminHouseRules"))return;
 const host=document.querySelector(".content,.main-content,main,#content")||document.body;
 const card=document.createElement("section");card.id="fundaAdminHouseRules";card.style.cssText="background:#fff;border:1px solid #dbe4ee;border-radius:16px;padding:16px;margin:14px 0;box-shadow:0 6px 20px rgba(7,27,49,.06)";
 card.innerHTML='<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start"><div><div style="font-size:9px;font-weight:900;letter-spacing:.13em;color:#a27c24">ADMIN GOVERNANCE</div><h3 style="margin:4px 0;color:#071b31">Admin & Staff House Rules</h3><p style="margin:0;color:#66758a;font-size:11px;line-height:1.5">Operational rules for protecting students, records, finances and the Academy.</p></div><button id="openAdminRules" style="border:0;border-radius:10px;background:#071b31;color:#fff;padding:10px 14px;font-size:10px;font-weight:800;cursor:pointer">View Rules</button></div>';
 host.prepend(card);
 const modal=document.createElement("div");modal.id="adminRulesModal";modal.style.cssText="display:none;position:fixed;inset:0;z-index:100000;background:rgba(2,10,24,.75);padding:18px;overflow:auto";
 modal.innerHTML='<div style="max-width:900px;margin:20px auto;background:#f8fafc;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35)"><div style="background:#071b31;color:#fff;padding:20px;display:flex;justify-content:space-between;gap:15px"><div><div style="font-size:9px;color:#d8b85e;font-weight:900;letter-spacing:.14em">FUNDA ONLINE ACADEMY</div><h2 style="margin:5px 0 0">Admin & Staff House Rules</h2><p style="font-size:10px;color:#cbd5e1;margin:6px 0 0">These rules apply whenever authorised staff use Academy systems or student information.</p></div><button id="closeAdminRules" style="height:38px;border:0;border-radius:9px;background:rgba(255,255,255,.12);color:#fff;padding:0 13px;font-size:10px;font-weight:800;cursor:pointer">Close</button></div><div style="padding:15px">'+RULES.map((r,i)=>'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:12px;margin-bottom:8px;display:flex;gap:10px"><div style="width:25px;height:25px;border-radius:50%;background:#edf3f9;color:#071b31;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex:none">'+(i+1)+'</div><div><b style="font-size:11px;color:#071b31">'+esc(r[0])+'</b><div style="font-size:9px;color:#5e6c7e;line-height:1.55;margin-top:3px">'+esc(r[1])+'</div></div></div>').join("")+'<div style="background:#fff7dc;border:1px solid #eed58a;border-radius:11px;padding:12px;font-size:9px;color:#6f520e;line-height:1.55"><b>Investigation rule:</b> Suspected fraud, false documentation, academic dishonesty, financial irregularities or system misuse must be investigated and documented. Admin decisions should follow the applicable Funda policy, evidence and a fair review process.</div></div></div>';
 document.body.appendChild(modal);
 const open=()=>{modal.style.display="block";document.body.style.overflow="hidden"},close=()=>{modal.style.display="none";document.body.style.overflow=""};
 card.querySelector("#openAdminRules").onclick=open;modal.querySelector("#closeAdminRules").onclick=close;modal.onclick=e=>{if(e.target===modal)close()};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(add,800));else setTimeout(add,800);
})();