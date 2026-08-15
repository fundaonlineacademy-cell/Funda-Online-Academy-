// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments
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
// MESSAGES
// ============================================================

function show(message, ok = false) {

  if (!msg) return;

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


function formatDate(date) {

  if (!date) return "";

  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

}


// ============================================================
// COURSE FORM
// ============================================================

function resetForm() {

  editingId = null;

  const form = document.getElementById("course-form");

  if (form) {
    form.reset();
  }

  const id = document.getElementById("course-id");

  if (id) {
    id.value = "";
  }

  const button = document.querySelector(
    "#course-form button[type='submit']"
  );

  if (button) {
    button.textContent = "Save Course";
  }

}


function fill(course) {

  editingId = course.id;

  const id = document.getElementById("course-id");
  const name = document.getElementById("course-name");
  const price = document.getElementById("course-price");
  const category = document.getElementById("course-category");
  const duration = document.getElementById("course-duration");
  const image = document.getElementById("course-image");
  const description = document.getElementById("course-description");
  const modules = document.getElementById("course-modules");

  if (id) id.value = course.id;
  if (name) name.value = course.title || "";
  if (price) price.value = course.price || 0;
  if (category) category.value = course.category || "";
  if (duration) duration.value = course.duration || "";
  if (image) image.value = course.image_url || "";
  if (description) description.value = course.description || "";

  if (modules) {

    modules.value =
      Array.isArray(course.modules)
        ? course.modules.join("\n")
        : "";

  }

  const button = document.querySelector(
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
  } = await db.auth.getSession();


  if (sessionError) {

    console.error(sessionError);

    show(sessionError.message);

    return;
  }


  if (!session) {

    window.location.href = "auth.html";

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


  if (!profile || profile.role !== "admin") {

    show(
      "This account is not authorised as an administrator."
    );

    setTimeout(() => {

      window.location.href = "dashboard.html";

    }, 1800);

    return;
  }


  // ==========================================================
  // LOAD ADMIN DATA
  // ==========================================================

  await Promise.all([
    loadStudents(),
    loadCourses(),
    loadEnrolments(),
    loadPayments()
  ]);

}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

  const box =
    document.getElementById("admin-students");

  if (!box) return;

  box.innerHTML =
    "<p>Loading registered students...</p>";


  const {
    data,
    error
  } = await db
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
        <br>
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
          Students will appear here after they create
          an account.
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

        const gender =
          student.gender ||
          "Not provided";

        const idNumber =
          student.id_number ||
          "Not provided";

        const email =
          student.email ||
          "Not provided";

        const phone =
          student.phone ||
          "Not provided";

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
                  ${esc(student.role || "student")}
                </span>

              </div>

            </div>

            <div class="student-details">

              <div class="student-detail">

                <span class="detail-label">
                  Gender
                </span>

                <strong>
                  ${esc(gender)}
                </strong>

              </div>

              <div class="student-detail sensitive">

                <span class="detail-label">
                  South African ID Number
                </span>

                <strong>
                  ${esc(idNumber)}
                </strong>

              </div>

              <div class="student-detail">

                <span class="detail-label">
                  Email
                </span>

                <strong>
                  ${esc(email)}
                </strong>

              </div>

              <div class="student-detail">

                <span class="detail-label">
                  WhatsApp / Mobile
                </span>

                <strong>
                  ${esc(phone)}
                </strong>

              </div>

              <div class="student-detail">

                <span class="detail-label">
                  Registered
                </span>

                <strong>
                  ${formatDate(student.created_at)}
                </strong>

              </div>

            </div>

          </div>

        `;

      }).join("")}

    </div>

  `;


  if (!document.getElementById("student-mobile-style")) {

    const style =
      document.createElement("style");

    style.id =
      "student-mobile-style";

    style.textContent = `

      .student-list {
        display: grid;
        gap: 18px;
        width: 100%;
      }

      .student-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 4px 14px rgba(0,0,0,.05);
      }

      .student-card-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
        padding-bottom: 14px;
        border-bottom: 1px solid #edf2f7;
      }

      .student-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #f0fdf4;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
        flex-shrink: 0;
      }

      .student-card h3 {
        margin: 0 0 5px;
        font-size: 19px;
        color: #0f172a;
      }

      .student-role {
        display: inline-block;
        background: #e8f5e9;
        color: #166534;
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: bold;
        text-transform: capitalize;
      }

      .student-details {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .student-detail {
        padding: 11px 12px;
        background: #f8fafc;
        border-radius: 9px;
      }

      .detail-label {
        display: block;
        color: #64748b;
        font-size: 12px;
        margin-bottom: 4px;
        font-weight: 600;
      }

      .student-detail strong {
        display: block;
        color: #0f172a;
        font-size: 14px;
        word-break: break-word;
      }

      .student-detail.sensitive {
        background: #fffaf0;
      }

      .empty-state {
        padding: 25px;
        text-align: center;
        color: #64748b;
      }

      .admin-error {
        padding: 18px;
        border-radius: 10px;
        background: #fef2f2;
        color: #991b1b;
      }

      @media (min-width: 700px) {

        .student-details {
          grid-template-columns: 1fr 1fr;
        }

      }

    `;

    document.head.appendChild(style);

  }

}


// ============================================================
// COURSES
// ============================================================

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

  if (!box) return;


  box.innerHTML = courses.map(course => `

    <div class="admin-row">

      <div>

        <strong>
          ${esc(course.title)}
        </strong>

        <small>
          ${esc(course.category || "")}
          · R${Number(
            course.price || 0
          ).toLocaleString("en-ZA")}
          · ${esc(course.duration || "")}
        </small>

      </div>

      <div class="row-actions">

        <button
          type="button"
          class="btn small ghost"
          data-edit="${course.id}">
          Edit
        </button>

        <button
          type="button"
          class="btn small danger"
          data-delete="${course.id}">
          Delete
        </button>

      </div>

    </div>

  `).join("") || "<p>No courses available.</p>";


  box.querySelectorAll("[data-edit]")
    .forEach(button => {

      button.onclick = () => {

        const course =
          courses.find(
            c => c.id === button.dataset.edit
          );

        if (course) {
          fill(course);
        }

      };

    });


  box.querySelectorAll("[data-delete]")
    .forEach(button => {

      button.onclick = () => {

        deleteCourse(
          button.dataset.delete
        );

      };

    });

}


