// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// STUDENT LEARNING SYSTEM
//
// Replace the ENTIRE dashboard.js with this file.
// DO NOT change dashboard.html yet.
// ============================================================

console.log("==========================================");
console.log("FUNDA ONLINE ACADEMY - STUDENT DASHBOARD");
console.log("STUDENT SYSTEM STARTING");
console.log("==========================================");


// ============================================================
// SUPABASE CONNECTION
// ============================================================

let db = null;

function connectDatabase() {
  try {

    if (typeof supabase === "undefined") {
      throw new Error(
        "Supabase JavaScript library is not loaded."
      );
    }

    if (!window.SUPABASE_URL) {
      throw new Error(
        "SUPABASE_URL is missing."
      );
    }

    if (!window.SUPABASE_ANON_KEY) {
      throw new Error(
        "SUPABASE_ANON_KEY is missing."
      );
    }

    db = supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log("Supabase connected successfully.");

    return true;

  } catch (error) {

    console.error(
      "Supabase connection failed:",
      error
    );

    showGlobalError(error);

    return false;
  }
}


// ============================================================
// ELEMENTS
// ============================================================

const messageEl =
  document.getElementById("message");

const studyListEl =
  document.getElementById("study-list");

const paymentListEl =
  document.getElementById("payment-list");

const enrolmentsEl =
  document.getElementById("enrolments");

const availableCoursesEl =
  document.getElementById("available-courses");


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

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
// GLOBAL ERROR
// ============================================================

function showGlobalError(error) {

  const text =
    error && error.message
      ? error.message
      : String(error);

  console.error(
    "Student system error:",
    text
  );

  if (messageEl) {

    messageEl.textContent =
      "Student system error: " + text;

    messageEl.className =
      "message error";
  }

  if (studyListEl) {

    studyListEl.innerHTML = `
      <div style="
        padding:20px;
        border:2px solid #d33;
        border-radius:15px;
        background:#fff4f4;
      ">

        <strong>
          Unable to load My Studies
        </strong>

        <p style="
          margin-top:10px;
          color:#555;
        ">
          ${escapeHtml(text)}
        </p>

      </div>
    `;
  }
}


// ============================================================
// LOADING
// ============================================================

function setStudyLoading(text) {

  if (!studyListEl) {
    return;
  }

  studyListEl.innerHTML = `
    <div style="
      padding:20px;
      border-radius:15px;
      background:#fff;
      border:1px solid #ddd;
    ">
      ${escapeHtml(text)}
    </div>
  `;
}


// ============================================================
// STATUS MESSAGE
// ============================================================

function setStatus(
  text,
  success = false
) {

  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;

  messageEl.className =
    "message " +
    (
      success
        ? "success"
        : "error"
    );
}


// ============================================================
// GET CURRENT USER
// ============================================================

async function getCurrentUser() {

  console.log(
    "Checking logged-in student..."
  );

  const result =
    await db.auth.getUser();

  if (result.error) {
    throw result.error;
  }

  if (
    !result.data ||
    !result.data.user
  ) {

    throw new Error(
      "No logged-in student was found. Please log in again."
    );
  }

  console.log(
    "Logged-in user:",
    result.data.user.id,
    result.data.user.email
  );

  return result.data.user;
}


// ============================================================
// GET STUDENT RECORD
// ============================================================

async function getStudent(user) {

  console.log(
    "Loading student profile:",
    user.id
  );

  const result =
    await db
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {

    throw new Error(
      "Your student profile could not be found."
    );
  }

  console.log(
    "Student record loaded:",
    result.data
  );

  return result.data;
}


// ============================================================
// DISPLAY STUDENT
// ============================================================

function displayStudent(
  student,
  user
) {

  const userName =
    document.getElementById("user-name");

  const userEmail =
    document.getElementById("user-email");


  if (userName) {

    userName.textContent =
      student.full_name ||
      "Student";
  }


  if (userEmail) {

    userEmail.textContent =
      user.email || "";
  }
}


