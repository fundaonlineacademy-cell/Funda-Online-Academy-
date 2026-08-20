// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
//
// COMPLETE DATABASE-MATCHED VERSION
//
// FIXES IN THIS VERSION:
// 1. Module buttons now target the CORRECT module.
// 2. Modules from different courses no longer conflict.
// 3. Each module has a unique target ID.
// 4. Course loading is faster.
// 5. Lessons remain connected to the correct module.
// 6. Lesson progress remains connected to the student.
// 7. Existing database structure is preserved.
//
// DATABASE CONNECTION:
//
// auth.users.id -> students.user_id
// students.id   -> enrollments.student_id
// students.id   -> lesson_progress.student_id
//
// ============================================================

"use strict";

// ============================================================
// SUPABASE
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

let allLessonsCache = [];
let studentProgressCache = [];

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

const policyCheckbox =
  document.getElementById("policy-checkbox");

const acceptPolicyButton =
  document.getElementById("accept-policy-btn");

const policyAccepted =
  document.getElementById("policy-accepted");

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

// ------------------------------------------------------------

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

// ------------------------------------------------------------

function setStatus(text) {

  if (systemStatus) {
    systemStatus.textContent = text;
  }
}

// ------------------------------------------------------------

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

// ------------------------------------------------------------

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
// CREATE UNIQUE MODULE KEY
// ============================================================
//
// IMPORTANT FIX:
//
// Previously every course used:
//
// module-index = 0
// module-index = 1
// module-index = 2
//
// This caused buttons from different courses to interfere.
//
// Now every module gets a unique key based on:
// COURSE ID + MODULE ID
//
// ============================================================

function createModuleKey(
  courseId,
  moduleId
) {

  return (
    "module-" +
    String(courseId) +
    "-" +
    String(moduleId)
  );

}

// ============================================================
// AUTH
// ============================================================

async function getLoggedInUser() {

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

    window.location.href =
      "login.html";

    return null;

  }

  console.log(
    "AUTH USER:",
    user.id,
    user.email
  );

  return user;

}

// ============================================================
// STUDENT PROFILE
// ============================================================

async function loadStudentProfile(user) {

  if (!user?.id) {

    throw new Error(
      "Authenticated user ID is missing."
    );

  }

  // ----------------------------------------------------------
  // METHOD 1 — RPC
  // ----------------------------------------------------------

  try {

    const rpcResult =
      await withTimeout(

        db.rpc(
          "get_my_student_profile"
        )

      );

    if (
      !rpcResult.error &&
      Array.isArray(rpcResult.data) &&
      rpcResult.data.length > 0
    ) {

      console.log(
        "Student found through RPC:",
        rpcResult.data[0]
      );

      return rpcResult.data[0];

    }

  } catch (error) {

    console.warn(
      "Student profile RPC failed:",
      error
    );

  }

  // ----------------------------------------------------------
  // METHOD 2 — USER ID
  // ----------------------------------------------------------

  try {

    const result =
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

    if (
      !result.error &&
      result.data
    ) {

      return result.data;

    }

  } catch (error) {

    console.warn(
      "Student user_id lookup failed:",
      error
    );

  }

  // ----------------------------------------------------------
  // METHOD 3 — EMAIL
  // ----------------------------------------------------------

  if (user.email) {

    try {

      const result =
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

      if (
        !result.error &&
        result.data
      ) {

        return result.data;

      }

    } catch (error) {

      console.warn(
        "Student email lookup failed:",
        error
      );

    }

  }

  throw new Error(

    "Your login is working, but your student profile could not be connected to this account."

  );

}

// ============================================================
// ENROLMENTS
// ============================================================

async function loadStudentEnrolments(
  studentId
) {

  if (!studentId) {

    throw new Error(
      "Student ID is missing."
    );

  }

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

  const approved =
    all.filter(
      enrollment => {

        const a =
          String(
            enrollment.enrollment_status ||
            ""
          )
            .trim()
            .toLowerCase();

        const b =
          String(
            enrollment.status ||
            ""
          )
            .trim()
            .toLowerCase();

        return (
          a === "approved" ||
          b === "approved"
        );

      }
    );

  return {
    all,
    approved
  };

}

// ============================================================
// COURSE
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
// MODULES
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
// LESSONS
// ============================================================

