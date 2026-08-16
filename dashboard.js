// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COMPLETE VERSION
// ============================================================
//
// Features:
// - Secure student authentication
// - Student profile
// - Student name + email
// - My enrolments
// - Available courses
// - Enrolment requests
// - Course fees
// - Payment history
// - Payment status
// - Proof of payment status
// - Study Course button after approval
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
// DATE
// ============================================================

function formatDate(date) {

  if (!date) {
    return "—";
  }

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

  if (!status) {
    return "pending";
  }

  return String(status)
    .trim()
    .toLowerCase();
}


function statusLabel(status) {

  const value =
    normaliseStatus(status);

  if (value === "approved") {
    return "Approved";
  }

  if (value === "active") {
    return "Active";
  }

  if (value === "completed") {
    return "Completed";
  }

  if (value === "rejected") {
    return "Rejected";
  }

  if (value === "cancelled") {
    return "Cancelled";
  }

  return "Pending";
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
// STUDENT RECORD
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
// PROFILE
// ============================================================

async function loadStudentProfile(student, user) {

  if (userNameEl) {

    userNameEl.textContent =
      student?.full_name ||
      student?.name ||
      user?.user_metadata?.full_name ||
      "Student";
  }


  if (userEmailEl) {

    userEmailEl.textContent =
      student?.email ||
      user?.email ||
      "";
  }


  // ----------------------------------------------------------
  // Support profile containers if they exist
  // ----------------------------------------------------------

  const profileName =
    document.getElementById("profile-name");

  const profileEmail =
    document.getElementById("profile-email");

  const profileGender =
    document.getElementById("profile-gender");

  const profileId =
    document.getElementById("profile-id");

  const profileMobile =
    document.getElementById("profile-mobile");

  const profileAddress =
    document.getElementById("profile-address");


  if (profileName) {

    profileName.textContent =
      student?.full_name ||
      student?.name ||
      "—";
  }


  if (profileEmail) {

    profileEmail.textContent =
      student?.email ||
      user?.email ||
      "—";
  }


  if (profileGender) {

    profileGender.textContent =
      student?.gender ||
      "—";
  }


  if (profileId) {

    profileId.textContent =
      student?.south_african_id ||
      student?.id_number ||
      "—";
  }


  if (profileMobile) {

    profileMobile.textContent =
      student?.mobile_whatsapp ||
      student?.mobile ||
      student?.phone ||
      "—";
  }


  if (profileAddress) {

    profileAddress.textContent =
      student?.address ||
      "—";
  }


  // ----------------------------------------------------------
  // Generic profile loading container
  // ----------------------------------------------------------

  const profileContainer =
    document.getElementById("profile");

  if (profileContainer) {

    profileContainer.innerHTML = `

      <div class="card">

        <h3>
          ${escapeHTML(
            student?.full_name ||
            student?.name ||
            "Student"
          )}
        </h3>

        <p>
          <strong>Email:</strong>
          ${escapeHTML(
            student?.email ||
            user?.email ||
            "—"
          )}
        </p>

        <p>
          <strong>Gender:</strong>
          ${escapeHTML(
            student?.gender ||
            "—"
          )}
        </p>

        <p>
          <strong>Mobile / WhatsApp:</strong>
          ${escapeHTML(
            student?.mobile_whatsapp ||
            student?.mobile ||
            student?.phone ||
            "—"
          )}
        </p>

      </div>

    `;
  }


  // ----------------------------------------------------------
  // Remove loading profile text where applicable
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      ".loading-profile"
    )
    .forEach(element => {

      element.style.display = "none";

    });
}


// ============================================================
// LOAD ENROLMENTS
// ============================================================

