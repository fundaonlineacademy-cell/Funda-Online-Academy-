// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// ------------------------------------------------------------
// ELEMENTS
// ------------------------------------------------------------

const message = document.getElementById("message");
const adminEmail = document.getElementById("admin-email");
const logoutBtn = document.getElementById("logout");

const studentsBox = document.getElementById("admin-students");
const coursesBox = document.getElementById("admin-courses");
const enrolmentsBox = document.getElementById("admin-enrolments");
const paymentsBox = document.getElementById("admin-payments");
const resultsBox = document.getElementById("admin-results");
const certificatesBox = document.getElementById("admin-certificates");

const courseForm = document.getElementById("course-form");
const courseId = document.getElementById("course-id");
const courseName = document.getElementById("course-name");
const coursePrice = document.getElementById("course-price");
const courseCategory = document.getElementById("course-category");
const courseDuration = document.getElementById("course-duration");
const courseImage = document.getElementById("course-image");
const courseDescription = document.getElementById("course-description");
const courseModules = document.getElementById("course-modules");
const cancelEdit = document.getElementById("cancel-edit");
const newCourseBtn = document.getElementById("new-course");


// ------------------------------------------------------------
// MESSAGE
// ------------------------------------------------------------

function showMessage(text, type = "error") {
  if (!message) return;

  message.textContent = text;
  message.className = "message " + type;
}


// ------------------------------------------------------------
// ESCAPE HTML
// ------------------------------------------------------------

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ------------------------------------------------------------
// DATE FORMAT
// ------------------------------------------------------------

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHTML(value);
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


// ------------------------------------------------------------
// MONEY
// ------------------------------------------------------------

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return escapeHTML(value);
  }

  return "R" + number.toFixed(2);
}


// ------------------------------------------------------------
// FIND A NAME FROM DIFFERENT POSSIBLE FIELDS
// ------------------------------------------------------------

function getStudentName(student) {
  if (!student) return "Unknown student";

  return (
    student.full_name ||
    student.name ||
    student.student_name ||
    student.first_name && student.last_name
      ? (
          student.full_name ||
          student.name ||
          student.student_name ||
          `${student.first_name || ""} ${student.last_name || ""}`.trim()
        )
      : student.email ||
        student.mobile ||
        student.phone ||
        "Unknown student"
  );
}


function getCourseName(course) {
  if (!course) return "Unknown course";

  return (
    course.title ||
    course.name ||
    course.course_name ||
    "Unknown course"
  );
}


// ------------------------------------------------------------
// STATUS BADGE
// ------------------------------------------------------------

function statusBadge(status) {
  const clean = String(status || "Pending");

  const lower = clean.toLowerCase();

  let className = "pending";

  if (
    lower === "approved" ||
    lower === "active" ||
    lower === "paid" ||
    lower === "completed"
  ) {
    className = "approved";
  }

  if (
    lower === "rejected" ||
    lower === "cancelled" ||
    lower === "failed"
  ) {
    className = "rejected";
  }

  return `
    <span class="status-badge ${className}">
      ${escapeHTML(clean)}
    </span>
  `;
}


// ------------------------------------------------------------
// MOBILE / DESKTOP ADMIN STYLES
// ------------------------------------------------------------

