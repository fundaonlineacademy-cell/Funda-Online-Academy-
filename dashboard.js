// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COMPLETE STUDENT LEARNING SYSTEM
//
// REPLACE THE ENTIRE dashboard.js WITH THIS FILE
//
// IMPORTANT:
// - This version has request timeouts.
// - It will NOT remain stuck on "Loading" forever.
// - It does NOT assume courses have an "active" column.
// - It shows the exact database operation that fails.
// - It supports:
//     Student profile
//     Enrolments
//     Approved courses
//     Course modules
//     Lessons
//     Lesson content
//     Lesson progress
//     Payments
//     Available courses
// ============================================================

console.log("==========================================");
console.log("FUNDA ONLINE ACADEMY");
console.log("STUDENT DASHBOARD");
console.log("VERSION: TIMEOUT + DIAGNOSTIC");
console.log("==========================================");


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let db = null;

let currentUser = null;

let currentStudent = null;

let currentProgress = [];


// ============================================================
// REQUEST TIMEOUT
// ============================================================

const REQUEST_TIMEOUT = 10000;


// ============================================================
// ELEMENTS
// ============================================================

let messageEl = null;

let studyListEl = null;

let paymentListEl = null;

let enrolmentsEl = null;

let availableCoursesEl = null;


// ============================================================
// INITIALISE ELEMENT REFERENCES
// ============================================================

