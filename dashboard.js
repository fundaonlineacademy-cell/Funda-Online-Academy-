// ============================================================
// FUNDA ONLINE ACADEMY - STUDENT DASHBOARD
// Complete, clean version
// ============================================================

const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const userNameEl = document.getElementById("user-name");
const userEmailEl = document.getElementById("user-email");
const enrolmentsEl = document.getElementById("enrolments");
const coursesEl = document.getElementById("available-courses");
const paymentListEl = document.getElementById("payment-list");
const messageEl = document.getElementById("message");
const logoutBtn = document.getElementById("logout");

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function formatMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? "R" + n.toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2}) : "R0.00";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-ZA",{year:"numeric",month:"short",day:"numeric"});
}

function statusOf(row) {
  return String(row?.enrollment_status ?? row?.status ?? "pending").trim().toLowerCase();
}

function showMessage(text, success=false) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = "message " + (success ? "success" : "error");
}

async function currentUser() {
  const {data,error} = await db.auth.getUser();
  if (error) {
    console.error("Auth:",error);
    return null;
  }
  return data?.user || null;
}

async function getStudent(userId) {
  const {data,error} = await db.from("students").select("*").eq("user_id",userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function getCourses(ids=null) {
  let q = db.from("courses").select("*");
  if (ids && ids.length) q = q.in("id",ids);
  else q = q.eq("active",true);
  const {data,error} = await q.order("title",{ascending:true});
  if (error) {
    // Older catalogue uses name instead of title.
    const fallback = ids && ids.length
      ? await db.from("courses").select("*").in("id",ids)
      : await db.from("courses").select("*").eq("active",true).order("name",{ascending:true});
    if (fallback.error) throw error;
    return fallback.data || [];
  }
  return data || [];
}

function courseTitle(course) {
  return course?.title || course?.name || "Course";
}

function coursePrice(course) {
  return course?.price ?? 0;
}

async function loadEnrolments(studentId) {
  enrolmentsEl.innerHTML = '<p class="loading">Loading enrolments…</p>';

  try {
    const {data: rows,error} = await db.from("enrollments").select("*")
      .eq("student_id",studentId).order("enrolled_at",{ascending:false});
    if (error) throw error;

    if (!rows?.length) {
      enrolmentsEl.innerHTML = `<div class="card"><h3>No enrolments yet</h3><p>Choose a course below to start your learning journey.</p></div>`;
      return;
    }

    const ids=[...new Set(rows.map(r=>r.course_id).filter(Boolean))];
    const courses=await getCourses(ids);
    const map=new Map(courses.map(c=>[String(c.id),c]));

    enrolmentsEl.innerHTML=rows.map(row=>{
      const course=map.get(String(row.course_id));
      const status=statusOf(row);
      const approved=status==="approved" || status==="active";
      const amount=row.amount ?? coursePrice(course);
      return `<div class="card">
        <span class="funda-status ${escapeHTML(status)}">${escapeHTML(status)}</span>
        <h3>${escapeHTML(courseTitle(course))}</h3>
        <p>${escapeHTML(course?.description || "Your enrolled online course.")}</p>
        <p class="funda-info"><strong>Course fee:</strong> ${formatMoney(amount)}</p>
        <p class="funda-info"><strong>Enrolled:</strong> ${formatDate(row.enrolled_at || row.created_at)}</p>
        ${approved ? `<div class="funda-card-actions"><button class="btn green study-btn" data-course-id="${escapeHTML(row.course_id)}">📚 Study Course</button></div>`
          : `<p style="margin-top:14px;color:#777">Your enrolment is awaiting approval.</p>`}
      </div>`;
    }).join("");

    document.querySelectorAll(".study-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id=btn.dataset.courseId;
        if(id) location.href="course-study.html?id="+encodeURIComponent(id);
      });
    });
  } catch(err) {
    console.error("Enrolments:",err);
    enrolmentsEl.innerHTML=`<div class="card"><h3>Unable to load enrolments</h3><p>${escapeHTML(err.message || "Please refresh and try again.")}</p></div>`;
  }
}

async function loadAvailableCourses(studentId) {
  coursesEl.innerHTML='<p class="loading">Loading courses…</p>';
  try {
    const courses=await getCourses();
    if(!courses.length){
      coursesEl.innerHTML='<div class="card"><h3>No courses available</h3><p>Courses will appear here when available.</p></div>';
      return;
    }

    const {data:existing,error}=await db.from("enrollments").select("course_id,enrollment_status,status")
      .eq("student_id",studentId);
    if(error) console.warn("Existing enrolments:",error);

    const enrolled=new Map((existing||[]).map(r=>[String(r.course_id),statusOf(r)]));

    coursesEl.innerHTML=courses.map(course=>{
      const id=String(course.id);
      const status=enrolled.get(id);
      return `<div class="card">
        <h3>${escapeHTML(courseTitle(course))}</h3>
        <p>${escapeHTML(course.description || "Online short course.")}</p>
        <p class="funda-info"><strong>Course fee:</strong> ${formatMoney(coursePrice(course))}</p>
        ${status ? `<span class="funda-status ${escapeHTML(status)}">${escapeHTML(status)}</span>`
          : `<button type="button" class="btn green enrol-btn" data-course-id="${escapeHTML(id)}">Enrol Now</button>`}
      </div>`;
    }).join("");

    document.querySelectorAll(".enrol-btn").forEach(btn=>{
      btn.addEventListener("click",()=>enrolStudent(studentId,btn.dataset.courseId,btn));
    });
  } catch(err) {
    console.error("Courses:",err);
    coursesEl.innerHTML=`<div class="card"><h3>Unable to load courses</h3><p>${escapeHTML(err.message || "Please refresh and try again.")}</p></div>`;
  }
}