async function loadEnrolments(studentId) {

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


    if (
      !enrolments ||
      enrolments.length === 0
    ) {

      enrolmentsEl.innerHTML = `

        <div class="card">

          <h3>
            No enrolments yet
          </h3>

          <p>
            You have not enrolled in a
            course yet.
          </p>

        </div>

      `;

      return;
    }


    // --------------------------------------------------------
    // Course IDs
    // --------------------------------------------------------

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

        courses =
          data || [];

      }
    }


    const courseMap =
      new Map();


    courses.forEach(course => {

      courseMap.set(
        course.id,
        course
      );

    });


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    enrolmentsEl.innerHTML =
      enrolments
        .map(enrolment => {

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
            normaliseStatus(
              enrolment.enrollment_status ||
              enrolment.status
            );


          const amount =
            enrolment.amount ??
            course?.price ??
            0;


          const approved =
            status === "approved" ||
            status === "active";


          return `

            <div class="card">

              <span class="badge">
                ${escapeHTML(
                  statusLabel(status)
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
                  statusLabel(status)
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
                        margin-top:15px;
                        color:#666;
                      "
                    >
                      Your enrolment is awaiting
                      approval.
                    </p>

                  `
              }

            </div>

          `;

        })
        .join("");


    // --------------------------------------------------------
    // Study buttons
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


    enrolmentsEl.innerHTML = `

      <div class="card">

        <h3>
          Unable to load enrolments
        </h3>

        <p>
          Please refresh the page and
          try again.
        </p>

      </div>

    `;

  }
}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses(studentId) {

  if (!coursesEl) {
    return;
  }


  coursesEl.innerHTML = `
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
      .eq("active", true)
      .order("title", {
        ascending: true
      });


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


    // --------------------------------------------------------
    // Existing enrolments
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


    (existing || [])
      .forEach(item => {

        enrolledMap.set(
          item.course_id,
          item.enrollment_status ||
          "pending"
        );

      });


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

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
                        statusLabel(status)
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
    // Enrol buttons
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
      "Courses error:",
      error
    );


    coursesEl.innerHTML = `

      <div class="card">

        <h3>
          Unable to load courses
        </h3>

        <p>
          Please refresh the page and
          try again.
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
    // Duplicate check
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
        statusLabel(
          existing.enrollment_status
        );


      return;
    }


    // --------------------------------------------------------
    // Course
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
    // Insert enrolment
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
          course?.price ?? null

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

async function loadPayments(studentId) {

  if (!paymentListEl) {
    return;
  }


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


    // --------------------------------------------------------
    // Course IDs
    // --------------------------------------------------------

    const courseIds = [
      ...new Set(
        payments
          .map(payment =>
            payment.course_id
          )
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
        .select(
          "id,title,name"
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


    courses.forEach(course => {

      courseMap.set(
        course.id,
        course
      );

    });


    // --------------------------------------------------------
    // Payment history
    // --------------------------------------------------------

    paymentListEl.innerHTML = `

      <div class="card">

        <h3>
          Payment History
        </h3>


        <div
          style="
            display:grid;
            gap:18px;
            margin-top:20px;
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
                  "—";


                const date =
                  payment.created_at ||
                  payment.paid_at;


                const proof =
                  payment.proof_of_payment ||
                  payment.proof_url ||
                  payment.receipt_url ||
                  payment.payment_proof;


                return `

                  <div
                    style="
                      border:1px solid #e5e5e5;
                      border-radius:20px;
                      padding:22px;
                    "
                  >

                    <h3>
                      ${escapeHTML(title)}
                    </h3>


                    <p>

                      <strong>
                        Amount paid:
                      </strong>

                      <br>

                      ${formatMoney(amount)}

                    </p>


                    <p>

                      <strong>
                        Payment method:
                      </strong>

                      <br>

                      ${escapeHTML(method)}

                    </p>


                    <p>

                      <strong>
                        Date:
                      </strong>

                      <br>

                      ${formatDate(date)}

                    </p>


                    <p>

                      <strong>
                        Status:
                      </strong>

                      <br>

                      <span
                        class="badge"
                      >
                        ${escapeHTML(
                          statusLabel(status)
                        )}
                      </span>

                    </p>


                    <p>

                      <strong>
                        Proof of payment:
                      </strong>

                      <br>

                      ${
                        proof
                          ? `

                            <a
                              href="${escapeHTML(proof)}"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="btn green"
                              style="
                                display:inline-block;
                                margin-top:10px;
                              "
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


    paymentListEl.innerHTML = `

      <div class="card">

        <h3>
          Payment History
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
    // Profile
    // --------------------------------------------------------

    await loadStudentProfile(
      student,
      user
    );


    // --------------------------------------------------------
    // Dashboard data
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

document.addEventListener(
  "DOMContentLoaded",
  initDashboard
); 
