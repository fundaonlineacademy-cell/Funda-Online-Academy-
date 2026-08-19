// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
//
// DATABASE MATCHED VERSION
//
// FIXES:
// ✅ Auth user
// ✅ Student profile
// ✅ Student ID connection
// ✅ Approved enrolments
// ✅ Courses
// ✅ Course modules
// ✅ Lessons
// ✅ Carpentry lessons
// ✅ Lesson viewer
// ✅ Lesson completion
// ✅ Saved progress
// ✅ Course progress
// ✅ Payments display
// ✅ Policy
// ✅ Logout
//
// IMPORTANT:
// students.id is used for enrolments and lesson_progress.
// auth.users.id is used only for connecting the account.
// ============================================================

"use strict";


// ============================================================
// SUPABASE CLIENT
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let currentStudent = null;
let currentLesson = null;


// ============================================================
// ELEMENTS
// ============================================================

const studyList =
  document.getElementById("study-list");

const enrolmentsContainer =
  document.getElementById("enrolments");

const availableCourses =
  document.getElementById("available-courses");

const userName =
  document.getElementById("user-name");

const userEmail =
  document.getElementById("user-email");

const systemStatus =
  document.getElementById("system-status");

const logoutButton =
  document.getElementById("logout");

const lessonViewer =
  document.getElementById("lesson-viewer");

const lessonViewerTitle =
  document.getElementById("lesson-viewer-title");

const lessonViewerModule =
  document.getElementById("lesson-viewer-module");

const lessonViewerContent =
  document.getElementById("lesson-viewer-content");

const lessonClose =
  document.getElementById("lesson-close");

const completeLessonButton =
  document.getElementById("complete-lesson-btn");

const lessonCompleteMessage =
  document.getElementById("lesson-complete-message");

const paymentsContainer =
  document.getElementById("payments");


// ============================================================
// HELPERS
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


function money(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return escapeHtml(value);
  }

  return (
    "R " +
    number.toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );
}


function setStatus(text) {

  if (systemStatus) {
    systemStatus.textContent = text;
  }
}


function showError(
  container,
  title,
  error
) {

  if (!container) {
    return;
  }

  container.innerHTML = `

    <div class="error-study">

      <strong>
        ⚠️ ${escapeHtml(title)}
      </strong>

      <p style="margin-top:10px">

        ${escapeHtml(
          error?.message ||
          String(error)
        )}

      </p>

    </div>

  `;
}


function withTimeout(
  promise,
  milliseconds = 15000
) {

  return Promise.race([

    promise,

    new Promise((resolve, reject) => {

      setTimeout(() => {

        reject(
          new Error(
            "The database request took too long. Please refresh the page."
          )
        );

      }, milliseconds);

    })

  ]);
}


// ============================================================
// GET AUTHENTICATED USER
// ============================================================

async function getLoggedInUser() {

  console.log(
    "Checking authenticated user..."
  );

  const result =
    await withTimeout(
      db.auth.getUser()
    );

  if (result.error) {
    throw result.error;
  }

  const user =
    result?.data?.user;

  if (!user) {

    console.log(
      "No authenticated user found."
    );

    window.location.href =
      "login.html";

    return null;
  }

  console.log(
    "AUTH USER FOUND:",
    user.id,
    user.email
  );

  return user;
}


// ============================================================
// LOAD STUDENT PROFILE
//
// FIRST:
// get_my_student_profile()
//
// SECOND:
// direct students.user_id lookup
//
// THIRD:
// email fallback
//
// The RPC is the preferred secure method.
// ============================================================

