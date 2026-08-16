// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ============================================================
// COMPLETE STUDENT DASHBOARD
//
// Includes:
// - Student authentication
// - Student profile
// - My enrolments
// - Available courses
// - Course enrolment
// - Course study access
// - Payment history
// - Assessments
// - Assessment results
// - Safe logout
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

  messageEl.classList.remove("hidden");
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {
  if (value === null || value === undefined) {
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
// FORMAT MONEY
// ============================================================

function formatMoney(amount) {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "R0.00";
  }

  const number = Number(amount);

  if (Number.isNaN(number)) {
    return "R0.00";
  }

  return (
    "R" +
    number.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
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
      console.error("Auth error:", error);
      return null;
    }

    return data?.user || null;

  } catch (error) {
    console.error("Unexpected auth error:", error);
    return null;
  }
}

// ============================================================
// GET STUDENT RECORD
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
    console.error("Student lookup error:", error);
    throw error;
  }

  return data;
}

// ============================================================
// LOAD STUDENT HEADER
// ============================================================

function loadStudentHeader(student) {
  if (!student) {
    if (userNameEl) {
      userNameEl.textContent = "Student";
    }

    return;
  }

  const name =
    student.full_name ||
    student.name ||
    "Student";

  if (userNameEl) {
    userNameEl.textContent = name;
  }
}

// ============================================================
// LOAD ENROLMENTS
// ============================================================

async function loadEnrolments(studentId) {
  if (!enrolmentsEl) return;

  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';

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

    if (error) {
      throw error;
    }

    if (!enrolments || enrolments.length === 0) {
      enrolmentsEl.innerHTML = `
        <div class="card">
          <h3>No enrolments yet</h3>

          <p>
            You have not enrolled in a course yet.
            Browse the available courses below.
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
          "Course lookup error:",
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

    enrolmentsEl.innerHTML =
      enrolments
        .map(enrolment => {
          const course =
            courseMap.get(enrolment.course_id);

          const title =
            course?.title ||
            course?.name ||
            "Course";

          const description =
            course?.description ||
            "Your enrolled course.";

          const status =
            enrolment.enrollment_status ||
            "pending";

          const amount =
            enrolment.amount ??
            course?.price ??
            null;

          const approved =
            status === "approved" ||
            status === "active";

          return `
            <div class="card">

              <span class="badge">
                ${escapeHTML(status)}
              </span>

              <h3>
                ${escapeHTML(title)}
              </h3>

              <p>
                ${escapeHTML(description)}
              </p>

              <p>
                <strong>Enrolled:</strong>
                ${formatDate(enrolment.enrolled_at)}
              </p>

              <p>
                <strong>Course fee:</strong>
                ${formatMoney(amount)}
              </p>

              <div
                style="
                  display:flex;
                  gap:10px;
                  flex-wrap:wrap;
                  margin-top:15px;
                "
              >

                <button
                  class="btn green study-btn"
                  type="button"
                  data-course-id="${escapeHTML(
                    enrolment.course_id
                  )}"
                  ${approved ? "" : "disabled"}
                >
                  📚 Study Course
                </button>

              </div>

              ${
                !approved
                  ? `
                    <p
                      style="
                        margin-top:12px;
                        color:#777;
                      "
                    >
                      Your enrolment is awaiting
                      approval.
                    </p>
                  `
                  : `
                    <p
                      style="
                        margin-top:12px;
                        color:#198754;
                      "
                    >
                      You can access your course.
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
        button.addEventListener(
          "click",
          () => {
            const courseId =
              button.dataset.courseId;

            if (!courseId) return;

            window.location.href =
              "course-study.html?id=" +
              encodeURIComponent(courseId);
          }
        );
      });

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
          Please refresh the page and try again.
        </p>

      </div>
    `;
  }
}

