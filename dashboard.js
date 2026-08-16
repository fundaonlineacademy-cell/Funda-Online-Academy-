// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ============================================================
// COMPLETE VERSION
// ============================================================
// Features:
// - Student authentication
// - Student profile
// - Student name/email
// - My enrolments
// - Available courses
// - Course enrolment
// - Course fees
// - Payment history
// - Payment status
// - Proof of payment display support
// - Study Course button after approval
// - Safe logout
// - Mobile-friendly dashboard layout
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
// MOBILE / DASHBOARD STYLES
// ============================================================

const dashboardStyle =
  document.createElement("style");

dashboardStyle.textContent = `

/* =========================================================
   FUNDA STUDENT DASHBOARD
   MOBILE LAYOUT
   ========================================================= */

.dashboard .wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard section {
  margin-bottom: 55px;
}

/* Make grids responsive */
.dashboard .grid3 {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 22px;
  width: 100%;
}

/* Cards */
.dashboard .card {
  width: 100%;
  min-width: 0;
  padding: 28px;
  border-radius: 24px;
}

/* Prevent long text from breaking layout */
.dashboard .card h3,
.dashboard .card p,
.dashboard .card span {
  overflow-wrap: anywhere;
  word-break: normal;
}

/* Buttons */
.dashboard .btn {
  max-width: 100%;
}

/* Mobile */
@media (max-width: 800px) {

  .dashboard .wrap {
    width: 100%;
    padding-left: 20px;
    padding-right: 20px;
  }

  .dashboard .grid3 {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .dashboard .card {
    width: 100%;
    padding: 24px;
  }

  .dash-head {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .dash-head .btn {
    width: 100%;
    text-align: center;
  }

}

/* Small phones */
@media (max-width: 480px) {

  .dashboard .wrap {
    padding-left: 16px;
    padding-right: 16px;
  }

  .dashboard section {
    margin-bottom: 42px;
  }

  .dashboard .card {
    padding: 22px;
    border-radius: 22px;
  }

  .dashboard .card h3 {
    font-size: 22px;
  }

  .dashboard .card p {
    font-size: 16px;
    line-height: 1.55;
  }

}

/* Payment table */
.payment-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
}

.payment-table th,
.payment-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eeeeee;
}

.payment-status {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
  text-transform: capitalize;
}

.payment-status.pending {
  background: #eaf7e5;
  color: #26751d;
}

.payment-status.approved,
.payment-status.paid,
.payment-status.completed {
  background: #dff4dc;
  color: #20751b;
}

.payment-status.rejected,
.payment-status.failed {
  background: #fde8e8;
  color: #a52b2b;
}

.study-btn {
  margin-top: 10px;
}

`;

document.head.appendChild(
  dashboardStyle
);

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
      month: "short",
      day: "numeric"
    }
  );

}

// ============================================================
// CURRENT USER
// ============================================================

async function getCurrentUser() {

  try {

    const {
      data,
      error
    } = await db.auth.getUser();

    if (error) {

      console.error(
        "Auth error:",
        error
      );

      return null;
    }

    return data?.user || null;

  } catch (error) {

    console.error(
      "Unexpected auth error:",
      error
    );

    return null;
  }

}

// ============================================================
// STUDENT RECORD
// ============================================================