// ============================================================
// GET ALL ENROLMENTS
// ============================================================

async function getEnrollments(student) {

  console.log(
    "Loading enrolments for:",
    student.id
  );

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
      .eq(
        "student_id",
        student.id
      )
      .order(
        "enrolled_at",
        {
          ascending: false
        }
      );

  if (result.error) {
    throw result.error;
  }

  const enrollments =
    result.data || [];

  console.log(
    "All enrolments:",
    enrollments
  );

  return enrollments;
}


// ============================================================
// GET COURSE
// ============================================================

async function getCourse(courseId) {

  if (!courseId) {
    return null;
  }

  const result =
    await db
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

  if (result.error) {

    console.error(
      "Course loading failed:",
      result.error
    );

    return null;
  }

  return result.data;
}


// ============================================================
// GET MODULES
// ============================================================

async function getModules(courseId) {

  console.log(
    "Loading modules for:",
    courseId
  );

  const result =
    await db
      .from("course_modules")
      .select(`
        id,
        course_id,
        module_number,
        module_name,
        description
      `)
      .eq(
        "course_id",
        courseId
      )
      .order(
        "module_number",
        {
          ascending: true
        }
      );

  if (result.error) {

    console.error(
      "Module query failed:",
      result.error
    );

    throw result.error;
  }

  return result.data || [];
}


// ============================================================
// GET LESSONS
// ============================================================
//
// Current confirmed lesson structure:
//
// id
// module_number
// module_name
// lesson_number
// title
//
// Lessons are therefore matched by module number
// and, when possible, module name.
// ============================================================

async function getLessons(module) {

  const result =
    await db
      .from("lessons")
      .select(`
        id,
        module_number,
        module_name,
        lesson_number,
        title
      `)
      .eq(
        "module_number",
        module.module_number
      )
      .order(
        "lesson_number",
        {
          ascending: true
        }
      );

  if (result.error) {

    console.warn(
      "Lessons could not be loaded:",
      result.error
    );

    return [];
  }

  let lessons =
    result.data || [];


  // Match module name when available.

  if (
    module.module_name &&
    lessons.length
  ) {

    const matchingLessons =
      lessons.filter(
        lesson =>
          !lesson.module_name ||
          lesson.module_name ===
            module.module_name
      );

    if (
      matchingLessons.length
    ) {

      lessons =
        matchingLessons;
    }
  }


  return lessons;
}


// ============================================================
// BUILD MODULE
// ============================================================

async function buildModuleHtml(
  module
) {

  const lessons =
    await getLessons(module);


  let lessonsHtml = "";


  if (lessons.length) {

    lessonsHtml =
      lessons
        .map(
          (
            lesson,
            index
          ) => {

            return `
              <div style="
                padding:14px 0;
                border-top:1px solid #e5e5e5;
              ">

                <strong>
                  Lesson
                  ${escapeHtml(
                    lesson.lesson_number ||
                    index + 1
                  )}
                </strong>

                <div style="
                  margin-top:5px;
                  color:#555;
                  line-height:1.5;
                ">
                  ${escapeHtml(
                    lesson.title ||
                    "Lesson"
                  )}
                </div>

              </div>
            `;
          }
        )
        .join("");

  } else {

    lessonsHtml = `
      <div style="
        padding:14px 0;
        color:#777;
      ">
        Learning lessons will appear here.
      </div>
    `;
  }


  return `
    <div
      class="funda-module"
      style="
        background:#fff;
        border:1px solid #ddd;
        border-radius:18px;
        margin-top:15px;
        overflow:hidden;
      "
    >

      <button
        type="button"
        class="funda-module-button"
        style="
          width:100%;
          border:0;
          background:#fff;
          padding:18px;
          text-align:left;
          cursor:pointer;
          font-size:17px;
        "
        onclick="toggleFundaModule(this)"
      >

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:15px;
        ">

          <div>

            <strong>
              Module
              ${escapeHtml(
                module.module_number
              )}
            </strong>

            <div style="
              margin-top:6px;
              font-size:16px;
              color:#333;
            ">
              ${escapeHtml(
                module.module_name ||
                "Course Module"
              )}
            </div>

          </div>

          <span class="funda-arrow">
            ▼
          </span>

        </div>

      </button>


      <div
        class="funda-module-content"
        style="
          display:none;
          padding:0 18px 18px;
        "
      >

        ${
          module.description
            ? `
              <div style="
                padding:12px 0;
                color:#555;
                line-height:1.6;
              ">
                ${escapeHtml(
                  module.description
                )}
              </div>
            `
            : ""
        }


        <div style="
          margin-top:8px;
        ">

          <strong>
            Lessons
          </strong>

          ${lessonsHtml}

        </div>

      </div>

    </div>
  `;
}