async function loadLessons() {

  const result =
    await withTimeout(

      db
        .from("lessons")
        .select(
          "id,module_id,lesson_number,title,content,video_url,document_url,created_at,updated_at,learning_objectives,key_terms,practical_activity,knowledge_check"
        )

    );

  if (result.error) {
    throw result.error;
  }

  const lessons =
    result.data || [];

  lessons.sort(
    (a, b) => {

      const moduleA =
        String(
          a.module_id
        );

      const moduleB =
        String(
          b.module_id
        );

      if (
        moduleA === moduleB
      ) {

        return (
          Number(
            a.lesson_number || 0
          ) -
          Number(
            b.lesson_number || 0
          )
        );

      }

      return moduleA.localeCompare(
        moduleB
      );

    }
  );

  allLessonsCache =
    lessons;

  console.log(
    "TOTAL LESSONS LOADED:",
    lessons.length
  );

  return lessons;

}

// ============================================================
// STUDENT PROGRESS
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
      "Progress could not be loaded:",
      result.error
    );

    studentProgressCache =
      [];

    return [];

  }

  studentProgressCache =
    result.data || [];

  console.log(
    "PROGRESS RECORDS:",
    studentProgressCache
  );

  return studentProgressCache;

}

// ============================================================
// GET COURSE LESSONS
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
// GET MODULE LESSONS
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
// CALCULATE COURSE PROGRESS
// ============================================================

function calculateCourseProgress(
  lessons,
  progress
) {

  const total =
    lessons.length;

  if (total === 0) {

    return {
      total: 0,
      completed: 0,
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

  let completed = 0;

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

  const percentage =
    Math.round(
      (
        completed /
        total
      ) *
      100
    );

  return {
    total,
    completed,
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

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "study-card";

  // IMPORTANT:
  // Store the course ID on the card.
  // This helps keep every course completely independent.

  card.setAttribute(
    "data-course-id",
    String(
      enrollment.course_id
    )
  );

  let modulesHtml =
    "";

  // ==========================================================
  // MODULES
  // ==========================================================

  if (modules.length === 0) {

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
          module => {

            // ------------------------------------------------
            // UNIQUE MODULE KEY
            // ------------------------------------------------

            const moduleKey =
              createModuleKey(
                enrollment.course_id,
                module.id
              );

            const moduleLessons =
              getModuleLessons(
                module,
                allLessons
              );

            let lessonsHtml =
              "";

            if (
              moduleLessons.length === 0
            ) {

              lessonsHtml = `

                <div class="empty-study">

                  📖 Lessons are being prepared.

                </div>

              `;

            } else {

              lessonsHtml = `

                <div class="lesson-list">

                  ${moduleLessons

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
                                      module.module_name ||
                                      "Course Module"
                                    )}"
                                  >

                                    📖 Open Lesson

                                  </button>

                                  ${
                                    completed
                                      ? `
                                        <span
                                          style="
                                            display:inline-block;
                                            margin-left:8px;
                                            color:#176b38;
                                            font-weight:700;
                                          "
                                        >

                                          ✓ Completed

                                        </span>
                                      `
                                      : ""
                                  }

                                </div>

                              </div>

                            </div>

                          </div>

                        `;

                      }
                    )

                    .join("")}

                </div>

              `;

            }

            // =================================================
            // MODULE CARD
            // =================================================

            return `

              <div class="module-card">

                <button
                  type="button"
                  class="module-header"
                  data-module-target="${escapeHtml(
                    moduleKey
                  )}"
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
                  id="${escapeHtml(
                    moduleKey
                  )}"
                  data-module-content
                >

                  ${
                    module.description
                      ? `
                        <div
                          class="module-description"
                          style="
                            margin-bottom:16px;
                            line-height:1.7;
                          "
                        >

                          ${escapeHtml(
                            module.description
                          )}

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

  // ==========================================================
  // COURSE CARD
  // ==========================================================

  card.innerHTML = `

    <span class="funda-status approved">
      ✓ Approved
    </span>

    <h3 class="study-title">

      ${escapeHtml(
        course?.title ||
        "Course"
      )}

    </h3>

    <p class="study-description">

      ${escapeHtml(
        course?.description ||
        "Funda Online Academy course."
      )}

    </p>

    <div class="study-meta">

      <span>
        💰 ${money(course?.price)}
      </span>

      <span>

        ⏱️

        ${
          course?.duration
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
              No lessons found for this course yet.
            `
        }

      </p>

      ${
        courseProgress.total > 0

          ? `

            <div
              style="
                margin-top:12px;
                font-size:14px;
                font-weight:700;
              "
            >

              📚

              ${courseProgress.total}

              total lessons

            </div>

          `

          : ""
      }

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
// MY STUDIES
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

    // ========================================================
    // LOAD LESSONS ONCE
    // ========================================================

    setStatus(
      "Loading lessons…"
    );

    const allLessons =
      await loadLessons();

    // ========================================================
    // LOAD PROGRESS ONCE
    // ========================================================

    const progress =
      await loadStudentProgress();

    studyList.innerHTML =
      "";

    // ========================================================
    // LOAD COURSES IN PARALLEL
    //
    // This is faster than waiting for one course before
    // loading the next course.
    // ========================================================

    setStatus(
      "Loading your courses…"
    );

    const courseResults =
      await Promise.all(

        enrolments.map(
          async enrollment => {

            try {

              const [
                course,
                modules
              ] =
                await Promise.all([

                  loadCourse(
                    enrollment.course_id
                  ),

                  loadModules(
                    enrollment.course_id
                  )

                ]);

              return {
                enrollment,
                course,
                modules,
                error: null
              };

            } catch (error) {

              return {
                enrollment,
                course: null,
                modules: [],
                error
              };

            }

          }
        )

      );

    // ========================================================
    // RENDER COURSES
    // ========================================================

    courseResults.forEach(
      result => {

        if (
          result.error ||
          !result.course
        ) {

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
                result.error?.message ||
                "Course information could not be found."
              )}

            </p>

          `;

          studyList.appendChild(
            errorCard
          );

          return;

        }

        renderCourse(

          result.enrollment,

          result.course,

          result.modules,

          allLessons,

          progress

        );

      }
    );

    // ========================================================
    // SET UP BUTTONS
    // ========================================================

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
// ENROLMENTS
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

    // ========================================================
    // LOAD COURSE INFORMATION IN PARALLEL
    // ========================================================

    const cards =
      await Promise.all(

        enrolments.map(
          async enrollment => {

            let course = null;

            try {

              course =
                await loadCourse(
                  enrollment.course_id
                );

            } catch (error) {

              console.warn(
                "Enrollment course lookup failed:",
                error
              );

            }

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

            return `

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

            `;

          }
        )

      );

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
//
// IMPORTANT FIX:
//
// OLD METHOD:
//
// document.querySelector(
//   `[data-module-content="${index}"]`
// )
//
// That always found the FIRST matching module on the page.
//
// NEW METHOD:
//
// Each button contains the EXACT ID of its own module.
//
// Example:
//
// data-module-target="module-courseID-moduleID"
//
// Therefore every course/module opens independently.
//
// ============================================================

