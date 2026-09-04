(()=>{
if(window.FundaLegacy)return;
const state={type:"",entitlement:null,evidencePath:null,manualClaimId:null,extractedText:"",verificationSummary:null};
const $=s=>document.querySelector(s);
const money=n=>Number(n||0).toLocaleString("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:2});
const selected=()=>window.FundaEnrollmentContext?.getSelectedCourse?.();
const client=()=>window.FundaEnrollmentContext?.getSupabase?.();
const user=()=>window.FundaEnrollmentContext?.getUser?.();
const student=()=>window.FundaEnrollmentContext?.getStudent?.();

function ensurePanel(){
 const details=$("#detailsStep"); if(!details||$("#legacyStudentPanel"))return;
 const left=details.querySelector(".lg\\:col-span-2");
 if(!left)return;
 const wrap=document.createElement("div");
 wrap.id="legacyStudentPanel";
 wrap.className="bg-white rounded-3xl shadow-xl p-6 sm:p-8";
 wrap.innerHTML=`
 <p class="text-xs uppercase tracking-widest font-black text-[#b88622]">Student Type</p>
 <h2 class="text-2xl font-black text-[#03133d] mt-1">Tell us about your previous Funda study</h2>
 <p class="text-sm text-gray-500 mt-2 leading-6">Choose the option that applies to the course you selected. Legacy discounts are verified against Funda's historical records before course access is approved.</p>
 <div class="grid sm:grid-cols-2 gap-3 mt-6" id="legacyChoices">
  <label class="border rounded-2xl p-4 cursor-pointer"><input type="radio" name="legacyType" value="first_time" class="mr-2"><b>First-time Funda student</b><span class="block text-xs text-gray-500 mt-1">I have never studied with Funda before. Standard current price.</span></label>
  <label class="border rounded-2xl p-4 cursor-pointer"><input type="radio" name="legacyType" value="legacy_completed" class="mr-2"><b>I completed this course before</b><span class="block text-xs text-gray-500 mt-1">Legacy upgrade: 70% off after certificate verification. Old Funda certificate required. Final approval follows after payment.</span></label>
  <label class="border rounded-2xl p-4 cursor-pointer"><input type="radio" name="legacyType" value="legacy_incomplete" class="mr-2"><b>I paid for this course but did not complete it</b><span class="block text-xs text-gray-500 mt-1">Restart benefit: 50% off after evidence verification. Old proof of payment required. Final approval follows after payment.</span></label>
  <label class="border rounded-2xl p-4 cursor-pointer"><input type="radio" name="legacyType" value="returning_student" class="mr-2"><b>I studied with Funda before, but this is a different course</b><span class="block text-xs text-gray-500 mt-1">Returning student benefit: 25% off after previous-study verification. Final approval follows after payment.</span></label>
 </div>
 <div id="legacyExtra" class="hidden mt-5 border-t pt-5">
  <div class="grid md:grid-cols-2 gap-4">
   <div><label class="block text-sm font-bold text-gray-700 mb-2">ID number used with your previous Funda record *</label><input id="legacyId" inputmode="numeric" maxlength="13" class="w-full rounded-xl border border-gray-200 px-4 py-3" placeholder="13-digit South African ID"></div>
   <div id="legacyDateWrap" class="hidden"><label class="block text-sm font-bold text-gray-700 mb-2">When did you pay? *</label><input id="legacyPaymentDate" type="date" class="w-full rounded-xl border border-gray-200 px-4 py-3"></div>
   <div id="legacyReasonWrap" class="hidden md:col-span-2"><label class="block text-sm font-bold text-gray-700 mb-2">Why did you not complete the course? *</label><textarea id="legacyReason" rows="3" class="w-full rounded-xl border border-gray-200 px-4 py-3"></textarea></div>
   <div class="md:col-span-2"><label id="legacyEvidenceLabel" class="block text-sm font-bold text-gray-700 mb-2">Previous Funda evidence *</label><input id="legacyEvidence" type="file" accept="image/png,image/jpeg,application/pdf" class="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4"><p id="legacyEvidenceHelp" class="text-xs text-gray-500 mt-2"></p></div>
  </div>
  <button id="legacyCheck" type="button" class="mt-4 bg-[#03133d] text-white px-5 py-3 rounded-xl font-black">Check my previous Funda record</button>
  <div id="legacyResult" class="hidden mt-4 rounded-xl p-4 text-sm font-semibold"></div>
 </div>`;
 left.insertBefore(wrap,left.firstChild);
 wrap.querySelectorAll('input[name="legacyType"]').forEach(r=>r.addEventListener("change",()=>choose(r.value)));
 $("#legacyCheck").addEventListener("click",check);
}

function paymentCard(){
 const proof=$("#proofFile"); return proof?.closest(".bg-white.rounded-3xl.shadow-xl");
}
function setPaymentVisible(show){
 const card=paymentCard(); if(card) card.style.display=show?"":"none";
 const btn=$("#submitApplication"); if(btn) btn.disabled=!show;
}
function choose(type){
 state.type=type; state.entitlement=null; state.evidencePath=null; state.extractedText=""; state.verificationSummary=null;
 const extra=$("#legacyExtra"), date=$("#legacyDateWrap"), reason=$("#legacyReasonWrap"), label=$("#legacyEvidenceLabel"), help=$("#legacyEvidenceHelp");
 if(type==="first_time"){
  extra?.classList.add("hidden"); setPaymentVisible(true); updateSummary();
  return;
 }
 extra?.classList.remove("hidden");
 const incomplete=type==="legacy_incomplete";
 date?.classList.toggle("hidden",!incomplete); reason?.classList.toggle("hidden",!incomplete);
 if(type==="legacy_completed"){label.textContent="Upload your old Funda certificate *";help.textContent="Your old certificate is mandatory. The system will read the certificate and compare the name, ID number and course before provisionally unlocking the 70% discount.";}
 else if(incomplete){label.textContent="Upload your old proof of payment *";help.textContent="Provide the genuine payment proof from your earlier enrolment. Admin will audit the payment date and record before approval.";}
 else {label.textContent="Upload proof that you studied with Funda before *";help.textContent="Upload an old Funda certificate or other official Funda study record for verification.";}
 const checkBtn=$("#legacyCheck");
 if(checkBtn) checkBtn.textContent=type==="legacy_completed"?"Verify Certificate":"Check my previous Funda record";
 setPaymentVisible(false); updateSummary();
}

function loadExternalScript(src,globalName){
 return new Promise((resolve,reject)=>{
  if(globalName&&window[globalName])return resolve(window[globalName]);
  const existing=[...document.scripts].find(s=>s.src===src);
  if(existing){existing.addEventListener("load",()=>resolve(globalName?window[globalName]:true),{once:true});existing.addEventListener("error",reject,{once:true});return;}
  const s=document.createElement("script");s.src=src;s.async=true;
  s.onload=()=>resolve(globalName?window[globalName]:true);s.onerror=()=>reject(new Error("Verification component could not load."));
  document.head.appendChild(s);
 });
}

async function extractCertificateText(file){
 if(!file)throw new Error("Please upload your old Funda certificate.");
 if(!["image/png","image/jpeg","application/pdf"].includes(file.type))throw new Error("Certificate must be a PDF, JPG or PNG file.");
 if(file.size>5*1024*1024)throw new Error("Certificate must be 5 MB or smaller.");

 const progress=$("#legacyResult");
 if(file.type==="application/pdf"){
  await loadExternalScript("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js","pdfjsLib");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
  const page=await pdf.getPage(1);
  const textContent=await page.getTextContent();
  let text=(textContent.items||[]).map(x=>x.str||"").join(" ").replace(/\s+/g," ").trim();
  if(text.length>=40)return text;
  await loadExternalScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js","Tesseract");
  const viewport=page.getViewport({scale:2});
  const canvas=document.createElement("canvas");canvas.width=viewport.width;canvas.height=viewport.height;
  await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
  const r=await window.Tesseract.recognize(canvas,"eng",{logger:m=>{if(m.status==="recognizing text"&&progress)progress.textContent="Reading certificate… "+Math.round((m.progress||0)*100)+"%";}});
  return String(r?.data?.text||"").replace(/\s+/g," ").trim();
 }

 await loadExternalScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js","Tesseract");
 const r=await window.Tesseract.recognize(file,"eng",{logger:m=>{if(m.status==="recognizing text"&&progress)progress.textContent="Reading certificate… "+Math.round((m.progress||0)*100)+"%";}});
 return String(r?.data?.text||"").replace(/\s+/g," ").trim();
}

async function check(){
 const course=selected(), db=client(); if(!course||!db)return;
 const id=($("#legacyId")?.value||"").replace(/\D/g,"");
 if(id.length!==13)return showResult("Enter the 13-digit ID number used on your previous Funda records.",false);
 $("#idNumber").value=id;

 if(state.type==="legacy_incomplete"){
   if(!$("#legacyPaymentDate").value)return showResult("Please enter the date you previously paid for the course.",false);
   if(!$("#legacyReason").value.trim())return showResult("Please tell us why you did not complete the course.",false);
 }

 const evidence=$("#legacyEvidence")?.files?.[0];
 if(!evidence)return showResult("Please upload the required old Funda evidence first.",false);

 const btn=$("#legacyCheck");btn.disabled=true;
 try{
  if(state.type==="legacy_completed"){
    showResult("Reading your old certificate. Please wait…",false);
    btn.textContent="Reading certificate…";
    const extracted=await extractCertificateText(evidence);
    if(!extracted||extracted.length<20)throw new Error("The certificate could not be read clearly. Please upload a clearer PDF, JPG or PNG image.");
    state.extractedText=extracted;
    btn.textContent="Checking certificate details…";
    const {data,error}=await db.rpc("evaluate_legacy_certificate_text",{p_course_id:course.id,p_id_number:id,p_extracted_text:extracted});
    if(error)throw error;
    state.verificationSummary=data||null;
    const mark=v=>v?"✓ Matched":"✗ Not matched";
    const breakdown=`ID number: ${mark(!!data?.id_match)}\nStudent name: ${mark(!!data?.name_match)}\nCourse: ${mark(!!data?.course_match)}`;
    if(data?.verified){
      state.entitlement={matched:true,discount_percent:70,original_amount:Number(data.original_amount||course.price||0),payable_amount:Number(data.payable_amount||0),system_verified:true};
      showResult(`Certificate verification passed.\n\n${breakdown}\n\nThe 70% Legacy Upgrade has been provisionally applied. Your provisional amount is ${money(data.payable_amount)}. You may pay this amount now. Funda Admin will still audit the original certificate and your new proof of payment before course access is approved. If the final audit fails, enrolment will be declined and the amount paid must be refunded.`,true);
      setPaymentVisible(true);updateSummary();return;
    }
    state.entitlement=null;setPaymentVisible(false);
    showResult(`Certificate verification needs attention.\n\n${breakdown}\n\nThe 70% price has not been unlocked. Check the field marked “Not matched”, or submit the certificate for manual review.`,false,true);
    addManualButton();return;
  }

  btn.textContent="Checking…";
  const {data,error}=await db.rpc("check_legacy_entitlement",{p_course_id:course.id,p_claim_type:state.type,p_id_number:id});
  if(error)throw error;
  state.entitlement=data||null;
  if(data?.matched){
    showResult(`${data.message} Your provisional price for this application is ${money(data.payable_amount)} (${data.discount_percent}% off). You may now pay this amount. Funda Admin will still audit your previous-study evidence and your new proof of payment before course access is approved. If the claim is declined after audit, course access will remain blocked and the discounted payment must be refunded.`,true);
    setPaymentVisible(true); updateSummary();
  }else{
    showResult(data?.message||"We could not automatically match the historical record. Please submit it for manual verification before paying.",false,true);
    setPaymentVisible(false); addManualButton();
  }
 }catch(e){
   state.entitlement=null;setPaymentVisible(false);
   showResult(e.message||"We could not verify the previous Funda evidence.",false);
 }finally{
   btn.disabled=false;btn.textContent=state.type==="legacy_completed"?"Verify Certificate":"Check my previous Funda record";
 }
}
function showResult(msg,ok,manual=false){
 const x=$("#legacyResult"); if(!x)return; x.textContent=msg; x.style.whiteSpace="pre-line"; x.className="mt-4 rounded-xl p-4 text-sm font-semibold "+(ok?"bg-green-100 text-green-800":"bg-amber-100 text-amber-900"); if(manual)x.dataset.manual="1";
}
function addManualButton(){
 if($("#legacyManualSubmit"))return;
 const b=document.createElement("button");b.id="legacyManualSubmit";b.type="button";b.className="mt-3 border border-[#03133d] text-[#03133d] px-5 py-3 rounded-xl font-black";b.textContent="Submit legacy evidence for manual verification";
 $("#legacyResult").after(b);b.onclick=submitManual;
}
async function uploadEvidence(){
 if(state.evidencePath)return state.evidencePath;
 const file=$("#legacyEvidence")?.files?.[0], db=client(), u=user(); if(!file||!db||!u)throw Error("Legacy evidence file is required.");
 if(!["image/png","image/jpeg","application/pdf"].includes(file.type)||file.size>5*1024*1024)throw Error("Legacy evidence must be PDF, JPG or PNG and 5 MB or smaller.");
 const ext=(file.name.split(".").pop()||"file").toLowerCase().replace(/[^a-z0-9]/g,"");
 const path=`${u.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
 const {data,error}=await db.storage.from("legacy-verification").upload(path,file,{upsert:false,contentType:file.type});
 if(error)throw error; state.evidencePath=data.path; return data.path;
}
async function submitManual(){
 const db=client(),u=user(),s=student(),course=selected(); if(!db||!u||!course)return;
 const btn=$("#legacyManualSubmit");btn.disabled=true;btn.textContent="Submitting...";
 try{
  const path=await uploadEvidence(),id=($("#legacyId").value||"").replace(/\D/g,""),discount=state.type==="legacy_completed"?70:state.type==="legacy_incomplete"?50:25;
  const {data,error}=await db.from("legacy_verification_claims").insert({user_id:u.id,student_id:s?.id||null,course_id:course.id,claim_type:state.type,id_number:id,evidence_path:path,old_payment_date:$("#legacyPaymentDate")?.value||null,noncompletion_reason:$("#legacyReason")?.value.trim()||null,original_amount:Number(course.price||0),discount_percent:discount,payable_amount:Math.round(Number(course.price||0)*(1-discount/100)*100)/100,auto_matched:false,verification_status:"pending"}).select("id").single();
  if(error)throw error;state.manualClaimId=data.id;
  showResult("Your legacy evidence has been submitted for manual verification. Please do not make payment yet. Funda will approve or decline the claim after checking the historical records.",true);
  btn.remove();
 }catch(e){showResult(e.message||"Could not submit your legacy evidence.",false);btn.disabled=false;btn.textContent="Submit legacy evidence for manual verification";}
}
function getPayableAmount(course){
 if(!course)return 0;
 if(state.type==="first_time"||!state.type)return Number(course.price||0);
 return state.entitlement?.matched?Number(state.entitlement.payable_amount||0):Number(course.price||0);
}
function updateSummary(){
 const course=selected(),price=$("#summaryPrice");if(!course||!price)return;
 const payable=getPayableAmount(course);
 if(state.type&&state.type!=="first_time"&&state.entitlement?.matched){
   price.innerHTML=`${money(payable)} <span style="display:block;font-size:12px;color:#15803d;margin-top:4px">Legacy price · ${state.entitlement.discount_percent}% off</span>`;
 }else price.textContent=money(course.price);
 try{window.FundaPaymentIntegrity?.refresh?.();}catch(e){}
}
function validate(){
 if(!state.type)return "Please tell us whether you are a first-time, legacy, incomplete legacy or returning Funda student.";
 if(state.type==="first_time")return null;
 if(!state.entitlement?.matched)return "Your legacy evidence must pass the system verification before the provisional discounted payment is unlocked.";
 if(!state.entitlement.approved_claim_id&&!$("#legacyEvidence")?.files?.[0]&&!state.evidencePath)return "Please upload the required previous Funda evidence.";
 if(state.type==="legacy_incomplete"&&(!$("#legacyPaymentDate").value||!$("#legacyReason").value.trim()))return "Previous payment date and reason for not completing are required.";
 return null;
}
async function saveClaim(enrollmentId){
 if(state.type==="first_time")return null;
 const db=client(),u=user(),s=student(),course=selected(); if(!db||!u||!course||!state.entitlement?.matched)return null;
 if(state.entitlement.approved_claim_id){
   await db.from("legacy_verification_claims").update({enrollment_id:enrollmentId}).eq("id",state.entitlement.approved_claim_id).eq("user_id",u.id);
   return {id:state.entitlement.approved_claim_id};
 }
 const path=await uploadEvidence();
 const payload={user_id:u.id,student_id:s?.id||null,course_id:course.id,enrollment_id:enrollmentId,claim_type:state.type,legacy_record_id:state.entitlement.legacy_record_id||null,id_number:($("#legacyId").value||"").replace(/\D/g,""),evidence_path:path,old_payment_date:$("#legacyPaymentDate")?.value||null,noncompletion_reason:$("#legacyReason")?.value.trim()||null,original_amount:Number(course.price||0),discount_percent:Number(state.entitlement.discount_percent||0),payable_amount:Number(state.entitlement.payable_amount||0),auto_matched:true,verification_status:"pending",system_verification_method:state.type==="legacy_completed"?"certificate_text_reading":"historical_match",system_verification_score:Number(state.verificationSummary?.score||0),system_verification_summary:state.verificationSummary||null,extracted_text:state.type==="legacy_completed"?state.extractedText:null};
 const {data,error}=await db.from("legacy_verification_claims").insert(payload).select("id").single();if(error)throw error;return data;
}
function fields(claim){
 const course=selected(),discount=state.type==="first_time"?0:Number(state.entitlement?.discount_percent||0);
 return {student_category:state.type||"first_time",original_amount:Number(course?.price||0),discount_percent:discount,legacy_claim_id:claim?.id||null};
}
function onCourseOpened(){ensurePanel(); state.type="";state.entitlement=null;state.evidencePath=null;state.extractedText="";state.verificationSummary=null; document.querySelectorAll('input[name="legacyType"]').forEach(x=>x.checked=false); $("#legacyExtra")?.classList.add("hidden");setPaymentVisible(false);updateSummary();}
window.FundaLegacy={ensurePanel,onCourseOpened,getPayableAmount,validate,saveClaim,getEnrollmentFields:fields,getPaymentFields:fields};
document.addEventListener("DOMContentLoaded",ensurePanel);
})();