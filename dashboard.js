// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ============================================================
// COMPLETE VERSION
//
// Features:
// - Student authentication
// - Student profile
// - Student name/email
// - My enrolments
// - Available courses
// - Course prices
// - Enrolment
// - Enrolment status
// - Study Course button after approval
// - Payment history
// - Payment method
// - Payment status
// - Proof of payment
// - Safe logout
// - Mobile-friendly dashboard
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
// MOBILE / DASHBOARD FIX
// ============================================================

function addDashboardMobileFix() {

  if (document.getElementById(
    "funda-dashboard-mobile-fix"
  )) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "funda-dashboard-mobile-fix";

  style.textContent = `

    /* =========================================
       FUNDA DASHBOARD MOBILE FIX
       ========================================= */

    .dashboard-section,
    main.dashboard section {
      margin-bottom: 35px !important;
    }

    .grid3 {
      display: grid !important;
      grid-template-columns:
        repeat(auto-fit, minmax(280px, 1fr)) !important;
      gap: 20px !important;
      width: 100% !important;
    }

    .grid3 .card {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .dashboard .card {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .dash-head {
      margin-bottom: 35px !important;
    }

    .dash-head h1 {
      margin-bottom: 12px !important;
    }

    .dashboard section {
      margin-top: 30px !important;
    }

    .dashboard section h2 {
      margin-bottom: 18px !important;
    }

    .funda-payment-card,
    .funda-enrolment-card,
    .funda-course-card {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }

    .funda-action-row {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      margin-top: 18px !important;
    }

    .funda-action-row .btn {
      min-width: 150px;
    }

    .funda-status {
      display: inline-block;
      padding: 9px 16px;
      border-radius: 999px;
      font-weight: 700;
      margin-bottom: 15px;
      text-transform: capitalize;
    }

    .funda-status.pending {
      background: #eaf7e5;
      color: #26751d;
    }

    .funda-status.approved,
    .funda-status.active,
    .funda-status.paid {
      background: #dff4dc;
      color: #197019;
    }

    .funda-status.rejected,
    .funda-status.failed {
      background: #fde8e8;
      color: #a51d1d;
    }

    .funda-info-line {
      margin: 10px 0;
      line-height: 1.5;
    }

    .funda-info-line strong {
      margin-right: 5px;
    }

    .funda-payment-proof {
      margin-top: 18px;
    }

    .funda-payment-proof a {
      display: inline-block;
    }

    @media (max-width: 700px) {

      .grid3 {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }

      .dashboard .wrap {
        width: 100%;
        padding-left: 20px;
        padding-right: 20px;
      }

      .dash-head {
        display: block !important;
      }

      .dash-head .btn {
        margin-top: 18px;
      }

      .funda-action-row {
        flex-direction: column !important;
      }

      .funda-action-row .btn {
        width: 100% !important;
      }

      .dashboard section {
        margin-top: 25px !important;
        margin-bottom: 30px !important;
      }

    }

  `;

  document.head.appendChild(style);
}

addDashboardMobileFix();

// ============================================================
// MESSAGE
// ============================================================

