const { createClient } = supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const msg=document.getElementById("message");
function show(t,ok=false){msg.textContent=t;msg.className="message "+(ok?"success":"error");}
async function init(){
 if(window.SUPABASE_URL.includes("PASTE_")){show("Supabase is not connected yet. Follow SETUP.md.");return;}
 const {data:{session}}=await db.auth.getSession();
 if(!session){location.href="auth.html";return;}
 document.getElementById("user-email").textContent=session.user.email;
 const {data:profile}=await db.from("profiles").select("full_name").eq("id",session.user.id).maybeSingle();
 document.getElementById("user-name").textContent=profile?.full_name||session.user.user_metadata?.full_name||"Student";
 await loadEnrolments(session.user.id); await loadAvailableCourses(session.user.id);
}
async function loadEnrolments(uid){
 const box=document.getElementById("enrolments");
 const {data,error}=await db.from("enrolments").select("id,status,created_at,courses(title,price,category,duration,description)").eq("student_id",uid).order("created_at",{ascending:false});
 if(error){box.innerHTML="<p>Could not load enrolments.</p>";return;}
 if(!data?.length){box.innerHTML='<div class="empty card"><h3>No enrolments yet</h3><p>Choose a course and request enrolment to see it here.</p><a class="btn green" href="index.html#courses">Browse Courses</a></div>';return;}
 box.innerHTML=data.map(e=>`<article class="card"><span class="tag">${escapeHtml(e.courses?.category||"Course")}</span><h3>${escapeHtml(e.courses?.title||"Course")}</h3><p>${escapeHtml(e.courses?.description||"")}</p><p><strong>Price:</strong> R${Number(e.courses?.price||0).toLocaleString("en-ZA")}</p><p><strong>Status:</strong> <span class="status">${escapeHtml(e.status)}</span></p><small>Requested ${new Date(e.created_at).toLocaleDateString("en-ZA")}</small></article>`).join("");
}
document.getElementById("logout").onclick=async()=>{await db.auth.signOut();location.href="index.html";};
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
init();

async function loadAvailableCourses(uid){
 const box=document.getElementById("available-courses");
 const {data:courses,error}=await db.from("courses").select("id,title,price,category,duration,description").eq("active",true).order("title");
 if(error){box.innerHTML="<p>Could not load courses.</p>";return;}
 const {data:mine}=await db.from("enrolments").select("course_id").eq("student_id",uid);
 const enrolled=new Set((mine||[]).map(x=>x.course_id));
 box.innerHTML=(courses||[]).map(c=>`<article class="card"><span class="tag">${escapeHtml(c.category||"Course")}</span><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.description||"Flexible online short course.")}</p><p><strong>${escapeHtml(c.duration||"")}</strong></p><p class="price">R${Number(c.price).toLocaleString("en-ZA")}</p>${enrolled.has(c.id)?'<button class="btn ghost full" disabled>Already Enrolled</button>':`<button class="btn green full" data-enrol="${c.id}">Request Enrolment</button>`}</article>`).join("")||"<p>No courses available.</p>";
 box.querySelectorAll("[data-enrol]").forEach(b=>b.onclick=()=>enrol(b.dataset.enrol,uid));
}
async function enrol(courseId,uid){
 if(!confirm("Send an enrolment request for this course?"))return;
 const {error}=await db.from("enrolments").insert({student_id:uid,course_id:courseId,status:"pending"});
 if(error){show(error.code==="23505"?"You have already requested this course.":error.message);return;}
 show("Enrolment request sent successfully.",true); await loadEnrolments(uid); await loadAvailableCourses(uid);
}