async function loadStudentProfile(user) {

  if (!user?.id) {

    throw new Error(
      "The authenticated user ID is missing."
    );

  }


  console.log(
    "================================================"
  );

  console.log(
    "LOADING STUDENT PROFILE"
  );

  console.log(
    "Auth user ID:",
    user.id
  );

  console.log(
    "Auth email:",
    user.email
  );

  console.log(
    "================================================"
  );


  // ----------------------------------------------------------
  // METHOD 1
  // SECURE RPC
  // ----------------------------------------------------------

  try {

    console.log(
      "Trying get_my_student_profile()..."
    );


    const rpcResult =
      await withTimeout(

        db.rpc(
          "get_my_student_profile"
        )

      );


    console.log(
      "PROFILE RPC RESULT:",
      rpcResult
    );


    if (!rpcResult.error) {

      const rows =
        Array.isArray(
          rpcResult.data
        )
          ? rpcResult.data
          : [];


      if (rows.length > 0) {

        console.log(
          "STUDENT PROFILE FOUND THROUGH RPC:",
          rows[0]
        );

        return rows[0];

      }

    } else {

      console.warn(
        "PROFILE RPC ERROR:",
        rpcResult.error
      );

    }

  } catch (error) {

    console.warn(
      "RPC PROFILE LOOKUP FAILED:",
      error
    );

  }


  // ----------------------------------------------------------
  // METHOD 2
  // DIRECT USER ID
  // ----------------------------------------------------------

  try {

    console.log(
      "Trying students.user_id lookup..."
    );


    const directResult =
      await withTimeout(

        db
          .from("students")
          .select(
            "id,user_id,full_name,gender,south_african_id,email,mobile_whatsapp,address,created_at,updated_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle()

      );


    console.log(
      "DIRECT PROFILE RESULT:",
      directResult
    );


    if (
      !directResult.error &&
      directResult.data
    ) {

      console.log(
        "STUDENT FOUND BY USER ID:",
        directResult.data
      );

      return directResult.data;

    }


    if (directResult.error) {

      console.warn(
        "DIRECT PROFILE ERROR:",
        directResult.error
      );

    }

  } catch (error) {

    console.warn(
      "DIRECT PROFILE LOOKUP FAILED:",
      error
    );

  }


  // ----------------------------------------------------------
  // METHOD 3
  // EMAIL
  //
  // This is only used to help connect an existing student
  // account where the user_id link was not returned.
  // ----------------------------------------------------------

  if (user.email) {

    try {

      console.log(
        "Trying student email lookup..."
      );


      const emailResult =
        await withTimeout(

          db
            .from("students")
            .select(
              "id,user_id,full_name,gender,south_african_id,email,mobile_whatsapp,address,created_at,updated_at"
            )
            .eq(
              "email",
              user.email
            )
            .maybeSingle()

        );


      console.log(
        "EMAIL PROFILE RESULT:",
        emailResult
      );


      if (
        !emailResult.error &&
        emailResult.data
      ) {

        console.log(
          "STUDENT FOUND BY EMAIL:",
          emailResult.data
        );

        return emailResult.data;

      }

    } catch (error) {

      console.warn(
        "EMAIL PROFILE LOOKUP FAILED:",
        error
      );

    }

  }


  // ----------------------------------------------------------
  // NOTHING FOUND
  // ----------------------------------------------------------

  throw new Error(

    "Your login is working, but your student profile could not be connected to this account. " +

    "The dashboard checked the secure student profile connection, your Auth user ID, and your registered email."

  );
}


// ============================================================
// LOAD ENROLMENTS
// ============================================================

async function loadStudentEnrolments(
  studentId
) {

  if (!studentId) {

    throw new Error(
      "Student ID is missing."
    );

  }


  console.log(
    "Loading enrolments for student:",
    studentId
  );


  const result =
    await withTimeout(

      db
        .from("enrollments")
        .select(
          "id,student_id,course_id,enrollment_status,enrolled_at,amount,status"
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
        )

    );


  if (result.error) {
    throw result.error;
  }


  const all =
    result.data || [];


  console.log(
    "ALL STUDENT ENROLMENTS:",
    all
  );


  // ----------------------------------------------------------
  // Approved courses
  //
  // Accept approved from either field because the database
  // contains both enrollment_status and status.
  // ----------------------------------------------------------

  const approved =
    all.filter(
      enrollment => {

        const enrollmentStatus =
          String(
            enrollment.enrollment_status ||
            ""
          )
            .trim()
            .toLowerCase();


        const status =
          String(
            enrollment.status ||
            ""
          )
            .trim()
            .toLowerCase();


        return (
          enrollmentStatus === "approved" ||
          status === "approved"
        );

      }
    );


  console.log(
    "APPROVED ENROLMENTS:",
    approved
  );


  return {
    all,
    approved
  };
}


// ============================================================
// LOAD COURSE
// ============================================================

async function loadCourse(
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
        .maybeSingle()

    );


  if (result.error) {
    throw result.error;
  }


  return result.data;
}


// ============================================================
// LOAD MODULES
// ============================================================

async function loadModules(
  courseId
) {

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
            ascending: true
          }
        )

    );


  if (result.error) {
    throw result.error;
  }


  return result.data || [];
}


// ============================================================
// LOAD LESSONS
// ============================================================

async function loadLessons() {

  const result =
    await withTimeout(

      db
        .from("lessons")
        .select(
          "id,module_id,lesson_number,title,content,video_url,document_url,created_at,updated_at,learning_objectives,key_terms,practical_activity,knowledge_check"
        )
        .order(
          "lesson_number",
          {
            ascending: true
          }
        )

    );


  if (result.error) {
    throw result.error;
  }


  return result.data || [];
}


// ============================================================
// LOAD PROGRESS
// ============================================================

async function loadStudentProgress() {

  if (!currentStudent?.id) {
    return [];
  }


  const result =
    await withTimeout(

      db
        .from("lesson_progress")
        .select(
          "id,student_id,lesson_id,completed,completed_at,created_at,updated_at"
        )
        .eq(
          "student_id",
          currentStudent.id
        )

    );


  if (result.error) {

    console.warn(
      "LESSON PROGRESS ERROR:",
      result.error
    );

    return [];
  }


  console.log(
    "STUDENT PROGRESS:",
    result.data
  );


  return result.data || [];
}


// ============================================================
// GET LESSON CONTENT
// ============================================================

function getLessonContent(
  lesson
) {

  if (!lesson) {
    return "";
  }


  return (
    lesson.content ||
    ""
  );
}


// ============================================================
// FORMAT CONTENT
// ============================================================

function formatLessonContent(
  value
) {

  if (
    !value ||
    String(value).trim() === ""
  ) {

    return `

      <div class="empty-study">

        <div style="font-size:45px">
          📖
        </div>

        <h3 style="margin-top:10px">
          Learning content is being prepared
        </h3>

        <p style="margin-top:8px;line-height:1.6">

          This lesson has been added to the
          course, but the lesson content has
          not yet been added.

        </p>

      </div>

    `;
  }


  const text =
    String(value);


  // If HTML was entered in Supabase,
  // allow it to display.
  if (
    /<[a-z][\s\S]*>/i.test(text)
  ) {

    return text;

  }


  return text

    .split(/\n\s*\n/)

    .map(
      paragraph => {

        return `

          <p>

            ${escapeHtml(
              paragraph
            ).replace(
              /\n/g,
              "<br>"
            )}

          </p>

        `;

      }
    )

    .join("");
}