async function enrolStudent(studentId,courseId,button) {
  if(!studentId || !courseId) return;
  button.disabled=true; button.textContent="Enrolling…";

  try {
    const {data:existing,error:checkError}=await db.from("enrollments").select("id,enrollment_status,status")
      .eq("student_id",studentId).eq("course_id",courseId).maybeSingle();
    if(checkError) throw checkError;
    if(existing){
      showMessage("You are already enrolled in this course.");
      return;
    }

    const {data:course,error:courseError}=await db.from("courses").select("*").eq("id",courseId).maybeSingle();
    if(courseError) throw courseError;

    const payload={
      student_id:studentId,
      course_id:courseId,
      enrollment_status:"pending",
      enrolled_at:new Date().toISOString(),
      amount:course?.price ?? null
    };

    const {error:insertError}=await db.from("enrollments").insert(payload);
    if(insertError) throw insertError;

    showMessage("Enrolment submitted successfully. Please wait for approval.",true);
    await Promise.all([loadEnrolments(studentId),loadAvailableCourses(studentId)]);
  } catch(err) {
    console.error("Enrolment:",err);
    showMessage("Unable to complete enrolment: " + (err.message || "Please try again."));
    button.disabled=false; button.textContent="Enrol Now";
  }
}

async function loadPayments(studentId) {
  paymentListEl.innerHTML='<div class="card"><p class="loading">Loading payment history…</p></div>';

  try {
    const {data:payments,error}=await db.from("payments").select("*")
      .eq("student_id",studentId).order("created_at",{ascending:false});
    if(error) throw error;

    if(!payments?.length){
      paymentListEl.innerHTML='<div class="card"><h3>Payment History</h3><p>No payment records have been recorded yet.</p></div>';
      return;
    }

    const courseIds=[...new Set(payments.map(p=>p.course_id).filter(Boolean))];
    let courseMap=new Map();
    if(courseIds.length){
      const courses=await getCourses(courseIds);
      courseMap=new Map(courses.map(c=>[String(c.id),c]));
    }

    paymentListEl.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px">${
      payments.map(p=>{
        const course=courseMap.get(String(p.course_id));
        const status=String(p.payment_status ?? p.status ?? "pending").toLowerCase();
        const proof=p.proof_url || p.proof_of_payment_url || p.receipt_url || p.file_url;
        const method=p.payment_method || p.method || "Not specified";
        const amount=p.amount ?? coursePrice(course);
        return `<div class="payment-card">
          <h3>${escapeHTML(courseTitle(course))}</h3>
          <p class="funda-info"><strong>Amount:</strong> ${formatMoney(amount)}</p>
          <p class="funda-info"><strong>Method:</strong> ${escapeHTML(method)}</p>
          <p class="funda-info"><strong>Date:</strong> ${formatDate(p.created_at || p.paid_at)}</p>
          <p class="funda-info"><strong>Status:</strong> <span class="funda-status ${escapeHTML(status)}">${escapeHTML(status)}</span></p>
          <p class="funda-info"><strong>Proof:</strong> ${
            proof ? `<a class="btn green" target="_blank" rel="noopener noreferrer" href="${escapeHTML(proof)}">View submitted proof</a>` : "Not available"
          }</p>
        </div>`;
      }).join("")
    }</div>`;
  } catch(err) {
    console.error("Payments:",err);
    paymentListEl.innerHTML=`<div class="card"><h3>Payment History</h3><p>Payment information could not be loaded right now.</p></div>`;
  }
}

async function logout() {
  const {error}=await db.auth.signOut();
  if(error){showMessage("Unable to log out. Please try again.");return;}
  location.href="auth.html";
}

async function initDashboard() {
  try {
    const user=await currentUser();
    if(!user){location.href="auth.html";return;}

    const student=await getStudent(user.id);
    if(!student){
      showMessage("Your student profile could not be found. Please contact the academy.");
      if(userEmailEl) userEmailEl.textContent=user.email || "";
      return;
    }

    const name=student.full_name || student.name || user.user_metadata?.full_name || "Student";
    userNameEl.textContent=name;
    userEmailEl.textContent=user.email || "";

    await Promise.all([
      loadEnrolments(student.id),
      loadAvailableCourses(student.id),
      loadPayments(student.id)
    ]);
  } catch(err) {
    console.error("Dashboard:",err);
    showMessage("Unable to load your dashboard: " + (err.message || "Please refresh the page."));
  }
}

if(logoutBtn) logoutBtn.addEventListener("click",logout);
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",initDashboard);
else initDashboard();
