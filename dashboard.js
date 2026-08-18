// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// STUDENT LEARNING + LESSON PROGRESS SYSTEM
//
// REPLACE THE ENTIRE dashboard.js WITH THIS FILE
// ============================================================

console.log("==========================================");
console.log("FUNDA ONLINE ACADEMY");
console.log("STUDENT DASHBOARD STARTING");
console.log("==========================================");


// ============================================================
// SUPABASE
// ============================================================

let db = null;
let currentUser = null;
let currentStudent = null;


// ============================================================
// CONNECT SUPABASE
// ============================================================

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

    console.log(
      "Supabase connected successfully."
    );

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
// STATUS
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
          Unable to load your studies.
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
// CURRENT SUPABASE USER
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

  currentUser =
    result.data.user;

  console.log(
    "Logged-in Supabase user:",
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
    await db
      .from("students")
      .select("*")
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

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
      user.email || "";
  }
}


// ============================================================
// ENROLMENTS
// ============================================================

async function getEnrollments(student) {

  console.log(
    "Loading enrolments..."
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

  return result.data || [];
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
      .eq(
        "id",
        courseId
      )
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
    "Loading course modules:",
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
          ascending: true
        }
      );

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}


// ============================================================
// GET LESSONS FOR MODULE
// ============================================================
//
// IMPORTANT:
//
// Your database showed:
//
// lessons
// - id
// - module_id
// - lesson_number
// - title
// - content
// - video_url
// - document_url
// - learning_objectives
// - key_terms
// - practical_activity
// - knowledge_check
//
// Therefore lessons are connected using module_id.
// ============================================================

async function getLessons(moduleId) {

  console.log(
    "Loading lessons for module:",
    moduleId
  );

  const result =
    await db
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
          ascending: true
        }
      );

  if (result.error) {

    console.error(
      "Lesson query failed:",
      result.error
    );

    throw result.error;
  }

  return result.data || [];
}


// ============================================================
// GET LESSON PROGRESS
// ============================================================
//
// VERY IMPORTANT:
//
// lesson_progress.student_id must match auth.uid()
// because your RLS policy says:
//
// student_id = auth.uid()
//
// Therefore we DO NOT use currentStudent.id here.
// ============================================================

async function getLessonProgress() {

  if (!currentUser) {
    return [];
  }

  console.log(
    "Loading lesson progress for auth user:",
    currentUser.id
  );

  const result =
    await db
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
      );

  if (result.error) {

    console.error(
      "Lesson progress loading failed:",
      result.error
    );

    throw result.error;
  }

  console.log(
    "Lesson progress:",
    result.data
  );

  return result.data || [];
}


// ============================================================
// IS LESSON COMPLETED?
// ============================================================

function isLessonCompleted(
  lessonId,
  progress
) {

  return progress.some(
    row =>
      row.lesson_id === lessonId &&
      row.completed === true
  );
}