// ============================================================
// MODULE OPEN / CLOSE
// ============================================================

window.toggleFundaModule =
  function(button) {

    const module =
      button.closest(
        ".funda-module"
      );

    if (!module) {
      return;
    }

    const content =
      module.querySelector(
        ".funda-module-content"
      );

    const arrow =
      module.querySelector(
        ".funda-arrow"
      );

    if (!content) {
      return;
    }


    const isOpen =
      content.style.display ===
      "block";


    if (isOpen) {

      content.style.display =
        "none";

      if (arrow) {
        arrow.textContent =
          "▼";
      }

    } else {

      content.style.display =
        "block";

      if (arrow) {
        arrow.textContent =
          "▲";
      }
    }
  };


// ============================================================
// BUILD COURSE
// ============================================================

async function buildCourseHtml(
  enrollment,
  course
) {

  if (!course) {

    return `
      <div style="
        padding:18px;
        border:2px solid #d33;
        border-radius:15px;
        background:#fff4f4;
        margin-bottom:20px;
      ">

        <strong>
          Course information could not be found.
        </strong>

      </div>
    `;
  }


  const modules =
    await getModules(
      course.id
    );


  let modulesHtml = "";


  if (modules.length) {

    const parts = [];

    for (
      const module of modules
    ) {

      parts.push(
        await buildModuleHtml(
          module
        )
      );
    }

    modulesHtml =
      parts.join("");

  } else {

    modulesHtml = `
      <div style="
        margin-top:15px;
        padding:18px;
        background:#f7f7f7;
        border-radius:15px;
        color:#666;
      ">
        Course modules will appear here.
      </div>
    `;
  }


  const courseName =
    course.course_name ||
    course.name ||
    course.title ||
    "My Course";


  const courseDescription =
    course.description ||
    course.course_description ||
    "";


  const status =
    enrollment.enrollment_status ||
    "approved";


  return `
    <div
      class="funda-course"
      style="
        background:#fff;
        border:1px solid #ddd;
        border-radius:22px;
        padding:22px;
        margin-bottom:25px;
        box-shadow:0 5px 20px rgba(0,0,0,0.05);
      "
    >

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:15px;
        flex-wrap:wrap;
      ">

        <div>

          <div style="
            font-size:13px;
            color:#2e9d22;
            font-weight:bold;
            text-transform:uppercase;
            margin-bottom:8px;
          ">
            My Approved Course
          </div>

          <h3 style="
            margin:0;
            font-size:25px;
            line-height:1.25;
          ">
            ${escapeHtml(
              courseName
            )}
          </h3>

        </div>


        <span style="
          display:inline-block;
          padding:7px 12px;
          border-radius:20px;
          background:#e8f7ed;
          color:#218838;
          font-weight:bold;
          text-transform:capitalize;
        ">
          ${escapeHtml(
            status
          )}
        </span>

      </div>


      ${
        courseDescription
          ? `
            <p style="
              margin-top:15px;
              color:#555;
              line-height:1.6;
            ">
              ${escapeHtml(
                courseDescription
              )}
            </p>
          `
          : ""
      }


      <div style="
        margin-top:22px;
        font-size:20px;
        font-weight:bold;
      ">
        📚 Course Modules
      </div>


      ${modulesHtml}

    </div>
  `;
}


