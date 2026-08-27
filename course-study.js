// ============================================================
// FUNDA ONLINE ACADEMY - COURSE STUDY
// ============================================================
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const content=document.getElementById("course-content");
const message=document.getElementById("message");
const logout=document.getElementById("logout");

const esc=v=>v==null?"":String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const statusOf=r=>String(r?.enrollment_status??r?.status??"pending").trim().toLowerCase();
function show(t,ok=false){if(message){message.textContent=t;message.className="message "+(ok?"success":"error");}}

function normaliseModules(raw){
  if(Array.isArray(raw))return raw;
  if(typeof raw==="string"){
    try{const x=JSON.parse(raw);if(Array.isArray(x))return x;}catch{}
    return raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  }
  if(raw&&typeof raw==="object")return Object.values(raw);
  return [];
}
function moduleHtml(item,i){
  if(typeof item==="string")return `<div class="module"><div class="module-number">Module ${i+1}</div><h3>${esc(item)}</h3><p>Study this module carefully and complete the activities provided by the Academy.</p></div>`;
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
    if(authError||!user){location.href="login.html?next="+encodeURIComponent(location.pathname+location.search);return;}

    // enrollments.student_id is the authenticated profile/user id in the Academy schema.
    const {data:enrolments,error:enrolError}=await db.from("enrollments").select("*").eq("student_id",user.id).eq("course_id",courseId).order("enrolled_at",{ascending:false}).limit(1);
    if(enrolError)throw enrolError;
    if(!enrolments?.length){show("You are not enrolled in this course.");return;}

    const enrol=enrolments[0];
    const status=statusOf(enrol);
    if(!["approved","active","enrolled","completed"].includes(status)){
      content.innerHTML=`<div class="study-head"><h1>Course access pending</h1><p>Your enrollment is currently <strong>${esc(status)}</strong>. Once the Academy approves it, your learning material will be available here.</p><a class="btn green" href="dashboard.html">Back to Dashboard</a></div>`;
      return;
    }

    const {data:course,error:courseError}=await db.from("courses").select("*").eq("id",courseId).maybeSingle();
    if(courseError)throw courseError;
    if(!course){show("Course could not be found.");return;}

    let modules=[];
    const moduleResult=await db.from("course_modules").select("id,module_number,module_name,description,learning_outcomes").eq("course_id",courseId).order("module_number",{ascending:true});
    if(!moduleResult.error&&moduleResult.data?.length){modules=moduleResult.data.map(m=>({title:m.module_name,description:m.description||"Open this module in the Academy learning area."}));}
    else modules=normaliseModules(course.modules);

    const title=course.title||course.name||"Course";
    content.innerHTML=`
      <div class="study-head">
        <span class="badge">APPROVED LEARNING ACCESS</span>
        <h1>${esc(title)}</h1>
        <p>${esc(course.description||"Welcome to your Funda Online Academy course.")}</p>
        ${course.duration?`<p><strong>Duration:</strong> ${esc(course.duration)}</p>`:""}
        <div class="study-actions"><a class="btn ghost" href="dashboard.html">← Dashboard</a></div>
      </div>
      <section>
        <h2>Course Modules</h2>
        ${modules.length?modules.map(moduleHtml).join(""):`<div class="card"><h3>Learning material is being prepared</h3><p>Modules have not yet been added to this course.</p></div>`}
      </section>
      <section>
        <h2>Assessments</h2>
        <div class="card"><p>Your assessments, results and completion requirements will appear in the full learning area as we complete the next learning-platform phase.</p></div>
      </section>`;
  }catch(err){
    console.error("Course study:",err);
    show("Unable to load this course: "+(err.message||"Please try again."));
  }
}
if(logout)logout.addEventListener("click",async()=>{await db.auth.signOut();location.href="login.html";});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();