function getElements() {

  messageEl =
    document.getElementById("message");

  studyListEl =
    document.getElementById("study-list");

  paymentListEl =
    document.getElementById("payment-list");

  enrolmentsEl =
    document.getElementById("enrolments");

  availableCoursesEl =
    document.getElementById("available-courses");

}


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
// SET STUDY LOADING
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
      color:#555;
    ">
      ${escapeHtml(text)}
    </div>
  `;
}


// ============================================================
// SHOW ERROR
// ============================================================

function showGlobalError(error) {

  const text =
    error && error.message
      ? error.message
      : String(error);


  console.error(
    "FUNDA DASHBOARD ERROR:",
    error
  );


  setStatus(
    "Dashboard error: " + text,
    false
  );


  if (studyListEl) {

    studyListEl.innerHTML = `
      <div style="
        padding:22px;
        border:2px solid #d33;
        border-radius:16px;
        background:#fff4f4;
      ">

        <strong>
          Student dashboard could not finish loading.
        </strong>

        <p style="
          margin-top:12px;
          color:#555;
          line-height:1.6;
        ">
          ${escapeHtml(text)}
        </p>

        <p style="
          margin-top:12px;
          color:#777;
          font-size:14px;
        ">
          Please refresh the page. If this message
          remains, send me the exact message shown
          above.
        </p>

      </div>
    `;
  }
}


// ============================================================
// DATABASE CONNECTION
// ============================================================

function connectDatabase() {

  console.log(
    "STEP 1: Connecting to Supabase..."
  );


  try {

    if (
      typeof supabase ===
      "undefined"
    ) {

      throw new Error(
        "Supabase JavaScript library is not loaded."
      );
    }


    if (
      !window.SUPABASE_URL
    ) {

      throw new Error(
        "SUPABASE_URL is missing."
      );
    }


    if (
      !window.SUPABASE_ANON_KEY
    ) {

      throw new Error(
        "SUPABASE_ANON_KEY is missing."
      );
    }


    db =
      supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );


    console.log(
      "STEP 1 COMPLETE: Supabase client created."
    );


    return true;

  } catch (error) {

    console.error(
      "SUPABASE CONNECTION ERROR:",
      error
    );

    showGlobalError(error);

    return false;
  }
}


// ============================================================
// RUN WITH TIMEOUT
// ============================================================

async function withTimeout(
  promise,
  operation
) {

  let timer = null;


  const timeoutPromise =
    new Promise(
      (_, reject) => {

        timer =
          setTimeout(
            function() {

              reject(
                new Error(
                  operation +
                  " timed out after " +
                  REQUEST_TIMEOUT +
                  " seconds."
                )
              );

            },
            REQUEST_TIMEOUT
          );
      }
    );


  try {

    return await Promise.race(
      [
        promise,
        timeoutPromise
      ]
    );

  } finally {

    if (timer) {
      clearTimeout(timer);
    }
  }
}


// ============================================================
// GET AUTH USER
// ============================================================

async function getCurrentUser() {

  console.log(
    "STEP 2: Checking logged-in student..."
  );


  const result =
    await withTimeout(
      db.auth.getUser(),
      "Checking student login"
    );


  if (result.error) {

    throw new Error(
      "Login check failed: " +
      result.error.message
    );
  }


  if (
    !result.data ||
    !result.data.user
  ) {

    throw new Error(
      "No logged-in student was found. Please log in again."
    );
  }


  currentUser =
    result.data.user;


  console.log(
    "STEP 2 COMPLETE: Logged-in user:",
    currentUser.id
  );


  return currentUser;
}


// ============================================================
// GET STUDENT PROFILE
// ============================================================

async function getStudent(user) {

  console.log(
    "STEP 3: Loading student profile..."
  );


  const result =
    await withTimeout(
      db
        .from("students")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle(),

      "Loading student profile"
    );


  if (result.error) {

    throw new Error(
      "Student profile query failed: " +
      result.error.message
    );
  }


  if (!result.data) {

    throw new Error(
      "No student profile was found for this account."
    );
  }


  currentStudent =
    result.data;


  console.log(
    "STEP 3 COMPLETE: Student:",
    currentStudent
  );


  return currentStudent;
}


// ============================================================
// DISPLAY STUDENT
// ============================================================

function displayStudent(
  student,
  user
) {

  const userName =
    document.getElementById(
      "user-name"
    );


  const userEmail =
    document.getElementById(
      "user-email"
    );


  if (userName) {

    userName.textContent =
      student.full_name ||
      "Student";
  }


  if (userEmail) {

    userEmail.textContent =
      user.email ||
      "";
  }
}


// ============================================================
// GET ENROLMENTS
// ============================================================

async function getEnrollments(student) {

  console.log(
    "STEP 4: Loading enrolments..."
  );


  const result =
    await withTimeout(
      db
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
            ascending:false
          }
        ),

      "Loading enrolments"
    );


  if (result.error) {

    throw new Error(
      "Enrolments query failed: " +
      result.error.message
    );
  }


  const rows =
    result.data || [];


  console.log(
    "STEP 4 COMPLETE: Enrolments:",
    rows
  );


  return rows;
}


// ============================================================
// GET COURSE
// ============================================================

async function getCourse(
  courseId
) {

  if (!courseId) {
    return null;
  }


  const result =
    await withTimeout(
      db
        .from("courses")
        .select("*")
        .eq(
          "id",
          courseId
        )
        .maybeSingle(),

      "Loading course"
    );


  if (result.error) {

    console.error(
      "COURSE ERROR:",
      result.error
    );

    return null;
  }


  return result.data;
}


// ============================================================
// GET ALL COURSES
// ============================================================

async function getAllCourses() {

  console.log(
    "STEP 5: Loading courses..."
  );


  // IMPORTANT:
  // We intentionally do NOT use:
  //
  // .eq("active", true)
  //
  // because we do not want the dashboard
  // to fail if the courses table does not
  // have an active column.


  const result =
    await withTimeout(
      db
        .from("courses")
        .select("*"),

      "Loading courses"
    );


  if (result.error) {

    throw new Error(
      "Courses query failed: " +
      result.error.message
    );
  }


  const courses =
    result.data || [];


  console.log(
    "STEP 5 COMPLETE: Courses:",
    courses
  );


  return courses;
}


// ============================================================
// GET MODULES
// ============================================================

async function getModules(
  courseId
) {

  console.log(
    "Loading modules for course:",
    courseId
  );


  const result =
    await withTimeout(
      db
        .from("course_modules")
        .select("*")
        .eq(
          "course_id",
          courseId
        )
        .order(
          "module_number",
          {
            ascending:true
          }
        ),

      "Loading course modules"
    );


  if (result.error) {

    throw new Error(
      "Course modules query failed: " +
      result.error.message
    );
  }


  return result.data || [];
}


// ============================================================
// GET LESSONS
// ============================================================

async function getLessons(
  moduleId
) {

  console.log(
    "Loading lessons for module:",
    moduleId
  );


  const result =
    await withTimeout(
      db
        .from("lessons")
        .select(`
          id,
          module_id,
          lesson_number,
          title,
          content,
          video_url,
          document_url,
          learning_objectives,
          key_terms,
          practical_activity,
          knowledge_check
        `)
        .eq(
          "module_id",
          moduleId
        )
        .order(
          "lesson_number",
          {
            ascending:true
          }
        ),

      "Loading lessons"
    );


  if (result.error) {

    throw new Error(
      "Lessons query failed: " +
      result.error.message
    );
  }


  return result.data || [];
}


// ============================================================
// GET LESSON PROGRESS
// ============================================================

async function getLessonProgress() {

  console.log(
    "STEP 6: Loading lesson progress..."
  );


  if (!currentUser) {

    throw new Error(
      "Cannot load lesson progress because the student is not logged in."
    );
  }


  const result =
    await withTimeout(
      db
        .from("lesson_progress")
        .select(`
          id,
          student_id,
          lesson_id,
          completed,
          completed_at
        `)
        .eq(
          "student_id",
          currentUser.id
        ),

      "Loading lesson progress"
    );


  if (result.error) {

    throw new Error(
      "Lesson progress query failed: " +
      result.error.message
    );
  }


  currentProgress =
    result.data || [];


  console.log(
    "STEP 6 COMPLETE: Lesson progress:",
    currentProgress
  );


  return currentProgress;
}


// ============================================================
// CHECK COMPLETION
// ============================================================

function isLessonCompleted(
  lessonId
) {

  return currentProgress.some(
    function(row) {

      return (
        row.lesson_id ===
        lessonId &&
        row.completed === true
      );

    }
  );
}


// ============================================================
// SAVE PROGRESS
// ============================================================

async function saveLessonProgress(
  lessonId
) {

  if (!currentUser) {

    throw new Error(
      "You are not logged in."
    );
  }


  console.log(
    "Saving progress for lesson:",
    lessonId
  );


  const row = {

    student_id:
      currentUser.id,

    lesson_id:
      lessonId,

    completed:
      true,

    completed_at:
      new Date().toISOString()

  };


  const result =
    await withTimeout(
      db
        .from("lesson_progress")
        .upsert(
          row,
          {
            onConflict:
              "student_id,lesson_id"
          }
        )
        .select()
        .single(),

      "Saving lesson progress"
    );


  if (result.error) {

    throw new Error(
      "Could not save lesson progress: " +
      result.error.message
    );
  }


  console.log(
    "Progress saved:",
    result.data
  );


  return result.data;
}


// ============================================================
// MARK LESSON COMPLETE
// ============================================================

window.markFundaLessonComplete =
  async function(
    lessonId,
    button
  ) {

    try {

      if (button) {

        button.disabled =
          true;

        button.textContent =
          "Saving...";
      }


      setStatus(
        "Saving lesson progress..."
      );


      await saveLessonProgress(
        lessonId
      );


      await getLessonProgress();


      if (button) {

        button.textContent =
          "✓ Lesson Completed";

        button.style.background =
          "#218838";

        button.style.color =
          "#fff";
      }


      setStatus(
        "Lesson completed successfully.",
        true
      );


    } catch (error) {

      console.error(
        "LESSON PROGRESS ERROR:",
        error
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Mark Lesson Complete";
      }


      setStatus(
        error.message ||
        "Could not save progress.",
        false
      );
    }
  };


// ============================================================
// LESSON MODAL
// ============================================================

window.openFundaLesson =
  function(lessonId) {

    const lesson =
      window.fundaLessons
        ? window.fundaLessons[lessonId]
        : null;


    if (!lesson) {

      alert(
        "Lesson information could not be found."
      );

      return;
    }


    let modal =
      document.getElementById(
        "funda-lesson-modal"
      );


    if (!modal) {

      modal =
        document.createElement(
          "div"
        );


      modal.id =
        "funda-lesson-modal";


      modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.65);
        z-index:99999;
        overflow-y:auto;
        padding:20px;
      `;


      document.body.appendChild(
        modal
      );
    }


    const completed =
      isLessonCompleted(
        lesson.id
      );


    modal.innerHTML = `

      <div style="
        max-width:900px;
        margin:20px auto;
        background:#fff;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 10px 40px rgba(0,0,0,.3);
      ">

        <div style="
          padding:20px;
          background:#f5f7f6;
          border-bottom:1px solid #ddd;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:15px;
        ">

          <div>

            <div style="
              font-size:13px;
              color:#299b22;
              font-weight:bold;
            ">
              LESSON
              ${escapeHtml(
                lesson.lesson_number
              )}
            </div>

            <h2 style="
              margin:6px 0 0;
            ">
              ${escapeHtml(
                lesson.title ||
                "Lesson"
              )}
            </h2>

          </div>


          <button
            type="button"
            onclick="closeFundaLesson()"
            style="
              width:42px;
              height:42px;
              border:0;
              border-radius:50%;
              background:#222;
              color:#fff;
              font-size:20px;
              cursor:pointer;
            "
          >
            ×
          </button>

        </div>


        <div style="
          padding:25px;
        ">


          ${
            lesson.content
              ? `
                <div style="
                  line-height:1.8;
                  white-space:pre-wrap;
                  color:#333;
                ">
                  ${escapeHtml(
                    lesson.content
                  )}
                </div>
              `
              : `
                <div style="
                  padding:20px;
                  background:#f7f7f7;
                  border-radius:15px;
                  color:#666;
                ">
                  Lesson content will appear here.
                </div>
              `
          }


          ${
            lesson.learning_objectives
              ? `
                <div style="
                  margin-top:25px;
                  padding:20px;
                  background:#f5f9f4;
                  border-radius:15px;
                ">

                  <h3>
                    Learning Objectives
                  </h3>

                  <div style="
                    margin-top:10px;
                    line-height:1.7;
                    white-space:pre-wrap;
                  ">
                    ${escapeHtml(
                      lesson.learning_objectives
                    )}
                  </div>

                </div>
              `
              : ""
          }


          ${
            lesson.key_terms
              ? `
                <div style="
                  margin-top:20px;
                  padding:20px;
                  background:#f7f7f7;
                  border-radius:15px;
                ">

                  <h3>
                    Key Terms
                  </h3>

                  <div style="
                    margin-top:10px;
                    line-height:1.7;
                    white-space:pre-wrap;
                  ">
                    ${escapeHtml(
                      lesson.key_terms
                    )}
                  </div>

                </div>
              `
              : ""
          }


          ${
            lesson.practical_activity
              ? `
                <div style="
                  margin-top:20px;
                  padding:20px;
                  background:#fff8e8;
                  border-radius:15px;
                ">

                  <h3>
                    Practical Activity
                  </h3>

                  <div style="
                    margin-top:10px;
                    line-height:1.7;
                    white-space:pre-wrap;
                  ">
                    ${escapeHtml(
                      lesson.practical_activity
                    )}
                  </div>

                </div>
              `
              : ""
          }


          ${
            lesson.knowledge_check
              ? `
                <div style="
                  margin-top:20px;
                  padding:20px;
                  background:#eef6ff;
                  border-radius:15px;
                ">

                  <h3>
                    Knowledge Check
                  </h3>

                  <div style="
                    margin-top:10px;
                    line-height:1.7;
                    white-space:pre-wrap;
                  ">
                    ${escapeHtml(
                      lesson.knowledge_check
                    )}
                  </div>

                </div>
              `
              : ""
          }


          ${
            lesson.video_url
              ? `
                <div style="
                  margin-top:25px;
                ">

                  <h3>
                    Lesson Video
                  </h3>

                  <a
                    href="${escapeHtml(
                      lesson.video_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      display:inline-block;
                      margin-top:10px;
                      padding:12px 18px;
                      background:#299b22;
                      color:#fff;
                      text-decoration:none;
                      border-radius:10px;
                    "
                  >
                    ▶ Open Lesson Video
                  </a>

                </div>
              `
              : ""
          }


          ${
            lesson.document_url
              ? `
                <div style="
                  margin-top:15px;
                ">

                  <a
                    href="${escapeHtml(
                      lesson.document_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      display:inline-block;
                      padding:12px 18px;
                      background:#333;
                      color:#fff;
                      text-decoration:none;
                      border-radius:10px;
                    "
                  >
                    📄 Open Lesson Document
                  </a>

                </div>
              `
              : ""
          }


          <div style="
            margin-top:30px;
            padding-top:20px;
            border-top:1px solid #ddd;
          ">

            ${
              completed
                ? `
                  <button
                    type="button"
                    disabled
                    style="
                      width:100%;
                      padding:15px;
                      border:0;
                      border-radius:12px;
                      background:#218838;
                      color:#fff;
                      font-size:16px;
                      font-weight:bold;
                    "
                  >
                    ✓ Lesson Completed
                  </button>
                `
                : `
                  <button
                    type="button"
                    onclick="
                      markFundaLessonComplete(
                        '${escapeHtml(
                          lesson.id
                        )}',
                        this
                      )
                    "
                    style="
                      width:100%;
                      padding:15px;
                      border:0;
                      border-radius:12px;
                      background:#299b22;
                      color:#fff;
                      font-size:16px;
                      font-weight:bold;
                      cursor:pointer;
                    "
                  >
                    Mark Lesson Complete
                  </button>
                `
            }

          </div>

        </div>

      </div>
    `;


    modal.style.display =
      "block";
  };