// ============================================================
// COURSE LESSONS
// ============================================================

function getCourseLessons(
  modules,
  allLessons
) {

  const moduleIds =
    new Set(
      modules.map(
        module =>
          String(module.id)
      )
    );


  return allLessons
    .filter(
      lesson =>
        moduleIds.has(
          String(
            lesson.module_id
          )
        )
    )
    .sort(
      (a, b) =>
        Number(
          a.lesson_number || 0
        ) -
        Number(
          b.lesson_number || 0
        )
    );
}


// ============================================================
// MODULE LESSONS
// ============================================================

function getModuleLessons(
  module,
  allLessons
) {

  return allLessons

    .filter(
      lesson =>
        String(
          lesson.module_id
        ) ===
        String(
          module.id
        )
    )

    .sort(
      (a, b) =>
        Number(
          a.lesson_number || 0
        ) -
        Number(
          b.lesson_number || 0
        )
    );
}


// ============================================================
// COURSE PROGRESS
// ============================================================

function calculateCourseProgress(
  lessons,
  progress
) {

  if (
    !lessons ||
    lessons.length === 0
  ) {

    return {
      completed: 0,
      total: 0,
      percentage: 0
    };

  }


  const completedIds =
    new Set(

      progress

        .filter(
          item =>
            item.completed === true
        )

        .map(
          item =>
            String(
              item.lesson_id
            )
        )

    );


  let completed =
    0;


  lessons.forEach(
    lesson => {

      if (
        completedIds.has(
          String(
            lesson.id
          )
        )
      ) {

        completed++;

      }

    }
  );


  const total =
    lessons.length;


  const percentage =
    Math.round(
      (
        completed /
        total
      ) *
      100
    );


  return {
    completed,
    total,
    percentage
  };
}


// ============================================================
// RENDER COURSE
// ============================================================

function renderCourse(
  enrollment,
  course,
  modules,
  allLessons,
  progress
) {

  if (!studyList) {
    return;
  }


  const lessons =
    getCourseLessons(
      modules,
      allLessons
    );


  const courseProgress =
    calculateCourseProgress(
      lessons,
      progress
    );


  const completedIds =
    new Set(

      progress

        .filter(
          item =>
            item.completed === true
        )

        .map(
          item =>
            String(
              item.lesson_id
            )
        )

    );


  const courseName =
    course.title ||
    "Course";


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "study-card";


  let modulesHtml =
    "";


  if (
    modules.length === 0
  ) {

    modulesHtml = `

      <div class="empty-study">

        <div style="font-size:42px">
          📚
        </div>

        <h3>
          Course modules are being prepared
        </h3>

      </div>

    `;

  } else {

    modulesHtml =
      modules

        .map(
          (module, moduleIndex) => {

            const moduleLessons =
              getModuleLessons(
                module,
                allLessons
              );


            const lessonsHtml =
              moduleLessons.length === 0

                ? `

                  <div class="empty-study">

                    📖 Lessons are being prepared.

                  </div>

                `

                : `

                  <div class="lesson-list">

                    ${

                      moduleLessons

                        .map(
                          lesson => {

                            const completed =
                              completedIds.has(
                                String(
                                  lesson.id
                                )
                              );


                            return `

                              <div
                                class="
                                  lesson-item
                                  ${
                                    completed
                                      ? "lesson-finished"
                                      : ""
                                  }
                                "
                              >

                                <div class="lesson-top">

                                  <span class="lesson-number">

                                    ${escapeHtml(
                                      lesson.lesson_number
                                    )}

                                  </span>


                                  <div class="lesson-main">

                                    <div class="lesson-title">

                                      ${
                                        completed
                                          ? "✅"
                                          : "📖"
                                      }

                                      ${escapeHtml(
                                        lesson.title ||
                                        "Lesson"
                                      )}

                                    </div>


                                    <div class="lesson-description">

                                      Lesson
                                      ${escapeHtml(
                                        lesson.lesson_number
                                      )}

                                    </div>


                                    <div class="lesson-actions">

                                      <button
                                        type="button"
                                        class="lesson-open"
                                        data-lesson-id="${escapeHtml(
                                          lesson.id
                                        )}"
                                        data-module-name="${escapeHtml(
                                          module.module_name
                                        )}"
                                      >

                                        📖 Open Lesson

                                      </button>


                                      <button
                                        type="button"
                                        class="review-lesson"
                                        data-lesson-id="${escapeHtml(
                                          lesson.id
                                        )}"
                                        data-module-name="${escapeHtml(
                                          module.module_name
                                        )}"
                                      >

                                        🔄 Review Lesson

                                      </button>

                                    </div>

                                  </div>

                                </div>

                              </div>

                            `;

                          }
                        )

                        .join("")

                    }

                  </div>

                `;


            return `

              <div class="module-card">

                <button
                  type="button"
                  class="module-header"
                  data-module-index="${moduleIndex}"
                >

                  <span class="module-left">

                    <span class="module-number">

                      ${escapeHtml(
                        module.module_number
                      )}

                    </span>


                    <span class="module-name">

                      ${escapeHtml(
                        module.module_name
                      )}

                    </span>

                  </span>


                  <span class="module-icon">
                    +
                  </span>

                </button>


                <div
                  class="module-content"
                  data-module-content="${moduleIndex}"
                >

                  <p class="module-description">

                    ${escapeHtml(
                      module.description ||
                      "Learning material for this module."
                    )}

                  </p>


                  ${
                    Array.isArray(
                      module.learning_outcomes
                    ) &&
                    module.learning_outcomes.length

                      ? `

                        <div
                          style="
                            margin:12px 0;
                            padding:12px;
                            border-radius:10px;
                            background:#f2f8f4;
                          "
                        >

                          <strong>
                            Learning Outcomes
                          </strong>

                          <ul
                            style="
                              margin:8px 0 0 20px;
                            "
                          >

                            ${module.learning_outcomes
                              .map(
                                outcome =>
                                  `<li>${escapeHtml(outcome)}</li>`
                              )
                              .join("")}

                          </ul>

                        </div>

                      `

                      : ""
                  }


                  <p
                    style="
                      margin-bottom:14px;
                      font-size:14px;
                      color:#68766f;
                      font-weight:700;
                    "
                  >

                    📖

                    ${moduleLessons.length}

                    ${
                      moduleLessons.length === 1
                        ? "lesson"
                        : "lessons"
                    }

                  </p>


                  ${lessonsHtml}

                </div>

              </div>

            `;

          }
        )

        .join("");

  }


  card.innerHTML = `

    <span class="funda-status approved">
      ✓ Approved
    </span>


    <h3 class="study-title">

      ${escapeHtml(
        courseName
      )}

    </h3>


    <p class="study-description">

      ${escapeHtml(
        course.description ||
        "Funda Online Academy course."
      )}

    </p>


    <div class="study-meta">

      <span>
        💰 ${money(course.price)}
      </span>


      <span>

        ⏱️

        ${
          course.duration
            ? escapeHtml(
                course.duration
              )
            : "Duration to be confirmed"
        }

      </span>


      <span>

        📚 ${modules.length}

        ${
          modules.length === 1
            ? "module"
            : "modules"
        }

      </span>


      <span>

        📖 ${lessons.length}

        ${
          lessons.length === 1
            ? "lesson"
            : "lessons"
        }

      </span>

    </div>


    <div class="study-button">

      <button
        type="button"
        class="btn green study-course-button"
      >

        📚 Study Course

      </button>

    </div>


    <div class="modules-container">

      <h3 class="modules-heading">
        📖 Course Modules
      </h3>


      ${modulesHtml}

    </div>


    <div class="progress-box">

      <div class="progress-label">

        <span>
          Course Progress
        </span>

        <span>
          ${courseProgress.percentage}%
        </span>

      </div>


      <div class="progress-track">

        <div
          class="progress-bar"
          style="
            width:${courseProgress.percentage}%;
          "
        ></div>

      </div>


      <p
        style="
          margin-top:8px;
          color:#68766f;
          font-size:13px;
        "
      >

        ${
          courseProgress.total > 0

            ? `
              ${courseProgress.completed}
              of
              ${courseProgress.total}
              lessons completed.
            `

            : `
              Your lesson progress will appear here.
            `
        }

      </p>


      ${
        courseProgress.percentage === 100

          ? `

            <div
              style="
                margin-top:14px;
                padding:14px;
                border-radius:12px;
                background:#eaf8ef;
                color:#176b38;
                font-weight:700;
              "
            >

              🎉 All course lessons completed!

              <br><br>

              Your assessment and completion
              journey can continue.

            </div>

          `

          : ""
      }

    </div>

  `;


  studyList.appendChild(
    card
  );
}