async function getStudent(
  userId
) {

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
  student
) {

  if (!student) {

    if (userNameEl) {
      userNameEl.textContent =
        "Student";
    }

    return;
  }

  const name =
    student.full_name ||
    student.name ||
    "Student";

  if (userNameEl) {

    userNameEl.textContent =
      name;

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
    `
      <p class="loading">
        Loading enrolments…
      </p>
    `;

  try {

    const {
      data: enrolments,
      error
    } = await db
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

      enrolmentsEl.innerHTML =
        `
          <div class="card">

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

    // --------------------------------------------------------
    // COURSE IDS
    // --------------------------------------------------------

    const courseIds = [
      ...new Set(
        enrolments
          .map(
            item =>
              item.course_id
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
        error:
          courseError
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

    // --------------------------------------------------------
    // COURSE MAP
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CARDS
    // --------------------------------------------------------

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

            const status =
              enrolment
                .enrollment_status ||
              "pending";

            const amount =
              enrolment.amount ??
              course?.price ??
              0;

            const safeStatus =
              escapeHTML(
                status
              );

            const approved =
              status === "approved" ||
              status === "active";

            return `
              <div class="card">

                <span class="badge">
                  ${safeStatus}
                </span>

                <h3>
                  ${escapeHTML(title)}
                </h3>

                <p>
                  ${escapeHTML(description)}
                </p>

                <p>
                  <strong>
                    Course fee:
                  </strong>
                  ${formatMoney(amount)}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>
                  ${escapeHTML(status)}
                </p>

                <p>
                  <strong>
                    Enrolled:
                  </strong>
                  ${formatDate(
                    enrolment.enrolled_at
                  )}
                </p>

                ${
                  approved
                    ? `
                      <button
                        type="button"
                        class="btn green study-btn"
                        data-course-id="${escapeHTML(
                          enrolment.course_id
                        )}"
                      >
                        📚 Study Course
                      </button>
                    `
                    : `
                      <p
                        style="
                          margin-top:16px;
                          font-weight:600;
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

    // --------------------------------------------------------
    // STUDY BUTTONS
    // --------------------------------------------------------

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
                button.dataset
                  .courseId;

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

    enrolmentsEl.innerHTML =
      `
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
    `
      <p class="loading">
        Loading courses…
      </p>
    `;

  try {

    const {
      data: courses,
      error
    } = await db
      .from("courses")
      .select("*")
      .eq(
        "active",
        true
      )
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

      coursesEl.innerHTML =
        `
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

    // --------------------------------------------------------
    // EXISTING ENROLMENTS
    // --------------------------------------------------------

    const {
      data: existing,
      error: existingError
    } = await db
      .from("enrollments")
      .select(
        "course_id,enrollment_status"
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

    // --------------------------------------------------------
    // COURSE CARDS
    // --------------------------------------------------------

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
              course.price ?? 0;

            const status =
              enrolledMap.get(
                course.id
              );

            const already =
              Boolean(status);

            return `
              <div class="card">

                <h3>
                  ${escapeHTML(title)}
                </h3>

                <p>
                  ${escapeHTML(
                    description
                  )}
                </p>

                <p>
                  <strong>
                    Course fee:
                  </strong>
                  ${formatMoney(price)}
                </p>

                ${
                  already
                    ? `
                      <span class="badge">
                        ${escapeHTML(
                          status
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

    // --------------------------------------------------------
    // ENROL BUTTONS
    // --------------------------------------------------------

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
                button.dataset
                  .courseId;

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

    coursesEl.innerHTML =
      `
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
    !courseId ||
    !button
  ) {
    return;
  }

  button.disabled =
    true;

  button.textContent =
    "Enrolling…";

  try {

    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // COURSE
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CREATE ENROLMENT
    // --------------------------------------------------------

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
          new Date().toISOString(),

        amount:
          course?.price ?? 0

      });

    if (insertError) {
      throw insertError;
    }

    showMessage(
      "Enrolment submitted successfully.",
      true
    );

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

  paymentListEl.innerHTML =
    `
      <div class="card">

        <p class="loading">
          Loading payments…
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

      paymentListEl.innerHTML =
        `
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

    // --------------------------------------------------------
    // COURSE IDS
    // --------------------------------------------------------

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
        error:
          courseError
      } = await db
        .from("courses")
        .select(
          "id,title,name"
        )
        .in(
          "id",
          courseIds
        );

      if (!courseError) {
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

    // --------------------------------------------------------
    // PAYMENT HISTORY
    // --------------------------------------------------------

    paymentListEl.innerHTML =
      `
        <div class="card">

          <h3>
            Payment History
          </h3>

          <div
            class="payment-history"
            style="
              display:grid;
              gap:18px;
              margin-top:20px;
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
                      0;

                    const status =
                      payment.payment_status ||
                      payment.status ||
                      "pending";

                    const method =
                      payment.payment_method ||
                      payment.method ||
                      "EFT / Bank Transfer";

                    const date =
                      payment.created_at ||
                      payment.paid_at;

                    const proof =
                      payment.proof_url ||
                      payment.proof_of_payment_url ||
                      payment.receipt_url ||
                      payment.file_url ||
                      null;

                    return `
                      <div
                        class="card"
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

                        <p>
                          <strong>
                            Amount paid:
                          </strong>
                        </p>

                        <p>
                          ${formatMoney(
                            amount
                          )}
                        </p>

                        <p>
                          <strong>
                            Payment method:
                          </strong>
                        </p>

                        <p>
                          ${escapeHTML(
                            method
                          )}
                        </p>

                        <p>
                          <strong>
                            Date:
                          </strong>
                        </p>

                        <p>
                          ${formatDate(
                            date
                          )}
                        </p>

                        <p>
                          <strong>
                            Status:
                          </strong>
                        </p>

                        <span
                          class="
                            payment-status
                            ${escapeHTML(
                              String(
                                status
                              ).toLowerCase()
                            )}
                          "
                        >
                          ${escapeHTML(
                            status
                          )}
                        </span>

                        <p
                          style="
                            margin-top:18px;
                          "
                        >
                          <strong>
                            Proof of payment:
                          </strong>
                        </p>

                        ${
                          proof
                            ? `
                              <p>
                                <a
                                  href="${escapeHTML(
                                    proof
                                  )}"
                                  target="_blank"
                                  rel="noopener"
                                  class="btn green"
                                  style="
                                    display:inline-block;
                                    margin-top:8px;
                                  "
                                >
                                  View submitted proof
                                </a>
                              </p>
                            `
                            : `
                              <p>
                                Submitted
                              </p>
                            `
                        }

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

    paymentListEl.innerHTML =
      `
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

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const user =
      await getCurrentUser();

    if (!user) {

      window.location.href =
        "login.html";

      return;
    }

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    if (userEmailEl) {

      userEmailEl.textContent =
        user.email || "";

    }

    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    const student =
      await getStudent(
        user.id
      );

    if (!student) {

      if (userNameEl) {

        userNameEl.textContent =
          "Student";

      }

      showMessage(
        "Your student profile could not be found."
      );

      return;
    }

    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    loadStudentHeader(
      student
    );

    // --------------------------------------------------------
    // LOAD EVERYTHING
    // --------------------------------------------------------

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
