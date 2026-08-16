// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// ============================================================
// ELEMENTS
// ============================================================

const userNameEl = document.getElementById("user-name");
const userEmailEl = document.getElementById("user-email");
const enrolmentsEl = document.getElementById("enrolments");
const coursesEl = document.getElementById("available-courses");
const paymentListEl = document.getElementById("payment-list");
const messageEl = document.getElementById("message");
const logoutBtn = document.getElementById("logout");

// ============================================================
// MESSAGE
// ============================================================

function showMessage(text, success = false) {
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className =
    "message " + (success ? "success" : "error");
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
// MONEY
// ============================================================

function formatMoney(amount) {
  const number = Number(amount);

  if (Number.isNaN(number)) {
    return "R0.00";
  }

  return "R" + number.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ============================================================
// DATE
// ============================================================

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

// ============================================================
// STATUS
// ============================================================

function normaliseStatus(status) {
  if (!status) return "pending";

  return String(status)
    .trim()
    .toLowerCase();
}

// ============================================================
// CURRENT USER
// ============================================================

async function getCurrentUser() {
  const {
    data,
    error
  } = await db.auth.getUser();

  if (error) {
    console.error("User error:", error);
    return null;
  }

  return data?.user || null;
}

// ============================================================
// STUDENT
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
    console.error("Student error:", error);
    throw error;
  }

  return data;
}

// ============================================================
// HEADER
// ============================================================

function loadStudentHeader(student, user) {
  const name =
    student?.full_name ||
    student?.name ||
    user?.user_metadata?.full_name ||
    "Student";

  if (userNameEl) {
    userNameEl.textContent = name;
  }

  if (userEmailEl) {
    userEmailEl.textContent = user?.email || "";
  }
}

// ============================================================
// LOAD ENROLMENTS
// ============================================================