// ============================================================
// SAVE LESSON PROGRESS
// ============================================================
//
// Uses UPSERT.
//
// Your database has:
//
// UNIQUE(student_id, lesson_id)
//
// Therefore upsert prevents duplicate progress rows.
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

  console.log(
    "auth.uid():",
    currentUser.id
  );

  console.log(
    "lesson_id:",
    lessonId
  );


  const row = {

    // IMPORTANT:
    // This must be auth.uid()
    // to satisfy your RLS policy.

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
    await db
      .from("lesson_progress")
      .upsert(
        row,
        {
          onConflict:
            "student_id,lesson_id"
        }
      )
      .select()
      .single();


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

        button.disabled = true;

        button.textContent =
          "Saving...";
      }


      setStatus(
        "Saving lesson progress..."
      );


      await saveLessonProgress(
        lessonId,
        true
      );


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
      }


      setStatus(
        "Lesson completed successfully.",
        true
      );


      // Recalculate progress.

      await refreshCourseProgress();


    } catch (error) {

      console.error(
        "Could not save lesson progress:",
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
        ? window.fundaLessons[lessonId]
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


  if (!window.fundaLessons) {

    window.fundaLessons = {};
  }


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
        Lessons will appear here.
      </div>
    `;
  }


  const outcomes =
    Array.isArray(
      module.learning_outcomes
    )
      ? module.learning_outcomes
      : [];


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


        ${
          outcomes.length
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

                  ${outcomes
                    .map(
                      item =>
                        `<li>${escapeHtml(
                          item
                        )}</li>`
                    )
                    .join("")}

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
          module,
          progress
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
    course.title ||
    "My Course";


  const courseDescription =
    course.description ||
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


  const approvedEnrollments =
    enrollments.filter(
      enrollment =>
        String(
          enrollment.enrollment_status ||
          ""
        ).toLowerCase() ===
        "approved"
    );


  if (!approvedEnrollments.length) {

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
          course,
          progress
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
// REFRESH COURSE PROGRESS
// ============================================================

async function refreshCourseProgress() {

  try {

    const progress =
      await getLessonProgress();


    window.fundaLessonProgress =
      progress;


    console.log(
      "Progress refreshed:",
      progress
    );

  } catch (error) {

    console.warn(
      "Could not refresh progress:",
      error
    );
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
        ? course.title
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
            ascending:false
          }
        );


    if (result.error) {

      console.warn(
        "Payment query:",
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
// AVAILABLE COURSES
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
        .select("*")
        .eq(
          "active",
          true
        );


    if (result.error) {

      console.error(
        "Available courses error:",
        result.error
      );

      availableCoursesEl.innerHTML = `
        <div style="
          padding:18px;
          background:#fff4f4;
          border:2px solid #d33;
          border-radius:15px;
        ">

          Courses could not be loaded.

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
      (a,b) =>
        String(
          a.title || ""
        ).localeCompare(
          String(
            b.title || ""
          )
        )
    );


    availableCoursesEl.innerHTML =
      courses
        .map(
          course => {

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
                  ${escapeHtml(
                    course.title
                  )}
                </h3>


                ${
                  course.price !== null &&
                  course.price !== undefined
                    ? `
                      <div style="
                        margin-top:10px;
                        font-weight:bold;
                        color:#299b22;
                        font-size:18px;
                      ">
                        R${escapeHtml(
                          course.price
                        )}
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
                        line-height:1.6;
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
        Courses could not be loaded.
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
    // 1. CONNECT DATABASE
    // --------------------------------------------------------

    if (!connectDatabase()) {
      return;
    }


    // --------------------------------------------------------
    // 2. GET AUTH USER
    // --------------------------------------------------------

    const user =
      await getCurrentUser();


    // --------------------------------------------------------
    // 3. GET STUDENT
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
    // 4. GET ENROLMENTS
    // --------------------------------------------------------

    const enrollments =
      await getEnrollments(
        student
      );


    // --------------------------------------------------------
    // 5. GET LESSON PROGRESS
    // --------------------------------------------------------

    const progress =
      await getLessonProgress();


    window.fundaLessonProgress =
      progress;


    window.fundaLessons =
      {};


    // --------------------------------------------------------
    // 6. MY STUDIES
    // --------------------------------------------------------

    await displayMyStudies(
      enrollments,
      progress
    );


    // --------------------------------------------------------
    // 7. MY ENROLMENTS
    // --------------------------------------------------------

    await displayEnrollments(
      enrollments
    );


    // --------------------------------------------------------
    // 8. PAYMENTS
    // --------------------------------------------------------

    await loadPayments(
      student
    );


    // --------------------------------------------------------
    // 9. AVAILABLE COURSES
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
      "LESSON PROGRESS SYSTEM READY"
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
// START DASHBOARD
// ============================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    function() {

      console.log(
        "DOM READY"
      );

      initDashboard();

    }
  );

} else {

  initDashboard();

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
