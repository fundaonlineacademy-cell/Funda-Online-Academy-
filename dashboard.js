// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// FINAL STUDY SYSTEM
//
// IMPORTANT:
// Replace the ENTIRE dashboard.js with this file.
// DO NOT change dashboard.html.
// ============================================================

console.log("==========================================");
console.log("FUNDA ONLINE ACADEMY - STUDENT DASHBOARD");
console.log("FINAL VERSION STARTED");
console.log("==========================================");


// ============================================================
// SUPABASE CONNECTION
// ============================================================

let db = null;

function connectDatabase() {
  try {

    if (typeof supabase === "undefined") {
      throw new Error("Supabase JavaScript library is not loaded.");
    }

    if (!window.SUPABASE_URL) {
      throw new Error("SUPABASE_URL is missing.");
    }

    if (!window.SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_ANON_KEY is missing.");
    }

    db = supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log("Supabase connected.");

    return true;

  } catch (error) {

    console.error("Supabase connection failed:", error);

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
// HELPERS
// ============================================================

function escapeHtml(value) {

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


function showGlobalError(error) {

  const text =
    error && error.message
      ? error.message
      : String(error);

  if (messageEl) {

    messageEl.textContent =
      "Student system error: " + text;

    messageEl.className =
      "message error";
  }

  if (studyListEl) {

    studyListEl.innerHTML = `
      <div class="card" style="
        padding:20px;
        border:2px solid #d33;
        border-radius:15px;
        background:#fff4f4;
      ">
        <strong>Unable to load My Studies</strong>
        <p style="margin-top:10px;">
          ${escapeHtml(text)}
        </p>
      </div>
    `;
  }
}


function setStudyLoading(text) {

  if (!studyListEl) {
    return;
  }

  studyListEl.innerHTML = `
    <div class="card" style="
      padding:20px;
      border-radius:15px;
    ">
      ${escapeHtml(text)}
    </div>
  `;
}


function setStatus(text, success = false) {

  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;

  messageEl.className =
    "message " +
    (success ? "success" : "error");
}


// ============================================================
// GET LOGGED-IN USER
// ============================================================

async function getCurrentUser() {

  console.log("Checking logged-in user...");

  const result =
    await db.auth.getUser();

  if (result.error) {
    throw result.error;
  }

  if (!result.data || !result.data.user) {

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
    "Looking for student:",
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
    "Student record:",
    result.data
  );

  return result.data;
}


// ============================================================
// UPDATE STUDENT NAME / EMAIL
// ============================================================

function displayStudent(student, user) {

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
// GET ENROLMENTS
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
      .eq("student_id", student.id)
      .order("enrolled_at", {
        ascending: false
      });

  if (result.error) {
    throw result.error;
  }

  const enrollments =
    result.data || [];

  console.log(
    "Enrolments found:",
    enrollments.length,
    enrollments
  );

  return enrollments;
}


// ============================================================
// GET COURSE
// ============================================================

async function getCourse(courseId) {

  const result =
    await db
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}


// ============================================================
// GET MODULES
// ============================================================

async function getModules(courseId) {

  console.log(
    "Loading modules for course:",
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
      .eq("course_id", courseId)
      .order("module_number", {
        ascending: true
      });

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}


// ============================================================
// GET LESSONS
// ============================================================
//
// The confirmed lessons table contains:
//
// id
// module_number
// module_name
// lesson_number
// title
//
// We therefore match lessons to modules using
// module_number/module_name.
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
      .order("lesson_number", {
        ascending: true
      });

  if (result.error) {

    console.warn(
      "Lesson query failed:",
      result.error
    );

    return [];
  }

  let lessons =
    result.data || [];


  // If module names are available,
  // make sure the lessons belong to this module.

  if (
    module.module_name &&
    lessons.length
  ) {

    const matching =
      lessons.filter(
        lesson =>
          !lesson.module_name ||
          lesson.module_name === module.module_name
      );

    if (matching.length) {
      lessons = matching;
    }
  }


  return lessons;
}


// ============================================================
// BUILD MODULE HTML
// ============================================================

async function buildModuleHtml(module) {

  const lessons =
    await getLessons(module);


  let lessonsHtml = "";


  if (lessons.length) {

    lessonsHtml = lessons
      .map((lesson, index) => {

        return `
          <div style="
            padding:12px 0;
            border-top:1px solid #e5e5e5;
          ">

            <strong>
              Lesson ${escapeHtml(
                lesson.lesson_number || index + 1
              )}
            </strong>

            <div style="
              margin-top:4px;
              color:#555;
            ">
              ${escapeHtml(
                lesson.title ||
                "Lesson"
              )}
            </div>

          </div>
        `;

      })
      .join("");

  } else {

    lessonsHtml = `
      <div style="
        padding:12px 0;
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
              Module ${escapeHtml(
                module.module_number
              )}
            </strong>

            <div style="
              margin-top:5px;
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
              ">
                ${escapeHtml(
                  module.description
                )}
              </div>
            `
            : ""
        }

        <div style="
          margin-top:5px;
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
// GLOBAL MODULE TOGGLE
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
      content.style.display === "block";


    if (isOpen) {

      content.style.display =
        "none";

      if (arrow) {
        arrow.textContent = "▼";
      }

    } else {

      content.style.display =
        "block";

      if (arrow) {
        arrow.textContent = "▲";
      }
    }
  };


// ============================================================
// DISPLAY ONE COURSE
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
      ">
        Course information could not be found.
      </div>
    `;
  }


  const modules =
    await getModules(course.id);


  let modulesHtml = "";


  if (modules.length) {

    const moduleParts = [];

    for (const module of modules) {

      moduleParts.push(
        await buildModuleHtml(module)
      );
    }

    modulesHtml =
      moduleParts.join("");

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
            margin-bottom:7px;
          ">
            My Approved Course
          </div>

          <h3 style="
            margin:0;
            font-size:25px;
          ">
            ${escapeHtml(courseName)}
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
          ${escapeHtml(status)}
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
        margin-top:20px;
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
// DISPLAY MY STUDIES
// ============================================================

async function displayMyStudies(
  enrollments
) {

  if (!studyListEl) {
    return;
  }


  if (!enrollments.length) {

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


  for (const enrollment of enrollments) {

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
        "Could not display course:",
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
            Could not load one of your courses.
          </div>
        `
      );
    }
  }
}


