const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const msg = document.getElementById("message");
let courses = [];
let editingId = null;

function show(text, ok = false) {
  msg.textContent = text;
  msg.className = "message " + (ok ? "success" : "error");
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function resetForm() {
  editingId = null;
  document.getElementById("course-form").reset();
  document.getElementById("course-id").value = "";
}

function fill(course) {
  editingId = course.id;

  document.getElementById("course-id").value = course.id;
  document.getElementById("course-name").value = course.name || "";
  document.getElementById("course-price").value = course.price || 0;
  document.getElementById("course-category").value = course.category || "";
  document.getElementById("course-duration").value = course.duration || "";
  document.getElementById("course-image").value = course.image_url || "";
  document.getElementById("course-description").value = course.description || "";
  document.getElementById("course-modules").value =
    (course.modules || []).join("\n");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function init() {
  if (window.SUPABASE_URL.includes("PASTE_")) {
    show("Supabase is not connected yet. Follow SETUP.md.");
    return;
  }

  const {
    data: { session }
  } = await db.auth.getSession();

  if (!session) {
    location.href = "auth.html";
    return;
  }

  document.getElementById("admin-email").textContent =
    session.user.email || "";

  const { data: profile, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    show(error.message);
    return;
  }

  if (profile?.role !== "admin") {
    show("This account is not an administrator.");

    setTimeout(() => {
      location.href = "dashboard.html";
    }, 1800);

    return;
  }

  await Promise.all([
    loadCourses(),
    loadEnrollments()
  ]);
}

/* =========================
   COURSES
========================= */

async function loadCourses() {
  const {
    data,
    error
  } = await db
    .from("courses")
    .select("*")
    .order("name");

  if (error) {
    show(error.message);
    return;
  }

  courses = data || [];

  const box = document.getElementById("admin-courses");

  box.innerHTML = courses.map(course => `
    <div class="admin-row">
      <div>
        <strong>${esc(course.name)}</strong>
        <small>
          ${esc(course.category || "")}
          · R${Number(course.price || 0).toLocaleString("en-ZA")}
          · ${esc(course.duration || "")}
        </small>
      </div>

      <div class="row-actions">
        <button
          class="btn small ghost"
          data-edit="${course.id}">
          Edit
        </button>

        <button
          class="btn small danger"
          data-delete="${course.id}">
          Delete
        </button>
      </div>
    </div>
  `).join("") || "<p>No courses.</p>";

  box.querySelectorAll("[data-edit]").forEach(button => {
    button.onclick = () => {
      const course = courses.find(
        c => c.id === button.dataset.edit
      );

      if (course) fill(course);
    };
  });

  box.querySelectorAll("[data-delete]").forEach(button => {
    button.onclick = () =>
      deleteCourse(button.dataset.delete);
  });
}

async function deleteCourse(id) {
  const course = courses.find(c => c.id === id);

  if (!course) return;

  if (!confirm(`Delete "${course.name}"?`)) {
    return;
  }

  const { error } = await db
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) {
    show(error.message);
    return;
  }

  show("Course deleted.", true);

  await loadCourses();
}

/* =========================
   COURSE FORM
========================= */

document.getElementById("course-form").onsubmit = async event => {
  event.preventDefault();

  const name =
    document.getElementById("course-name").value.trim();

  const payload = {
    name,

    price: Number(
      document.getElementById("course-price").value
    ),

    category:
      document.getElementById("course-category").value.trim(),

    duration:
      document.getElementById("course-duration").value.trim(),

    image_url:
      document.getElementById("course-image").value.trim() || null,

    description:
      document.getElementById("course-description").value.trim(),

    modules:
      document
        .getElementById("course-modules")
        .value
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean),

    active: true,

    updated_at: new Date().toISOString()
  };

  let result;

  if (editingId) {
    result = await db
      .from("courses")
      .update(payload)
      .eq("id", editingId);
  } else {
    result = await db
      .from("courses")
      .insert(payload);
  }

  if (result.error) {
    show(result.error.message);
    return;
  }

  show(
    editingId
      ? "Course updated successfully."
      : "Course added successfully.",
    true
  );

  resetForm();

  await loadCourses();
};

document.getElementById("new-course").onclick = resetForm;

document.getElementById("cancel-edit").onclick = resetForm;

/* =========================
   STUDENT ENROLLMENTS
========================= */

async function loadEnrollments() {
  const box =
    document.getElementById("admin-enrolments");

  const {
    data,
    error
  } = await db
    .from("enrollments")
    .select(`
      id,
      status,
      created_at,
      student_id,
      profiles(full_name),
      courses(name,price)
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    box.innerHTML =
      "<p>Could not load student enrolments.</p>";

    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    box.innerHTML =
      "<p>No enrolment requests yet.</p>";
    return;
  }

  box.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Course</th>
          <th>Price</th>
          <th>Status</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        ${data.map(enrollment => `
          <tr>

            <td>
              ${esc(
                enrollment.profiles?.full_name ||
                "Student"
              )}
            </td>

            <td>
              ${esc(
                enrollment.courses?.name ||
                ""
              )}
            </td>

            <td>
              R${Number(
                enrollment.courses?.price || 0
              ).toLocaleString("en-ZA")}
            </td>

            <td>
              ${esc(enrollment.status)}
            </td>

            <td>
              ${new Date(
                enrollment.created_at
              ).toLocaleDateString("en-ZA")}
            </td>

            <td>

              <select
                data-status="${enrollment.id}"
              >

                <option
                  value="pending"
                  ${enrollment.status === "pending" ? "selected" : ""}
                >
                  Pending
                </option>

                <option
                  value="approved"
                  ${enrollment.status === "approved" ? "selected" : ""}
                >
                  Approved
                </option>

                <option
                  value="completed"
                  ${enrollment.status === "completed" ? "selected" : ""}
                >
                  Completed
                </option>

                <option
                  value="cancelled"
                  ${enrollment.status === "cancelled" ? "selected" : ""}
                >
                  Cancelled
                </option>

              </select>

            </td>

          </tr>
        `).join("")}

      </tbody>
    </table>
  `;

  box.querySelectorAll("[data-status]")
    .forEach(select => {

      select.onchange = async () => {

        const { error } = await db
          .from("enrollments")
          .update({
            status: select.value
          })
          .eq("id", select.dataset.status);

        if (error) {
          show(error.message);
          return;
        }

        show(
          "Enrolment status updated.",
          true
        );
      };

    });
}

/* =========================
   LOGOUT
========================= */

document.getElementById("logout").onclick =
  async () => {

    await db.auth.signOut();

    location.href = "index.html";
  };

/* START */

init(); 
