// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// STUDENT LEARNING + LESSON PROGRESS SYSTEM
//
// COMPLETE REPLACEMENT dashboard.js
//
// IMPORTANT:
// Replace the ENTIRE existing dashboard.js with this file.
// Do NOT add this code underneath the old dashboard.js.
// ============================================================

console.log("==========================================");
console.log("FUNDA ONLINE ACADEMY");
console.log("STUDENT DASHBOARD STARTING");
console.log("==========================================");


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let db = null;
let currentUser = null;
let currentStudent = null;

window.fundaLessons = {};
window.fundaLessonProgress = [];


// ============================================================
// DASHBOARD REQUEST TIMEOUT
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
// GET ELEMENTS
// ============================================================

function getDashboardElements() {

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
// ESCAPE HTML
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
// LOADING MESSAGE
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
// GLOBAL ERROR
// ============================================================

function showGlobalError(error) {

  const text =
    error && error.message
      ? error.message
      : String(error);

  console.error(
    "STUDENT SYSTEM ERROR:",
    error
  );

  setStatus(
    "Student system error: " + text,
    false
  );

  if (studyListEl) {

    studyListEl.innerHTML = `
      <div style="
        padding:20px;
        border:2px solid #d33;
        border-radius:15px;
        background:#fff4f4;
      ">

        <strong>
          The student dashboard could not load.
        </strong>

        <p style="
          margin-top:10px;
          color:#555;
          line-height:1.6;
        ">
          ${escapeHtml(text)}
        </p>

        <button
          type="button"
          onclick="location.reload()"
          style="
            margin-top:15px;
            padding:12px 18px;
            border:0;
            border-radius:10px;
            background:#222;
            color:#fff;
            cursor:pointer;
          "
        >
          Reload Dashboard
        </button>

      </div>
    `;
  }
}


// ============================================================
// CONNECT SUPABASE
// ============================================================

function connectDatabase() {

  try {

    console.log(
      "Connecting to Supabase..."
    );


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
      "Supabase client created successfully."
    );


    return true;

  } catch (error) {

    console.error(
      "Supabase connection failed:",
      error
    );

    showGlobalError(
      error
    );

    return false;
  }
}


// ============================================================
// REQUEST WITH TIMEOUT
// ============================================================
//
// This prevents the dashboard from sitting on
// "Loading..." forever.
//
// Supabase queries themselves cannot always be cancelled
// by this wrapper, but the dashboard will stop waiting
// after the timeout and display the problem.
// ============================================================

async function withTimeout(
  promise,
  label = "Database request"
) {

  let timeoutId;


  const timeoutPromise =
    new Promise(
      (_, reject) => {

        timeoutId =
          setTimeout(
            function() {

              reject(
                new Error(
                  label +
                  " timed out after " +
                  (
                    REQUEST_TIMEOUT / 1000
                  ) +
                  " seconds."
                )
              );

            },
            REQUEST_TIMEOUT
          );
      }
    );


  try {

    return await Promise.race([
      promise,
      timeoutPromise
    ]);

  } finally {

    clearTimeout(
      timeoutId
    );
  }
}


// ============================================================
// CURRENT AUTH USER
// ============================================================

async function getCurrentUser() {

  console.log(
    "Checking logged-in student..."
  );


  const result =
    await withTimeout(
      db.auth.getUser(),
      "Checking student login"
    );


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


  currentUser =
    result.data.user;


  console.log(
    "Logged-in user:",
    currentUser.id
  );


  console.log(
    "Student email:",
    currentUser.email
  );


  return currentUser;
}


// ============================================================
// STUDENT PROFILE
// ============================================================