// ============================================================
// LOAD MY STUDIES
// ============================================================

async function loadMyStudies() {

  if (!studyList) {
    return;
  }


  studyList.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading your approved courses…
      </p>

    </div>

  `;


  try {

    const enrolmentData =
      await loadStudentEnrolments(
        currentStudent.id
      );


    const enrolments =
      enrolmentData.approved;


    if (
      enrolments.length === 0
    ) {

      studyList.innerHTML = `

        <div class="empty-study">

          <div style="font-size:48px">
            📚
          </div>

          <h3 style="margin-top:10px">
            No approved courses yet
          </h3>

          <p style="margin-top:8px;line-height:1.6">

            Your student profile is connected.

            <br><br>

            Once your course enrolment is approved,
            the course will appear here.

          </p>

        </div>

      `;

      return;

    }


    const allLessons =
      await loadLessons();


    const progress =
      await loadStudentProgress();


    studyList.innerHTML =
      "";


    for (
      const enrollment of enrolments
    ) {

      try {

        const course =
          await loadCourse(
            enrollment.course_id
          );


        if (!course) {

          throw new Error(
            "Course information could not be found."
          );

        }


        const modules =
          await loadModules(
            enrollment.course_id
          );


        renderCourse(
          enrollment,
          course,
          modules,
          allLessons,
          progress
        );


      } catch (error) {

        console.error(
          "COURSE ERROR:",
          error
        );


        const errorCard =
          document.createElement(
            "div"
          );


        errorCard.className =
          "error-study";


        errorCard.innerHTML = `

          <strong>
            ⚠️ Course could not be loaded
          </strong>

          <p style="margin-top:8px">

            ${escapeHtml(
              error.message ||
              String(error)
            )}

          </p>

        `;


        studyList.appendChild(
          errorCard
        );

      }

    }


    setupModuleButtons();
    setupLessonButtons();


  } catch (error) {

    console.error(
      "MY STUDIES ERROR:",
      error
    );


    showError(
      studyList,
      "My Studies could not be loaded",
      error
    );

  }
}


// ============================================================
// MY ENROLMENTS
// ============================================================

async function loadMyEnrolments() {

  if (!enrolmentsContainer) {
    return;
  }


  enrolmentsContainer.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading your enrolments…
      </p>

    </div>

  `;


  try {

    const data =
      await loadStudentEnrolments(
        currentStudent.id
      );


    const enrolments =
      data.all;


    if (
      enrolments.length === 0
    ) {

      enrolmentsContainer.innerHTML = `

        <div class="empty-study">

          <div style="font-size:40px">
            📝
          </div>

          <h3>
            No enrolments found
          </h3>

          <p style="margin-top:8px">

            Your student profile is connected.

          </p>

        </div>

      `;

      return;

    }


    const cards = [];


    for (
      const enrollment of enrolments
    ) {

      const course =
        await loadCourse(
          enrollment.course_id
        );


      const name =
        course?.title ||
        "Course";


      const enrollmentStatus =
        enrollment.enrollment_status ||
        enrollment.status ||
        "pending";


      const approved =
        String(
          enrollmentStatus
        )
          .toLowerCase() ===
        "approved";


      cards.push(`

        <div class="card">

          <span
            class="
              funda-status
              ${
                approved
                  ? "approved"
                  : ""
              }
            "
          >

            ${
              approved
                ? "✓ Approved"
                : escapeHtml(
                    enrollmentStatus
                  )
            }

          </span>


          <h3 style="margin-top:10px">

            ${escapeHtml(
              name
            )}

          </h3>


          <p style="margin-top:8px">

            ${
              approved
                ? "Your enrolment has been approved."
                : "Your enrolment is being processed."
            }

          </p>


          ${
            enrollment.enrolled_at

              ? `

                <p
                  style="
                    margin-top:8px;
                    color:#68766f;
                  "
                >

                  📅 Enrolled:

                  ${new Date(
                    enrollment.enrolled_at
                  ).toLocaleDateString(
                    "en-ZA"
                  )}

                </p>

              `

              : ""
          }


          ${
            enrollment.amount !== null &&
            enrollment.amount !== undefined

              ? `

                <p
                  style="
                    margin-top:8px;
                    font-weight:700;
                  "
                >

                  💰 Amount:
                  ${money(
                    enrollment.amount
                  )}

                </p>

              `

              : ""
          }

        </div>

      `);

    }


    enrolmentsContainer.innerHTML =
      cards.join("");


  } catch (error) {

    console.error(
      "ENROLMENTS ERROR:",
      error
    );


    showError(
      enrolmentsContainer,
      "Enrolments could not be loaded",
      error
    );

  }
}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  if (!paymentsContainer) {
    return;
  }


  paymentsContainer.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading payment history…
      </p>

    </div>

  `;


  try {

    const result =
      await withTimeout(

        db
          .from("payments")
          .select(
            "id,student_id,enrolment_id,amount,payment_method,status,proof_url,notes,created_at,updated_at"
          )
          .eq(
            "student_id",
            currentStudent.id
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )

      );


    if (result.error) {
      throw result.error;
    }


    const payments =
      result.data || [];


    if (
      payments.length === 0
    ) {

      paymentsContainer.innerHTML = `

        <div class="card">

          <p>
            Payment history will appear here.
          </p>

        </div>

      `;

      return;

    }


    paymentsContainer.innerHTML =
      payments
        .map(
          payment => `

            <div class="card">

              <h3>

                ${money(
                  payment.amount
                )}

              </h3>


              <p style="margin-top:8px">

                💳

                ${escapeHtml(
                  payment.payment_method ||
                  "Payment"
                )}

              </p>


              <p style="margin-top:8px">

                Status:

                <strong>

                  ${escapeHtml(
                    payment.status ||
                    "pending"
                  )}

                </strong>

              </p>


              <p
                style="
                  margin-top:8px;
                  color:#68766f;
                "
              >

                ${
                  payment.created_at
                    ? new Date(
                        payment.created_at
                      ).toLocaleDateString(
                        "en-ZA"
                      )
                    : ""
                }

              </p>

            </div>

          `
        )
        .join("");


  } catch (error) {

    console.error(
      "PAYMENTS ERROR:",
      error
    );


    showError(
      paymentsContainer,
      "Payment history could not be loaded",
      error
    );

  }
}


// ============================================================
// MODULE BUTTONS
// ============================================================

function setupModuleButtons() {

  document
    .querySelectorAll(
      "[data-module-index]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              button.getAttribute(
                "data-module-index"
              );


            const content =
              document.querySelector(
                `[data-module-content="${index}"]`
              );


            if (!content) {
              return;
            }


            const icon =
              button.querySelector(
                ".module-icon"
              );


            const isOpen =
              content.classList.contains(
                "open"
              );


            if (isOpen) {

              content.classList.remove(
                "open"
              );


              if (icon) {
                icon.textContent =
                  "+";
              }

            } else {

              content.classList.add(
                "open"
              );


              if (icon) {
                icon.textContent =
                  "−";
              }

            }

          }
        );

      }
    );
}


// ============================================================
// LESSON BUTTONS
// ============================================================

function setupLessonButtons() {

  document
    .querySelectorAll(
      ".lesson-open, .review-lesson"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openLesson(

              button.getAttribute(
                "data-lesson-id"
              ),

              button.getAttribute(
                "data-module-name"
              )

            );

          }
        );

      }
    );
}


// ============================================================
// OPEN LESSON
// ============================================================

async function openLesson(
  lessonId,
  moduleName
) {

  if (!lessonId) {
    return;
  }


  if (!lessonViewer) {

    alert(
      "The lesson viewer could not be found."
    );

    return;
  }


  lessonViewer.classList.add(
    "show"
  );


  lessonViewer.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";


  if (lessonViewerContent) {

    lessonViewerContent.innerHTML = `

      <div class="card">

        <p class="loading">
          Loading lesson content…
        </p>

      </div>

    `;

  }


  if (lessonCompleteMessage) {

    lessonCompleteMessage.style.display =
      "none";

  }


  if (completeLessonButton) {

    completeLessonButton.disabled =
      true;

    completeLessonButton.textContent =
      "Loading…";

  }


  try {

    const result =
      await withTimeout(

        db
          .from("lessons")
          .select(
            "id,module_id,lesson_number,title,content,video_url,document_url,created_at,updated_at,learning_objectives,key_terms,practical_activity,knowledge_check"
          )
          .eq(
            "id",
            lessonId
          )
          .maybeSingle()

      );


    if (result.error) {
      throw result.error;
    }


    if (!result.data) {

      throw new Error(
        "This lesson could not be found."
      );

    }


    currentLesson =
      result.data;


    if (lessonViewerTitle) {

      lessonViewerTitle.textContent =
        currentLesson.title ||
        "Lesson";

    }


    if (lessonViewerModule) {

      lessonViewerModule.textContent =
        moduleName ||
        "Course Lesson";

    }


    if (lessonViewerContent) {

      let html =
        formatLessonContent(
          currentLesson.content
        );


      if (
        currentLesson.learning_objectives
      ) {

        html += `

          <div
            style="
              margin-top:20px;
              padding:15px;
              border-radius:12px;
              background:#f2f8f4;
            "
          >

            <h3>
              🎯 Learning Objectives
            </h3>

            <p
              style="
                margin-top:8px;
                line-height:1.6;
              "
            >

              ${escapeHtml(
                currentLesson.learning_objectives
              )}

            </p>

          </div>

        `;

      }


      if (
        currentLesson.key_terms
      ) {

        html += `

          <div
            style="
              margin-top:15px;
              padding:15px;
              border-radius:12px;
              background:#f7f7f7;
            "
          >

            <h3>
              🔑 Key Terms
            </h3>

            <p
              style="
                margin-top:8px;
                line-height:1.6;
              "
            >

              ${escapeHtml(
                currentLesson.key_terms
              )}

            </p>

          </div>

        `;

      }


      if (
        currentLesson.practical_activity
      ) {

        html += `

          <div
            style="
              margin-top:15px;
              padding:15px;
              border-radius:12px;
              background:#fff8e8;
            "
          >

            <h3>
              🛠️ Practical Activity
            </h3>

            <p
              style="
                margin-top:8px;
                line-height:1.6;
              "
            >

              ${escapeHtml(
                currentLesson.practical_activity
              )}

            </p>

          </div>

        `;

      }


      if (
        currentLesson.knowledge_check
      ) {

        html += `

          <div
            style="
              margin-top:15px;
              padding:15px;
              border-radius:12px;
              background:#eef5ff;
            "
          >

            <h3>
              📝 Knowledge Check
            </h3>

            <p
              style="
                margin-top:8px;
                line-height:1.6;
              "
            >

              ${escapeHtml(
                currentLesson.knowledge_check
              )}

            </p>

          </div>

        `;

      }


      if (
        currentLesson.video_url
      ) {

        html += `

          <div
            style="
              margin-top:20px;
            "
          >

            <a
              href="${escapeHtml(
                currentLesson.video_url
              )}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn green"
            >

              ▶️ Watch Lesson Video

            </a>

          </div>

        `;

      }


      if (
        currentLesson.document_url
      ) {

        html += `

          <div
            style="
              margin-top:12px;
            "
          >

            <a
              href="${escapeHtml(
                currentLesson.document_url
              )}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn green"
            >

              📄 Open Lesson Document

            </a>

          </div>

        `;

      }


      lessonViewerContent.innerHTML =
        html;

    }


    if (completeLessonButton) {

      completeLessonButton.disabled =
        false;

      completeLessonButton.textContent =
        "✅ Mark Lesson Complete";

    }


    await checkLessonCompletion(
      currentLesson.id
    );


  } catch (error) {

    console.error(
      "LESSON ERROR:",
      error
    );


    if (lessonViewerContent) {

      lessonViewerContent.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Lesson could not be opened
          </strong>

          <p style="margin-top:8px">

            ${escapeHtml(
              error.message ||
              String(error)
            )}

          </p>

        </div>

      `;

    }

  }
}