function addAdminStyles() {

  if (document.getElementById("funda-admin-extra-styles")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "funda-admin-extra-styles";

  style.textContent = `

    .funda-admin-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .funda-admin-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }

    .funda-admin-table th {
      text-align: left;
      padding: 14px 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .funda-admin-table td {
      padding: 14px 12px;
      border-top: 1px solid #e8ece9;
      vertical-align: top;
    }

    .funda-admin-table td,
    .funda-admin-table th {
      word-break: normal;
    }

    .funda-records {
      display: grid;
      gap: 14px;
    }

    .funda-record {
      background: #ffffff;
      border: 1px solid #e5eae7;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 14px rgba(0,0,0,.04);
    }

    .funda-record-row {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      padding: 8px 0;
      border-bottom: 1px solid #edf0ee;
    }

    .funda-record-row:last-child {
      border-bottom: 0;
    }

    .funda-record-label {
      font-weight: 700;
      color: #4c5853;
    }

    .funda-record-value {
      text-align: right;
      color: #17201c;
      max-width: 65%;
      overflow-wrap: anywhere;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 15px;
      border-radius: 999px;
      font-weight: 700;
      white-space: nowrap;
    }

    .status-badge.pending {
      background: #fff3c7;
      color: #995a14;
    }

    .status-badge.approved {
      background: #dff5e7;
      color: #177245;
    }

    .status-badge.rejected {
      background: #fde3e3;
      color: #a52c2c;
    }

    .funda-action-select {
      padding: 9px 12px;
      border: 1px solid #b8c0bc;
      border-radius: 8px;
      background: white;
      font-size: 15px;
    }

    .funda-proof-link {
      color: #14804a;
      font-weight: 700;
      text-decoration: none;
    }

    .funda-proof-link:hover {
      text-decoration: underline;
    }

    .funda-course-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .funda-btn {
      border: 0;
      border-radius: 9px;
      padding: 9px 14px;
      cursor: pointer;
      font-weight: 700;
    }

    .funda-btn-edit {
      background: #e7f1ff;
      color: #1557a0;
    }

    .funda-btn-delete {
      background: #fde5e5;
      color: #a72828;
    }

    .funda-empty {
      padding: 20px;
      text-align: center;
      color: #69756f;
    }

    .funda-loading {
      padding: 20px;
      text-align: center;
      color: #69756f;
    }

    @media (max-width: 700px) {

      .funda-admin-table-wrap {
        overflow-x: visible;
      }

      .funda-admin-table {
        min-width: 0;
      }

      .funda-admin-table thead {
        display: none;
      }

      .funda-admin-table,
      .funda-admin-table tbody,
      .funda-admin-table tr,
      .funda-admin-table td {
        display: block;
        width: 100%;
      }

      .funda-admin-table tr {
        background: #fff;
        border: 1px solid #e5eae7;
        border-radius: 14px;
        margin-bottom: 14px;
        padding: 10px;
      }

      .funda-admin-table td {
        border: 0;
        padding: 9px 6px;
        display: flex;
        justify-content: space-between;
        gap: 15px;
        text-align: right;
      }

      .funda-admin-table td::before {
        content: attr(data-label);
        font-weight: 700;
        text-align: left;
        color: #4c5853;
      }

      .funda-admin-table td > * {
        max-width: 65%;
      }
    }

  `;

  document.head.appendChild(style);
}


// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

async function checkAdminLogin() {

  const {
    data: { user },
    error
  } = await db.auth.getUser();

  if (error) {
    console.error(error);
  }

  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  if (adminEmail) {
    adminEmail.textContent =
      user.email || "Administrator";
  }

  return user;
}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await db.auth.signOut();

    window.location.href = "login.html";

  });

}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

  if (!studentsBox) return;

  studentsBox.innerHTML =
    `<div class="funda-loading">Loading students...</div>`;

  const { data, error } = await db
    .from("students")
    .select("*")
    .order("id", { ascending: false });

  if (error) {

    console.error("Students error:", error);

    studentsBox.innerHTML = `
      <div class="funda-empty">
        Could not load students.<br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {

    studentsBox.innerHTML =
      `<div class="funda-empty">No students registered yet.</div>`;

    return;
  }

  studentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Gender</th>
            <th>Registration</th>
          </tr>
        </thead>

        <tbody>

          ${data.map(student => `

            <tr>

              <td data-label="Name">
                ${escapeHTML(getStudentName(student))}
              </td>

              <td data-label="Email">
                ${escapeHTML(
                  student.email ||
                  student.email_address ||
                  "—"
                )}
              </td>

              <td data-label="Mobile">
                ${escapeHTML(
                  student.mobile ||
                  student.phone ||
                  student.whatsapp ||
                  "—"
                )}
              </td>

              <td data-label="Gender">
                ${escapeHTML(
                  student.gender || "—"
                )}
              </td>

              <td data-label="Registration">
                ${formatDate(
                  student.created_at ||
                  student.registered_at
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
// COURSES
// ============================================================

async function loadCourses() {

  if (!coursesBox) return;

  coursesBox.innerHTML =
    `<div class="funda-loading">Loading courses...</div>`;

  const { data, error } = await db
    .from("courses")
    .select("*")
    .order("id", { ascending: false });

  if (error) {

    console.error("Courses error:", error);

    coursesBox.innerHTML = `
      <div class="funda-empty">
        Could not load courses.<br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {

    coursesBox.innerHTML =
      `<div class="funda-empty">No courses found.</div>`;

    return;
  }

  coursesBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>
          <tr>
            <th>Course</th>
            <th>Price</th>
            <th>Category</th>
            <th>Duration</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${data.map(course => `

            <tr>

              <td data-label="Course">
                <strong>
                  ${escapeHTML(getCourseName(course))}
                </strong>
              </td>

              <td data-label="Price">
                ${formatMoney(
                  course.price ||
                  course.amount
                )}
              </td>

              <td data-label="Category">
                ${escapeHTML(
                  course.category || "—"
                )}
              </td>

              <td data-label="Duration">
                ${escapeHTML(
                  course.duration || "—"
                )}
              </td>

              <td data-label="Action">

                <div class="funda-course-actions">

                  <button
                    class="funda-btn funda-btn-edit"
                    onclick="editCourse('${escapeHTML(course.id)}')">
                    Edit
                  </button>

                  <button
                    class="funda-btn funda-btn-delete"
                    onclick="deleteCourse('${escapeHTML(course.id)}')">
                    Delete
                  </button>

                </div>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;
}


// ============================================================
// ENROLMENTS
//
// IMPORTANT:
// We DO NOT use enrollments.created_at.
// The working field is enrolled_at.
//
// This fixes:
// "column enrolments.created_at does not exist"
// ============================================================

async function loadEnrolments() {

  if (!enrolmentsBox) return;

  enrolmentsBox.innerHTML =
    `<div class="funda-loading">Loading enrolments...</div>`;

  const { data: enrolments, error } = await db
    .from("enrollments")
    .select(`
      id,
      student_id,
      course_id,
      amount,
      enrollment_status,
      enrolled_at
    `)
    .order("enrolled_at", {
      ascending: false
    });

  if (error) {

    console.error("Enrolments error:", error);

    enrolmentsBox.innerHTML = `
      <div class="funda-empty">
        <strong>Could not load enrolments.</strong><br><br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

  if (!enrolments || enrolments.length === 0) {

    enrolmentsBox.innerHTML =
      `<div class="funda-empty">No enrolments found.</div>`;

    return;
  }


  // ----------------------------------------------------------
  // GET STUDENTS
  // ----------------------------------------------------------

  const studentIds = [
    ...new Set(
      enrolments
        .map(row => row.student_id)
        .filter(Boolean)
    )
  ];

  let students = [];

  if (studentIds.length > 0) {

    const result = await db
      .from("students")
      .select("*")
      .in("id", studentIds);

    if (!result.error) {
      students = result.data || [];
    }
  }


  // ----------------------------------------------------------
  // GET COURSES
  // ----------------------------------------------------------

  const courseIds = [
    ...new Set(
      enrolments
        .map(row => row.course_id)
        .filter(Boolean)
    )
  ];

  let courses = [];

  if (courseIds.length > 0) {

    const result = await db
      .from("courses")
      .select("*")
      .in("id", courseIds);

    if (!result.error) {
      courses = result.data || [];
    }
  }


  const studentMap = {};

  students.forEach(student => {
    studentMap[student.id] = student;
  });


  const courseMap = {};

  courses.forEach(course => {
    courseMap[course.id] = course;
  });


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  enrolmentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${enrolments.map(row => {

            const student =
              studentMap[row.student_id];

            const course =
              courseMap[row.course_id];

            return `

              <tr>

                <td data-label="Student">
                  <strong>
                    ${escapeHTML(
                      getStudentName(student)
                    )}
                  </strong>
                </td>

                <td data-label="Course">
                  ${escapeHTML(
                    getCourseName(course)
                  )}
                </td>

                <td data-label="Amount">
                  ${formatMoney(row.amount)}
                </td>

                <td data-label="Status">
                  ${statusBadge(
                    row.enrollment_status
                  )}
                </td>

                <td data-label="Date">
                  ${formatDate(
                    row.enrolled_at
                  )}
                </td>

                <td data-label="Action">

                  <select
                    class="funda-action-select"
                    onchange="changeEnrollmentStatus(
                      '${escapeHTML(row.id)}',
                      this.value
                    )">

                    <option
                      value="Pending"
                      ${String(row.enrollment_status).toLowerCase() === "pending" ? "selected" : ""}>
                      Pending
                    </option>

                    <option
                      value="Approved"
                      ${String(row.enrollment_status).toLowerCase() === "approved" ? "selected" : ""}>
                      Approved
                    </option>

                    <option
                      value="Active"
                      ${String(row.enrollment_status).toLowerCase() === "active" ? "selected" : ""}>
                      Active
                    </option>

                    <option
                      value="Completed"
                      ${String(row.enrollment_status).toLowerCase() === "completed" ? "selected" : ""}>
                      Completed
                    </option>

                    <option
                      value="Rejected"
                      ${String(row.enrollment_status).toLowerCase() === "rejected" ? "selected" : ""}>
                      Rejected
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
}


// ============================================================
// CHANGE ENROLMENT STATUS
// ============================================================

async function changeEnrollmentStatus(id, status) {

  showMessage(
    "Updating enrolment...",
    "success"
  );

  const { error } = await db
    .from("enrollments")
    .update({
      enrollment_status: status
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    showMessage(
      "Could not update enrolment: " +
      error.message,
      "error"
    );

    return;
  }

  showMessage(
    "Enrolment status updated successfully.",
    "success"
  );

  await loadEnrolments();
}


// Make function available to HTML
window.changeEnrollmentStatus =
  changeEnrollmentStatus;


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  if (!paymentsBox) return;

  paymentsBox.innerHTML =
    `<div class="funda-loading">Loading payments...</div>`;

  const { data: payments, error } = await db
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
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error("Payments error:", error);

    paymentsBox.innerHTML = `
      <div class="funda-empty">
        <strong>Could not load payments.</strong><br><br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

  if (!payments || payments.length === 0) {

    paymentsBox.innerHTML =
      `<div class="funda-empty">No payments found.</div>`;

    return;
  }


  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------

  const studentIds = [
    ...new Set(
      payments
        .map(row => row.student_id)
        .filter(Boolean)
    )
  ];

  let students = [];

  if (studentIds.length > 0) {

    const result = await db
      .from("students")
      .select("*")
      .in("id", studentIds);

    if (!result.error) {
      students = result.data || [];
    }
  }


  // ----------------------------------------------------------
  // ENROLMENTS
  // ----------------------------------------------------------

  const enrolmentIds = [
    ...new Set(
      payments
        .map(row => row.enrolment_id)
        .filter(Boolean)
    )
  ];

  let enrolments = [];

  if (enrolmentIds.length > 0) {

    const result = await db
      .from("enrollments")
      .select(`
        id,
        student_id,
        course_id,
        amount,
        enrollment_status,
        enrolled_at
      `)
      .in("id", enrolmentIds);

    if (!result.error) {
      enrolments = result.data || [];
    }
  }


  // ----------------------------------------------------------
  // COURSES
  // ----------------------------------------------------------

  const courseIds = [
    ...new Set(
      enrolments
        .map(row => row.course_id)
        .filter(Boolean)
    )
  ];

  let courses = [];

  if (courseIds.length > 0) {

    const result = await db
      .from("courses")
      .select("*")
      .in("id", courseIds);

    if (!result.error) {
      courses = result.data || [];
    }
  }


  const studentMap = {};

  students.forEach(student => {
    studentMap[student.id] = student;
  });


  const enrolmentMap = {};

  enrolments.forEach(enrolment => {
    enrolmentMap[enrolment.id] = enrolment;
  });


  const courseMap = {};

  courses.forEach(course => {
    courseMap[course.id] = course;
  });


  // ----------------------------------------------------------
  // RENDER PAYMENTS
  // ----------------------------------------------------------

  paymentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Date</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${payments.map(payment => {

            const student =
              studentMap[payment.student_id];

            const enrolment =
              enrolmentMap[payment.enrolment_id];

            const course =
              enrolment
                ? courseMap[enrolment.course_id]
                : null;

            return `

              <tr>

                <td data-label="Student">
                  <strong>
                    ${escapeHTML(
                      getStudentName(student)
                    )}
                  </strong>
                </td>

                <td data-label="Course">
                  ${escapeHTML(
                    getCourseName(course)
                  )}
                </td>

                <td data-label="Amount">
                  ${formatMoney(payment.amount)}
                </td>

                <td data-label="Method">
                  ${escapeHTML(
                    payment.payment_method || "—"
                  )}
                </td>

                <td data-label="Status">
                  ${statusBadge(payment.status)}
                </td>

                <td data-label="Proof">

                  ${
                    payment.proof_url
                    ? `
                      <a
                        class="funda-proof-link"
                        href="${escapeHTML(payment.proof_url)}"
                        target="_blank"
                        rel="noopener noreferrer">
                        View Proof
                      </a>
                    `
                    : "No proof"
                  }

                </td>

                <td data-label="Date">
                  ${formatDate(payment.created_at)}
                </td>

                <td data-label="Action">

                  <select
                    class="funda-action-select"
                    onchange="changePaymentStatus(
                      '${escapeHTML(payment.id)}',
                      this.value
                    )">

                    <option
                      value="Pending"
                      ${String(payment.status).toLowerCase() === "pending" ? "selected" : ""}>
                      Pending
                    </option>

                    <option
                      value="Paid"
                      ${String(payment.status).toLowerCase() === "paid" ? "selected" : ""}>
                      Paid
                    </option>

                    <option
                      value="Approved"
                      ${String(payment.status).toLowerCase() === "approved" ? "selected" : ""}>
                      Approved
                    </option>

                    <option
                      value="Rejected"
                      ${String(payment.status).toLowerCase() === "rejected" ? "selected" : ""}>
                      Rejected
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
}


// ============================================================
// CHANGE PAYMENT STATUS
// ============================================================

async function changePaymentStatus(id, status) {

  showMessage(
    "Updating payment...",
    "success"
  );

  const { error } = await db
    .from("payments")
    .update({
      status: status
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    showMessage(
      "Could not update payment: " +
      error.message,
      "error"
    );

    return;
  }

  showMessage(
    "Payment status updated successfully.",
    "success"
  );

  await loadPayments();
}


window.changePaymentStatus =
  changePaymentStatus;


// ============================================================
// COURSE FORM
// ============================================================

if (courseForm) {

  courseForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    showMessage(
      "Saving course...",
      "success"
    );


    const courseData = {

      title:
        courseName
          ? courseName.value.trim()
          : "",

      price:
        coursePrice
          ? Number(coursePrice.value)
          : 0,

      category:
        courseCategory
          ? courseCategory.value.trim()
          : "",

      duration:
        courseDuration
          ? courseDuration.value.trim()
          : "",

      image:
        courseImage
          ? courseImage.value.trim()
          : "",

      description:
        courseDescription
          ? courseDescription.value.trim()
          : "",

      modules:
        courseModules
          ? courseModules.value.trim()
          : ""

    };


    if (!courseData.title) {

      showMessage(
        "Please enter a course name.",
        "error"
      );

      return;
    }


    let result;


    if (courseId && courseId.value) {

      result = await db
        .from("courses")
        .update(courseData)
        .eq("id", courseId.value);

    } else {

      result = await db
        .from("courses")
        .insert(courseData);

    }


    if (result.error) {

      console.error(result.error);

      showMessage(
        "Could not save course: " +
        result.error.message,
        "error"
      );

      return;
    }


    showMessage(
      "Course saved successfully.",
      "success"
    );


    courseForm.reset();

    if (courseId) {
      courseId.value = "";
    }

    if (cancelEdit) {
      cancelEdit.style.display = "none";
    }

    await loadCourses();

  });

}


// ============================================================
// EDIT COURSE
// ============================================================

async function editCourse(id) {

  const { data, error } = await db
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {

    console.error(error);

    showMessage(
      "Could not load course: " +
      error.message,
      "error"
    );

    return;
  }


  if (courseId) {
    courseId.value = data.id || "";
  }

  if (courseName) {
    courseName.value =
      data.title ||
      data.name ||
      "";
  }

  if (coursePrice) {
    coursePrice.value =
      data.price ||
      "";
  }

  if (courseCategory) {
    courseCategory.value =
      data.category ||
      "";
  }

  if (courseDuration) {
    courseDuration.value =
      data.duration ||
      "";
  }

  if (courseImage) {
    courseImage.value =
      data.image ||
      data.image_url ||
      "";
  }

  if (courseDescription) {
    courseDescription.value =
      data.description ||
      "";
  }

  if (courseModules) {

    let modules = data.modules || "";

    if (Array.isArray(modules)) {
      modules = modules.join("\n");
    }

    courseModules.value = modules;
  }


  if (cancelEdit) {
    cancelEdit.style.display = "inline-block";
  }


  if (courseForm) {

    courseForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


window.editCourse = editCourse;


// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

  const confirmed = window.confirm(
    "Are you sure you want to delete this course?"
  );

  if (!confirmed) return;


  const { error } = await db
    .from("courses")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(error);

    showMessage(
      "Could not delete course: " +
      error.message,
      "error"
    );

    return;
  }


  showMessage(
    "Course deleted successfully.",
    "success"
  );


  await loadCourses();
}


window.deleteCourse = deleteCourse;


// ============================================================
// NEW COURSE
// ============================================================

if (newCourseBtn) {

  newCourseBtn.addEventListener("click", () => {

    if (courseForm) {
      courseForm.reset();
    }

    if (courseId) {
      courseId.value = "";
    }

    if (cancelEdit) {
      cancelEdit.style.display = "none";
    }

    if (courseForm) {

      courseForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  });

}


// ============================================================
// CANCEL COURSE EDIT
// ============================================================

if (cancelEdit) {

  cancelEdit.addEventListener("click", () => {

    if (courseForm) {
      courseForm.reset();
    }

    if (courseId) {
      courseId.value = "";
    }

    cancelEdit.style.display = "none";

  });

}


// ============================================================
// RESULTS
// ============================================================

async function loadResults() {

  if (!resultsBox) return;

  resultsBox.innerHTML = `
    <div class="funda-empty">
      Results management will appear here once the results system is connected.
    </div>
  `;
}


// ============================================================
// CERTIFICATES
// ============================================================

async function loadCertificates() {

  if (!certificatesBox) return;

  certificatesBox.innerHTML = `
    <div class="funda-empty">
      Certificate management will appear here once the certificate system is connected.
    </div>
  `;
}


// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadDashboard() {

  addAdminStyles();

  const user = await checkAdminLogin();

  if (!user) return;


  await Promise.all([

    loadStudents(),

    loadCourses(),

    loadEnrolments(),

    loadPayments(),

    loadResults(),

    loadCertificates()

  ]);

}


// ============================================================
// START
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  loadDashboard
);