async function getStudent(user) {

  console.log(
    "Loading student profile..."
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
    throw result.error;
  }


  if (!result.data) {

    throw new Error(
      "Your student profile could not be found."
    );
  }


  currentStudent =
    result.data;


  console.log(
    "Student profile loaded:",
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

async function getEnrollments(
  student
) {

  console.log(
    "Loading student enrolments..."
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
    throw result.error;
  }


  const rows =
    result.data || [];


  console.log(
    "Enrolments loaded:",
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


  try {

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
        "Course error:",
        result.error
      );

      return null;
    }


    return result.data || null;

  } catch (error) {

    console.error(
      "Course timeout/error:",
      error
    );

    return null;
  }
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
        .select(`
          id,
          course_id,
          module_number,
          module_name,
          description,
          learning_outcomes
        `)
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
    throw result.error;
  }


  return result.data || [];
}


// ============================================================
// GET LESSONS
// ============================================================
//
// LESSONS ARE CONNECTED TO MODULES USING:
//
// lessons.module_id
//
// This is important.
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
    throw result.error;
  }


  return result.data || [];
}


// ============================================================
// GET LESSON PROGRESS
// ============================================================
//
// IMPORTANT:
//
// lesson_progress.student_id uses auth.uid().
//
// Therefore we use:
//
// currentUser.id
//
// NOT:
//
// currentStudent.id
// ============================================================

async function getLessonProgress() {

  if (!currentUser) {

    throw new Error(
      "Student authentication is missing."
    );
  }


  console.log(
    "Loading lesson progress..."
  );


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
    throw result.error;
  }


  const rows =
    result.data || [];


  console.log(
    "Lesson progress loaded:",
    rows
  );


  return rows;
}


// ============================================================
// CHECK LESSON COMPLETION
// ============================================================

function isLessonCompleted(
  lessonId,
  progress
) {

  return progress.some(
    row =>
      String(row.lesson_id) ===
      String(lessonId) &&
      row.completed === true
  );
}


// ============================================================
// SAVE LESSON PROGRESS
// ============================================================

async function saveLessonProgress(
  lessonId,
  completed = true
) {

  if (!db) {

    throw new Error(
      "Database is not connected."
    );
  }


  if (!currentUser) {

    throw new Error(
      "You are not logged in."
    );
  }


  if (!lessonId) {

    throw new Error(
      "Lesson ID is missing."
    );
  }


  console.log(
    "Saving lesson progress..."
  );


  const row = {

    student_id:
      currentUser.id,

    lesson_id:
      lessonId,

    completed:
      completed,

    completed_at:
      completed
        ? new Date().toISOString()
        : null
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

    console.error(
      "PROGRESS SAVE ERROR:",
      result.error
    );

    throw result.error;
  }


  console.log(
    "Lesson progress saved:",
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


      const saved =
        await saveLessonProgress(
          lessonId,
          true
        );


      // Update local progress.

      const existingIndex =
        window.fundaLessonProgress.findIndex(
          row =>
            String(row.lesson_id) ===
            String(lessonId)
        );


      if (
        existingIndex >= 0
      ) {

        window.fundaLessonProgress[
          existingIndex
        ] = saved;

      } else {

        window.fundaLessonProgress.push(
          saved
        );
      }


      if (button) {

        button.textContent =
          "✓ Lesson Completed";

        button.style.background =
          "#218838";

        button.style.color =
          "#fff";

        button.disabled =
          true;
      }


      const lessonElement =
        document.querySelector(
          `[data-lesson-id="${lessonId}"]`
        );


      if (lessonElement) {

        lessonElement.style.border =
          "2px solid #218838";

        lessonElement.style.background =
          "#f0fff3";
      }


      setStatus(
        "Lesson completed successfully.",
        true
      );


    } catch (error) {

      console.error(
        "Lesson progress save failed:",
        error
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Mark Lesson Complete";
      }


      setStatus(
        "Progress could not be saved: " +
        (
          error.message ||
          error
        ),
        false
      );
    }
  };


// ============================================================
// OPEN LESSON
// ============================================================