// ============================================================
// CLOSE LESSON
// ============================================================

function closeLesson() {

  if (!lessonViewer) {
    return;
  }


  lessonViewer.classList.remove(
    "show"
  );


  lessonViewer.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";


  currentLesson =
    null;
}


if (lessonClose) {

  lessonClose.addEventListener(
    "click",
    closeLesson
  );

}


if (lessonViewer) {

  lessonViewer.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        lessonViewer
      ) {

        closeLesson();

      }

    }
  );

}


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      lessonViewer &&
      lessonViewer.classList.contains(
        "show"
      )
    ) {

      closeLesson();

    }

  }
);


// ============================================================
// CHECK LESSON COMPLETION
// ============================================================

async function checkLessonCompletion(
  lessonId
) {

  if (
    !currentStudent?.id ||
    !lessonId
  ) {

    return;

  }


  try {

    const result =
      await db
        .from("lesson_progress")
        .select(
          "id,student_id,lesson_id,completed,completed_at"
        )
        .eq(
          "student_id",
          currentStudent.id
        )
        .eq(
          "lesson_id",
          lessonId
        )
        .maybeSingle();


    if (result.error) {

      console.warn(
        "PROGRESS CHECK ERROR:",
        result.error
      );

      return;

    }


    if (
      result.data?.completed === true
    ) {

      if (lessonCompleteMessage) {

        lessonCompleteMessage.style.display =
          "block";


        lessonCompleteMessage.innerHTML = `

          <strong>
            ✅ Lesson completed
          </strong>

          <br>

          Your progress has already been saved.

        `;

      }


      if (completeLessonButton) {

        completeLessonButton.textContent =
          "✅ Lesson Completed";

        completeLessonButton.disabled =
          true;

      }

    } else {

      if (lessonCompleteMessage) {

        lessonCompleteMessage.style.display =
          "none";

      }


      if (completeLessonButton) {

        completeLessonButton.textContent =
          "✅ Mark Lesson Complete";

        completeLessonButton.disabled =
          false;

      }

    }

  } catch (error) {

    console.warn(
      "CHECK PROGRESS ERROR:",
      error
    );

  }
}


