// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments • Results • Certificates
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

  const fullName =
    student.full_name ||
    student.student_name ||
    student.name ||
    student.fullname ||
    "";

  if (fullName) {
    return fullName;
  }

  const firstName =
    student.first_name ||
    student.firstname ||
    "";

  const lastName =
    student.last_name ||
    student.lastname ||
    "";

  const combined =
    `${firstName} ${lastName}`.trim();

  if (combined) {
    return combined;
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
    course.course_title ||
    "Unknown course"
  );
}


// ============================================================
// GET STUDENT EMAIL
// ============================================================

function getStudentEmail(student) {

  if (!student) {
    return "—";
  }

  return (
    student.email ||
    student.email_address ||
    student.emailAddress ||
    "—"
  );
}


// ============================================================
// GET STUDENT MOBILE
// ============================================================

function getStudentMobile(student) {

  if (!student) {
    return "—";
  }

  return (
    student.mobile ||
    student.phone ||
    student.whatsapp ||
    student.whatsapp_number ||
    student.mobile_number ||
    "—"
  );
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
        flex-shrink: 0;
      }

      .funda-admin-table td > * {
        max-width: 65%;
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
    