// ============================================================
// MY STUDIES
// ============================================================
//
// IMPORTANT:
// ONLY APPROVED ENROLMENTS ARE SHOWN HERE.
//
// Pending applications remain under
// "My Enrolments".
// ============================================================

async function displayMyStudies(
  enrollments
) {

  if (!studyListEl) {
    return;
  }


  // Only approved courses.

  const approvedEnrollments =
    enrollments.filter(
      enrollment =>
        String(
          enrollment.enrollment_status ||
          ""
        ).toLowerCase() ===
        "approved"
    );


  console.log(
    "Approved enrolments:",
    approvedEnrollments
  );


  if (
    !approvedEnrollments.length
  ) {

    studyListEl.innerHTML = `
      <div style="
        padding:22px;
        background:#fff;
        border:1px solid #ddd;
        border-radius:18px;
      ">

        <strong>
          No approved courses yet.
        </strong>

        <p style="
          margin-top:10px;
          color:#666;
          line-height:1.6;
        ">
          Once your enrolment has been approved,
          your course, modules and lessons will
          appear here.
        </p>

      </div>
    `;

    return;
  }


  studyListEl.innerHTML = "";


  for (
    const enrollment of
    approvedEnrollments
  ) {

    try {

      const course =
        await getCourse(
          enrollment.course_id
        );


      const html =
        await buildCourseHtml(
          enrollment,
          course
        );


      studyListEl.insertAdjacentHTML(
        "beforeend",
        html
      );

    } catch (error) {

      console.error(
        "Could not display approved course:",
        error
      );

      studyListEl.insertAdjacentHTML(
        "beforeend",
        `
          <div style="
            padding:18px;
            border:2px solid #d33;
            border-radius:15px;
            background:#fff4f4;
            margin-bottom:15px;
          ">

            Could not load one of
            your approved courses.

          </div>
        `
      );
    }
  }
}


// ============================================================
// GET COURSE NAMES FOR ENROLMENTS
// ============================================================

async function displayEnrollments(
  enrollments
) {

  if (!enrolmentsEl) {
    return;
  }


  if (!enrollments.length) {

    enrolmentsEl.innerHTML = `
      <div style="
        padding:18px;
        border-radius:15px;
        background:#fff;
      ">
        No enrolments found.
      </div>
    `;

    return;
  }


  enrolmentsEl.innerHTML = `
    <div style="
      padding:18px;
      background:#fff;
      border-radius:15px;
      border:1px solid #ddd;
      margin-bottom:15px;
    ">
      Loading your enrolment details...
    </div>
  `;


  const cards = [];


  for (
    const enrollment of
    enrollments
  ) {

    const course =
      await getCourse(
        enrollment.course_id
      );


    const courseName =
      course
        ? (
            course.course_name ||
            course.name ||
            course.title ||
            "Course"
          )
        : "Course information unavailable";


    const status =
      enrollment.enrollment_status ||
      "pending";


    const statusLower =
      String(status)
        .toLowerCase();


    let statusBackground =
      "#fff4d6";

    let statusColor =
      "#8a6500";


    if (
      statusLower ===
      "approved"
    ) {

      statusBackground =
        "#e8f7ed";

      statusColor =
        "#218838";

    } else if (
      statusLower ===
      "rejected"
    ) {

      statusBackground =
        "#fff0f0";

      statusColor =
        "#c62828";
    }


    cards.push(`
      <div style="
        background:#fff;
        border:1px solid #ddd;
        border-radius:18px;
        padding:18px;
        margin-bottom:12px;
      ">

        <div style="
          font-size:12px;
          color:#2e9d22;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:6px;
        ">
          Course
        </div>


        <h3 style="
          margin:0;
          font-size:20px;
        ">
          ${escapeHtml(
            courseName
          )}
        </h3>


        <div style="
          margin-top:12px;
        ">

          <span style="
            display:inline-block;
            padding:7px 12px;
            border-radius:20px;
            background:${statusBackground};
            color:${statusColor};
            font-weight:bold;
            text-transform:capitalize;
          ">
            ${escapeHtml(
              status
            )}
          </span>

        </div>


        ${
          enrollment.enrolled_at
            ? `
              <div style="
                margin-top:12px;
                color:#666;
                font-size:14px;
              ">
                Enrolled:
                ${escapeHtml(
                  new Date(
                    enrollment.enrolled_at
                  ).toLocaleDateString()
                )}
              </div>
            `
            : ""
        }

      </div>
    `);
  }


  enrolmentsEl.innerHTML =
    cards.join("");
}