// ============================================================
// DELETE COURSE
// ============================================================

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


  const { error } =
    await db
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


// ============================================================
// SAVE COURSE
// ============================================================

const courseForm =
  document.getElementById("course-form");


if (courseForm) {

  courseForm.onsubmit =
    async event => {

      event.preventDefault();


      const title =
        document
          .getElementById("course-name")
          .value
          .trim();


      if (!title) {

        show(
          "Please enter a course name."
        );

        return;
      }


      const payload = {

        title: title,

        price: Number(
          document
            .getElementById("course-price")
            .value
        ) || 0,

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

        result =
          await db
            .from("courses")
            .update(payload)
            .eq("id", editingId);

      } else {

        result =
          await db
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

}


// ============================================================
// COURSE BUTTONS
// ============================================================

const newCourse =
  document.getElementById("new-course");


if (newCourse) {
  newCourse.onclick = resetForm;
}


const cancelEdit =
  document.getElementById("cancel-edit");


if (cancelEdit) {
  cancelEdit.onclick = resetForm;
}


// ============================================================
// ENROLMENTS
// IMPORTANT:
// Your database uses enrollment_status,
// NOT status.
// We also DO NOT join profiles directly.
// ============================================================

async function loadEnrolments() {

  const box =
    document.getElementById("admin-enrolments");


  if (!box) return;


  box.innerHTML =
    "<p>Loading student enrolments...</p>";


  // ----------------------------------------------------------
  // LOAD ENROLMENTS
  // ----------------------------------------------------------

  const {
    data: enrolments,
    error: enrolmentError
  } = await db
    .from("enrollments")
    .select(`
      id,
      student_id,
      course_id,
      enrollment_status,
      created_at,
      courses(title,price)
    `)
    .order("created_at", {
      ascending: false
    });


  if (enrolmentError) {

    console.error(
      "Enrolment loading error:",
      enrolmentError
    );

    box.innerHTML = `
      <div class="admin-error">
        <strong>Could not load enrolments.</strong>
        <br>
        ${esc(enrolmentError.message)}
      </div>
    `;

    return;
  }


  if (!enrolments || enrolments.length === 0) {

    box.innerHTML =
      "<p>No enrolment requests yet.</p>";

    return;
  }


  // ----------------------------------------------------------
  // GET STUDENT IDs
  // ----------------------------------------------------------

  const studentIds = [
    ...new Set(
      enrolments
        .map(e => e.student_id)
        .filter(Boolean)
    )
  ];


  let students = [];


  if (studentIds.length > 0) {

    const {
      data,
      error
    } = await db
      .from("students")
      .select(`
        id,
        user_id
      `)
      .in("id", studentIds);


    if (error) {

      console.error(
        "Student relationship error:",
        error
      );

    } else {

      students = data || [];

    }

  }


  // ----------------------------------------------------------
  // GET PROFILE INFORMATION
  // ----------------------------------------------------------

  const userIds = [
    ...new Set(
      students
        .map(s => s.user_id)
        .filter(Boolean)
    )
  ];


  let profiles = [];


  if (userIds.length > 0) {

    const {
      data,
      error
    } = await db
      .from("profiles")
      .select(`
        id,
        full_name,
        email
      `)
      .in("id", userIds);


    if (error) {

      console.error(
        "Profile loading error:",
        error
      );

    } else {

      profiles = data || [];

    }

  }


  // ----------------------------------------------------------
  // CREATE LOOKUP
  // ----------------------------------------------------------

  const studentLookup = {};


  students.forEach(student => {

    const profile =
      profiles.find(
        p => p.id === student.user_id
      );


    studentLookup[student.id] = {

      name:
        profile?.full_name ||
        profile?.email ||
        "Student",

      email:
        profile?.email ||
        ""

    };

  });


  // ----------------------------------------------------------
  // DISPLAY ENROLMENTS
  // ----------------------------------------------------------

  box.innerHTML = `

    <div style="overflow-x:auto; width:100%;">

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

          ${enrolments.map(enrolment => {

            const student =
              studentLookup[enrolment.student_id] || {};

            const studentName =
              student.name ||
              "Student";

            const courseName =
              enrolment.courses?.title ||
              "Course";

            const price =
              enrolment.courses?.price || 0;

            const status =
              enrolment.enrollment_status ||
              "pending";


            return `

              <tr>

                <td>
                  ${esc(studentName)}
                </td>

                <td>
                  ${esc(courseName)}
                </td>

                <td>
                  R${Number(
                    price
                  ).toLocaleString("en-ZA")}
                </td>

                <td>

                  <span class="enrolment-status ${esc(status)}">
                    ${esc(status)}
                  </span>

                </td>

                <td>
                  ${formatDate(
                    enrolment.created_at
                  )}
                </td>

                <td>

                  <select
                    data-status="${enrolment.id}"
                  >

                    <option
                      value="pending"
                      ${
                        status === "pending"
                          ? "selected"
                          : ""
                      }>
                      Pending
                    </option>

                    <option
                      value="approved"
                      ${
                        status === "approved"
                          ? "selected"
                          : ""
                      }>
                      Approved
                    </option>

                    <option
                      value="completed"
                      ${
                        status === "completed"
                          ? "selected"
                          : ""
                      }>
                      Completed
                    </option>

                    <option
                      value="cancelled"
                      ${
                        status === "cancelled"
                          ? "selected"
                          : ""
                      }>
                      Cancelled
                    </option>

                  </select>

                </td>

              </tr>

            `;

          }).join("")}

        </tbody>

      </table>

    </div>

  `;


  // ----------------------------------------------------------
  // STATUS UPDATES
  // IMPORTANT: UPDATE enrollment_status
  // ----------------------------------------------------------

  box.querySelectorAll("[data-status]")
    .forEach(select => {

      select.onchange =
        async () => {

          const newStatus =
            select.value;

          const enrolmentId =
            select.dataset.status;


          const {
            error
          } = await db
            .from("enrollments")
            .update({

              enrollment_status:
                newStatus

            })
            .eq(
              "id",
              enrolmentId
            );


          if (error) {

            console.error(error);

            show(
              "Could not update enrolment: " +
              error.message
            );

          } else {

            show(
              "Enrolment status updated successfully.",
              true
            );

            await loadEnrolments();

          }

        };

    });

}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  const box =
    document.getElementById("admin-payments");


  if (!box) return;


  box.innerHTML =
    "<p>Loading payment records...</p>";


  const {
    data: payments,
    error
  } = await db
    .from("payments")
    .select(`
      id,
      student_id,
      enrolment_id,
      amount,
      payment_method,
      status,
      proof_url,
      notes,
      created_at
    `)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Payment loading error:",
      error
    );

    box.innerHTML = `
      <div class="admin-error">
        <strong>Could not load payments.</strong>
        <br>
        ${esc(error.message)}
      </div>
    `;

    return;
  }


  if (!payments || payments.length === 0) {

    box.innerHTML =
      "<p>Payment records will appear here.</p>";

    return;
  }


  box.innerHTML = `

    <div style="overflow-x:auto; width:100%;">

      <table>

        <thead>

          <tr>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Date</th>
          </tr>

        </thead>

        <tbody>

          ${payments.map(payment => `

            <tr>

              <td>
                R${Number(
                  payment.amount || 0
                ).toLocaleString("en-ZA")}
              </td>

              <td>
                ${esc(
                  payment.payment_method || ""
                )}
              </td>

              <td>

                <span class="payment-status">
                  ${esc(
                    payment.status || "pending"
                  )}
                </span>

              </td>

              <td>

                ${
                  payment.proof_url
                    ? `
                      <a
                        href="${esc(payment.proof_url)}"
                        target="_blank"
                        rel="noopener">
                        View Proof
                      </a>
                    `
                    : "No proof"
                }

              </td>

              <td>
                ${formatDate(
                  payment.created_at
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;

}


// ============================================================
// LOGOUT
// ============================================================

const logout =
  document.getElementById("logout");


if (logout) {

  logout.onclick =
    async () => {

      await db.auth.signOut();

      window.location.href =
        "index.html";

    };

}


// ============================================================
// START
// ============================================================

init();