// ============================================================
// DISPLAY ENROLMENTS
// ============================================================

function displayEnrollments(
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


  enrolmentsEl.innerHTML =
    enrollments
      .map(enrollment => {

        return `
          <div style="
            background:#fff;
            border:1px solid #ddd;
            border-radius:15px;
            padding:18px;
            margin-bottom:12px;
          ">

            <strong>
              Course ID
            </strong>

            <div style="
              margin-top:5px;
            ">
              ${escapeHtml(
                enrollment.course_id
              )}
            </div>


            <div style="
              margin-top:10px;
            ">

              <strong>
                Status:
              </strong>

              ${escapeHtml(
                enrollment.enrollment_status ||
                "Pending"
              )}

            </div>


            ${
              enrollment.enrolled_at
                ? `
                  <div style="
                    margin-top:8px;
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
        `;

      })
      .join("");
}


// ============================================================
// LOAD PAYMENTS
// ============================================================

async function loadPayments(student) {

  if (!paymentListEl) {
    return;
  }


  try {

    const result =
      await db
        .from("payments")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", {
          ascending:false
        });


    if (result.error) {

      console.warn(
        "Payments table:",
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
        .map(payment => {

          return `
            <div style="
              background:#fff;
              border:1px solid #ddd;
              border-radius:15px;
              padding:18px;
              margin-bottom:12px;
            ">

              <strong>
                Payment
              </strong>

              <div style="
                margin-top:8px;
              ">
                Amount:
                ${escapeHtml(
                  payment.amount ||
                  payment.total ||
                  ""
                )}
              </div>

              <div style="
                margin-top:6px;
              ">
                Status:
                ${escapeHtml(
                  payment.status ||
                  "Recorded"
                )}
              </div>

            </div>
          `;

        })
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


  try {

    const result =
      await db
        .from("courses")
        .select("*")
        .order("course_name", {
          ascending:true
        });


    if (result.error) {

      console.warn(
        "Courses query:",
        result.error
      );

      availableCoursesEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff;
          border-radius:15px;
        ">
          Courses will appear here.
        </div>
      `;

      return;
    }


    const courses =
      result.data || [];


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


    availableCoursesEl.innerHTML =
      courses
        .map(course => {

          const name =
            course.course_name ||
            course.name ||
            course.title ||
            "Course";


          const price =
            course.price ??
            course.course_price ??
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
              ">
                ${escapeHtml(name)}
              </h3>


              ${
                price !== ""
                  ? `
                    <div style="
                      margin-top:10px;
                      font-weight:bold;
                      color:#299b22;
                    ">
                      R${escapeHtml(price)}
                    </div>
                  `
                  : ""
              }


              ${
                course.description
                  ? `
                    <p style="
                      margin-top:10px;
                      color:#666;
                    ">
                      ${escapeHtml(
                        course.description
                      )}
                    </p>
                  `
                  : ""
              }

            </div>
          `;

        })
        .join("");


  } catch (error) {

    console.warn(
      "Available courses error:",
      error
    );

    availableCoursesEl.innerHTML = `
      <div style="
        padding:18px;
        background:#fff;
        border-radius:15px;
      ">
        Courses will appear here.
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
    // 1. Connect
    // --------------------------------------------------------

    if (!connectDatabase()) {
      return;
    }


    // --------------------------------------------------------
    // 2. User
    // --------------------------------------------------------

    const user =
      await getCurrentUser();


    // --------------------------------------------------------
    // 3. Student
    // --------------------------------------------------------

    const student =
      await getStudent(user);


    displayStudent(
      student,
      user
    );


    // --------------------------------------------------------
    // 4. Enrolments
    // --------------------------------------------------------

    const enrollments =
      await getEnrollments(student);


    // --------------------------------------------------------
    // 5. My Studies
    // --------------------------------------------------------

    await displayMyStudies(
      enrollments
    );


    // --------------------------------------------------------
    // 6. Enrolment section
    // --------------------------------------------------------

    displayEnrollments(
      enrollments
    );


    // --------------------------------------------------------
    // 7. Payments
    // --------------------------------------------------------

    await loadPayments(
      student
    );


    // --------------------------------------------------------
    // 8. Available courses
    // --------------------------------------------------------

    await loadAvailableCourses();


    // --------------------------------------------------------
    // Finished
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

    showGlobalError(error);

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
  () => {

    console.log(
      "DOM READY"
    );

    initDashboard();

  }
);