// ============================================================
// COMPLETE LESSON
// ============================================================

async function completeCurrentLesson() {

  if (
    !currentStudent?.id ||
    !currentLesson?.id
  ) {

    alert(
      "Your student profile could not be confirmed. Please log in again."
    );

    return;

  }


  if (!completeLessonButton) {
    return;
  }


  completeLessonButton.disabled =
    true;


  completeLessonButton.textContent =
    "Saving…";


  try {

    const now =
      new Date().toISOString();


    const result =
      await db
        .from("lesson_progress")
        .upsert(

          {
            student_id:
              currentStudent.id,

            lesson_id:
              currentLesson.id,

            completed:
              true,

            completed_at:
              now,

            updated_at:
              now

          },

          {
            onConflict:
              "student_id,lesson_id"
          }

        );


    if (result.error) {
      throw result.error;
    }


    if (lessonCompleteMessage) {

      lessonCompleteMessage.style.display =
        "block";


      lessonCompleteMessage.innerHTML = `

        <strong>
          ✅ Lesson completed successfully.
        </strong>

        <br>

        Your progress has been saved.

      `;

    }


    completeLessonButton.textContent =
      "✅ Lesson Completed";


    completeLessonButton.disabled =
      true;


    // Refresh course progress.
    await loadMyStudies();


  } catch (error) {

    console.error(
      "COMPLETE LESSON ERROR:",
      error
    );


    completeLessonButton.disabled =
      false;


    completeLessonButton.textContent =
      "✅ Mark Lesson Complete";


    alert(

      "The lesson opened, but the progress could not be saved.\n\n" +

      (
        error.message ||
        String(error)
      )

    );

  }

}


