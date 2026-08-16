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

function showMessage(
  text,
  type = "error"
) {

  if (!message) return;

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

  return "R" +
    number.toFixed(2);
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
    course.name ||
    "Unknown course"
  );
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
    lower === "completed" ||
    lower === "passed"
  ) {
    className =
      "approved";
  }

  if (
    lower === "rejected" ||
    lower === "cancelled" ||
    lower === "failed" ||
    lower === "unpaid"
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
// MODULE HELPERS
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

    .funda-btn-save {
      background: #dff5e7;
      color: #177245;
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
      color: #68746e;
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
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Students error:",
      error
    );

    studentsBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load students.
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
                    getStudentName(student)
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  student.email || "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.mobile_whatsapp || "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.gender || "—"
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

async function getCourses() {

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

  return {
    data: data || [],
    error
  };
}


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
  } = await getCourses();

  if (error) {

    console.error(
      "Courses error:",
      error
    );

    coursesBox.innerHTML = `
      <div class="funda-empty">

        <strong>
          Could not load courses.
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
                    getCourseName(course)
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
                  course.duration || "—"
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
// STUDENT LOOKUP
// IMPORTANT FIX
// ============================================================

async function buildStudentMap(ids) {

  const map = {};

  const cleanIds = [
    ...new Set(
      (ids || [])
        .filter(Boolean)
        .map(id => String(id))
    )
  ];

  if (
    cleanIds.length === 0
  ) {
    return map;
  }

  // ----------------------------------------------------------
  // LOOK UP BY STUDENTS.ID
  // ----------------------------------------------------------

  const byId =
    await db
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
      `)
      .in(
        "id",
        cleanIds
      );

  if (
    !byId.error &&
    byId.data
  ) {

    byId.data.forEach(student => {

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

      if (student.email) {

        map[
          String(student.email)
            .toLowerCase()
        ] = student;

      }

    });
  }

  // ----------------------------------------------------------
  // LOOK UP BY STUDENTS.USER_ID
  // ----------------------------------------------------------

  const missingIds =
    cleanIds.filter(
      id => !map[id]
    );

  if (
    missingIds.length > 0
  ) {

    const byUserId =
      await db
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
        `)
        .in(
          "user_id",
          missingIds
        );

    if (
      !byUserId.error &&
      byUserId.data
    ) {

      byUserId.data.forEach(student => {

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

        if (student.email) {

          map[
            String(student.email)
              .toLowerCase()
          ] = student;

        }

      });
    }
  }

  return map;
}


// ============================================================
// COURSE LOOKUP
// ============================================================

async function buildCourseMap(ids) {

  const map = {};

  const cleanIds = [
    ...new Set(
      (ids || [])
        .filter(Boolean)
        .map(id => String(id))
    )
  ];

  if (
    cleanIds.length === 0
  ) {
    return map;
  }

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
    .in(
      "id",
      cleanIds
    );

  if (
    !error &&
    data
  ) {

    data.forEach(course => {

      map[
        String(course.id)
      ] = course;

    });
  }

  return map;
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

  const studentIds =
    enrolments.map(
      row => row.student_id
    );

  const courseIds =
    enrolments.map(
      row => row.course_id
    );

  const studentMap =
    await buildStudentMap(
      studentIds
    );

  const courseMap =
    await buildCourseMap(
      courseIds
    );

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
                    course?.price
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
                    onchange="changeEnrollmentStatus('${row.id}', this.value)"
                  >

                    <option
                      value="pending"
                      ${
                        String(
                          row.enrollment_status || ""
                        ).toLowerCase() === "pending"
                          ? "selected"
                          : ""
                      }
                    >
                      Pending
                    </option>

                    <option
                      value="approved"
                      ${
                        String(
                          row.enrollment_status || ""
                        ).toLowerCase() === "approved"
                          ? "selected"
                          : ""
                      }
                    >
                      Approved
                    </option>

                    <option
                      value="active"
                      ${
                        String(
                          row.enrollment_status || ""
                        ).toLowerCase() === "active"
                          ? "selected"
                          : ""
                      }
                    >
                      Active
                    </option>

                    <option
                      value="completed"
                      ${
                        String(
                          row.enrollment_status || ""
                        ).toLowerCase() === "completed"
                          ? "selected"
                          : ""
                      }
                    >
                      Completed
                    </option>

                    <option
                      value="rejected"
                      ${
                        String(
                          row.enrollment_status || ""
                        ).toLowerCase() === "rejected"
                          ? "selected"
                          : ""
                      }
                    >
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

  // ----------------------------------------------------------
  // ENROLMENT IDS
  // ----------------------------------------------------------

  const enrolmentIds =
    payments
      .map(
        row => row.enrolment_id
      )
      .filter(Boolean);

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

    }
  }

  // ----------------------------------------------------------
  // STUDENT IDS
  // ----------------------------------------------------------

  const studentIds = [
    ...payments.map(
      row => row.student_id
    ),
    ...enrolments.map(
      row => row.student_id
    )
  ].filter(Boolean);

  const studentMap =
    await buildStudentMap(
      studentIds
    );

  // ----------------------------------------------------------
  // COURSE IDS
  // ----------------------------------------------------------

  const courseIds =
    enrolments.map(
      row => row.course_id
    );

  const courseMap =
    await buildCourseMap(
      courseIds
    );

  // ----------------------------------------------------------
  // ENROLMENT MAP
  // ----------------------------------------------------------

  const enrolmentMap = {};

  enrolments.forEach(row => {

    enrolmentMap[
      String(row.id)
    ] = row;

  });

  // ----------------------------------------------------------
  // RENDER
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

            const enrolment =
              enrolmentMap[
                String(
                  payment.enrolment_id
                )
              ];

            // IMPORTANT:
            // Payment may contain student_id directly,
            // otherwise use the enrolment student_id.

            const studentId =
              payment.student_id ||
              enrolment?.student_id;

            const student =
              studentMap[
                String(studentId)
              ];

            const course =
              courseMap[
                String(
                  enrolment?.course_id
                )
              ];

            const amount =
              payment.amount ??
              course?.price;

            let proof = "—";

            if (
              payment.proof_url
            ) {

              proof = `
                <a
                  class="funda-proof-link"
                  href="${escapeHTML(
                    payment.proof_url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
                    !student
                      ? `
                        <div class="funda-small">
                          Student record not matched
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

                  ${proof}

                </td>

                <td>

                  ${formatDate(
                    payment.created_at
                  )}

                </td>

                <td>

                  <select
                    class="funda-action-select"
                    onchange="changePaymentStatus('${payment.id}', this.value)"
                  >

                    <option
                      value="pending"
                      ${
                        String(
                          payment.status || ""
                        ).toLowerCase() === "pending"
                          ? "selected"
                          : ""
                      }
                    >
                      Pending
                    </option>

                    <option
                      value="paid"
                      ${
                        String(
                          payment.status || ""
                        ).toLowerCase() === "paid"
                          ? "selected"
                          : ""
                      }
                    >
                      Paid
                    </option>

                    <option
                      value="failed"
                      ${
                        String(
                          payment.status || ""
                        ).toLowerCase() === "failed"
                          ? "selected"
                          : ""
                      }
                    >
                      Failed
                    </option>

                    <option
                      value="cancelled"
                      ${
                        String(
                          payment.status || ""
                        ).toLowerCase() === "cancelled"
                          ? "selected"
                          : ""
                      }
                    >
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
// COURSE EDIT
// ============================================================

async function editCourse(id) {

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
// RESET COURSE FORM
// ============================================================

function resetCourseForm() {

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
}


// ============================================================
// NEW COURSE
// ============================================================

if (newCourseBtn) {

  newCourseBtn.addEventListener(
    "click",
    () => {

      resetCourseForm();

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
// CANCEL COURSE EDIT
// ============================================================

if (cancelEdit) {

  cancelEdit.addEventListener(
    "click",
    () => {

      resetCourseForm();

    }
  );
}


// ============================================================
// SAVE COURSE
// ============================================================

if (courseForm) {

  courseForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const title =
        courseName?.value.trim();

      if (!title) {

        showMessage(
          "Please enter the course name.",
          "error"
        );

        return;
      }

      const priceValue =
        coursePrice?.value;

      const price =
        priceValue === ""
          ? null
          : Number(priceValue);

      if (
        priceValue !== "" &&
        Number.isNaN(price)
      ) {

        showMessage(
          "Please enter a valid course price.",
          "error"
        );

        return;
      }

      const modules =
        modulesToArray(
          courseModules?.value
        );

      const payload = {

        title:
          title,

        slug:
          createSlug(title),

        description:
          courseDescription?.value.trim() ||
          null,

        duration:
          courseDuration?.value.trim() ||
          null,

        price:
          price,

        image_url:
          courseImage?.value.trim() ||
          null,

        modules:
          modules,

        active:
          true

      };

      showMessage(
        courseId?.value
          ? "Updating course..."
          : "Creating course...",
        "success"
      );

      let result;

      if (
        courseId?.value
      ) {

        result =
          await db
            .from("courses")
            .update(payload)
            .eq(
              "id",
              courseId.value
            );

      } else {

        result =
          await db
            .from("courses")
            .insert(payload);

      }

      if (result.error) {

        console.error(
          "Course save error:",
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

      resetCourseForm();

      await loadCourses();
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
          Results are not available yet.
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
        No results recorded yet.
      </div>`;

    return;
  }

  const studentIds =
    data.map(
      row =>
        row.student_id
    );

  const courseIds =
    data.map(
      row =>
        row.course_id
    );

  const studentMap =
    await buildStudentMap(
      studentIds
    );

  const courseMap =
    await buildCourseMap(
      courseIds
    );

  resultsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>

            <th>Student</th>
            <th>Course</th>
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
                  row.student_id
                )
              ];

            const course =
              courseMap[
                String(
                  row.course_id
                )
              ];

            const mark =
              row.mark ??
              row.score ??
              row.result ??
              "—";

            const status =
              row.status ||
              (
                typeof mark === "number"
                  ? (
                      mark >= 50
                        ? "Passed"
                        : "Failed"
                    )
                  : "Pending"
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
                    getCourseName(
                      course
                    )
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
                    row.created_at
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
          Certificates are not available yet.
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
        No certificates issued yet.
      </div>`;

    return;
  }

  const studentIds =
    data.map(
      row =>
        row.student_id
    );

  const courseIds =
    data.map(
      row =>
        row.course_id
    );

  const studentMap =
    await buildStudentMap(
      studentIds
    );

  const courseMap =
    await buildCourseMap(
      courseIds
    );

  certificatesBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>

            <th>Student</th>
            <th>Course</th>
            <th>Certificate No.</th>
            <th>Status</th>
            <th>Date</th>

          </tr>

        </thead>

        <tbody>

          ${data.map(row => {

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

            const certificateNumber =
              row.certificate_number ||
              row.certificate_no ||
              row.number ||
              "—";

            const status =
              row.status ||
              "Issued";

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
                    row.created_at
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
// SLUG
// ============================================================

function createSlug(title) {

  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


// ============================================================
// INITIALISE ADMIN
// ============================================================

async function initAdmin() {

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

  console.log(
    "Funda Online Academy admin dashboard loaded."
  );
}


// ============================================================
// START
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  initAdmin
);
