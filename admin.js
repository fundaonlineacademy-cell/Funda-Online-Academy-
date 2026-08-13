const { createClient } = supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const msg=document.getElementById("message");
let courses=[], editingId=null;
function show(t,ok=false){msg.textContent=t;msg.className="message "+(ok?"success":"error");}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function resetForm(){editingId=null;document.getElementById("course-form").reset();document.getElementById("course-id").value="";}
function fill(c){editingId=c.id;document.getElementById("course-id").value=c.id;document.getElementById("course-name").value=c.title;document.getElementById("course-price").value=c.price;document.getElementById("course-category").value=c.category||"";document.getElementById("course-duration").value=c.duration||"";document.getElementById("course-image").value=c.image_url||"";document.getElementById("course-description").value=c.description||"";document.getElementById("course-modules").value=(c.modules||[]).join("\n");scrollTo({top:0,behavior:"smooth"});}
async function init(){
 if(window.SUPABASE_URL.includes("PASTE_")){show("Supabase is not connected yet. Follow SETUP.md.");return;}
 const {data:{session}}=await db.auth.getSession(); if(!session){location.href="auth.html";return;}
 document.getElementById("admin-email").textContent=session.user.email;
 const {data:profile}=await db.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
 if(profile?.role!=="admin"){show("This account is not an administrator.");setTimeout(()=>location.href="dashboard.html",1800);return;}
 await Promise.all([loadCourses(),loadEnrolments()]);
}
async function loadCourses(){
 const {data,error}=await db.from("courses").select("*").order("title");if(error)return show(error.message);
 courses=data||[];const box=document.getElementById("admin-courses");
 box.innerHTML=courses.map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.category||"")} · R${Number(c.price).toLocaleString("en-ZA")} · ${esc(c.duration||"")}</small></div><div class="row-actions"><button class="btn small ghost" data-edit="${c.id}">Edit</button><button class="btn small danger" data-delete="${c.id}">Delete</button></div></div>`).join("")||"<p>No courses.</p>";
 box.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>fill(courses.find(c=>c.id===b.dataset.edit)));
 box.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteCourse(b.dataset.delete));
}
async function deleteCourse(id){
 const c=courses.find(x=>x.id===id);if(!c||!confirm(`Delete "${c.title}"?`))return;
 const {error}=await db.from("courses").delete().eq("id",id);if(error)return show(error.message);show("Course deleted.",true);await loadCourses();
}
document.getElementById("course-form").onsubmit=async e=>{e.preventDefault();
 const payload={title:document.getElementById("course-name").value.trim(),slug:document.getElementById("course-name").value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""),price:Number(document.getElementById("course-price").value),category:document.getElementById("course-category").value.trim(),duration:document.getElementById("course-duration").value.trim(),image_url:document.getElementById("course-image").value.trim()||null,description:document.getElementById("course-description").value.trim(),modules:document.getElementById("course-modules").value.split("\n").map(x=>x.trim()).filter(Boolean),active:true};
 let result=editingId?await db.from("courses").update(payload).eq("id",editingId):await db.from("courses").insert(payload);
 if(result.error)return show(result.error.message);show(editingId?"Course updated.":"Course added.",true);resetForm();await loadCourses();
};
document.getElementById("new-course").onclick=resetForm;document.getElementById("cancel-edit").onclick=resetForm;
async function loadEnrolments(){
 const box=document.getElementById("admin-enrolments");const {data,error}=await db.from("enrolments").select("id,status,created_at,student_id,profiles(full_name),courses(title,price)").order("created_at",{ascending:false});
 if(error){box.innerHTML="<p>Could not load enrolments.</p>";return;}
 box.innerHTML=data?.length?`<table><thead><tr><th>Student</th><th>Course</th><th>Price</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>${data.map(e=>`<tr><td>${esc(e.profiles?.full_name||"")}</td><td>${esc(e.courses?.title||"")}</td><td>R${Number(e.courses?.price||0).toLocaleString("en-ZA")}</td><td>${esc(e.status)}</td><td>${new Date(e.created_at).toLocaleDateString("en-ZA")}</td><td><select data-status="${e.id}"><option ${e.status==="pending"?"selected":""}>pending</option><option ${e.status==="approved"?"selected":""}>approved</option><option ${e.status==="completed"?"selected":""}>completed</option><option ${e.status==="cancelled"?"selected":""}>cancelled</option></select></td></tr>`).join("")}</tbody></table>`:"<p>No enrolment requests yet.</p>";
 box.querySelectorAll("[data-status]").forEach(s=>s.onchange=async()=>{const {error}=await db.from("enrolments").update({status:s.value}).eq("id",s.dataset.status);if(error)show(error.message);else show("Enrolment status updated.",true);});
}
document.getElementById("logout").onclick=async()=>{await db.auth.signOut();location.href="index.html";};
init();