function showMessage(
  text,
  success = false
) {

  if (!messageEl) return;

  messageEl.textContent = text;

  messageEl.className =
    "message " +
    (success ? "success" : "error");
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
// GET CURRENT USER
// ============================================================

async function getCurrentUser() {

  try {

    const {
      data,
      error
    } = await db.auth.getUser();

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

async function getStudent(userId) {

  const {
    data,
    error
  } = await db
    .from("students")
    .select("*")
    .eq("user_id", userId)
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

  enrolmentsEl.innerHTML =
    `<p class="loading">
      Loading enrolments…
    </p>`;

  try {

    const {
      data: enrolments,
      error
    } = await db
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
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
            below to get started.
          </p>

        </div>
      `;

      return;
    }

    // ========================================================
    // COURSE IDS
    // ========================================================

    const courseIds = [
      ...new Set(
        enrolments
          .map(
            item => item.course_id
          )
          .filter(Boolean)
      )
    ];

    let courses = [];

    if (
      courseIds.length > 0
    ) {

      const {
        data,
        error: courseError
      } = await db
        .from("courses")
        .select("*")
        .in(
          "id",
          courseIds
        );

      if (courseError) {

        console.error(
          "Course lookup error:",
          courseError
        );

      } else {

        courses =
          data || [];
      }
    }

    const courseMap =
      new Map();

    courses.forEach(
      course => {

        courseMap.set(
          course.id,
          course
        );

      }
    );

    // ========================================================
    // CARDS
    // ========================================================

    enrolmentsEl.innerHTML =
      enrolments
        .map(
          enrolment => {

            const course =
              courseMap.get(
                enrolment.course_id
              );

            const title =
              course?.title ||
              course?.name ||
              "Course";

            const description =
              course?.description ||
              "Your enrolled online course.";

            // IMPORTANT:
            // Use enrolment amount first,
            // then course price.
            const amount =
              enrolment.amount !== null &&
              enrolment.amount !== undefined
                ? enrolment.amount
                : (
                    course?.price ??
                    0
                  );

            const status =
              normaliseStatus(
                enrolment.enrollment_status
              );

            const safeTitle =
              escapeHTML(title);

            const safeDescription =
              escapeHTML(description);

            const canStudy =
              status === "approved" ||
              status === "active";

            return `

              <div
                class="card funda-enrolment-card"
              >

                <span
                  class="funda-status ${escapeHTML(
                    status
                  )}"
                >
                  ${escapeHTML(
                    status
                  )}
                </span>

                <h3>
                  ${safeTitle}
                </h3>

                <p>
                  ${safeDescription}
                </p>

                <p
                  class="funda-info-line"
                >
                  <strong>
                    Course fee:
                  </strong>
                  ${formatMoney(
                    amount
                  )}
                </p>

                <p
                  class="funda-info-line"
                >
                  <strong>
                    Status:
                  </strong>
                  ${escapeHTML(
                    status
                  )}
                </p>

                <p
                  class="funda-info-line"
                >
                  <strong>
                    Enrolled:
                  </strong>
                  ${formatDate(
                    enrolment.enrolled_at
                  )}
                </p>

                ${
                  canStudy
                    ? `
                      <div
                        class="funda-action-row"
                      >

                        <button
                          type="button"
                          class="btn green study-btn"
                          data-course-id="${escapeHTML(
                            enrolment.course_id
                          )}"
                        >
                          📚 Study Course
                        </button>

                      </div>
                    `
                    : `
                      <p
                        style="
                          margin-top:18px;
                          color:#777;
                        "
                      >
                        Your enrolment is
                        awaiting approval.
                      </p>
                    `
                }

              </div>

            `;
          }
        )
        .join("");

    // ========================================================
    // STUDY BUTTONS
    // ========================================================

    document
      .querySelectorAll(
        ".study-btn"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const courseId =
                button.dataset.courseId;

              if (!courseId) {
                return;
              }

              window.location.href =
                "course-study.html?id=" +
                encodeURIComponent(
                  courseId
                );

            }
          );

        }
      );

  } catch (error) {

    console.error(
      "Enrolments error:",
      error
    );

    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>
          Unable to load enrolments
        </h3>

        <p>
          Please refresh the page
          and try again.
        </p>

      </div>
    `;
  }
}

// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses(
  studentId
) {

  if (!coursesEl) {
    return;
  }

  coursesEl.innerHTML =
    `<p class="loading">
      Loading courses…
    </p>`;

  try {

    const {
      data: courses,
      error
    } = await db
      .from("courses")
      .select("*")
      .eq("active", true)
      .order(
        "title",
        {
          ascending: true
        }
      );

    if (error) {
      throw error;
    }

    if (
      !courses ||
      courses.length === 0
    ) {

      coursesEl.innerHTML = `
        <div class="card">

          <h3>
            No courses available
          </h3>

          <p>
            Courses will appear here
            when they become available.
          </p>

        </div>
      `;

      return;
    }

    // ========================================================
    // EXISTING ENROLMENTS
    // ========================================================

    const {
      data: existing,
      error: existingError
    } = await db
      .from("enrollments")
      .select(
        "id,course_id,enrollment_status"
      )
      .eq(
        "student_id",
        studentId
      );

    if (existingError) {

      console.error(
        "Existing enrolment lookup error:",
        existingError
      );
    }

    const enrolledMap =
      new Map();

    (
      existing || []
    ).forEach(
      item => {

        enrolledMap.set(
          item.course_id,
          item.enrollment_status
        );

      }
    );

    // ========================================================
    // COURSE CARDS
    // ========================================================

    coursesEl.innerHTML =
      courses
        .map(
          course => {

            const title =
              course.title ||
              course.name ||
              "Course";

            const description =
              course.description ||
              "Online short course.";

            const price =
              course.price ??
              0;

            const status =
              enrolledMap.get(
                course.id
              );

            const alreadyEnrolled =
              Boolean(status);

            return `

              <div
                class="card funda-course-card"
              >

                <h3>
                  ${escapeHTML(
                    title
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    description
                  )}
                </p>

                <p
                  class="funda-info-line"
                >
                  <strong>
                    Course fee:
                  </strong>
                  ${formatMoney(
                    price
                  )}
                </p>

                ${
                  alreadyEnrolled
                    ? `
                      <span
                        class="funda-status ${escapeHTML(
                          normaliseStatus(
                            status
                          )
                        )}"
                      >
                        ${escapeHTML(
                          normaliseStatus(
                            status
                          )
                        )}
                      </span>
                    `
                    : `
                      <button
                        type="button"
                        class="btn green enrol-btn"
                        data-course-id="${escapeHTML(
                          course.id
                        )}"
                      >
                        Enrol Now
                      </button>
                    `
                }

              </div>

            `;
          }
        )
        .join("");

    // ========================================================
    // ENROL BUTTONS
    // ========================================================

    document
      .querySelectorAll(
        ".enrol-btn"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            async () => {

              const courseId =
                button.dataset.courseId;

              await enrolStudent(
                studentId,
                courseId,
                button
              );

            }
          );

        }
      );

  } catch (error) {

    console.error(
      "Courses error:",
      error
    );

    coursesEl.innerHTML = `
      <div class="card">

        <h3>
          Unable to load courses
        </h3>

        <p>
          Please refresh the page
          and try again.
        </p>

      </div>
    `;
  }
}