// ============================================================
// CLOSE LESSON
// ============================================================

window.closeFundaLesson =
  function() {

    const modal =
      document.getElementById(
        "funda-lesson-modal"
      );


    if (modal) {

      modal.style.display =
        "none";
    }
  };


// ============================================================
// BUILD MODULE
// ============================================================

async function buildModuleHtml(
  module
) {

  const lessons =
    await getLessons(
      module.id
    );


  if (!window.fundaLessons) {

    window.fundaLessons = {};
  }


  let lessonsHtml = "";


  if (lessons.length) {

    lessonsHtml =
      lessons
        .map(
          function(lesson) {

            window.fundaLessons[
              lesson.id
            ] = lesson;


            const completed =
              isLessonCompleted(
                lesson.id
              );


            return `

              <div
                data-lesson-id="${escapeHtml(
                  lesson.id
                )}"
                style="
                  padding:14px;
                  margin-top:10px;
                  border-radius:12px;
                  border:2px solid ${
                    completed
                      ? "#218838"
                      : "#e5e5e5"
                  };
                  background:${
                    completed
                      ? "#f0fff3"
                      : "#fff"
                  };
                "
              >

                <div style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  gap:12px;
                  flex-wrap:wrap;
                ">

                  <div>

                    <strong>
                      Lesson
                      ${escapeHtml(
                        lesson.lesson_number
                      )}
                    </strong>

                    <div style="
                      margin-top:5px;
                      color:#555;
                    ">
                      ${escapeHtml(
                        lesson.title ||
                        "Lesson"
                      )}
                    </div>

                  </div>


                  ${
                    completed
                      ? `
                        <span style="
                          padding:6px 10px;
                          border-radius:20px;
                          background:#218838;
                          color:#fff;
                          font-size:13px;
                          font-weight:bold;
                        ">
                          ✓ Completed
                        </span>
                      `
                      : ""
                  }

                </div>


                <button
                  type="button"
                  onclick="
                    openFundaLesson(
                      '${escapeHtml(
                        lesson.id
                      )}'
                    )
                  "
                  style="
                    margin-top:12px;
                    padding:10px 15px;
                    border:0;
                    border-radius:9px;
                    background:#333;
                    color:#fff;
                    cursor:pointer;
                  "
                >
                  ${
                    completed
                      ? "Review Lesson"
                      : "Open Lesson"
                  }
                </button>

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
        No lessons have been added to this module yet.
      </div>
    `;
  }


  let outcomesHtml = "";


  if (
    module.learning_outcomes
  ) {

    if (
      Array.isArray(
        module.learning_outcomes
      )
    ) {

      outcomesHtml =
        module.learning_outcomes
          .map(
            function(item) {

              return `
                <li>
                  ${escapeHtml(item)}
                </li>
              `;
            }
          )
          .join("");

    } else {

      outcomesHtml = `
        <li>
          ${escapeHtml(
            module.learning_outcomes
          )}
        </li>
      `;
    }
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
        style="
          width:100%;
          border:0;
          background:#fff;
          padding:18px;
          text-align:left;
          cursor:pointer;
          font-size:17px;
        "
        onclick="
          toggleFundaModule(this)
        "
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


        ${
          outcomesHtml
            ? `
              <div style="
                margin-top:10px;
                padding:15px;
                background:#f5f9f4;
                border-radius:12px;
              ">

                <strong>
                  Learning Outcomes
                </strong>

                <ul style="
                  margin-top:10px;
                  padding-left:20px;
                  line-height:1.7;
                ">
                  ${outcomesHtml}
                </ul>

              </div>
            `
            : ""
        }


        <div style="
          margin-top:18px;
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
// TOGGLE MODULE
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


    const open =
      content.style.display ===
      "block";


    if (open) {

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
        Course information could not be found.
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
        No modules have been added to this course yet.
      </div>
    `;
  }


  const courseName =
    course.title ||
    course.course_name ||
    course.name ||
    "My Course";


  const description =
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
        box-shadow:0 5px 20px rgba(0,0,0,.05);
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
            color:#299b22;
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
        description
          ? `
            <p style="
              margin-top:15px;
              color:#555;
              line-height:1.6;
            ">
              ${escapeHtml(
                description
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
// DISPLAY MY STUDIES
// ============================================================

async function displayMyStudies(
  enrollments
) {

  if (!studyListEl) {
    return;
  }


  const approved =
    enrollments.filter(
      function(enrollment) {

        return (
          String(
            enrollment.enrollment_status ||
            ""
          ).toLowerCase() ===
          "approved"
        );

      }
    );


  console.log(
    "APPROVED ENROLMENTS:",
    approved
  );


  if (!approved.length) {

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
          Your approved course will appear here
          once your enrolment has been approved.
        </p>

      </div>
    `;

    return;
  }


  studyListEl.innerHTML = "";


  for (
    const enrollment of approved
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
        "COURSE DISPLAY ERROR:",
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
            ${escapeHtml(
              error.message
            )}
          </div>
        `
      );
    }
  }
}


// ============================================================
// DISPLAY ENROLMENTS
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
        background:#fff;
        border-radius:15px;
      ">
        No enrolments found.
      </div>
    `;

    return;
  }


  const cards = [];


  for (
    const enrollment of enrollments
  ) {

    const course =
      await getCourse(
        enrollment.course_id
      );


    const courseName =
      course
        ? (
            course.title ||
            course.course_name ||
            course.name ||
            "Course"
          )
        : "Course information unavailable";


    const status =
      enrollment.enrollment_status ||
      "pending";


    const statusLower =
      String(status)
        .toLowerCase();


    let background =
      "#fff4d6";


    let color =
      "#8a6500";


    if (
      statusLower ===
      "approved"
    ) {

      background =
        "#e8f7ed";

      color =
        "#218838";

    } else if (
      statusLower ===
      "rejected"
    ) {

      background =
        "#fff0f0";

      color =
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
          color:#299b22;
          font-weight:bold;
          text-transform:uppercase;
        ">
          Course
        </div>


        <h3 style="
          margin:6px 0 0;
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
            background:${background};
            color:${color};
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
// PAYMENTS
// ============================================================

async function loadPayments(
  student
) {

  if (!paymentListEl) {
    return;
  }


  console.log(
    "Loading payments..."
  );


  try {

    const result =
      await withTimeout(
        db
          .from("payments")
          .select("*")
          .eq(
            "student_id",
            student.id
          )
          .order(
            "created_at",
            {
              ascending:false
            }
          ),

        "Loading payments"
      );


    if (result.error) {

      console.warn(
        "Payment query failed:",
        result.error
      );


      paymentListEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff;
          border-radius:15px;
        ">
          Payment history is not available yet.
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
          No payments recorded yet.
        </div>
      `;


      return;
    }


    paymentListEl.innerHTML =
      payments
        .map(
          function(payment) {

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
        Payment history is not available yet.
      </div>
    `;
  }
}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses() {

  if (!availableCoursesEl) {
    return;
  }


  console.log(
    "Loading available courses..."
  );


  availableCoursesEl.innerHTML = `
    <div style="
      padding:18px;
      background:#fff;
      border-radius:15px;
      border:1px solid #ddd;
    ">
      Loading courses...
    </div>
  `;


  try {

    const courses =
      await getAllCourses();


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


    courses.sort(
      function(a,b) {

        const nameA =
          String(
            a.title ||
            a.course_name ||
            a.name ||
            ""
          );


        const nameB =
          String(
            b.title ||
            b.course_name ||
            b.name ||
            ""
          );


        return nameA.localeCompare(
          nameB
        );
      }
    );


    availableCoursesEl.innerHTML =
      courses
        .map(
          function(course) {

            const name =
              course.title ||
              course.course_name ||
              course.name ||
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
      "AVAILABLE COURSES ERROR:",
      error
    );


    availableCoursesEl.innerHTML = `
      <div style="
        padding:20px;
        border:2px solid #d33;
        border-radius:15px;
        background:#fff4f4;
      ">

        <strong>
          Courses could not be loaded.
        </strong>

        <p style="
          margin-top:10px;
          color:#555;
          line-height:1.6;
        ">
          ${escapeHtml(
            error.message
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
    "=========================================="
  );

  console.log(
    "DASHBOARD INITIALISING"
  );

  console.log(
    "=========================================="
  );


  setStudyLoading(
    "Connecting to student account..."
  );


  try {

    // --------------------------------------------------------
    // STEP 1
    // --------------------------------------------------------

    if (
      !connectDatabase()
    ) {

      return;
    }


    // --------------------------------------------------------
    // STEP 2
    // --------------------------------------------------------

    setStudyLoading(
      "Checking your student account..."
    );


    const user =
      await getCurrentUser();


    // --------------------------------------------------------
    // STEP 3
    // --------------------------------------------------------

    setStudyLoading(
      "Loading your student profile..."
    );


    const student =
      await getStudent(
        user
      );


    displayStudent(
      student,
      user
    );


    // --------------------------------------------------------
    // STEP 4
    // --------------------------------------------------------

    setStudyLoading(
      "Loading your enrolments..."
    );


    const enrollments =
      await getEnrollments(
        student
      );


    // --------------------------------------------------------
    // STEP 5
    // --------------------------------------------------------

    setStudyLoading(
      "Loading your lesson progress..."
    );


    try {

      await getLessonProgress();

    } catch (progressError) {

      console.warn(
        "Lesson progress could not load:",
        progressError
      );

      // Do NOT stop the whole dashboard
      // because progress is unavailable.

      currentProgress = [];
    }


    window.fundaLessonProgress =
      currentProgress;


    window.fundaLessons =
      {};


    // --------------------------------------------------------
    // STEP 6
    // --------------------------------------------------------

    setStudyLoading(
      "Loading your courses..."
    );


    await displayMyStudies(
      enrollments
    );


    // --------------------------------------------------------
    // STEP 7
    // --------------------------------------------------------

    await displayEnrollments(
      enrollments
    );


    // --------------------------------------------------------
    // STEP 8
    // --------------------------------------------------------

    await loadPayments(
      student
    );


    // --------------------------------------------------------
    // STEP 9
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
      "=========================================="
    );

    console.error(
      "DASHBOARD FAILED"
    );

    console.error(
      error
    );

    console.error(
      "=========================================="
    );


    showGlobalError(
      error
    );
  }
}


// ============================================================
// OUTSIDE MODAL CLICK
// ============================================================

document.addEventListener(
  "click",
  function(event) {

    const modal =
      document.getElementById(
        "funda-lesson-modal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeFundaLesson();
    }

  }
);


// ============================================================
// START
// ============================================================

function startDashboard() {

  console.log(
    "DOM READY - STARTING DASHBOARD"
  );


  getElements();


  initDashboard();
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startDashboard
  );

} else {

  startDashboard();
}