async function loadEnrolments(studentId) {
  if (!enrolmentsEl) return;

  enrolmentsEl.innerHTML = `
    <p class="loading">Loading enrolments...</p>
  `;

  try {
    const {
      data: enrolments,
      error
    } = await db
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .order("enrolled_at", {
        ascending: false
      });

    if (error) throw error;

    if (!enrolments || enrolments.length === 0) {
      enrolmentsEl.innerHTML = `
        <div class="card">
          <h3>No enrolments yet</h3>
          <p>
            You have not enrolled in a course yet.
          </p>
        </div>
      `;
      return;
    }

    const courseIds = [
      ...new Set(
        enrolments
          .map(item => item.course_id)
          .filter(Boolean)
      )
    ];

    let courses = [];

    if (courseIds.length > 0) {
      const {
        data,
        error: courseError
      } = await db
        .from("courses")
        .select("*")
        .in("id", courseIds);

      if (courseError) {
        console.error(
          "Course error:",
          courseError
        );
      } else {
        courses = data || [];
      }
    }

    const courseMap = new Map();

    courses.forEach(course => {
      courseMap.set(course.id, course);
    });

    enrolmentsEl.innerHTML = enrolments
      .map(enrolment => {

        const course =
          courseMap.get(enrolment.course_id);

        const title =
          course?.title ||
          course?.name ||
          "Course";

        const description =
          course?.description ||
          "Your enrolled online course.";

        const amount =
          enrolment.amount ??
          course?.price ??
          0;

        const status =
          normaliseStatus(
            enrolment.enrollment_status
          );

        const approved =
          status === "approved" ||
          status === "active";

        return `
          <div class="card funda-enrolment-card">

            <span class="funda-status ${escapeHTML(status)}">
              ${escapeHTML(status)}
            </span>

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(description)}
            </p>

            <p class="funda-info-line">
              <strong>Course fee:</strong>
              ${formatMoney(amount)}
            </p>

            <p class="funda-info-line">
              <strong>Status:</strong>
              ${escapeHTML(status)}
            </p>

            <p class="funda-info-line">
              <strong>Enrolled:</strong>
              ${formatDate(enrolment.enrolled_at)}
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
                  <p style="margin-top:18px;color:#777;">
                    Your enrolment is awaiting approval.
                  </p>
                `
            }

          </div>
        `;
      })
      .join("");

    document
      .querySelectorAll(".study-btn")
      .forEach(button => {

        button.addEventListener("click", () => {

          const courseId =
            button.dataset.courseId;

          if (!courseId) return;

          window.location.href =
            "course-study.html?id=" +
            encodeURIComponent(courseId);

        });

      });

  } catch (error) {

    console.error(
      "Enrolment loading error:",
      error
    );

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>Unable to load enrolments</h3>
        <p>
          Please refresh the page and try again.
        </p>
      </div>
    `;
  }
}

// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses(studentId) {
  if (!coursesEl) return;

  coursesEl.innerHTML = `
    <p class="loading">Loading courses...</p>
  `;

  try {

    const {
      data: courses,
      error
    } = await db
      .from("courses")
      .select("*")
      .eq("active", true)
      .order("title", {
        ascending: true
      });

    if (error) throw error;

    if (!courses || courses.length === 0) {

      coursesEl.innerHTML = `
        <div class="card">
          <h3>No courses available</h3>
          <p>
            Courses will appear here when available.
          </p>
        </div>
      `;

      return;
    }

    const {
      data: existing,
      error: existingError
    } = await db
      .from("enrollments")
      .select("id,course_id,enrollment_status")
      .eq("student_id", studentId);

    if (existingError) {
      console.error(
        "Existing enrolment error:",
        existingError
      );
    }

    const enrolledMap = new Map();

    (existing || []).forEach(item => {
      enrolledMap.set(
        item.course_id,
        item.enrollment_status
      );
    });

    coursesEl.innerHTML = courses
      .map(course => {

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
          enrolledMap.get(course.id);

        if (status) {

          return `
            <div class="card funda-course-card">

              <h3>
                ${escapeHTML(title)}
              </h3>

              <p>
                ${escapeHTML(description)}
              </p>

              <p class="funda-info-line">
                <strong>Course fee:</strong>
                ${formatMoney(price)}
              </p>

              <span class="funda-status ${escapeHTML(
                normaliseStatus(status)
              )}">
                ${escapeHTML(
                  normaliseStatus(status)
                )}
              </span>

            </div>
          `;

        }

        return `
          <div class="card funda-course-card">

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(description)}
            </p>

            <p class="funda-info-line">
              <strong>Course fee:</strong>
              ${formatMoney(price)}
            </p>

            <button
              type="button"
              class="btn green enrol-btn"
              data-course-id="${escapeHTML(course.id)}"
            >
              Enrol Now
            </button>

          </div>
        `;

      })
      .join("");

    document
      .querySelectorAll(".enrol-btn")
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            await enrolStudent(
              studentId,
              button.dataset.courseId,
              button
            );

          }
        );

      });

  } catch (error) {

    console.error(
      "Course loading error:",
      error
    );

    coursesEl.innerHTML = `
      <div class="card">
        <h3>Unable to load courses</h3>
        <p>
          Please refresh the page and try again.
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

  if (!studentId || !courseId) return;

  button.disabled = true;
  button.textContent = "Enrolling...";

  try {

    const {
      data: existing,
      error: checkError
    } = await db
      .from("enrollments")
      .select("id,enrollment_status")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {

      button.textContent =
        existing.enrollment_status ||
        "Already enrolled";

      showMessage(
        "You are already enrolled in this course."
      );

      return;
    }

    const {
      data: course,
      error: courseError
    } = await db
      .from("courses")
      .select("id,title,name,price")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) throw courseError;

    const {
      error: insertError
    } = await db
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: courseId,
        enrollment_status: "pending",
        enrolled_at: new Date().toISOString(),
        amount: course?.price ?? null
      });

    if (insertError) throw insertError;

    showMessage(
      "Enrolment submitted successfully.",
      true
    );

    await loadEnrolments(studentId);
    await loadAvailableCourses(studentId);

  } catch (error) {

    console.error(
      "Enrolment error:",
      error
    );

    showMessage(
      "Unable to complete enrolment. Please try again."
    );

    button.disabled = false;
    button.textContent = "Enrol Now";
  }
}

// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments(studentId) {

  if (!paymentListEl) return;

  paymentListEl.innerHTML = `
    <div class="card">
      <p class="loading">
        Loading payment history...
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
      .eq("student_id", studentId)
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    if (!payments || payments.length === 0) {

      paymentListEl.innerHTML = `
        <div class="card">
          <h3>Payment History</h3>
          <p>
            No payment records have been recorded yet.
          </p>
        </div>
      `;

      return;
    }

    const courseIds = [
      ...new Set(
        payments
          .map(payment => payment.course_id)
          .filter(Boolean)
      )
    ];

    let courses = [];

    if (courseIds.length > 0) {

      const {
        data,
        error: courseError
      } = await db
        .from("courses")
        .select("id,title,name,price")
        .in("id", courseIds);

      if (!courseError) {
        courses = data || [];
      }
    }

    const courseMap = new Map();

    courses.forEach(course => {
      courseMap.set(course.id, course);
    });

    paymentListEl.innerHTML = `
      <div class="card">

        <h3>Payment History</h3>

        <div style="
          display:flex;
          flex-direction:column;
          gap:16px;
          margin-top:15px;
        ">

          ${payments.map(payment => {

            const course =
              courseMap.get(payment.course_id);

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
              "EFT / Bank Transfer";

            const status =
              normaliseStatus(
                payment.payment_status ||
                payment.status ||
                "pending"
              );

            const date =
              payment.created_at ||
              payment.paid_at;

            const proof =
              payment.proof_url ||
              payment.proof_of_payment_url ||
              payment.receipt_url ||
              payment.file_url;

            return `
              <div
                class="card funda-payment-card"
                style="margin:0;"
              >

                <h3>
                  ${escapeHTML(title)}
                </h3>

                <p class="funda-info-line">
                  <strong>Amount paid:</strong>
                  ${formatMoney(amount)}
                </p>

                <p class="funda-info-line">
                  <strong>Payment method:</strong>
                  ${escapeHTML(method)}
                </p>

                <p class="funda-info-line">
                  <strong>Date:</strong>
                  ${formatDate(date)}
                </p>

                <p class="funda-info-line">
                  <strong>Status:</strong>
                </p>

                <span class="funda-status ${escapeHTML(status)}">
                  ${escapeHTML(status)}
                </span>

                <div style="margin-top:18px;">

                  <p class="funda-info-line">
                    <strong>Proof of payment:</strong>
                  </p>

                  ${
                    proof
                      ? `
                        <a
                          href="${escapeHTML(proof)}"
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

          }).join("")}

        </div>

      </div>
    `;

  } catch (error) {

    console.error(
      "Payment error:",
      error
    );

    paymentListEl.innerHTML = `
      <div class="card">
        <h3>Payment History</h3>
        <p>
          Payment information could not be loaded right now.
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

    if (error) throw error;

    window.location.href = "login.html";

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

if (logoutBtn) {
  logoutBtn.addEventListener(
    "click",
    logout
  );
}

// ============================================================
// START DASHBOARD
// ============================================================

async function initDashboard() {

  try {

    const user =
      await getCurrentUser();

    if (!user) {

      window.location.href =
        "login.html";

      return;
    }

    const student =
      await getStudent(user.id);

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

    loadStudentHeader(
      student,
      user
    );

    await Promise.all([
      loadEnrolments(student.id),
      loadAvailableCourses(student.id),
      loadPayments(student.id)
    ]);

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    showMessage(
      "Unable to load your dashboard. Please refresh the page."
    );
  }
}

// ============================================================
// RUN
// ============================================================

if (
  document.readyState === "loading"
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
