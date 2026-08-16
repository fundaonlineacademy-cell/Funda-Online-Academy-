// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ============================================================
// COMPLETE VERSION
//
// Includes:
// - Authentication
// - Student profile
// - Student name + email
// - My Enrolments
// - Correct course names
// - Correct course prices
// - Enrolment status
// - Available courses
// - Enrol Now
// - Course study button
// - Payment history
// - Safe logout
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
// MESSAGE
// ============================================================

function showMessage(text, success = false) {

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

  if (Number.isNaN(number)) {
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
// STATUS TEXT
// ============================================================

function formatStatus(status) {

  if (!status) {
    return "Pending";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
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
// LOAD HEADER
// ============================================================

function loadStudentHeader(student) {

  if (!student) {

    if (userNameEl) {
      userNameEl.textContent =
        "Student";
    }

    return;
  }

  const name =
    student.full_name ||
    "Student";

  if (userNameEl) {

    userNameEl.textContent =
      name;
  }
}


// ============================================================
// GET COURSES BY IDS
// ============================================================
//
// IMPORTANT:
// The courses table uses:
//
// id
// title
// price
// description
// active
//
// NOT "name".
// ============================================================

async function getCoursesByIds(courseIds) {

  if (
    !courseIds ||
    courseIds.length === 0
  ) {
    return [];
  }

  const uniqueIds = [
    ...new Set(
      courseIds.filter(Boolean)
    )
  ];

  if (uniqueIds.length === 0) {
    return [];
  }

  const {
    data,
    error
  } = await db
    .from("courses")
    .select(
      "id,title,description,price,duration,modules,active"
    )
    .in(
      "id",
      uniqueIds
    );

  if (error) {

    console.error(
      "Courses by ID error:",
      error
    );

    throw error;
  }

  return data || [];
}


// ============================================================
// LOAD MY ENROLMENTS
// ============================================================

async function loadEnrolments(studentId) {

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

    // --------------------------------------------------------
    // GET ENROLMENTS
    // --------------------------------------------------------

    const {
      data: enrolments,
      error
    } = await db
      .from("enrollments")
      .select(
        "id,student_id,course_id,enrollment_status,enrolled_at,amount"
      )
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


    // --------------------------------------------------------
    // NO ENROLMENTS
    // --------------------------------------------------------

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

    const courseIds =
      enrolments
        .map(
          enrolment =>
            enrolment.course_id
        )
        .filter(Boolean);


    // --------------------------------------------------------
    // GET COURSES
    // --------------------------------------------------------

    let courses = [];

    try {

      courses =
        await getCoursesByIds(
          courseIds
        );

    } catch (courseError) {

      console.error(
        "Unable to load course information:",
        courseError
      );

      courses = [];
    }


    // --------------------------------------------------------
    // COURSE MAP
    // --------------------------------------------------------

    const courseMap =
      new Map();

    courses.forEach(course => {

      courseMap.set(
        course.id,
        course
      );

    });


    // --------------------------------------------------------
    // BUILD CARDS
    // --------------------------------------------------------

    enrolmentsEl.innerHTML =
      enrolments
        .map(enrolment => {

          const course =
            courseMap.get(
              enrolment.course_id
            );


          // --------------------------------------------------
          // CORRECT COURSE NAME
          // --------------------------------------------------

          const title =
            course?.title ||
            "Course";


          // --------------------------------------------------
          // CORRECT DESCRIPTION
          // --------------------------------------------------

          const description =
            course?.description ||
            "Your enrolled online course.";


          // --------------------------------------------------
          // STATUS
          // --------------------------------------------------

          const status =
            enrolment.enrollment_status ||
            "pending";


          // --------------------------------------------------
          // PRICE
          // --------------------------------------------------
          //
          // First use enrolment amount.
          // If null, use courses.price.
          //
          // This fixes the R0.00 problem when
          // the enrolment amount is empty.
          // --------------------------------------------------

          let amount =
            enrolment.amount;

          if (
            amount === null ||
            amount === undefined ||
            amount === ""
          ) {

            amount =
              course?.price;
          }


          // --------------------------------------------------
          // STUDY BUTTON
          // --------------------------------------------------

          const canStudy =
            status === "approved" ||
            status === "active";


          return `
            <div class="card">

              <span class="badge">
                ${escapeHTML(
                  formatStatus(status)
                )}
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

                ${escapeHTML(
                  formatStatus(status)
                )}
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
                canStudy
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
                        margin-top:15px;
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

        })
        .join("");


    // --------------------------------------------------------
    // STUDY BUTTONS
    // --------------------------------------------------------

    document
      .querySelectorAll(
        ".study-btn"
      )
      .forEach(button => {

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

      });


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
            ${escapeHTML(
              error?.message ||
              "Please refresh the page and try again."
            )}
          </p>

        </div>
      `;
  }
}


// ============================================================
// LOAD AVAILABLE COURSES
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

    // --------------------------------------------------------
    // ACTIVE COURSES
    // --------------------------------------------------------

    const {
      data: courses,
      error
    } = await db
      .from("courses")
      .select(
        "id,title,description,price,duration,modules,active"
      )
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


    // --------------------------------------------------------
    // NO COURSES
    // --------------------------------------------------------

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
    // GET EXISTING ENROLMENTS
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


    // --------------------------------------------------------
    // ENROLMENT MAP
    // --------------------------------------------------------

    const enrolledMap =
      new Map();

    (
      existing || []
    ).forEach(item => {

      enrolledMap.set(
        item.course_id,
        item.enrollment_status
      );

    });


    // --------------------------------------------------------
    // COURSE CARDS
    // --------------------------------------------------------

    coursesEl.innerHTML =
      courses
        .map(course => {

          const title =
            course.title ||
            "Course";

          const description =
            course.description ||
            "Online short course.";

          const price =
            course.price;


          const status =
            enrolledMap.get(
              course.id
            );


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


              ${
                course.duration
                  ? `
                    <p>
                      <strong>
                        Duration:
                      </strong>

                      ${escapeHTML(
                        course.duration
                      )}
                    </p>
                  `
                  : ""
              }


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
                      ${escapeHTML(
                        formatStatus(status)
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

        })
        .join("");


    // --------------------------------------------------------
    // ENROL BUTTONS
    // --------------------------------------------------------

    document
      .querySelectorAll(
        ".enrol-btn"
      )
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
      "Available courses error:",
      error
    );

    coursesEl.innerHTML =
      `
        <div class="card">

          <h3>
            Unable to load courses
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Please refresh the page and try again."
            )}
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


  button.disabled = true;

  button.textContent =
    "Enrolling…";


  try {

    // --------------------------------------------------------
    // CHECK EXISTING ENROLMENT
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

      button.textContent =
        formatStatus(
          existing.enrollment_status
        );

      return;
    }


    // --------------------------------------------------------
    // GET COURSE
    // --------------------------------------------------------

    const {
      data: course,
      error: courseError
    } = await db
      .from("courses")
      .select(
        "id,title,price"
      )
      .eq(
        "id",
        courseId
      )
      .maybeSingle();


    if (courseError) {
      throw courseError;
    }


    if (!course) {

      throw new Error(
        "Course could not be found."
      );

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
          course.price

      });


    if (insertError) {
      throw insertError;
    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    showMessage(
      "Enrolment submitted successfully. Please wait for approval.",
      true
    );


    button.textContent =
      "Pending Approval";


    // Reload dashboard
    await Promise.all([
      loadEnrolments(
        studentId
      ),
      loadAvailableCourses(
        studentId
      )
    ]);


  } catch (error) {

    console.error(
      "Enrolment error:",
      error
    );


    showMessage(
      error?.message ||
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

    // --------------------------------------------------------
    // PAYMENT RECORDS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // NO PAYMENTS
    // --------------------------------------------------------

    if (
      !payments ||
      payments.length === 0
    ) {

      paymentListEl.innerHTML =
        `
          <div class="card">

            <h3>
              Course Payments
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

    const courseIds =
      [
        ...new Set(
          payments
            .map(
              payment =>
                payment.course_id
            )
            .filter(Boolean)
        )
      ];


    // --------------------------------------------------------
    // GET PAYMENT COURSES
    // --------------------------------------------------------

    let courses = [];


    if (
      courseIds.length > 0
    ) {

      try {

        courses =
          await getCoursesByIds(
            courseIds
          );

      } catch (error) {

        console.error(
          "Payment course lookup error:",
          error
        );

        courses = [];
      }
    }


    // --------------------------------------------------------
    // COURSE MAP
    // --------------------------------------------------------

    const courseMap =
      new Map();


    courses.forEach(course => {

      courseMap.set(
        course.id,
        course
      );

    });


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
            style="
              display:grid;
              gap:15px;
              margin-top:15px;
            "
          >

            ${
              payments
                .map(payment => {

                  const course =
                    courseMap.get(
                      payment.course_id
                    );


                  const title =
                    course?.title ||
                    "Course";


                  const amount =
                    payment.amount ??
                    course?.price ??
                    0;


                  const method =
                    payment.payment_method ||
                    "Not specified";


                  const status =
                    payment.payment_status ||
                    payment.status ||
                    "pending";


                  const date =
                    payment.created_at ||
                    payment.paid_at;


                  const proof =
                    payment.proof_url ||
                    payment.payment_proof ||
                    payment.proof_of_payment;


                  return `
                    <div
                      style="
                        padding:20px;
                        border:1px solid #e5e5e5;
                        border-radius:16px;
                        background:#fff;
                      "
                    >

                      <h3>
                        ${escapeHTML(title)}
                      </h3>


                      <p>
                        <strong>
                          Amount paid:
                        </strong>
                      </p>


                      <p>
                        ${formatMoney(amount)}
                      </p>


                      <p>
                        <strong>
                          Payment method:
                        </strong>
                      </p>


                      <p>
                        ${escapeHTML(method)}
                      </p>


                      <p>
                        <strong>
                          Date:
                        </strong>
                      </p>


                      <p>
                        ${formatDate(date)}
                      </p>


                      <p>
                        <strong>
                          Status:
                        </strong>
                      </p>


                      <span
                        class="badge"
                      >
                        ${escapeHTML(
                          formatStatus(status)
                        )}
                      </span>


                      <p
                        style="
                          margin-top:15px;
                        "
                      >
                        <strong>
                          Proof of payment:
                        </strong>
                      </p>


                      <p>
                        ${
                          proof
                            ? `
                              <a
                                href="${escapeHTML(
                                  proof
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View submitted proof
                              </a>
                            `
                            : `
                              Submitted
                            `
                        }
                      </p>

                    </div>
                  `;

                })
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
            Payments
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
// INITIALISE DASHBOARD
// ============================================================

async function initDashboard() {

  try {

    // --------------------------------------------------------
    // AUTHENTICATION
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
    // LOAD ALL DASHBOARD DATA
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
      error?.message ||
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


// ============================================================
// END OF FILE
// ============================================================