// ============================================================
// ENROL STUDENT
// ============================================================

async function enrolStudent(
  studentId,
  courseId,
  button
) {

  if (
    !studentId ||
    !courseId
  ) {
    return;
  }

  button.disabled =
    true;

  button.textContent =
    "Enrolling…";

  try {

    // ========================================================
    // CHECK EXISTING
    // ========================================================

    const {
      data: existing,
      error: checkError
    } = await db
      .from("enrollments")
      .select(
        "id,enrollment_status"
      )
      .eq(
        "student_id",
        studentId
      )
      .eq(
        "course_id",
        courseId
      )
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {

      showMessage(
        "You are already enrolled in this course."
      );

      button.disabled =
        true;

      button.textContent =
        existing.enrollment_status ||
        "Already enrolled";

      return;
    }

    // ========================================================
    // COURSE
    // ========================================================

    const {
      data: course,
      error: courseError
    } = await db
      .from("courses")
      .select(
        "id,title,name,price"
      )
      .eq(
        "id",
        courseId
      )
      .maybeSingle();

    if (courseError) {
      throw courseError;
    }

    // ========================================================
    // INSERT
    // ========================================================

    const {
      error: insertError
    } = await db
      .from("enrollments")
      .insert({

        student_id:
          studentId,

        course_id:
          courseId,

        enrollment_status:
          "pending",

        enrolled_at:
          new Date()
            .toISOString(),

        amount:
          course?.price ??
          null

      });

    if (insertError) {
      throw insertError;
    }

    showMessage(
      "Enrolment submitted successfully.",
      true
    );

    button.textContent =
      "Pending Approval";

    await loadEnrolments(
      studentId
    );

    await loadAvailableCourses(
      studentId
    );

  } catch (error) {

    console.error(
      "Enrolment error:",
      error
    );

    showMessage(
      "Unable to complete enrolment. Please try again."
    );

    button.disabled =
      false;

    button.textContent =
      "Enrol Now";
  }
}

// ============================================================
// LOAD PAYMENTS
// ============================================================

