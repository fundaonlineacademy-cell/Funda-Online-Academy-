const { createClient } = supabase;
const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const msg = document.getElementById("message");
let courses = [];
let editingId = null;


// =============================
// MESSAGES
// =============================

function show(message, ok = false) {
  msg.textContent = message;
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


// =============================
// COURSE FORM
// =============================

function resetForm() {
  editingId = null;

  document.getElementById("course-form").reset();
  document.getElementById("course-id").value = "";
}

function fill(course) {
  editingId = course.id;

  document.getElementById("course-id").value = course.id;

  // DATABASE COLUMN IS "title"
  document.getElementById("course-name").value =
    course.title || "";

  document.getElementById("course-price").value =
    course.price || 0;

  document.getElementById("course-category").value =
    course.category || "";

  document.getElementById("course-duration").value =
    course.duration || "";

  document.getElementById("course-image").value =
    course.image_url || "";

  document.getElementById("course-description").value =
    course.description || "";

  document.getElementById("course-modules").value =
    Array.isArray(course.modules)
      ? course.modules.join("\n")
      : "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// =============================
// INITIALISE ADMIN
// =============================

async function init() {

  if (
    !window.SUPABASE_URL ||
    window.SUPABASE_URL.includes("PASTE_")
  ) {
    show(
      "Supabase is not connected yet. Check supabase-config.js."
    );
    return;
  }

  const {
    data: { session },
    error: sessionError
  } = await db.auth.getSession();

  if (sessionError) {
    console.error(sessionError);
    show(sessionError.message);
    return;
  }

  if (!session) {
    location.href = "auth.html";
    return;
  }

  document.getElementById("admin-email").textContent =
    session.user.email || "";


  // =============================
  // CHECK ADMIN ROLE
  // =============================

  const {
    data: profile,
    error: profileError
  } = await db
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error(profileError);
    show(profileError.message);
    return;
  }

  if (profile?.role !== "admin") {

    show(
      "This account is not an administrator."
    );

    setTimeout(() => {
      location.href = "dashboard.html";
    }, 1800);

    return;
  }


  // Load admin information
  await Promise.all([
    loadCourses(),
    loadEnrolments()
  ]);
}


// =============================
// LOAD COURSES
// =============================

async function loadCourses() {

  const {
    data,
    error
  } = await db
    .from("courses")
    .select("*")
    .order("title");

  if (error) {
    console.error(error);
    show(error.message);
    return;
  }

  courses = data || [];

  const box =
    document.getElementById("admin-courses");

  box.innerHTML = courses.map(course => `
    <div class="admin-row">

      <div>

        <strong>
          ${esc(course.title)}
        </strong>

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


  // EDIT BUTTONS

  box.querySelectorAll("[data-edit]")
    .forEach(button => {

      button.onclick = () => {

        const course = courses.find(
          c => c.id === button.dataset.edit
        );

        if (course) {
          fill(course);
        }
      };

    });


  // DELETE BUTTONS

  box.querySelectorAll("[data-delete]")
    .forEach(button => {

      button.onclick = () =>
        deleteCourse(button.dataset.delete);

    });
}


// =============================
// DELETE COURSE
// =============================

async function deleteCourse(id) {

  const course =
    courses.find(c => c.id === id);

  if (!course) return;


  if (
    !confirm(
      `Delete "${course.title}"?`
    )
  ) {
    return;
  }


  const { error } = await db
    .from("courses")
    .delete()
    .eq("id", id);


  if (error) {
    console.error(error);
    show(error.message);
    return;
  }


  show(
    "Course deleted successfully.",
    true
  );

  await loadCourses();
}


// =============================
// SAVE COURSE
// =============================

document.getElementById("course-form").onsubmit =
  async event => {

    event.preventDefault();


    const title =
      document
        .getElementById("course-name")
        .value
        .trim();


    if (!title) {
      show("Please enter a course name.");
      return;
    }


    const payload = {

      // DATABASE COLUMN IS "title"
      title: title,

      price: Number(
        document.getElementById("course-price").value
      ),

      category:
        document
          .getElementById("course-category")
          .value
          .trim(),

      duration:
        document
          .getElementById("course-duration")
          .value
          .trim(),

      image_url:
        document
          .getElementById("course-image")
          .value
          .trim() || null,

      description:
        document
          .getElementById("course-description")
          .value
          .trim(),

      modules:
        document
          .getElementById("course-modules")
          .value
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean),

      active: true,

      updated_at:
        new Date().toISOString()
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

      console.error(result.error);

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


// =============================
// COURSE BUTTONS
// =============================

document.getElementById("new-course").onclick =
  resetForm;

document.getElementById("cancel-edit").onclick =
  resetForm;


// =============================
// LOAD ENROLMENTS
// =============================

async function loadEnrolments() {

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
      courses(title,price)
    `)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    box.innerHTML =
      "<p>Could not load enrolments: " +
      esc(error.message) +
      "</p>";

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

        ${data.map(enrolment => `

          <tr>

            <td>
              ${esc(
                enrolment.profiles?.full_name || ""
              )}
            </td>


            <td>
              ${esc(
                enrolment.courses?.title || ""
              )}
            </td>


            <td>
              R${Number(
                enrolment.courses?.price || 0
              ).toLocaleString("en-ZA")}
            </td>


            <td>
              ${esc(
                enrolment.status || ""
              )}
            </td>


            <td>
              ${new Date(
                enrolment.created_at
              ).toLocaleDateString("en-ZA")}
            </td>


            <td>

              <select
                data-status="${enrolment.id}">

                <option
                  value="pending"
                  ${enrolment.status === "pending" ? "selected" : ""}>
                  Pending
                </option>

                <option
                  value="approved"
                  ${enrolment.status === "approved" ? "selected" : ""}>
                  Approved
                </option>

                <option
                  value="completed"
                  ${enrolment.status === "completed" ? "selected" : ""}>
                  Completed
                </option>

                <option
                  value="cancelled"
                  ${enrolment.status === "cancelled" ? "selected" : ""}>
                  Cancelled
                </option>

              </select>

            </td>

          </tr>

        `).join("")}

      </tbody>

    </table>
  `;


  // STATUS CHANGES

  box.querySelectorAll("[data-status]")
    .forEach(select => {

      select.onchange = async () => {

        const { error } = await db
          .from("enrollments")
          .update({
            status: select.value
          })
          .eq(
            "id",
            select.dataset.status
          );


        if (error) {

          console.error(error);

          show(error.message);

        } else {

          show(
            "Enrolment status updated.",
            true
          );

        }

      };

    });
}


// =============================
// LOGOUT
// =============================

document.getElementById("logout").onclick =
  async () => {

    await db.auth.signOut();

    location.href = "index.html";
  };


// =============================
// START
// =============================

init();