if (completeLessonButton) {

  completeLessonButton.addEventListener(
    "click",
    completeCurrentLesson
  );

}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses() {

  if (!availableCourses) {
    return;
  }


  availableCourses.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading available courses…
      </p>

    </div>

  `;


  try {

    const result =
      await withTimeout(

        db
          .from("courses")
          .select(
            "id,title,slug,description,duration,price,image_url,active,learning_outcomes,assessment_info,certificate_info"
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
          )

      );


    if (result.error) {
      throw result.error;
    }


    const courses =
      result.data || [];


    if (
      courses.length === 0
    ) {

      availableCourses.innerHTML = `

        <div class="empty-study">

          <div style="font-size:45px">
            📚
          </div>

          <h3>
            No courses found
          </h3>

        </div>

      `;

      return;

    }


    availableCourses.innerHTML =
      courses

        .map(
          course => `

            <div class="card available-course-card">

              <span class="available-badge">
                ✓ Available
              </span>


              <h3 style="margin-top:10px">

                ${escapeHtml(
                  course.title
                )}

              </h3>


              <p
                style="
                  margin-top:8px;
                  line-height:1.6;
                  color:#53625b;
                "
              >

                ${escapeHtml(
                  course.description ||
                  "Funda Online Academy course."
                )}

              </p>


              <div class="course-information">

                <span>
                  💰 ${money(
                    course.price
                  )}
                </span>


                <span>

                  ⏱️

                  ${
                    course.duration
                      ? escapeHtml(
                          course.duration
                        )
                      : "Duration to be confirmed"
                  }

                </span>

              </div>


              <button
                type="button"
                class="btn green"
                disabled
              >

                ✓ Available

              </button>

            </div>

          `
        )

        .join("");


  } catch (error) {

    console.error(
      "AVAILABLE COURSES ERROR:",
      error
    );


    showError(
      availableCourses,
      "Courses could not be loaded",
      error
    );

  }
}


// ============================================================
// HEADER
// ============================================================

function loadHeader() {

  if (userEmail) {

    userEmail.textContent =
      currentUser?.email ||
      currentStudent?.email ||
      "";

  }


  if (userName) {

    userName.textContent =
      currentStudent?.full_name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email ||
      "Student";

  }

}


// ============================================================
// POLICY
// ============================================================

const policyCheckbox =
  document.getElementById(
    "policy-checkbox"
  );

const acceptPolicyButton =
  document.getElementById(
    "accept-policy-btn"
  );

const policyAccepted =
  document.getElementById(
    "policy-accepted"
  );


// ============================================================
// LOAD POLICY
// ============================================================

async function loadPolicyStatus() {

  if (!currentUser) {
    return;
  }


  const key =
    "foa_policy_accepted_" +
    currentUser.id;


  if (
    localStorage.getItem(key) ===
    "true"
  ) {

    if (policyCheckbox) {

      policyCheckbox.checked =
        true;

      policyCheckbox.disabled =
        true;

    }


    if (acceptPolicyButton) {

      acceptPolicyButton.disabled =
        true;

    }


    if (policyAccepted) {

      policyAccepted.style.display =
        "block";


      policyAccepted.innerHTML = `

        <strong>
          ✅ Declaration accepted
        </strong>

        <br>

        Your declaration has already been
        accepted on this device.

      `;

    }

  }

}


// ============================================================
// ACCEPT POLICY
// ============================================================

if (acceptPolicyButton) {

  acceptPolicyButton.addEventListener(
    "click",
    () => {

      if (
        !policyCheckbox ||
        !policyCheckbox.checked
      ) {

        alert(
          "Please tick the declaration checkbox before continuing."
        );

        return;

      }


      const key =
        "foa_policy_accepted_" +
        currentUser.id;


      localStorage.setItem(
        key,
        "true"
      );


      if (policyAccepted) {

        policyAccepted.style.display =
          "block";


        policyAccepted.innerHTML = `

          <strong>
            ✅ Declaration accepted
          </strong>

          <br>

          Thank you. Your declaration has
          been recorded on this device.

        `;

      }


      policyCheckbox.disabled =
        true;


      acceptPolicyButton.disabled =
        true;

    }
  );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        const result =
          await db.auth.signOut();


        if (result.error) {
          console.error(
            "LOGOUT ERROR:",
            result.error
          );
        }

      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

      } finally {

        window.location.href =
          "login.html";

      }

    }
  );

}


// ============================================================
// START DASHBOARD
// ============================================================

async function initDashboard() {

  try {

    setStatus(
      "Connecting to Funda Online Academy…"
    );


    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    currentUser =
      await getLoggedInUser();


    if (!currentUser) {
      return;
    }


    setStatus(
      "Finding your student profile…"
    );


    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    currentStudent =
      await loadStudentProfile(
        currentUser
      );


    if (!currentStudent?.id) {

      throw new Error(
        "Student profile was found, but its student ID is missing."
      );

    }


    console.log(
      "================================================"
    );

    console.log(
      "CONNECTED STUDENT"
    );

    console.log(
      "Student ID:",
      currentStudent.id
    );

    console.log(
      "Auth ID:",
      currentUser.id
    );

    console.log(
      "Student name:",
      currentStudent.full_name
    );

    console.log(
      "Student email:",
      currentStudent.email
    );

    console.log(
      "================================================"
    );


    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    loadHeader();


    // --------------------------------------------------------
    // POLICY
    // --------------------------------------------------------

    await loadPolicyStatus();


    // --------------------------------------------------------
    // COURSES
    // --------------------------------------------------------

    setStatus(
      "Loading your courses…"
    );


    await loadMyStudies();


    // --------------------------------------------------------
    // ENROLMENTS
    // --------------------------------------------------------

    setStatus(
      "Loading your enrolments…"
    );


    await loadMyEnrolments();


    // --------------------------------------------------------
    // PAYMENTS
    // --------------------------------------------------------

    await loadPayments();


    // --------------------------------------------------------
    // AVAILABLE COURSES
    // --------------------------------------------------------

    await loadAvailableCourses();


    // --------------------------------------------------------
    // READY
    // --------------------------------------------------------

    setStatus(
      "Student dashboard ready."
    );


    console.log(
      "=========================================="
    );

    console.log(
      "FUNDA ONLINE ACADEMY DASHBOARD READY"
    );

    console.log(
      "Student:",
      currentStudent.full_name
    );

    console.log(
      "Student ID:",
      currentStudent.id
    );

    console.log(
      "Auth ID:",
      currentUser.id
    );

    console.log(
      "=========================================="
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


    setStatus(
      "Student dashboard could not finish loading."
    );


    const message =
      error?.message ||
      String(error);


    if (studyList) {

      studyList.innerHTML = `

        <div class="error-study">

          <div
            style="
              font-size:48px;
              text-align:center;
              margin-bottom:12px;
            "
          >
            👤
          </div>


          <h3
            style="
              text-align:center;
            "
          >

            Student dashboard error

          </h3>


          <p
            style="
              margin-top:12px;
              line-height:1.7;
              text-align:center;
            "
          >

            ${escapeHtml(
              message
            )}

          </p>


          <p
            style="
              margin-top:15px;
              font-size:13px;
              color:#68766f;
              text-align:center;
            "
          >

            Your login session was checked
            securely against your Funda Online
            Academy student account.

          </p>

        </div>

      `;

    }


    if (enrolmentsContainer) {

      enrolmentsContainer.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Enrolments could not be loaded
          </strong>

          <p style="margin-top:10px">

            ${escapeHtml(
              message
            )}

          </p>

        </div>

      `;

    }


    if (paymentsContainer) {

      paymentsContainer.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Payment history could not be loaded
          </strong>

        </div>

      `;

    }

  }

}


// ============================================================
// RUN DASHBOARD
// ============================================================

initDashboard();
