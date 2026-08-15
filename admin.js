// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
// Results • Certificates
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

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


// ============================================================
// MESSAGE
// ============================================================

function showMessage(text, type = "error") {

  if (!message) return;

  message.textContent = text;
  message.className = "message " + type;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  if (value === null || value === undefined) {
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

  const number = Number(value);

  if (Number.isNaN(number)) {
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

  if (student.full_name) {
    return student.full_name;
  }

  if (student.name) {
    return student.name;
  }

  if (student.student_name) {
    return student.student_name;
  }

  if (student.first_name || student.last_name) {

    return (
      `${student.first_name || ""} ${student.last_name || ""}`
    ).trim();
  }

  if (student.email) {
    return student.email;
  }

  if (student.mobile) {
    return student.mobile;
  }

  if (student.phone) {
    return student.phone;
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
    course.name ||
    course.course_name ||
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

  if (
    course.amount !== null &&
    course.amount !== undefined &&
    course.amount !== ""
  ) {
    return course.amount;
  }

  return null;
}


// ============================================================
// STATUS BADGE
// ============================================================

function statusBadge(status) {

  const clean =
    status ||
    "Pending";

  const lower =
    String(clean).toLowerCase();

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

    /* =========================================
       ADMIN TABLE
       ========================================= */

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
      white-space: normal;
    }

    .funda-admin-table tr:hover {
      background: #fafcfb;
    }


    /* =========================================
       STATUS
       ========================================= */

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


    /* =========================================
       ACTION SELECT
       ========================================= */

    .funda-action-select {
      padding: 9px 12px;
      border: 1px solid #b8c0bc;
      border-radius: 8px;
      background: white;
      font-size: 15px;
      min-width: 125px;
    }


    /* =========================================
       PROOF
       ========================================= */

    .funda-proof-link {
      color: #14804a;
      font-weight: 700;
      text-decoration: none;
    }

    .funda-proof-link:hover {
      text-decoration: underline;
    }


    /* =========================================
       COURSE BUTTONS
       ========================================= */

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


    /* =========================================
       EMPTY / LOADING
       ========================================= */

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


    /* =========================================
       PAYMENT RECORD
       ========================================= */

    .funda-payment-record {
      background: #ffffff;
      border: 1px solid #e5eae7;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 14px;
      box-shadow: 0 4px 14px rgba(0,0,0,.04);
    }

    .funda-payment-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 10px 0;
      border-bottom: 1px solid #edf0ee;
    }

    .funda-payment-row:last-child {
      border-bottom: 0;
    }

    .funda-payment-label {
      font-weight: 700;
      color: #4c5853;
    }

    .funda-payment-value {
      text-align: right;
      overflow-wrap: anywhere;
    }


    /* =========================================
       MOBILE
       ========================================= */

    @media (max-width: 700px) {

      .funda-admin-table-wrap {
        overflow-x: auto;
      }

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

  const {
    data,
    error
  } = await db
    .from("students")
    .select("*")
    .order("id", {
      ascending: false
    });

  if (error) {

    console.error(
      "Students error:",
      error
    );

    studentsBox.innerHTML = `
      <div class="funda-empty">
        <strong>Could not load students.</strong>
        <br><br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

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
            <th>Mobile</th>
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
                    getStudentName(student)
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  student.email ||
                  student.email_address ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.mobile ||
                  student.phone ||
                  student.whatsapp ||
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

  if (!coursesBox) {
    return;
  }

  coursesBox.innerHTML =
    `<div class="funda-loading">
      Loading courses...
    </div>`;

  const {
    data,
    error
  } = await db
    .from("courses")
    .select("*")
    .order("id", {
      ascending: false
    });

  if (error) {

    console.error(
      "Courses error:",
      error
    );

    coursesBox.innerHTML = `
      <div class="funda-empty">
        <strong>Could not load courses.</strong>
        <br><br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

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
            <th>Category</th>
            <th>Duration</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${data.map(course => `

            <tr>

              <td>

                <strong>
                  ${escapeHTML(
                    getCourseName(course)
                  )}
                </strong>

              </td>

              <td>
                ${formatMoney(
                  getCoursePrice(course)
                )}
              </td>

              <td>
                ${escapeHTML(
                  course.category ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  course.duration ||
                  "—"
                )}
              </td>

              <td>

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
//
// The enrollments table DOES NOT contain "amount".
//
// Therefore we only request columns that actually belong
// to the enrolments table.
//
// The amount is taken from the related course price.
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
    .order("enrolled_at", {
      ascending: false
    });


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

        ${escapeHTML(error.message)}

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

  const studentIds = [
    ...new Set(
      enrolments
        .map(row => row.student_id)
        .filter(Boolean)
    )
  ];

  let students = [];


  if (
    studentIds.length > 0
  ) {

    const result =
      await db
        .from("students")
        .select("*")
        .in(
          "id",
          studentIds
        );

    if (!result.error) {

      students =
        result.data || [];
    }
  }


  // ==========================================================
  // GET COURSES
  // ==========================================================

  const courseIds = [
    ...new Set(
      enrolments
        .map(row => row.course_id)
        .filter(Boolean)
    )
  ];

  let courses = [];


  if (
    courseIds.length > 0
  ) {

    const result =
      await db
        .from("courses")
        .select("*")
        .in(
          "id",
          courseIds
        );

    if (!result.error) {

      courses =
        result.data || [];
    }
  }


  // ==========================================================
  // MAP STUDENTS
  // ==========================================================

  const studentMap = {};

  students.forEach(student => {

    studentMap[
      String(student.id)
    ] = student;

  });


  // ==========================================================
  // MAP COURSES
  // ==========================================================

  const courseMap = {};

  courses.forEach(course => {

    courseMap[
      String(course.id)
    ] = course;

  });


  // ==========================================================
  // RENDER
  // ==========================================================

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
              studentMap[
                String(row.student_id)
              ];

            const course =
              courseMap[
                String(row.course_id)
              ];

            const amount =
              getCoursePrice(course);

            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(
                      getStudentName(student)
                    )}
                  </strong>

                </td>

                <td>

                  ${escapeHTML(
                    getCourseName(course)
                  )}

                </td>

                <td>

                  ${formatMoney(amount)}

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
                      '${escapeHTML(row.id)}',
                      this.value
                    )">

                    <option
                      value="Pending"
                      ${String(
                        row.enrollment_status || ""
                      ).toLowerCase() === "pending"
                        ? "selected"
                        : ""}>
                      Pending
                    </option>

                    <option
                      value="Approved"
                      ${String(
                        row.enrollment_status || ""
                      ).toLowerCase() === "approved"
                        ? "selected"
                        : ""}>
                      Approved
                    </option>

                    <option
                      value="Active"
                      ${String(
                        row.enrollment_status || ""
                      ).toLowerCase() === "active"
                        ? "selected"
                        : ""}>
                      Active
                    </option>

                    <option
                      value="Completed"
                      ${String(
                        row.enrollment_status || ""
                      ).toLowerCase() === "completed"
                        ? "selected"
                        : ""}>
                      Completed
                    </option>

                    <option
                      value="Rejected"
                      ${String(
                        row.enrollment_status || ""
                      ).toLowerCase() === "rejected"
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
    .order("created_at", {
      ascending: false
    });


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

        ${escapeHTML(error.message)}

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
  // GET ENROLMENTS FIRST
  //
  // This is important.
  //
  // The payment record contains enrolment_id.
  // The enrolment contains student_id and course_id.
  //
  // Therefore we use the enrolment as the main connection.
  // ==========================================================

  const enrolmentIds = [
    ...new Set(
      payments
        .map(row => row.enrolment_id)
        .filter(Boolean)
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


    if (!result.error) {

      enrolments =
        result.data || [];

    } else {

      console.error(
        "Payment enrolment lookup error:",
        result.error
      );
    }
  }


  // ==========================================================
  // ADD STUDENT IDS FROM BOTH SOURCES
  // ==========================================================

  const allStudentIds = [
    ...new Set(
      [
        ...payments.map(
          row => row.student_id
        ),

        ...enrolments.map(
          row => row.student_id
        )
      ]
      .filter(Boolean)
      .map(id => String(id))
    )
  ];


  let students = [];


  if (
    allStudentIds.length > 0
  ) {

    const result =
      await db
        .from("students")
        .select("*")
        .in(
          "id",
          allStudentIds
        );


    if (!result.error) {

      students =
        result.data || [];

    } else {

      console.error(
        "Payment student lookup error:",
        result.error
      );
    }
  }


  // ==========================================================
  // GET COURSES
  // ==========================================================

  const allCourseIds = [
    ...new Set(
      enrolments
        .map(row => row.course_id)
        .filter(Boolean)
        .map(id => String(id))
    )
  ];


  let courses = [];


  if (
    allCourseIds.length > 0
  ) {

    const result =
      await db
        .from("courses")
        .select("*")
        .in(
          "id",
          allCourseIds
        );


    if (!result.error) {

      courses =
        result.data || [];

    } else {

      console.error(
        "Payment course lookup error:",
        result.error
      );
    }
  }


  // ==========================================================
  // MAP STUDENTS
  // ==========================================================

  const studentMap = {};

  students.forEach(student => {

    studentMap[
      String(student.id)
    ] = student;

  });


  // ==========================================================
  // MAP ENROLMENTS
  // ==========================================================

  const enrolmentMap = {};

  enrolments.forEach(enrolment => {

    enrolmentMap[
      String(enrolment.id)
    ] = enrolment;

  });


  // ==========================================================
  // MAP COURSES
  // ==========================================================

  const courseMap = {};

  courses.forEach(course => {

    courseMap[
      String(course.id)
    ] = course;

  });


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

            <th>Method</th>

            <th>Status</th>

            <th>Proof</th>

            <th>Date</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          ${payments.map(payment => {

            // ------------------------------------------------
            // Find enrolment
            // ------------------------------------------------

            const enrolment =
              enrolmentMap[
                String(
                  payment.enrolment_id
                )
              ];


            // ------------------------------------------------
            // Prefer student from enrolment
            // ------------------------------------------------

            let student = null;


            if (enrolment) {

              student =
                studentMap[
                  String(
                    enrolment.student_id
                  )
                ];
            }


            // ------------------------------------------------
            // Fallback to payment student_id
            // ------------------------------------------------

            if (!student) {

              student =
                studentMap[
                  String(
                    payment.student_id
                  )
                ];
            }


            // ------------------------------------------------
            // Course
            // ------------------------------------------------

            const course =
              enrolment
                ? courseMap[
                    String(
                      enrolment.course_id
                    )
                  ]
                : null;


            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHTML(
                      getStudentName(student)
                    )}
                  </strong>

                </td>

                <td>

                  ${escapeHTML(
                    getCourseName(course)
                  )}

                </td>

                <td>

                  ${formatMoney(
                    payment.amount
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

                  ${
                    payment.proof_url

                    ? `

                      <a
                        class="funda-proof-link"
                        href="${escapeHTML(
                          payment.proof_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer">

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

                <td>

                  <select
                    class="funda-action-select"
                    onchange="changePaymentStatus(
                      '${escapeHTML(payment.id)}',
                      this.value
                    )">

                    <option
                      value="Pending"
                      ${String(
                        payment.status || ""
                      ).toLowerCase() === "pending"
                        ? "selected"
                        : ""}>
                      Pending
                    </option>

                    <option
                      value="Paid"
                      ${String(
                        payment.status || ""
                      ).toLowerCase() === "paid"
                        ? "selected"
                        : ""}>
                      Paid
                    </option>

                    <option
                      value="Approved"
                      ${String(
                        payment.status || ""
                      ).toLowerCase() === "approved"
                        ? "selected"
                        : ""}>
                      Approved
                    </option>

                    <option
                      value="Rejected"
                      ${String(
                        payment.status || ""
                      ).toLowerCase() === "rejected"
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

  courseForm.addEventListener(
    "submit",
    async function(event) {

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
            ? Number(
                coursePrice.value
              )
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


      if (
        courseId &&
        courseId.value
      ) {

        result =
          await db
            .from("courses")
            .update(courseData)
            .eq(
              "id",
              courseId.value
            );

      } else {

        result =
          await db
            .from("courses")
            .insert(
              courseData
            );
      }


      if (result.error) {

        console.error(
          result.error
        );

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

        cancelEdit.style.display =
          "none";
      }


      await loadCourses();

    }
  );
}


// ============================================================
// EDIT COURSE
// ============================================================

async function editCourse(id) {

  const {
    data,
    error
  } = await db
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
    courseId.value =
      data.id || "";
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
      data.amount ||
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

    let modules =
      data.modules ||
      "";

    if (
      Array.isArray(modules)
    ) {

      modules =
        modules.join("\n");
    }

    courseModules.value =
      modules;
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


  const {
    error
  } = await db
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


window.deleteCourse =
  deleteCourse;


// ============================================================
// NEW COURSE
// ============================================================

if (newCourseBtn) {

  newCourseBtn.addEventListener(
    "click",
    () => {

      if (courseForm) {
        courseForm.reset();
      }


      if (courseId) {
        courseId.value = "";
      }


      if (cancelEdit) {

        cancelEdit.style.display =
          "none";
      }


      if (courseForm) {

        courseForm.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    }
  );
}


// ============================================================
// CANCEL EDIT
// ============================================================

if (cancelEdit) {

  cancelEdit.addEventListener(
    "click",
    () => {

      if (courseForm) {
        courseForm.reset();
      }


      if (courseId) {
        courseId.value = "";
      }


      cancelEdit.style.display =
        "none";

    }
  );
}


// ============================================================
// RESULTS
// ============================================================

async function loadResults() {

  if (!resultsBox) {
    return;
  }

  resultsBox.innerHTML = `
    <div class="funda-empty">

      Results management will appear here
      once the results system is connected.

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

  certificatesBox.innerHTML = `
    <div class="funda-empty">

      Certificate management will appear here
      once the certificate system is connected.

    </div>
  `;
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

  addAdminStyles();


  const user =
    await checkAdminLogin();


  if (!user) {
    return;
  }


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