// ============================================================
// LOAD PAYMENTS
// ============================================================

async function loadPayments(
  student
) {

  if (!paymentListEl) {
    return;
  }


  try {

    const result =
      await db
        .from("payments")
        .select("*")
        .eq(
          "student_id",
          student.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (result.error) {

      console.warn(
        "Payments query:",
        result.error
      );

      paymentListEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff;
          border-radius:15px;
        ">
          Payment history will appear here.
        </div>
      `;

      return;
    }


    const payments =
      result.data || [];


    if (!payments.length) {

      paymentListEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff;
          border-radius:15px;
        ">
          Payment history will appear here.
        </div>
      `;

      return;
    }


    paymentListEl.innerHTML =
      payments
        .map(
          payment => {

            const amount =
              payment.amount ??
              payment.total ??
              "";


            const status =
              payment.status ||
              "Recorded";


            return `
              <div style="
                background:#fff;
                border:1px solid #ddd;
                border-radius:18px;
                padding:18px;
                margin-bottom:12px;
              ">

                <strong>
                  💳 Payment
                </strong>


                <div style="
                  margin-top:10px;
                ">
                  Amount:
                  <strong>
                    R${escapeHtml(
                      amount
                    )}
                  </strong>
                </div>


                <div style="
                  margin-top:7px;
                ">
                  Status:
                  ${escapeHtml(
                    status
                  )}
                </div>

              </div>
            `;
          }
        )
        .join("");


  } catch (error) {

    console.warn(
      "Payment loading error:",
      error
    );

    paymentListEl.innerHTML = `
      <div style="
        padding:18px;
        background:#fff;
        border-radius:15px;
      ">
        Payment history will appear here.
      </div>
    `;
  }
}


// ============================================================
// LOAD AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses() {

  if (!availableCoursesEl) {
    return;
  }


  availableCoursesEl.innerHTML = `
    <div style="
      padding:18px;
      background:#fff;
      border-radius:15px;
      border:1px solid #ddd;
    ">
      Loading available courses...
    </div>
  `;


  try {

    const result =
      await db
        .from("courses")
        .select("*");


    if (result.error) {

      console.error(
        "Available courses query failed:",
        result.error
      );

      availableCoursesEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff4f4;
          border:2px solid #d33;
          border-radius:15px;
        ">

          <strong>
            Courses could not be loaded.
          </strong>

          <p style="
            margin-top:8px;
            color:#666;
          ">
            ${escapeHtml(
              result.error.message
            )}
          </p>

        </div>
      `;

      return;
    }


    const courses =
      result.data || [];


    console.log(
      "Available courses:",
      courses
    );


    if (!courses.length) {

      availableCoursesEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff;
          border-radius:15px;
        ">
          No courses are currently available.
        </div>
      `;

      return;
    }


    // Sort in JavaScript so that
    // missing course_name does not
    // break the database query.

    courses.sort(
      (a, b) => {

        const nameA =
          String(
            a.course_name ||
            a.name ||
            a.title ||
            ""
          ).toLowerCase();


        const nameB =
          String(
            b.course_name ||
            b.name ||
            b.title ||
            ""
          ).toLowerCase();


        return nameA.localeCompare(
          nameB
        );
      }
    );


    availableCoursesEl.innerHTML =
      courses
        .map(
          course => {

            const name =
              course.course_name ||
              course.name ||
              course.title ||
              "Course";


            const price =
              course.price ??
              course.course_price ??
              "";


            const description =
              course.description ||
              course.course_description ||
              "";


            return `
              <div style="
                background:#fff;
                border:1px solid #ddd;
                border-radius:18px;
                padding:20px;
                margin-bottom:15px;
              ">

                <h3 style="
                  margin:0;
                  line-height:1.3;
                ">
                  ${escapeHtml(
                    name
                  )}
                </h3>


                ${
                  price !== ""
                    ? `
                      <div style="
                        margin-top:10px;
                        font-weight:bold;
                        color:#299b22;
                        font-size:18px;
                      ">
                        R${escapeHtml(
                          price
                        )}
                      </div>
                    `
                    : ""
                }


                ${
                  description
                    ? `
                      <p style="
                        margin-top:10px;
                        color:#666;
                        line-height:1.6;
                      ">
                        ${escapeHtml(
                          description
                        )}
                      </p>
                    `
                    : ""
                }

              </div>
            `;
          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Available courses error:",
      error
    );

    availableCoursesEl.innerHTML = `
      <div style="
        padding:18px;
        background:#fff4f4;
        border:2px solid #d33;
        border-radius:15px;
      ">

        <strong>
          Courses could not be loaded.
        </strong>

        <p style="
          margin-top:8px;
          color:#666;
        ">
          ${escapeHtml(
            error.message ||
            error
          )}
        </p>

      </div>
    `;
  }
}


// ============================================================
// MAIN DASHBOARD
// ============================================================

async function initDashboard() {

  console.log(
    "Starting student dashboard..."
  );


  setStudyLoading(
    "Loading your approved courses..."
  );


  try {

    // --------------------------------------------------------
    // 1. DATABASE
    // --------------------------------------------------------

    if (!connectDatabase()) {
      return;
    }


    // --------------------------------------------------------
    // 2. LOGGED-IN USER
    // --------------------------------------------------------

    const user =
      await getCurrentUser();


    // --------------------------------------------------------
    // 3. STUDENT PROFILE
    // --------------------------------------------------------

    const student =
      await getStudent(
        user
      );


    displayStudent(
      student,
      user
    );


    // --------------------------------------------------------
    // 4. ENROLMENTS
    // --------------------------------------------------------

    const enrollments =
      await getEnrollments(
        student
      );


    // --------------------------------------------------------
    // 5. MY STUDIES
    //
    // ONLY APPROVED ENROLMENTS
    // --------------------------------------------------------

    await displayMyStudies(
      enrollments
    );


    // --------------------------------------------------------
    // 6. MY ENROLMENTS
    //
    // APPROVED + PENDING + OTHER STATUS
    // --------------------------------------------------------

    await displayEnrollments(
      enrollments
    );


    // --------------------------------------------------------
    // 7. PAYMENTS
    // --------------------------------------------------------

    await loadPayments(
      student
    );


    // --------------------------------------------------------
    // 8. AVAILABLE COURSES
    // --------------------------------------------------------

    await loadAvailableCourses();


    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    setStatus(
      "Student learning system ready.",
      true
    );


    console.log(
      "=========================================="
    );

    console.log(
      "STUDENT DASHBOARD READY"
    );

    console.log(
      "=========================================="
    );


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );

    showGlobalError(
      error
    );

    setStatus(
      "Student learning system could not load.",
      false
    );
  }
}


// ============================================================
// START
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "DOM READY"
    );

    initDashboard();

  }
);