// ============================================================
// LOAD AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses(studentId) {
  if (!coursesEl) return;

  coursesEl.innerHTML =
    '<p class="loading">Loading courses…</p>';

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

    if (error) {
      throw error;
    }

    if (!courses || courses.length === 0) {
      coursesEl.innerHTML = `
        <div class="card">

          <h3>
            No courses available
          </h3>

          <p>
            Courses will appear here when
            they become available.
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
      .select("course_id,enrollment_status")
      .eq("student_id", studentId);

    if (existingError) {
      console.error(
        "Existing enrolment lookup error:",
        existingError
      );
    }

    const enrolledMap = new Map();

    (existing || []).forEach(item => {
      if (!enrolledMap.has(item.course_id)) {
        enrolledMap.set(
          item.course_id,
          item.enrollment_status
        );
      }
    });

    coursesEl.innerHTML =
      courses
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

          const alreadyEnrolled =
            Boolean(status);

          return `
            <div class="card">

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
                ${formatMoney(price)}
              </p>

              ${
                alreadyEnrolled
                  ? `
                    <span class="badge">
                      ${escapeHTML(status)}
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
        })
        .join("");

    document
      .querySelectorAll(".enrol-btn")
      .forEach(button => {
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
      });

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
  if (!studentId || !courseId) {
    return;
  }

  button.disabled = true;
  button.textContent = "Enrolling…";

  try {
    const {
      data: existingRows,
      error: checkError
    } = await db
      .from("enrollments")
      .select("id,enrollment_status")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    const existing =
      existingRows?.[0] || null;

    if (existing) {
      showMessage(
        "You are already enrolled in this course."
      );

      button.textContent =
        existing.enrollment_status ||
        "Already enrolled";

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

    if (courseError) {
      throw courseError;
    }

    const {
      error: insertError
    } = await db
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: courseId,
        enrollment_status: "pending",
        enrolled_at:
          new Date().toISOString(),
        amount:
          course?.price ?? null
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
// LOAD PAYMENTS
// ============================================================

async function loadPayments(studentId) {
  if (!paymentListEl) return;

  paymentListEl.innerHTML = `
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
      .eq("student_id", studentId)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw error;
    }

    if (!payments || payments.length === 0) {
      paymentListEl.innerHTML = `
        <div class="card">

          <h3>
            Course Payments
          </h3>

          <p>
            No payment records have been
            recorded yet.
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
        .select("id,title,name")
        .in("id", courseIds);

      if (courseError) {
        console.error(
          "Payment course lookup error:",
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

    paymentListEl.innerHTML = `
      <div class="card">

        <h3>
          Course Payments
        </h3>

        <div
          style="
            overflow-x:auto;
            width:100%;
          "
        >

          <table
            style="
              width:100%;
              border-collapse:collapse;
              min-width:650px;
            "
          >

            <thead>

              <tr>

                <th
                  style="
                    text-align:left;
                    padding:10px;
                  "
                >
                  Course
                </th>

                <th
                  style="
                    text-align:left;
                    padding:10px;
                  "
                >
                  Amount
                </th>

                <th
                  style="
                    text-align:left;
                    padding:10px;
                  "
                >
                  Status
                </th>

                <th
                  style="
                    text-align:left;
                    padding:10px;
                  "
                >
                  Date
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                payments
                  .map(payment => {
                    const course =
                      courseMap.get(
                        payment.course_id
                      );

                    const title =
                      course?.title ||
                      course?.name ||
                      "Course";

                    const amount =
                      payment.amount ?? 0;

                    const status =
                      payment.payment_status ||
                      payment.status ||
                      "pending";

                    const date =
                      payment.created_at ||
                      payment.paid_at;

                    return `
                      <tr>

                        <td
                          style="
                            padding:10px;
                            border-top:1px solid #eee;
                          "
                        >
                          ${escapeHTML(title)}
                        </td>

                        <td
                          style="
                            padding:10px;
                            border-top:1px solid #eee;
                          "
                        >
                          ${formatMoney(amount)}
                        </td>

                        <td
                          style="
                            padding:10px;
                            border-top:1px solid #eee;
                          "
                        >
                          ${escapeHTML(status)}
                        </td>

                        <td
                          style="
                            padding:10px;
                            border-top:1px solid #eee;
                          "
                        >
                          ${formatDate(date)}
                        </td>

                      </tr>
                    `;
                  })
                  .join("")
              }

            </tbody>

          </table>

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
          Payments
        </h3>

        <p>
          Payment information could not
          be loaded right now.
        </p>

      </div>
    `;
  }
}

// ============================================================
// ASSESSMENTS & RESULTS SECTION
// ============================================================

function createAssessmentSection() {
  if (
    document.getElementById(
      "student-assessments-section"
    )
  ) {
    return;
  }

  const main =
    document.querySelector("main");

  if (!main) return;

  const wrap =
    main.querySelector(".wrap");

  if (!wrap) return;

  const section =
    document.createElement("section");

  section.id =
    "student-assessments-section";

  section.innerHTML = `
    <h2>
      📝 Assessments & Results
    </h2>

    <div
      id="student-assessments"
      class="grid3"
    >

      <div class="card">

        <p class="loading">
          Loading assessments…
        </p>

      </div>

    </div>
  `;

  const sections =
    wrap.querySelectorAll("section");

  const lastSection =
    sections[sections.length - 1];

  if (lastSection) {
    lastSection.insertAdjacentElement(
      "afterend",
      section
    );
  } else {
    wrap.appendChild(section);
  }
}

// ============================================================
// LOAD ASSESSMENTS AND RESULTS
// ============================================================

async function loadAssessments(studentId) {
  createAssessmentSection();

  const container =
    document.getElementById(
      "student-assessments"
    );

  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <p class="loading">
        Loading assessments…
      </p>
    </div>
  `;

  try {
    // --------------------------------------------------------
    // Get student's approved/active enrolments
    // --------------------------------------------------------

    const {
      data: enrolments,
      error: enrolmentError
    } = await db
      .from("enrollments")
      .select("course_id,enrollment_status")
      .eq("student_id", studentId);

    if (enrolmentError) {
      throw enrolmentError;
    }

    const courseIds = [
      ...new Set(
        (enrolments || [])
          .filter(item =>
            item.enrollment_status === "approved" ||
            item.enrollment_status === "active"
          )
          .map(item => item.course_id)
          .filter(Boolean)
      )
    ];

    if (courseIds.length === 0) {
      container.innerHTML = `
        <div class="card">

          <h3>
            No assessments yet
          </h3>

          <p>
            Assessments will appear here after
            your course enrolment has been approved.
          </p>

        </div>
      `;

      return;
    }

    // --------------------------------------------------------
    // Get assessments
    // --------------------------------------------------------

    const {
      data: assessments,
      error: assessmentError
    } = await db
      .from("assessments")
      .select("*")
      .in("course_id", courseIds)
      .order("created_at", {
        ascending: true
      });

    if (assessmentError) {
      console.error(
        "Assessment lookup error:",
        assessmentError
      );

      container.innerHTML = `
        <div class="card">

          <h3>
            Assessments
          </h3>

          <p>
            Your assessment area is being prepared.
          </p>

        </div>
      `;

      return;
    }

    if (!assessments || assessments.length === 0) {
      container.innerHTML = `
        <div class="card">

          <h3>
            No assessments available
          </h3>

          <p>
            Your assessments will appear here
            when they are published.
          </p>

        </div>
      `;

      return;
    }

    // --------------------------------------------------------
    // Get student's submissions/results
    // --------------------------------------------------------

    let submissions = [];

    const {
      data: submissionData,
      error: submissionError
    } = await db
      .from("assessment_submissions")
      .select("*")
      .eq("student_id", studentId);

    if (submissionError) {
      console.warn(
        "Assessment submissions could not be loaded:",
        submissionError
      );
    } else {
      submissions =
        submissionData || [];
    }

    const submissionMap =
      new Map();

    submissions.forEach(submission => {
      if (submission.assessment_id) {
        submissionMap.set(
          submission.assessment_id,
          submission
        );
      }
    });

    // --------------------------------------------------------
    // Render assessments
    // --------------------------------------------------------

    container.innerHTML =
      assessments
        .map(assessment => {
          const submission =
            submissionMap.get(
              assessment.id
            );

          const title =
            assessment.title ||
            assessment.name ||
            "Assessment";

          const description =
            assessment.description ||
            assessment.instructions ||
            "Complete this assessment.";

          const marks =
            submission?.marks ??
            submission?.score ??
            submission?.mark ??
            null;

          const resultStatus =
            submission?.status ||
            submission?.result ||
            "Not submitted";

          const feedback =
            submission?.feedback ||
            "";

          const submittedDate =
            submission?.submitted_at ||
            submission?.created_at ||
            null;

          let resultText =
            "Not submitted";

          if (marks !== null) {
            resultText =
              String(marks);
          }

          return `
            <div class="card">

              <span class="badge">
                ${escapeHTML(resultStatus)}
              </span>

              <h3>
                📝 ${escapeHTML(title)}
              </h3>

              <p>
                ${escapeHTML(description)}
              </p>

              <p>
                <strong>
                  Mark:
                </strong>
                ${escapeHTML(resultText)}
              </p>

              ${
                submittedDate
                  ? `
                    <p>
                      <strong>
                        Submitted:
                      </strong>
                      ${formatDate(
                        submittedDate
                      )}
                    </p>
                  `
                  : ""
              }

              ${
                feedback
                  ? `
                    <div
                      style="
                        margin-top:15px;
                        padding:12px;
                        border-radius:10px;
                        background:#f5f7f6;
                      "
                    >
                      <strong>
                        Feedback
                      </strong>

                      <p
                        style="
                          margin-top:6px;
                        "
                      >
                        ${escapeHTML(
                          feedback
                        )}
                      </p>
                    </div>
                  `
                  : ""
              }

              ${
                !submission
                  ? `
                    <p
                      style="
                        margin-top:12px;
                        color:#777;
                      "
                    >
                      This assessment has not
                      been submitted yet.
                    </p>
                  `
                  : ""
              }

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Assessments error:",
      error
    );

    container.innerHTML = `
      <div class="card">

        <h3>
          Assessments & Results
        </h3>

        <p>
          Assessments could not be loaded
          right now. Please try again later.
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
// INITIALISE DASHBOARD
// ============================================================

async function initDashboard() {
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    const user =
      await getCurrentUser();

    if (!user) {
      window.location.href =
        "login.html";

      return;
    }

    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    if (userEmailEl) {
      userEmailEl.textContent =
        user.email || "";
    }

    // --------------------------------------------------------
    // Student
    // --------------------------------------------------------

    const student =
      await getStudent(user.id);

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
    // Student name
    // --------------------------------------------------------

    loadStudentHeader(student);

    // --------------------------------------------------------
    // Load main dashboard
    // --------------------------------------------------------

    await Promise.all([
      loadEnrolments(student.id),
      loadAvailableCourses(student.id),
      loadPayments(student.id),
      loadAssessments(student.id)
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
// START DASHBOARD
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  initDashboard
);