async function loadPayments(
  studentId
) {

  if (!paymentListEl) {
    return;
  }

  paymentListEl.innerHTML = `
    <div class="card">

      <p class="loading">
        Loading payment history…
      </p>

    </div>
  `;

  try {

    const {
      data: payments,
      error
    } = await db
      .from("payments")
      .select("*")
      .eq(
        "student_id",
        studentId
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {
      throw error;
    }

    if (
      !payments ||
      payments.length === 0
    ) {

      paymentListEl.innerHTML = `
        <div class="card">

          <h3>
            Payment History
          </h3>

          <p>
            No payment records have
            been recorded yet.
          </p>

        </div>
      `;

      return;
    }

    // ========================================================
    // COURSE IDS
    // ========================================================

    const courseIds = [
      ...new Set(
        payments
          .map(
            payment =>
              payment.course_id
          )
          .filter(Boolean)
      )
    ];

    let courses = [];

    if (
      courseIds.length > 0
    ) {

      const {
        data,
        error: courseError
      } = await db
        .from("courses")
        .select(
          "id,title,name,price"
        )
        .in(
          "id",
          courseIds
        );

      if (courseError) {

        console.error(
          "Payment course lookup error:",
          courseError
        );

      } else {

        courses =
          data || [];
      }
    }

    const courseMap =
      new Map();

    courses.forEach(
      course => {

        courseMap.set(
          course.id,
          course
        );

      }
    );

    // ========================================================
    // PAYMENT CARDS
    // ========================================================

    paymentListEl.innerHTML = `

      <div class="card">

        <h3>
          Payment History
        </h3>

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:16px;
            margin-top:15px;
          "
        >

          ${
            payments
              .map(
                payment => {

                  const course =
                    courseMap.get(
                      payment.course_id
                    );

                  const title =
                    course?.title ||
                    course?.name ||
                    "Course";

                  const amount =
                    payment.amount ??
                    course?.price ??
                    0;

                  const method =
                    payment.payment_method ||
                    payment.method ||
                    "Not specified";

                  const status =
                    normaliseStatus(
                      payment.payment_status ||
                      payment.status ||
                      "pending"
                    );

                  const date =
                    payment.created_at ||
                    payment.paid_at;

                  // Try common proof fields
                  const proof =
                    payment.proof_url ||
                    payment.proof_of_payment_url ||
                    payment.receipt_url ||
                    payment.file_url ||
                    payment.proof_url;

                  return `

                    <div
                      class="card funda-payment-card"
                      style="
                        margin:0;
                        width:100%;
                      "
                    >

                      <h3>
                        ${escapeHTML(
                          title
                        )}
                      </h3>

                      <p
                        class="funda-info-line"
                      >
                        <strong>
                          Amount paid:
                        </strong>
                        ${formatMoney(
                          amount
                        )}
                      </p>

                      <p
                        class="funda-info-line"
                      >
                        <strong>
                          Payment method:
                        </strong>
                        ${escapeHTML(
                          method
                        )}
                      </p>

                      <p
                        class="funda-info-line"
                      >
                        <strong>
                          Date:
                        </strong>
                        ${formatDate(
                          date
                        )}
                      </p>

                      <p
                        class="funda-info-line"
                      >
                        <strong>
                          Status:
                        </strong>
                      </p>

                      <span
                        class="funda-status ${escapeHTML(
                          status
                        )}"
                      >
                        ${escapeHTML(
                          status
                        )}
                      </span>

                      <div
                        class="funda-payment-proof"
                      >

                        <p
                          class="funda-info-line"
                        >
                          <strong>
                            Proof of payment:
                          </strong>
                        </p>

                        ${
                          proof
                            ? `
                              <a
                                href="${escapeHTML(
                                  proof
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn green"
                              >
                                View submitted proof
                              </a>
                            `
                            : `
                              <span>
                                Submitted
                              </span>
                            `
                        }

                      </div>

                    </div>

                  `;
                }
              )
              .join("")
          }

        </div>

      </div>

    `;

  } catch (error) {

    console.error(
      "Payments error:",
      error
    );

    paymentListEl.innerHTML = `
      <div class="card">

        <h3>
          Payment History
        </h3>

        <p>
          Payment information could
          not be loaded right now.
        </p>

      </div>
    `;
  }
}

// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  try {

    const {
      error
    } = await db.auth.signOut();

    if (error) {
      throw error;
    }

    window.location.href =
      "login.html";

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    showMessage(
      "Unable to log out. Please try again."
    );
  }
}

// ============================================================
// LOGOUT BUTTON
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    logout
  );

}

// ============================================================
// INITIALISE
// ============================================================

async function initDashboard() {

  try {

    // ========================================================
    // AUTH
    // ========================================================

    const user =
      await getCurrentUser();

    if (!user) {

      window.location.href =
        "login.html";

      return;
    }

    // ========================================================
    // STUDENT
    // ========================================================

    const student =
      await getStudent(
        user.id
      );

    if (!student) {

      if (userNameEl) {

        userNameEl.textContent =
          "Student";
      }

      if (userEmailEl) {

        userEmailEl.textContent =
          user.email || "";
      }

      showMessage(
        "Your student profile could not be found."
      );

      return;
    }

    // ========================================================
    // HEADER
    // ========================================================

    loadStudentHeader(
      student,
      user
    );

    // ========================================================
    // DASHBOARD DATA
    // ========================================================

    await Promise.all([
      loadEnrolments(
        student.id
      ),

      loadAvailableCourses(
        student.id
      ),

      loadPayments(
        student.id
      )
    ]);

  } catch (error) {

    console.error(
      "Dashboard initialisation error:",
      error
    );

    showMessage(
      "Unable to load your dashboard. Please refresh the page."
    );
  }
}

// ============================================================
// START
// ============================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initDashboard
  );

} else {

  initDashboard();

}

// ============================================================
// END
// ============================================================