function setupModuleButtons() {

  document
    .querySelectorAll(
      ".module-header[data-module-target]"
    )
    .forEach(
      button => {

        // Prevent duplicate listeners if this function
        // is ever called again.

        if (
          button.dataset.moduleReady ===
          "true"
        ) {

          return;

        }

        button.dataset.moduleReady =
          "true";

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();
            event.stopPropagation();

            const targetId =
              button.getAttribute(
                "data-module-target"
              );

            if (!targetId) {
              return;
            }

            // =================================================
            // FIND THE EXACT MODULE
            // =================================================

            const content =
              document.getElementById(
                targetId
              );

            if (!content) {

              console.error(
                "MODULE CONTENT NOT FOUND:",
                targetId
              );

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

              button.setAttribute(
                "aria-expanded",
                "false"
              );

              if (icon) {

                icon.textContent =
                  "+";

              }

            } else {

              content.classList.add(
                "open"
              );

              button.setAttribute(
                "aria-expanded",
                "true"
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
      ".lesson-open"
    )
    .forEach(
      button => {

        if (
          button.dataset.lessonReady ===
          "true"
        ) {

          return;

        }

        button.dataset.lessonReady =
          "true";

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
// FORMAT LESSON CONTENT
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

        <h3>
          Learning content is being prepared
        </h3>

      </div>

    `;

  }

  const text =
    String(value);

  if (
    /<[a-z][\s\S]*>/i.test(text)
  ) {

    return text;

  }

  return text

    .split(/\n\s*\n/)

    .map(
      paragraph => `

        <p>

          ${escapeHtml(
            paragraph
          ).replace(
            /\n/g,
            "<br>"
          )}

        </p>

      `
    )

    .join("");

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

      // ======================================================
      // OBJECTIVES
      // ======================================================

      if (
        currentLesson.learning_objectives
      ) {

        html += `

          <div
            style="
              margin-top:24px;
              padding:18px;
              border-radius:12px;
              background:#f2f8f4;
            "
          >

            <h3>
              🎯 Learning Objectives
            </h3>

            <p
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${escapeHtml(
                currentLesson.learning_objectives
              )}

            </p>

          </div>

        `;

      }

      // ======================================================
      // KEY TERMS
      // ======================================================

      if (
        currentLesson.key_terms
      ) {

        html += `

          <div
            style="
              margin-top:20px;
              padding:18px;
              border-radius:12px;
              background:#f7f7f7;
            "
          >

            <h3>
              🔑 Key Terms
            </h3>

            <p
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${escapeHtml(
                currentLesson.key_terms
              )}

            </p>

          </div>

        `;

      }

      // ======================================================
      // PRACTICAL ACTIVITY
      // ======================================================

      if (
        currentLesson.practical_activity
      ) {

        html += `

          <div
            style="
              margin-top:20px;
              padding:18px;
              border-radius:12px;
              background:#fff8e8;
            "
          >

            <h3>
              🛠️ Practical Activity
            </h3>

            <p
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${escapeHtml(
                currentLesson.practical_activity
              )}

            </p>

          </div>

        `;

      }

      // ======================================================
      // KNOWLEDGE CHECK
      // ======================================================

      if (
        currentLesson.knowledge_check
      ) {

        html += `

          <div
            style="
              margin-top:20px;
              padding:18px;
              border-radius:12px;
              background:#eef5ff;
            "
          >

            <h3>
              📝 Knowledge Check
            </h3>

            <p
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${escapeHtml(
                currentLesson.knowledge_check
              )}

            </p>

          </div>

        `;

      }

      // ======================================================
      // VIDEO
      // ======================================================

      if (
        currentLesson.video_url
      ) {

        html += `

          <div style="margin-top:20px">

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

      // ======================================================
      // DOCUMENT
      // ======================================================

      if (
        currentLesson.document_url
      ) {

        html += `

          <div style="margin-top:12px">

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
      await withTimeout(

        db
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
          .maybeSingle()

      );

    if (result.error) {

      console.warn(
        "Progress check error:",
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

    // ========================================================
    // UPDATE LOCAL PROGRESS
    // ========================================================

    const existing =
      studentProgressCache.find(
        item =>
          String(
            item.lesson_id
          ) ===
          String(
            currentLesson.id
          )
      );

    if (existing) {

      existing.completed =
        true;

      existing.completed_at =
        now;

      existing.updated_at =
        now;

    } else {

      studentProgressCache.push({

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

      });

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

    // ========================================================
    // REFRESH DASHBOARD
    // ========================================================

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

    // ========================================================
    // AUTH
    // ========================================================

    currentUser =
      await getLoggedInUser();

    if (!currentUser) {
      return;
    }

    // ========================================================
    // STUDENT
    // ========================================================

    setStatus(
      "Finding your student profile…"
    );

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
      "CONNECTED STUDENT:",
      currentStudent
    );

    // ========================================================
    // HEADER
    // ========================================================

    loadHeader();

    // ========================================================
    // POLICY
    // ========================================================

    await loadPolicyStatus();

    // ========================================================
    // STUDIES
    // ========================================================

    setStatus(
      "Loading your courses and lessons…"
    );

    await loadMyStudies();

    // ========================================================
    // ENROLMENTS
    // ========================================================

    setStatus(
      "Loading your enrolments…"
    );

    await loadMyEnrolments();

    // ========================================================
    // PAYMENTS
    // ========================================================

    setStatus(
      "Loading payment history…"
    );

    await loadPayments();

    // ========================================================
    // AVAILABLE COURSES
    // ========================================================

    await loadAvailableCourses();

    // ========================================================
    // READY
    // ========================================================

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
      "DASHBOARD ERROR:",
      error
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
