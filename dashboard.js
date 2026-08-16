// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COMPLETE DASHBOARD VERSION
// ============================================================
// Includes:
// - Student authentication
// - Student profile
// - Student name/email
// - My enrolments
// - Available courses
// - Course prices
// - Enrolment
// - Enrolment status
// - Study Course after approval
// - Payment history
// - Payment method
// - Payment status
// - Proof of payment
// - Mobile layout
// - Reduced unnecessary spacing
// - Correct payment course names
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const userNameEl =
  document.getElementById("user-name");

const userEmailEl =
  document.getElementById("user-email");

const enrolmentsEl =
  document.getElementById("enrolments");

const coursesEl =
  document.getElementById("available-courses");

const paymentListEl =
  document.getElementById("payment-list");

const messageEl =
  document.getElementById("message");

const logoutBtn =
  document.getElementById("logout");


// ============================================================
// DASHBOARD STYLE FIX
// ============================================================

function addDashboardFix() {

  if (
    document.getElementById(
      "funda-dashboard-final-fix"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "funda-dashboard-final-fix";

  style.textContent = `

    /* ========================================================
       FUNDA DASHBOARD FINAL MOBILE FIX
       ======================================================== */

    html,
    body {
      overflow-x: hidden !important;
    }

    .dashboard {
      width: 100% !important;
    }

    .dashboard .wrap {
      width: 100% !important;
      max-width: 1200px !important;
      box-sizing: border-box !important;
    }


    /* ========================================================
       REDUCE LARGE EMPTY SPACES
       ======================================================== */

    .dashboard-section,
    .dashboard section,
    main.dashboard section {
      margin-top: 0 !important;
      margin-bottom: 28px !important;
    }

    .dash-head {
      margin-bottom: 22px !important;
    }

    .dash-head h1 {
      margin-bottom: 8px !important;
    }

    .dashboard section h2 {
      margin-top: 0 !important;
      margin-bottom: 14px !important;
    }


    /* ========================================================
       GRID
       ======================================================== */

    #enrolments,
    #available-courses,
    .grid3 {
      display: grid !important;
      grid-template-columns:
        repeat(auto-fit, minmax(280px, 1fr)) !important;

      gap: 16px !important;

      width: 100% !important;
      max-width: 100% !important;

      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }


    /* ========================================================
       CARDS
       ======================================================== */

    #enrolments .card,
    #available-courses .card,
    #payment-list .card,
    .funda-enrolment-card,
    .funda-course-card,
    .funda-payment-card {

      width: 100% !important;
      max-width: 100% !important;

      min-width: 0 !important;

      box-sizing: border-box !important;
    }


    /* ========================================================
       PAYMENT LIST
       ======================================================== */

    #payment-list {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
    }


    .funda-payment-wrapper {
      display: flex !important;
      flex-direction: column !important;
      gap: 14px !important;
      margin-top: 10px !important;
    }


    .funda-payment-card {
      margin: 0 !important;
      padding: 22px !important;
    }


    /* ========================================================
       PAYMENT INFORMATION
       ======================================================== */

    .funda-info-line {
      margin: 8px 0 !important;
      line-height: 1.45 !important;
    }

    .funda-info-line strong {
      margin-right: 5px;
    }


    /* ========================================================
       STATUS
       ======================================================== */

    .funda-status {
      display: inline-block !important;

      padding: 8px 16px !important;

      border-radius: 999px !important;

      font-weight: 700 !important;

      margin-bottom: 10px !important;

      text-transform: capitalize !important;
    }


    .funda-status.pending {
      background: #fff1c7 !important;
      color: #8a6500 !important;
    }


    .funda-status.approved,
    .funda-status.active,
    .funda-status.paid {
      background: #dff4dc !important;
      color: #197019 !important;
    }


    .funda-status.rejected,
    .funda-status.failed {
      background: #fde8e8 !important;
      color: #a51d1d !important;
    }


    /* ========================================================
       PROOF OF PAYMENT
       ======================================================== */

    .funda-payment-proof {
      margin-top: 14px !important;
    }


    .funda-payment-proof .btn {
      display: inline-block !important;
      margin-top: 4px !important;
    }


    /* ========================================================
       BUTTONS
       ======================================================== */

    .funda-action-row {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      margin-top: 14px !important;
    }


    .funda-action-row .btn {
      min-width: 150px;
    }


    /* ========================================================
       MOBILE
       ======================================================== */

    @media (max-width: 700px) {

      .dashboard .wrap {
        width: 100% !important;

        padding-left: 16px !important;
        padding-right: 16px !important;

        box-sizing: border-box !important;
      }


      .dashboard-section,
      .dashboard section,
      main.dashboard section {
        margin-top: 0 !important;
        margin-bottom: 24px !important;
      }


      .dash-head {
        margin-bottom: 18px !important;
      }


      #enrolments,
      #available-courses,
      .grid3 {
        grid-template-columns:
          1fr !important;

        gap: 14px !important;
      }


      .funda-action-row {
        flex-direction: column !important;
      }


      .funda-action-row .btn {
        width: 100% !important;
        min-width: 0 !important;
      }


      .funda-payment-card {
        padding: 20px !important;
      }

    }

  `;

  document.head.appendChild(style);
}

addDashboardFix();


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
  text,
  success = false
) {

  if (!messageEl) {
    return;
  }

  messageEl.textContent =
    text;

  messageEl.className =
    "message " +
    (
      success
        ? "success"
        : "error"
    );
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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// MONEY
// ============================================================

function formatMoney(amount) {

  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "R0.00";
  }

  const number =
    Number(amount);

  if (
    Number.isNaN(number)
  ) {
    return "R0.00";
  }

  return (
    "R" +
    number.toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );
}


// ============================================================
// DATE
// ============================================================

function formatDate(date) {

  if (!date) {
    return "—";
  }

  const d =
    new Date(date);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "—";
  }

  return d.toLocaleDateString(
    "en-ZA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  );
}


// ============================================================
// STATUS
// ============================================================

function normaliseStatus(status) {

  if (!status) {
    return "pending";
  }

  return String(status)
    .trim()
    .toLowerCase();
}


// ============================================================
// CURRENT USER
// ============================================================

async function getCurrentUser() {

  try {

    const {
      data,
      error
    } =
      await db.auth.getUser();

    if (error) {

      console.error(
        "Authentication error:",
        error
      );

      return null;
    }

    return data?.user || null;

  } catch (error) {

    console.error(
      "Unexpected authentication error:",
      error
    );

    return null;
  }
}


// ============================================================
// GET STUDENT
// ============================================================

async function getStudent(
  userId
) {

  const {
    data,
    error
  } =
    await db
      .from("students")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  if (error) {

    console.error(
      "Student lookup error:",
      error
    );

    throw error;
  }

  return data;
}


// ============================================================
// STUDENT HEADER
// ============================================================

function loadStudentHeader(
  student,
  user
) {

  const name =
    student?.full_name ||
    student?.name ||
    user?.user_metadata?.full_name ||
    "Student";


  if (userNameEl) {

    userNameEl.textContent =
      name;
  }


  if (userEmailEl) {

    userEmailEl.textContent =
      user?.email || "";
  }
}


// ============================================================
// LOAD ENROLMENTS
// ============================================================

async function loadEnrolments(
  studentId
) {

  if (!enrolmentsEl) {
    return;
  }

  enrolmentsEl.innerHTML = `
    <p class="loading">
      Loading enrolments…
    </p>
  `;


  try {

    const {
      data: enrolments,
      error
    } =
      await db
        .from("enrollments")
        .select("*")
        .eq(
          "student_id",
          studentId
        )
        .order(
          "enrolled_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !enrolments ||
      enrolments.length === 0
    ) {

      enrolmentsEl.innerHTML = `
        <div class="card funda-enrolment-card">

          <h3>
            No enrolments yet
          </h3>

          <p>
            You have not enrolled in a
            course yet.
          </p>

          <p>
            Browse the available courses
           
