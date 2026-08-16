// ============================================================
// FUNDA ONLINE ACADEMY - COURSE STUDY
// ============================================================
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const content=document.getElementById("course-content");
const message=document.getElementById("message");
const logout=document.getElementById("logout");

const esc=v=>v==null?"":String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const money=v=>{const n=Number(v);return Number.isFinite(n)?"R"+n.toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2}):"R0.00";};
const statusOf=r=>String(r?.enrollment_status??r?.status??"pending").toLowerCase();
function show(t,ok=false){if(message){message.textContent=t;message.className="message "+(ok?"success":"error");}}

function normaliseModules(raw){
  if(Array.isArray(raw)) return raw;
  if(typeof raw==="string"){
    try{const x=JSON.parse(raw);if(Array.isArray(x))return x;}catch{}
    return raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  }
  if(raw && typeof raw==="object"){
    return Object.values(raw);
  }
  return [];
}

function moduleHtml(item,i){
  if(typeof item==="string") return `<div class="module"><div class="module-number">Module ${i+1}</div><h3>${esc(item)}</h3><p>Study this module carefully and complete the activities provided by your academy.</p></div>`;
  const title=item?.title||item?.name||item?.module||`Module ${i+1}`;
  const body=item?.content||item?.description||item?.lesson||item?.text||"Study the learning material for this module and complete the required activities.";
  return `<div class="module"><div class="module-number">Module ${i+1}</div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}

async function init(){
  try{
    const params=new URLSearchParams(location.search);
    const courseId=params.get("id")||params.get("course");
    if(!courseId){show("No course was selected.");return;}

    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user){location.href="auth.html";return;}

    const {data:student,error:studentError}=await db.from("students").select("id,full_name,name").eq("user_id",user.id).maybeSingle();
    if(studentError)throw studentError;
    if(!student){show("Your student profile could not be found.");return;}

    const {data:enrolments,error:enrolError}=await db.from("enrollments").select("*").eq("student_id",student.id).eq("course_id",courseId);
    if(enrolError)throw enrolError;
    if(!enrolments?.length){show("You are not enrolled in this course.");return;}

    const enrol=enrolments[0];
    const status=statusOf(enrol);
    if(status!=="approved"&&status!=="active"){
      content.innerHTML=`<div class="study-head"><h1>Course access pending</h1><p>Your enrolment is currently <strong>${esc(status)}</strong>. Once the academy approves it, your learning material will be available here.</p><a class="btn green" href="dashboard.html">Back to Dashboard</a></div>`;
      return;
    }

    const {data:course,error:courseError}=await db.from("courses").select("*").eq("id",courseId).maybeSingle();
    if(courseError)throw courseError;
    if(!course){show("Course could not be found.");return;}

    const modules=normaliseModules(course.modules);
    const title=course.title||course.name||"Course";
    content.innerHTML=`
      <div class="study-head">
        <span class="badge">ONLINE LEARNING</span>
        <h1>${esc(title)}</h1>
        <p>${esc(course.description||"Welcome to your Funda Online Academy course.")}</p>
        <p><strong>Course fee:</strong> ${money(course.price)}</p>
        ${course.duration?`<p><strong>Duration:</strong> ${esc(course.duration)}</p>`:""}
        <div class="study-actions"><a class="btn ghost" href="dashboard.html">← Dashboard</a></div>
      </div>
      <section>
        <h2>Course Modules</h2>
        ${modules.length?modules.map(moduleHtml).join(""):`<div class="card"><h3>Learning material is being prepared</h3><p>The course has been enrolled successfully, but modules have not yet been added.</p></div>`}
      </section>
      <section>
        <h2>Assessments</h2>
        <div class="card"><p>Your assessments and results will be made available here as they are added to your course.</p></div>
      </section>`;
  }catch(err){
    console.error("Course study:",err);
    show("Unable to load this course: "+(err.message||"Please try again."));
  }
}

if(logout)logout.addEventListener("click",async()=>{await db.auth.signOut();location.href="auth.html";});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