window.openFundaLesson =
  function(lessonId) {

    const lesson =
      window.fundaLessons
        ? window.fundaLessons[
            lessonId
          ]
        : null;


    if (!lesson) {

      console.error(
        "Lesson not found:",
        lessonId
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


    const progress =
      window.fundaLessonProgress ||
      [];


    const completed =
      isLessonCompleted(
        lesson.id,
        progress
      );


    modal.innerHTML = `

      <div style="
        max-width:900px;
        margin:20px auto;
        background:#fff;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 10px 40px rgba(0,0,0,0.25);
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
              font-weight:bold;
              color:#299b22;
              text-transform:uppercase;
            ">
              Lesson ${escapeHtml(
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
              border:0;
              background:#222;
              color:#fff;
              border-radius:50%;
              width:42px;
              height:42px;
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
                  color:#333;
                  white-space:pre-wrap;
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
  module,
  progress
) {

  const lessons =
    await getLessons(
      module.id
    );


  let lessonsHtml = "";


  if (lessons.length) {

    lessonsHtml =
      lessons
        .map(
          lesson => {

            window.fundaLessons[
              lesson.id
            ] = lesson;


            const completed =
              isLessonCompleted(
                lesson.id,
                progress
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

      if (
        module.learning_outcomes.length
      ) {

        outcomesHtml = `
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

              ${module.learning_outcomes
                .map(
                  item =>
                    `<li>${escapeHtml(
                      item
                    )}</li>`
                )
                .join("")}

            </ul>

          </div>
        `;
      }

    } else {

      outcomesHtml = `
        <div style="
          margin-top:10px;
          padding:15px;
          background:#f5f9f4;
          border-radius:12px;
          line-height:1.7;
          white-space:pre-wrap;
        ">

          <strong>
            Learning Outcomes
          </strong>

          <div style="
            margin-top:8px;
          ">
            ${escapeHtml(
              module.learning_outcomes
            )}
          </div>

        </div>
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


        ${outcomesHtml}


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
  course,
  progress
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
      const module of
      modules
    ) {

      try {

        parts.push(
          await buildModuleHtml(
            module,
            progress
          )
        );

      } catch (error) {

        console.error(
          "Module could not load:",
          error
        );


        parts.push(`
          <div style="
            margin-top:15px;
            padding:18px;
            border:1px solid #ddd;
            border-radius:15px;
            background:#fff;
          ">
            Module ${escapeHtml(
              module.module_number
            )} could not be loaded.
          </div>
        `);
      }
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
    course.title ||
    course.course_name ||
    course.name ||
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
      data-course-id="${escapeHtml(
        course.id
      )}"
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
// DISPLAY MY STUDIES
// ============================================================

async function displayMyStudies(
  enrollments,
  progress
) {

  if (!studyListEl) {
    return;
  }


  const approved =
    enrollments.filter(
      enrollment =>
        String(
          enrollment.enrollment_status ||
          ""
        ).toLowerCase() ===
        "approved"
    );


  console.log(
    "Approved courses:",
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
    approved
  ) {

    try {

      const course =
        await getCourse(
          enrollment.course_id
        );


      const html =
        await buildCourseHtml(
          enrollment,
          course,
          progress
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

            <strong>
              Course could not be loaded.
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
        border-radius:15px;
        background:#fff;
      ">
        No enrolments found.
      </div>
    `;

    return;
  }


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
      String(
        status
      ).toLowerCase();


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
          color:#299b22;
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
// PAYMENTS
// ============================================================
//
// PAYMENT HISTORY IS OPTIONAL.
// A payment problem MUST NOT stop the dashboard.
// ============================================================

async function loadPayments(
  student
) {

  if (!paymentListEl) {
    return;
  }


  paymentListEl.innerHTML = `
    <div style="
      padding:18px;
      background:#fff;
      border-radius:15px;
    ">
      Loading payment history...
    </div>
  `;


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

        "Loading payment history"
      );


    if (result.error) {
      throw result.error;
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
          No payment records yet.
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
      "Payment section unavailable:",
      error
    );


    paymentListEl.innerHTML = `
      <div style="
        padding:18px;
        background:#fff;
        border-radius:15px;
        border:1px solid #ddd;
        color:#666;
      ">
        Payment history is currently unavailable.
      </div>
    `;
  }
}


// ============================================================
// AVAILABLE COURSES
// ============================================================
//
// OPTIONAL SECTION.
// It cannot block My Studies.
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
      await withTimeout(

        db
          .from("courses")
          .select("*"),

        "Loading available courses"
      );


    if (result.error) {
      throw result.error;
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


    courses.sort(
      function(a, b) {

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
          course => {

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

    console.warn(
      "Available courses unavailable:",
      error
    );


    availableCoursesEl.innerHTML = `
      <div style="
        padding:18px;
        background:#fff;
        border-radius:15px;
        border:1px solid #ddd;
        color:#666;
      ">
        Available courses are currently unavailable.
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
    "INITIALISING STUDENT DASHBOARD"
  );

  console.log(
    "=========================================="
  );


  getDashboardElements();


  setStudyLoading(
    "Connecting to your student account..."
  );


  try {

    // --------------------------------------------------------
    // STEP 1
    // SUPABASE
    // --------------------------------------------------------

    setStatus(
      "Connecting to student system..."
    );


    if (
      !connectDatabase()
    ) {

      return;
    }


    // --------------------------------------------------------
    // STEP 2
    // AUTH
    // --------------------------------------------------------

    setStatus(
      "Checking student login..."
    );


    const user =
      await getCurrentUser();


    // --------------------------------------------------------
    // STEP 3
    // STUDENT PROFILE
    // --------------------------------------------------------

    setStatus(
      "Loading student profile..."
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
    // ENROLMENTS
    // --------------------------------------------------------

    setStatus(
      "Loading your enrolments..."
    );


    const enrollments =
      await getEnrollments(
        student
      );


    // --------------------------------------------------------
    // STEP 5
    // PROGRESS
    // --------------------------------------------------------
    //
    // IMPORTANT:
    //
    // Progress is useful but must NOT prevent
    // the dashboard from opening.
    //
    // --------------------------------------------------------

    let progress = [];


    try {

      setStatus(
        "Loading lesson progress..."
      );


      progress =
        await getLessonProgress();


    } catch (progressError) {

      console.warn(
        "Lesson progress unavailable:",
        progressError
      );


      progress = [];


      // Do NOT stop dashboard.
    }


    window.fundaLessonProgress =
      progress;


    window.fundaLessons =
      {};


    // --------------------------------------------------------
    // STEP 6
    // SHOW MAIN STUDIES
    // --------------------------------------------------------

    setStatus(
      "Loading your courses..."
    );


    await displayMyStudies(
      enrollments,
      progress
    );


    // --------------------------------------------------------
    // DASHBOARD IS NOW READY
    // --------------------------------------------------------
    //
    // From this point the student does not need
    // to wait for payments or available courses.
    //
    // --------------------------------------------------------

    setStatus(
      "Student learning system ready.",
      true
    );


    console.log(
      "=========================================="
    );

    console.log(
      "MAIN STUDENT DASHBOARD READY"
    );

    console.log(
      "=========================================="
    );


    // --------------------------------------------------------
    // OPTIONAL SECTIONS
    // LOAD AFTER MAIN DASHBOARD
    // --------------------------------------------------------

    displayEnrollments(
      enrollments
    ).catch(
      error =>
        console.warn(
          "Enrolment display error:",
          error
        )
    );


    loadPayments(
      student
    ).catch(
      error =>
        console.warn(
          "Payment display error:",
          error
        )
    );


    loadAvailableCourses().catch(
      error =>
        console.warn(
          "Available course display error:",
          error
        )
    );


  } catch (error) {

    console.error(
      "=========================================="
    );

    console.error(
      "DASHBOARD ERROR"
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


    setStatus(
      "Student learning system could not load.",
      false
    );
  }
}


// ============================================================
// START DASHBOARD
// ============================================================

function startDashboard() {

  console.log(
    "Starting dashboard..."
  );


  getDashboardElements();


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


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
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
// END
// ============================================================

console.log(
  "FUNDA STUDENT DASHBOARD SCRIPT LOADED."
);

console.log(
  "=========================================="
);
