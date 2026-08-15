// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
// Assessments • Results
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const msg = document.getElementById("message");

let courses = [];
let editingId = null;


// ============================================================
// MESSAGE
// ============================================================

function show(message, ok = false) {

  if (!msg) return;

  msg.textContent = message;

  msg.className =
    "message " + (ok ? "success" : "error");
}


// ============================================================
// ESCAPE HTML
// ============================================================

function esc(value) {

  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));

}


// ============================================================
// DATE
// IMPORTANT:
// We do NOT assume created_at exists on enrollments.
// ============================================================

function formatDate(date) {

  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

}


// ============================================================
// MONEY
// ============================================================

function money(value) {

  const amount = Number(value || 0);

  return "R" + amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

}


// ============================================================
// RESET COURSE FORM
// ============================================================

function resetForm() {

  editingId = null;

  const form =
    document.getElementById("course-form");

  if (form) {
    form.reset();
  }

  const id =
    document.getElementById("course-id");

  if (id) {
    id.value = "";
  }

  const button =
    document.querySelector(
      "#course-form button[type='submit']"
    );

  if (button) {
    button.textContent = "Save Course";
  }

}


// ============================================================
// FILL COURSE FORM
// ============================================================

function fill(course) {

  editingId = course.id;

  const id =
    document.getElementById("course-id");

  const name =
    document.getElementById("course-name");

  const price =
    document.getElementById("course-price");

  const category =
    document.getElementById("course-category");

  const duration =
    document.getElementById("course-duration");

  const image =
    document.getElementById("course-image");

  const description =
    document.getElementById("course-description");

  const modules =
    document.getElementById("course-modules");


  if (id) {
    id.value = course.id;
  }

  if (name) {
    name.value =
      course.title ||
      course.name ||
      "";
  }

  if (price) {
    price.value =
      course.price || 0;
  }

  if (category) {
    category.value =
      course.category || "";
  }

  if (duration) {
    duration.value =
      course.duration || "";
  }

  if (image) {
    image.value =
      course.image_url || "";
  }

  if (description) {
    description.value =
      course.description || "";
  }

  if (modules) {

    modules.value =
      Array.isArray(course.modules)
        ? course.modules.join("\n")
        : "";

  }


  const button =
    document.querySelector(
      "#course-form button[type='submit']"
    );

  if (button) {
    button.textContent = "Update Course";
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ============================================================
// ADMIN INITIALISATION
// ============================================================

async function init() {

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY ||
    window.SUPABASE_URL.includes("PASTE_")
  ) {

    show(
      "Supabase is not connected. Please check supabase-config.js."
    );

    return;
  }


  const {
    data: { session },
    error: sessionError
  } =
    await db.auth.getSession();


  if (sessionError) {

    console.error(sessionError);

    show(sessionError.message);

    return;
  }


  if (!session) {

    window.location.href =
      "auth.html";

    return;
  }


  const adminEmail =
    document.getElementById("admin-email");

  if (adminEmail) {

    adminEmail.textContent =
      session.user.email || "";

  }


  // ==========================================================
  // CHECK ADMIN ROLE
  // ==========================================================

  const {
    data: profile,
    error: profileError
  } =
    await db
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();


  if (profileError) {

    console.error(profileError);

    show(profileError.message);

    return;
  }


  if (
    !profile ||
    profile.role !== "admin"
  ) {

    show(
      "This account is not authorised as an administrator."
    );

    setTimeout(() => {

      window.location.href =
        "dashboard.html";

    }, 1800);

    return;
  }


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  await loadCourses();

  await Promise.all([
    loadStudents(),
    loadEnrolments(),
    loadPayments(),
    loadAssessments()
  ]);

}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

  const box =
    document.getElementById(
      "admin-students"
    );

  if (!box) return;


  box.innerHTML =
    "<p>Loading registered students...</p>";


  const {
    data,
    error
  } =
    await db
      .from("profiles")
      .select(`
        id,
        full_name,
        gender,
        id_number,
        email,
        phone,
        role,
        created_at
      `)
      .neq("role", "admin")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(
      "Student loading error:",
      error
    );

    box.innerHTML = `
      <div class="admin-error">
        <strong>Could not load students.</strong>
        <br><br>
        ${esc(error.message)}
      </div>
    `;

    return;
  }


  if (!data || data.length === 0) {

    box.innerHTML = `
      <div class="empty-state">
        <strong>No registered students yet.</strong>
        <p>
          Students will appear here after
          they create an account.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML = `

    <div class="student-list">

      ${data.map(student => {

        const name =
          student.full_name ||
          "Student";

        return `

          <div class="student-card">

            <div class="student-card-header">

              <div class="student-avatar">
                🎓
              </div>

              <div>

                <h3>
                  ${esc(name)}
                </h3>

                <span class="student-role">
                  ${esc(
                    student.role ||
                    "student"
                  )}
                </span>

              </div>

            </div>


            <div class="student-details">

              <div class="student-detail">

                <span class="detail-label">
                  Gender
                </span>

                <strong>
                  ${esc(
                    student.gender ||
                    "Not provided"
                  )}
                </strong>

              </div>


              <div class="student-detail sensitive">

                <span class="detail-label">
                  South African ID Number
                </span>

                <strong>
                  ${esc(
                    student.id_number ||
                    "Not provided"
                  )}
                </strong>

              </div>


              <div class="student-detail">

                <span class="detail-label">
                  Email
                </span>

                <strong>
                  ${esc(
                    student.email ||
                    "Not provided"
                  )}
                </strong>

              </div>


              <div class="student-detail">

                <span class="detail-label">
                  WhatsApp / Mobile
                </span>

                <strong>
                  ${esc(
                    student.phone ||
                    "Not provided"
                  )}
                </strong>

              </div>


              <div class="student-detail">

                <span class="detail-label">
                  Registered
                </span>

                <strong>
                  ${formatDate(
                    student.created_at
                  )}
  </
