// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
// Results • Certificates
//
// COMPLETE REPLACEMENT FILE
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const message =
  document.getElementById("message");

const adminEmail =
  document.getElementById("admin-email");

const logoutBtn =
  document.getElementById("logout");

const studentsBox =
  document.getElementById("admin-students");

const coursesBox =
  document.getElementById("admin-courses");

const enrolmentsBox =
  document.getElementById("admin-enrolments");

const paymentsBox =
  document.getElementById("admin-payments");

const resultsBox =
  document.getElementById("admin-results");

const certificatesBox =
  document.getElementById("admin-certificates");


// ============================================================
// COURSE FORM ELEMENTS
// ============================================================

const courseForm =
  document.getElementById("course-form");

const courseId =
  document.getElementById("course-id");

const courseName =
  document.getElementById("course-name");

const coursePrice =
  document.getElementById("course-price");

const courseCategory =
  document.getElementById("course-category");

const courseDuration =
  document.getElementById("course-duration");

const courseImage =
  document.getElementById("course-image");

const courseDescription =
  document.getElementById("course-description");

const courseModules =
  document.getElementById("course-modules");

const cancelEdit =
  document.getElementById("cancel-edit");

const newCourseBtn =
  document.getElementById("new-course");


// ============================================================
// MESSAGE
// ============================================================

function showMessage(text, type = "error") {

  if (!message) {
    return;
  }

  message.textContent = text;

  message.className =
    "message " + type;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// DATE
// ============================================================

function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return escapeHTML(value);
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


// ============================================================
// MONEY
// ============================================================

function formatMoney(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return escapeHTML(value);
  }

  return "R" + number.toFixed(2);
}


// ============================================================
// STUDENT NAME
// ============================================================

function getStudentName(student) {

  if (!student) {
    return "Unknown student";
  }

  if (
    student.full_name &&
    String(student.full_name).trim()
  ) {
    return String(
      student.full_name
    ).trim();
  }

  if (
    student.email &&
    String(student.email).trim()
  ) {
    return String(
      student.email
    ).trim();
  }

  if (
    student.mobile_whatsapp &&
    String(student.mobile_whatsapp).trim()
  ) {
    return String(
      student.mobile_whatsapp
    ).trim();
  }

  return "Unknown student";
}


// ============================================================
// COURSE NAME
// ============================================================

function getCourseName(course) {

  if (!course) {
    return "Unknown course";
  }

  return (
    course.title ||
    "Unknown course"
  );
}


// ============================================================
// COURSE PRICE
// ============================================================

function getCoursePrice(course) {

  if (!course) {
    return null;
  }

  if (
    course.price !== null &&
    course.price !== undefined &&
    course.price !== ""
  ) {
    return course.price;
  }

  return null;
}


// ============================================================
// STATUS BADGE
// ============================================================

function statusBadge(status) {

  const clean =
    status || "Pending";

  const lower =
    String(clean).toLowerCase();

  let className =
    "pending";

  if (
    lower === "approved" ||
    lower === "active" ||
    lower === "paid" ||
    lower === "completed"
  ) {
    className =
      "approved";
  }

  if (
    lower === "rejected" ||
    lower === "cancelled" ||
    lower === "failed"
  ) {
    className =
      "rejected";
  }

  return `
    <span class="status-badge ${className}">
      ${escapeHTML(clean)}
    </span>
  `;
}


// ============================================================
// SLUG
// ============================================================

function createSlug(title) {

  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


// ============================================================
// MODULES
// ============================================================

function modulesToArray(value) {

  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}


function modulesToText(value) {

  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join("\n");
  }

  return String(value);
}


// ============================================================
// ADMIN STYLES
// ============================================================

function addAdminStyles() {

  if (
    document.getElementById(
      "funda-admin-extra-styles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "funda-admin-extra-styles";

  style.textContent = `

    .funda-admin-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .funda-admin-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 850px;
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
      vertical-align: middle;
    }

    .funda-admin-table tr:hover {
      background: #fafcfb;
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
      min-width: 125px;
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
      padding: 25px;
      text-align: center;
      color: #69756f;
    }

    .funda-loading {
      padding: 25px;
      text-align: center;
      color: #69756f;
    }

    .funda-small {
      font-size: 13px;
      color: #69756f;
    }

    @media (max-width: 700px) {

      .funda-admin-table {
        min-width: 760px;
      }

      .funda-admin-table th,
      .funda-admin-table td {
        padding: 12px 10px;
      }

      .funda-action-select {
        min-width: 115px;
      }

    }

  `;

  document.head.appendChild(style);
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function checkAdminLogin() {

  const {
    data: { user },
    error
  } = await db.auth.getUser();

  if (error) {

    console.error(
      "Authentication error:",
      error
    );
  }

  if (!user) {

    window.location.href =
      "login.html";

    return null;
  }

  if (adminEmail) {

    adminEmail.textContent =
      user.email ||
      "Administrator";
  }

  return user;
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await db.auth.signOut();

      window.location.href =
        "login.html";
    }
  );
}


// ============================================================
// LOAD ALL STUDENTS
//
// IMPORTANT FIX:
// We create TWO lookup keys:
//
// 1. students.id
// 2. students.user_id
//
// This fixes the "Unknown student" problem when
// enrolments.student_id contains either value.
// ============================================================

async function getAllStudents() {

  const {
    data,
    error
  } = await db
    .from("students")
    .select(`
      id,
      user_id,
      full_name,
      gender,
      south_african_id,
      email,
      mobile_whatsapp,
      address,
      created_at,
      updated_at
    `);

  if (error) {

    console.error(
      "Student lookup error:",
      error
    );

    return {
      students: [],
      map: {},
      error
    };
  }

  const students =
    data || [];

  const map = {};

  students.forEach(student => {

    if (student.id) {

      map[
        String(student.id)
      ] = student;
    }

    if (student.user_id) {

      map[
        String(student.user_id)
      ] = student;
    }

  });

  return {
    students,
    map,
    error: null
  };
}


// ============================================================
// LOAD ALL COURSES
// ============================================================

async function getAllCourses() {

  const {
    data,
    error
  } = await db
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      duration,
      price,
      image_url,
      modules,
      active,
      created_at,
      updated_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Course lookup error:",
      error
    );

    return {
      courses: [],
      map: {},
      error
    };
  }

  const courses =
    data || [];

  const map = {};

  courses.forEach(course => {

    if (course.id) {

      map[
        String(course.id)
      ] = course;
    }

  });

  return {
    courses,
    map,
    error: null
  };
}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

  if (!studentsBox) {
    return;
  }

  studentsBox.innerHTML =
    `<div class="funda-loading">
      Loading students...
    </div>`;

  const result =
    await getAllStudents();

  if (result.error) {

    studentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load students.
        </strong>

        <br><br>

        ${escapeHTML(
          result.error.message
        )}

      </div>
    `;

    return;
  }

  const data =
    result.students;

  if (
    !data ||
    data.length === 0
  ) {

    studentsBox.innerHTML =
      `<div class="funda-empty">
        No students registered yet.
      </div>`;

    return;
  }

  studentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile / WhatsApp</th>
            <th>Gender</th>
            <th>Registration</th>
          </tr>

        </thead>

        <tbody>

          ${data.map(student => `

            <tr>

              <td>
                <strong>
                  ${escapeHTML(
                    getStudentName(
                      student
                    )
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  student.email ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.mobile_whatsapp ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.gender ||
                  "—"
                )}
              </td>

              <td>
                ${formatDate(
                  student.created_at
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

  if (!coursesBox) {
    return;
  }

  coursesBox.innerHTML =
    `<div class="funda-loading">
      Loading courses...
    </div>`;

  const result =
    await getAllCourses();

  if (result.error) {

    coursesBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load courses.
        </strong>

        <br><br>

        ${escapeHTML(
          result.error.message
        )}

      </div>
    `;

    return;
  }

  const data =
    result.courses;

  if (
    !data ||
    data.length === 0
  ) {

    coursesBox.innerHTML =
      `<div class="funda-empty">
        No courses found.
      </div>`;

    return;
  }

  coursesBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>

            <th>Course</th>
            <th>Price</th>
            <th>Duration</th>
            <th>Active</th>
            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          ${data.map(course => `

            <tr>

              <td>

                <strong>
                  ${escapeHTML(
                    getCourseName(
                      course
                    )
                  )}
                </strong>

              </td>

              <td>
                ${formatMoney(
                  course.price
                )}
              </td>

              <td>
                ${escapeHTML(
                  course.duration ||
                  "—"
                )}
              </td>

              <td>

                ${statusBadge(
                  course.active
                    ? "Active"
                    : "Inactive"
                )}

              </td>

              <td>

                <div class="funda-course-actions">

                  <button
                    type="button"
                    class="funda-btn funda-btn-edit"
                    onclick="editCourse('${course.id}')">
                    Edit
                  </button>

                  <button
                    type="button"
                    class="funda-btn funda-btn-delete"
                    onclick="deleteCourse('${course.id}')">
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
// ============================================================

async function loadEnrolments() {

  if (!enrolmentsBox) {
    return;
  }

  enrolmentsBox.innerHTML =
    `<div class="funda-loading">
      Loading enrolments...
    </div>`;

  const {
    data: enrolments,
    error
  } = await db
    .from("enrollments")
    .select(`
      id,
      student_id,
      course_id,
      enrollment_status,
      enrolled_at
    `)
    .order(
      "enrolled_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Enrolments error:",
      error
    );

    enrolmentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load enrolments.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

    return;
  }

  if (
    !enrolments ||
    enrolments.length === 0
  ) {

    enrolmentsBox.innerHTML =
      `<div class="funda-empty">
        No enrolments found.
      </div>`;

    return;
  }


  // ==========================================================
  // GET STUDENTS
  // ==========================================================

  const studentResult =
    await getAllStudents();

  if (studentResult.error) {

    enrolmentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load student information.
        </strong>

        <br><br>

        ${escapeHTML(
          studentResult.error.message
        )}

      </div>
    `;

    return;
  }


  // ==========================================================
  // GET COURSES
  // ==========================================================

  const courseResult =
    await getAllCourses();

  if (courseResult.error) {

    enrolmentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load course information.
        </strong>

        <br><br>

        ${escapeHTML(
          courseResult.error.message
        )}

      </div>
    `;

    return;
  }


  const studentMap =
    studentResult.map;

  const courseMap =
    courseResult.map;


  // ==========================================================
  // RENDER
  // ==========================================================

  enrolmentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>

            <th>Student</th>
            <th>Email</th>
            <th>Course</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          ${enrolments.map(row => {

            /*
             * IMPORTANT:
             * student_id can now match either
             * students.id OR students.user_id.
             */

            const student =
              studentMap[
                String(
                  row.student_id
                )
              ];

            const course =
              courseMap[
                String(
                  row.course_id
                )
              ];

            const amount =
              getCoursePrice(
                course
              );

            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(
                      getStudentName(
                        student
                      )
                    )}
                  </strong>

                </td>

                <td>

                  ${escapeHTML(
                    student?.email ||
                    "—"
                  )}

                </td>

                <td>

                  ${escapeHTML(
                    getCourseName(
                      course
                    )
                  )}

                </td>

                <td>

                  ${formatMoney(
                    amount
                  )}

                </td>

                <td>

                  ${statusBadge(
                    row.enrollment_status
                  )}

                </td>

                <td>

                  ${formatDate(
                    row.enrolled_at
                  )}

                </td>

                <td>

                  <select
                    class="funda-action-select"
                    onchange="changeEnrollmentStatus(
                      '${row.id}',
                      this.value
                    )">

                    <option
                      value="pending"
                      ${String(
                        row.enrollment_status ||
                        ""
                      ).toLowerCase() ===
                      "pending"
                        ? "selected"
                        : ""}>
                      Pending
                    </option>

                    <option
                      value="approved"
                      ${String(
                        row.enrollment_status ||
                        ""
                      ).toLowerCase() ===
                      "approved"
                        ? "selected"
                        : ""}>
                      Approved
                    </option>

                    <option
                      value="active"
                      ${String(
                        row.enrollment_status ||
                        ""
                      ).toLowerCase() ===
                      "active"
                        ? "selected"
                        : ""}>
                      Active
                    </option>

                    <option
                      value="completed"
                      ${String(
                        row.enrollment_status ||
                        ""
                      ).toLowerCase() ===
                      "completed"
                        ? "selected"
                        : ""}>
                      Completed
                    </option>

                    <option
                      value="rejected"
                      ${String(
                        row.enrollment_status ||
                        ""
                      ).toLowerCase() ===
                      "rejected"
                        ? "selected"
                        : ""}>
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

async function changeEnrollmentStatus(
  id,
  status
) {

  showMessage(
    "Updating enrolment...",
    "success"
  );

  const {
    error
  } = await db
    .from("enrollments")
    .update({
      enrollment_status:
        status
    })
    .eq(
      "id",
      id
    );

  if (error) {

    console.error(
      error
    );

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

window.changeEnrollmentStatus =
  changeEnrollmentStatus;


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  if (!paymentsBox) {
    return;
  }

  paymentsBox.innerHTML =
    `<div class="funda-loading">
      Loading payments...
    </div>`;

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
      created_at,
      updated_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Payments error:",
      error
    );

    paymentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load payments.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

    return;
  }

  if (
    !payments ||
    payments.length === 0
  ) {

    paymentsBox.innerHTML =
      `<div class="funda-empty">
        No payments found.
      </div>`;

    return;
  }


  // ==========================================================
  // GET STUDENTS
  // ==========================================================

  const studentResult =
    await getAllStudents();

  if (studentResult.error) {

    paymentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load student information.
        </strong>

        <br><br>

        ${escapeHTML(
          studentResult.error.message
        )}

      </div>
    `;

    return;
  }


  // ==========================================================
  // GET ENROLMENTS
  // ==========================================================

  const enrolmentIds = [
    ...new Set(
      payments
        .map(
          row =>
            row.enrolment_id
        )
        .filter(Boolean)
        .map(
          id =>
            String(id)
        )
    )
  ];

  let enrolments = [];


  if (
    enrolmentIds.length > 0
  ) {

    const result =
      await db
        .from("enrollments")
        .select(`
          id,
          student_id,
          course_id,
          enrollment_status,
          enrolled_at
        `)
        .in(
          "id",
          enrolmentIds
        );

    if (result.error) {

      console.error(
        "Payment enrolment lookup error:",
        result.error
      );

    } else {

      enrolments =
        result.data || [];
    }
  }


  // ==========================================================
  // GET COURSES
  // ==========================================================

  const courseResult =
    await getAllCourses();

  if (courseResult.error) {

    paymentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load course information.
        </strong>

        <br><br>

        ${escapeHTML(
          courseResult.error.message
        )}

      </div>
    `;

    return;
  }


  // ==========================================================
  // MAP ENROLMENTS
  // ==========================================================

  const enrolmentMap = {};

  enrolments.forEach(
    enrolment => {

      enrolmentMap[
        String(
          enrolment.id
        )
      ] = enrolment;

    }
  );


  // ==========================================================
  // RENDER PAYMENTS
  // ==========================================================

  paymentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>

            <th>Student</th>
            <th>Course</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Date</th>
            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          ${payments.map(payment => {

            // ------------------------------------------------
            // FIND ENROLMENT
            // ------------------------------------------------

            const enrolment =
              enrolmentMap[
                String(
                  payment.enrolment_id
                )
              ];


            // ------------------------------------------------
            // FIND STUDENT
            //
            // We check:
            // payment.student_id
            // AND enrolment.student_id
            //
            // The student map supports BOTH:
            // students.id
            // students.user_id
            // ------------------------------------------------

            let student = null;

            if (
              payment.student_id
            ) {

              student =
                studentResult.map[
                  String(
                    payment.student_id
                  )
                ] || null;
            }

            if (
              !student &&
              enrolment &&
              enrolment.student_id
            ) {

              student =
                studentResult.map[
                  String(
                    enrolment.student_id
                  )
                ] || null;
            }


            // ------------------------------------------------
            // FIND COURSE
            // ------------------------------------------------

            const course =
              enrolment
                ? courseResult.map[
                    String(
                      enrolment.course_id
                    )
                  ]
                : null;


            // ------------------------------------------------
            // PAYMENT AMOUNT
            //
            // First use payment.amount.
            // If empty, use course.price.
            // ------------------------------------------------

            let amount =
              payment.amount;

            if (
              amount === null ||
              amount === undefined ||
              amount === ""
            ) {

              amount =
                course
                  ? course.price
                  : null;
            }


            // ------------------------------------------------
            // PROOF
            // ------------------------------------------------

            let proofHTML =
              "—";

            if (
              payment.proof_url
            ) {

              proofHTML = `
                <a
                  class="funda-proof-link"
                  href="${escapeHTML(
                    payment.proof_url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer">
                  View proof
                </a>
              `;
            }


            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(
                      getStudentName(
                        student
                      )
                    )}
                  </strong>

                  ${
                    student?.email
                      ? `
                        <div class="funda-small">
                          ${escapeHTML(
                            student.email
                          )}
                        </div>
                      `
                      : ""
                  }

                </td>


                <td>

                  ${escapeHTML(
                    getCourseName(
                      course
                    )
                  )}

                </td>


                <td>

                  ${formatMoney(
                    amount
                  )}

                </td>


                <td>

                  ${escapeHTML(
                    payment.payment_method ||
                    "—"
                  )}

                </td>


                <td>

                  ${statusBadge(
                    payment.status
                  )}

                </td>


                <td>

                  ${proofHTML}

                </td>


                <td>

                  ${formatDate(
                    payment.created_at
                  )}

                </td>


                <td>

                  <select
                    class="funda-action-select"
                    onchange="changePaymentStatus(
                      '${payment.id}',
                      this.value
                    )">

                    <option
                      value="pending"
                      ${String(
                        payment.status ||
                        ""
                      ).toLowerCase() ===
                      "pending"
                        ? "selected"
                        : ""}>
                      Pending
                    </option>

                    <option
                      value="paid"
                      ${String(
                        payment.status ||
                        ""
                      ).toLowerCase() ===
                      "paid"
                        ? "selected"
                        : ""}>
                      Paid
                    </option>

                    <option
                      value="approved"
                      ${String(
                        payment.status ||
                        ""
                      ).toLowerCase() ===
                      "approved"
                        ? "selected"
                        : ""}>
                      Approved
                    </option>

                    <option
                      value="failed"
                      ${String(
                        payment.status ||
                        ""
                      ).toLowerCase() ===
                      "failed"
                        ? "selected"
                        : ""}>
                      Failed
                    </option>

                    <option
                      value="rejected"
                      ${String(
                        payment.status ||
                        ""
                      ).toLowerCase() ===
                      "rejected"
                        ? "selected"
                        : ""}>
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

async function changePaymentStatus(
  id,
  status
) {

  showMessage(
    "Updating payment...",
    "success"
  );

  const {
    error
  } = await db
    .from("payments")
    .update({
      status:
        status
    })
    .eq(
      "id",
      id
    );

  if (error) {

    console.error(
      error
    );

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

function clearCourseForm() {

  if (courseId) {
    courseId.value = "";
  }

  if (courseName) {
    courseName.value = "";
  }

  if (coursePrice) {
    coursePrice.value = "";
  }

  if (courseCategory) {
    courseCategory.value = "";
  }

  if (courseDuration) {
    courseDuration.value = "";
  }

  if (courseImage) {
    courseImage.value = "";
  }

  if (courseDescription) {
    courseDescription.value = "";
  }

  if (courseModules) {
    courseModules.value = "";
  }

  if (cancelEdit) {
    cancelEdit.style.display =
      "none";
  }
}


// ============================================================
// EDIT COURSE
// ============================================================

async function editCourse(id) {

  showMessage(
    "Loading course...",
    "success"
  );

  const {
    data,
    error
  } = await db
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      duration,
      price,
      image_url,
      modules,
      active
    `)
    .eq(
      "id",
      id
    )
    .single();

  if (error) {

    console.error(
      error
    );

    showMessage(
      "Could not load course: " +
      error.message,
      "error"
    );

    return;
  }

  if (courseId) {
    courseId.value =
      data.id || "";
  }

  if (courseName) {
    courseName.value =
      data.title || "";
  }

  if (coursePrice) {
    coursePrice.value =
      data.price ?? "";
  }

  if (courseDuration) {
    courseDuration.value =
      data.duration || "";
  }

  if (courseImage) {
    courseImage.value =
      data.image_url || "";
  }

  if (courseDescription) {
    courseDescription.value =
      data.description || "";
  }

  if (courseModules) {
    courseModules.value =
      modulesToText(
        data.modules
      );
  }

  if (cancelEdit) {
    cancelEdit.style.display =
      "inline-block";
  }

  if (courseForm) {

    courseForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

  showMessage(
    "Course loaded for editing.",
    "success"
  );
}

window.editCourse =
  editCourse;


// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

  const confirmed =
    window.confirm(
      "Are you sure you want to delete this course?"
    );

  if (!confirmed) {
    return;
  }

  showMessage(
    "Deleting course...",
    "success"
  );

  const {
    error
  } = await db
    .from("courses")
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {

    console.error(
      error
    );

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

window.deleteCourse =
  deleteCourse;


// ============================================================
// SAVE COURSE
// ============================================================

if (courseForm) {

  courseForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const title =
        courseName
          ? courseName.value.trim()
          : "";

      const price =
        coursePrice
          ? coursePrice.value
          : "";

      const duration =
        courseDuration
          ? courseDuration.value.trim()
          : "";

      const image =
        courseImage
          ? courseImage.value.trim()
          : "";

      const description =
        courseDescription
          ? courseDescription.value.trim()
          : "";

      const modules =
        courseModules
          ? modulesToArray(
              courseModules.value
            )
          : [];

      if (!title) {

        showMessage(
          "Please enter a course name.",
          "error"
        );

        return;
      }

      const slug =
        createSlug(title);

      const payload = {

        title:
          title,

        slug:
          slug,

        description:
          description,

        duration:
          duration,

        price:
          price === ""
            ? null
            : Number(price),

        image_url:
          image || null,

        modules:
          modules,

        active:
          true

      };


      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      if (
        courseId &&
        courseId.value
      ) {

        showMessage(
          "Updating course...",
          "success"
        );

        const {
          error
        } = await db
          .from("courses")
          .update(
            payload
          )
          .eq(
            "id",
            courseId.value
          );

        if (error) {

          console.error(
            error
          );

          showMessage(
            "Could not update course: " +
            error.message,
            "error"
          );

          return;
        }

        showMessage(
          "Course updated successfully.",
          "success"
        );

      }


      // --------------------------------------------------------
      // INSERT
      // --------------------------------------------------------

      else {

        showMessage(
          "Adding course...",
          "success"
        );

        const {
          error
        } = await db
          .from("courses")
          .insert(
            payload
          );

        if (error) {

          console.error(
            error
          );

          showMessage(
            "Could not add course: " +
            error.message,
            "error"
          );

          return;
        }

        showMessage(
          "Course added successfully.",
          "success"
        );
      }

      clearCourseForm();

      await loadCourses();

    }
  );
}


// ============================================================
// NEW COURSE BUTTON
// ============================================================

if (newCourseBtn) {

  newCourseBtn.addEventListener(
    "click",
    () => {

      clearCourseForm();

      if (courseName) {
        courseName.focus();
      }

    }
  );
}


// ============================================================
// CANCEL COURSE EDIT
// ============================================================

if (cancelEdit) {

  cancelEdit.addEventListener(
    "click",
    () => {

      clearCourseForm();

      showMessage(
        "Course editing cancelled.",
        "success"
      );

    }
  );
}


// ============================================================
// RESULTS
//
// This section intentionally reads the table dynamically so
// the dashboard can still display the result information even
// when additional result columns are added later.
// ============================================================

async function loadResults() {

  if (!resultsBox) {
    return;
  }

  resultsBox.innerHTML =
    `<div class="funda-loading">
      Loading results...
    </div>`;

  const {
    data,
    error
  } = await db
    .from("results")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Results error:",
      error
    );

    resultsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load results.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

    return;
  }

  if (
    !data ||
    data.length === 0
  ) {

    resultsBox.innerHTML =
      `<div class="funda-empty">
        No results found.
      </div>`;

    return;
  }


  const studentResult =
    await getAllStudents();

  const courseResult =
    await getAllCourses();

  const studentMap =
    studentResult.map;

  const courseMap =
    courseResult.map;


  resultsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Result</th>
            <th>Mark</th>
            <th>Status</th>
            <th>Date</th>
          </tr>

        </thead>

        <tbody>

          ${data.map(row => {

            const student =
              studentMap[
                String(
                  row.student_id ||
                  ""
                )
              ];

            const course =
              courseMap[
                String(
                  row.course_id ||
                  ""
                )
              ];

            const resultValue =
              row.result ||
              row.result_status ||
              row.grade ||
              "—";

            const mark =
              row.mark ??
              row.score ??
              row.percentage ??
              "—";

            const status =
              row.status ||
              "Pending";

            const date =
              row.created_at ||
              row.updated_at;

            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(
                      getStudentName(
                        student
                      )
                    )}
                  </strong>

                </td>

                <td>

                  ${escapeHTML(
                    getCourseName(
                      course
                    )
                  )}

                </td>

                <td>

                  ${escapeHTML(
                    resultValue
                  )}

                </td>

                <td>

                  ${escapeHTML(
                    mark
                  )}

                </td>

                <td>

                  ${statusBadge(
                    status
                  )}

                </td>

                <td>

                  ${formatDate(
                    date
                  )}

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
// CERTIFICATES
// ============================================================

async function loadCertificates() {

  if (!certificatesBox) {
    return;
  }

  certificatesBox.innerHTML =
    `<div class="funda-loading">
      Loading certificates...
    </div>`;

  const {
    data,
    error
  } = await db
    .from("certificates")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Certificates error:",
      error
    );

    certificatesBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load certificates.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

    return;
  }

  if (
    !data ||
    data.length === 0
  ) {

    certificatesBox.innerHTML =
      `<div class="funda-empty">
        No certificates found.
      </div>`;

    return;
  }


  const studentResult =
    await getAllStudents();

  const courseResult =
    await getAllCourses();

  const studentMap =
    studentResult.map;

  const courseMap =
    courseResult.map;


  certificatesBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Certificate Number</th>
            <th>Status</th>
            <th>Date</th>
          </tr>

        </thead>

        <tbody>

          ${data.map(row => {

            const student =
              studentMap[
                String(
                  row.student_id ||
                  ""
                )
              ];

            const course =
              courseMap[
                String(
                  row.course_id ||
                  ""
                )
              ];

            const certificateNumber =
              row.certificate_number ||
              row.certificate_no ||
              row.number ||
              "—";

            const status =
              row.status ||
              "Issued";

            const date =
              row.created_at ||
              row.issued_at ||
              row.updated_at;

            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(
                      getStudentName(
                        student
                      )
                    )}
                  </strong>

                </td>

                <td>

                  ${escapeHTML(
                    getCourseName(
                      course
                    )
                  )}

                </td>

                <td>

                  ${escapeHTML(
                    certificateNumber
                  )}

                </td>

                <td>

                  ${statusBadge(
                    status
                  )}

                </td>

                <td>

                  ${formatDate(
                    date
                  )}

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
// REFRESH EVERYTHING
// ============================================================

async function loadDashboard() {

  await Promise.allSettled([

    loadStudents(),

    loadCourses(),

    loadEnrolments(),

    loadPayments(),

    loadResults(),

    loadCertificates()

  ]);

}


// ============================================================
// INITIALISE
// ============================================================

async function initAdminDashboard() {

  addAdminStyles();

  const user =
    await checkAdminLogin();

  if (!user) {
    return;
  }

  await loadDashboard();

}


// ============================================================
// START
// ============================================================

initAdminDashboard();


// ============================================================
// OPTIONAL GLOBAL REFRESH
// ============================================================

window.refreshAdminDashboard =
  loadDashboard;
