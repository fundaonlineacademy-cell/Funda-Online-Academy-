// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
//
// COMPLETE DATABASE-MATCHED VERSION
//
// THIS VERSION INCLUDES:
//
// ✓ Student authentication
// ✓ Student profile
// ✓ Approved enrolments
// ✓ Course information
// ✓ Study Plan
// ✓ Practical Projects
// ✓ Materials / Resources
// ✓ Career Application
// ✓ Learning Outcomes
// ✓ Assessment Information
// ✓ Certificate Information
// ✓ Course Modules
// ✓ Module Learning Outcomes
// ✓ Lessons
// ✓ Lesson content
// ✓ Lesson learning objectives
// ✓ Key terms
// ✓ Practical activities
// ✓ Knowledge checks
// ✓ Lesson videos
// ✓ Lesson documents
// ✓ Lesson illustrations
// ✓ Course progress
// ✓ Completed lessons
// ✓ Correct lesson_progress authentication ID
// ✓ Payment history
// ✓ Available courses
// ✓ Policy acceptance
// ✓ Logout
//
// DATABASE CONNECTION:
//
// auth.users.id
//      ↓
// students.user_id
//
// students.id
//      ↓
// enrollments.student_id
//      ↓
// payments.student_id
//
// auth.users.id
//      ↓
// lesson_progress.student_id
//
// courses.id
//      ↓
// course_modules.course_id
//
// course_modules.id
//      ↓
// lessons.module_id
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

let courseAssessmentCache = {};
let studentResultsCache = [];

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

  const number =
    Number(value);

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
    systemStatus.textContent =
      text;
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

    new Promise(
      (resolve, reject) => {

        setTimeout(
          () => {

            reject(
              new Error(
                "The database request took too long. Please refresh the page."
              )
            );

          },
          milliseconds
        );

      }
    )

  ]);

}

// ============================================================
// TEXT / ARRAY DISPLAY
// ============================================================

function renderTextBlock(
  value,
  emptyText = ""
) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {

    return emptyText
      ? `
        <p
          style="
            color:#7b8781;
            line-height:1.6;
          "
        >
          ${escapeHtml(emptyText)}
        </p>
      `
      : "";

  }

  return String(value)
    .split(/\n\s*\n/)
    .map(
      paragraph => `

        <p
          style="
            margin:0 0 10px;
            line-height:1.7;
          "
        >

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

// ------------------------------------------------------------

function renderListOrText(
  value,
  emptyText = ""
) {

  if (
    value === null ||
    value === undefined
  ) {

    return emptyText
      ? `
        <p
          style="
            color:#7b8781;
            line-height:1.6;
          "
        >
          ${escapeHtml(emptyText)}
        </p>
      `
      : "";

  }

  if (
    Array.isArray(value)
  ) {

    const items =
      value
        .filter(
          item =>
            item !== null &&
            item !== undefined &&
            String(item).trim() !== ""
        );

    if (items.length === 0) {

      return emptyText
        ? `
          <p
            style="
              color:#7b8781;
              line-height:1.6;
            "
          >
            ${escapeHtml(emptyText)}
          </p>
        `
        : "";

    }

    return `

      <ul
        style="
          margin:0;
          padding-left:22px;
          line-height:1.8;
        "
      >

        ${items
          .map(
            item => `
              <li>
                ${escapeHtml(item)}
              </li>
            `
          )
          .join("")}

      </ul>

    `;

  }

  const text =
    String(value).trim();

  if (!text) {

    return emptyText
      ? `
        <p
          style="
            color:#7b8781;
            line-height:1.6;
          "
        >
          ${escapeHtml(emptyText)}
        </p>
      `
      : "";

  }

  const lines =
    text
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);

  const looksLikeList =
    lines.length > 1 &&
    lines.every(
      line =>
        /^[-•*]\s+/.test(line) ||
        /^\d+[.)]\s+/.test(line)
    );

  if (looksLikeList) {

    return `

      <ul
        style="
          margin:0;
          padding-left:22px;
          line-height:1.8;
        "
      >

        ${lines
          .map(
            line => {

              const cleaned =
                line
                  .replace(
                    /^[-•*]\s+/,
                    ""
                  )
                  .replace(
                    /^\d+[.)]\s+/,
                    ""
                  );

              return `

                <li>
                  ${escapeHtml(cleaned)}
                </li>

              `;

            }
          )
          .join("")}

      </ul>

    `;

  }

  return renderTextBlock(
    text,
    emptyText
  );

}

// ============================================================
// UNIQUE MODULE KEY
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

async function loadStudentProfile(
  user
) {

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
      Array.isArray(
        rpcResult.data
      ) &&
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
        .select(`
          id,
          title,
          slug,
          description,
          duration,
          price,
          image_url,
          modules,
          active,
          created_at,
          updated_at,
          learning_outcomes,
          assessment_info,
          certificate_info,
          study_plan,
          practical_projects,
          materials_required,
          career_application
        `)
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
        .select(`
          id,
          course_id,
          module_number,
          module_name,
          description,
          learning_outcomes,
          created_at,
          updated_at
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
//
// IMPORTANT:
//
// There are more than 1,000 lessons in the database.
//
// Supabase/PostgREST can limit a response.
//
// Therefore this function loads lessons in pages instead of
// requesting all lessons in one response.
//
// ============================================================

async function loadLessonsForModules(
  moduleIds
) {

  if (
    !Array.isArray(moduleIds) ||
    moduleIds.length === 0
  ) {

    allLessonsCache = [];

    return [];

  }

  const lessons = [];

  const pageSize = 500;

  for (
    let from = 0;
    ;
    from += pageSize
  ) {

    const to =
      from +
      pageSize -
      1;

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
            created_at,
            updated_at,
            learning_objectives,
            key_terms,
            practical_activity,
            knowledge_check,
            illustration_url,
            illustration_caption,
            illustration_source
          `)
          .in(
            "module_id",
            moduleIds
          )
          .range(
            from,
            to
          )

      );

    if (result.error) {
      throw result.error;
    }

    const page =
      result.data || [];

    lessons.push(
      ...page
    );

    if (
      page.length <
      pageSize
    ) {

      break;

    }

  }

  lessons.sort(
    (a, b) => {

      const moduleCompare =
        String(
          a.module_id
        ).localeCompare(
          String(
            b.module_id
          )
        );

      if (
        moduleCompare !== 0
      ) {

        return moduleCompare;

      }

      return (
        Number(
          a.lesson_number || 0
        ) -
        Number(
          b.lesson_number || 0
        )
      );

    }
  );

  allLessonsCache =
    lessons;

  console.log(
    "TOTAL ENROLLED-COURSE LESSONS LOADED:",
    lessons.length
  );

  return lessons;

}

// ============================================================
// STUDENT PROGRESS
// ============================================================
//
// IMPORTANT DATABASE FIX:
//
// lesson_progress.student_id references auth.users.id.
//
// Therefore this function MUST use:
//
// currentUser.id
//
// NOT:
//
// currentStudent.id
//
// ============================================================

async function loadStudentProgress() {

  if (!currentUser?.id) {
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
          currentUser.id
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
// ASSESSMENTS
// ============================================================

async function loadAssessmentsForCourses(
  courseIds
) {

  courseAssessmentCache = {};

  if (
    !Array.isArray(courseIds) ||
    courseIds.length === 0
  ) {

    return;

  }

  const result =
    await withTimeout(

      db
        .from("assessments")
        .select(`
          id,
          course_id,
          title,
          description,
          total_marks,
          pass_mark,
          created_at,
          instructions,
          active,
          status,
          updated_at
        `)
        .in(
          "course_id",
          courseIds
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        )

    );

  if (result.error) {

    console.warn(
      "Assessments could not be loaded:",
      result.error
    );

    return;

  }

  (
    result.data || []
  ).forEach(
    assessment => {

      const key =
        String(
          assessment.course_id
        );

      if (
        !courseAssessmentCache[key]
      ) {

        courseAssessmentCache[key] =
          [];

      }

      courseAssessmentCache[key]
        .push(
          assessment
        );

    }
  );

}

// ============================================================
// STUDENT RESULTS
// ============================================================

async function loadStudentResults() {

  if (!currentStudent?.id) {

    studentResultsCache =
      [];

    return [];

  }

  const result =
    await withTimeout(

      db
        .from("results")
        .select(`
          id,
          student_id,
          assessment_id,
          marks_obtained,
          percentage,
          result_status,
          submitted_at,
          created_at
        `)
        .eq(
          "student_id",
          currentStudent.id
        )

    );

  if (result.error) {

    console.warn(
      "Student results could not be loaded:",
      result.error
    );

    studentResultsCache =
      [];

    return [];

  }

  studentResultsCache =
    result.data || [];

  return studentResultsCache;

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
          String(
            module.id
          )
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
// COURSE PROGRESS
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
// COURSE INFORMATION BOX
// ============================================================

function renderCourseInformation(
  course,
  assessments
) {

  const learningOutcomes =
    course.learning_outcomes;

  const hasLearningOutcomes =
    Array.isArray(
      learningOutcomes
    )
      ? learningOutcomes.length > 0
      : Boolean(
          learningOutcomes &&
          String(
            learningOutcomes
          ).trim()
        );

  const hasStudyPlan =
    Boolean(
      course.study_plan &&
      String(
        course.study_plan
      ).trim()
    );

  const hasPractical =
    Boolean(
      course.practical_projects &&
      String(
        course.practical_projects
      ).trim()
    );

  const hasMaterials =
    Boolean(
      course.materials_required &&
      String(
        course.materials_required
      ).trim()
    );

  const hasCareer =
    Boolean(
      course.career_application &&
      String(
        course.career_application
      ).trim()
    );

  const hasAssessmentInfo =
    Boolean(
      course.assessment_info &&
      String(
        course.assessment_info
      ).trim()
    );

  const hasCertificateInfo =
    Boolean(
      course.certificate_info &&
      String(
        course.certificate_info
      ).trim()
    );

  const hasAssessments =
    Array.isArray(
      assessments
    ) &&
    assessments.length > 0;

  return `

    <div
      class="course-information-section"
      style="
        margin-top:22px;
      "
    >

      <h3
        style="
          margin-bottom:14px;
        "
      >
        📋 Your Course Information
      </h3>

      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(240px,1fr));
          gap:14px;
        "
      >

        ${
          hasStudyPlan
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#f4f8f5;
                  border:1px solid #dce8df;
                "
              >

                <h4>
                  📅 Study Plan
                </h4>

                <div
                  style="
                    margin-top:9px;
                  "
                >

                  ${renderListOrText(
                    course.study_plan
                  )}

                </div>

              </div>
            `
            : ""
        }

        ${
          hasPractical
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#fff8ed;
                  border:1px solid #f1dfb9;
                "
              >

                <h4>
                  🛠️ Practical Project
                </h4>

                <div
                  style="
                    margin-top:9px;
                  "
                >

                  ${renderListOrText(
                    course.practical_projects
                  )}

                </div>

              </div>
            `
            : ""
        }

        ${
          hasMaterials
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#f5f6fa;
                  border:1px solid #e0e3ea;
                "
              >

                <h4>
                  📚 Materials / Resources
                </h4>

                <div
                  style="
                    margin-top:9px;
                  "
                >

                  ${renderListOrText(
                    course.materials_required
                  )}

                </div>

              </div>
            `
            : ""
        }

        ${
          hasCareer
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#f4f1fb;
                  border:1px solid #e2d9f2;
                "
              >

                <h4>
                  💼 Career Application
                </h4>

                <div
                  style="
                    margin-top:9px;
                  "
                >

                  ${renderListOrText(
                    course.career_application
                  )}

                </div>

              </div>
            `
            : ""
        }

        ${
          hasLearningOutcomes
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#eef7ff;
                  border:1px solid #d5e8f7;
                "
              >

                <h4>
                  🎯 Learning Outcomes
                </h4>

                <div
                  style="
                    margin-top:9px;
                  "
                >

                  ${renderListOrText(
                    learningOutcomes
                  )}

                </div>

              </div>
            `
            : ""
        }

        ${
          hasAssessmentInfo ||
          hasAssessments
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#fff3f3;
                  border:1px solid #efdada;
                "
              >

                <h4>
                  📝 Assessment Information
                </h4>

                ${
                  hasAssessmentInfo
                    ? `
                      <div
                        style="
                          margin-top:9px;
                        "
                      >

                        ${renderListOrText(
                          course.assessment_info
                        )}

                      </div>
                    `
                    : ""
                }

                ${
                  hasAssessments
                    ? `
                      <div
                        style="
                          margin-top:12px;
                        "
                      >

                        <strong>
                          Assessments:
                        </strong>

                        <ul
                          style="
                            margin-top:7px;
                            padding-left:22px;
                            line-height:1.7;
                          "
                        >

                          ${assessments
                            .map(
                              assessment => `

                                <li>

                                  ${escapeHtml(
                                    assessment.title ||
                                    "Assessment"
                                  )}

                                  ${
                                    assessment.total_marks !==
                                    null &&
                                    assessment.total_marks !==
                                    undefined
                                      ? `
                                        —
                                        ${escapeHtml(
                                          assessment.total_marks
                                        )}
                                        marks
                                      `
                                      : ""
                                  }

                                  ${
                                    assessment.pass_mark !==
                                    null &&
                                    assessment.pass_mark !==
                                    undefined
                                      ? `
                                        |
                                        Pass:
                                        ${escapeHtml(
                                          assessment.pass_mark
                                        )}
                                      `
                                      : ""
                                  }

                                </li>

                              `
                            )
                            .join("")}

                        </ul>

                      </div>
                    `
                    : ""
                }

              </div>
            `
            : ""
        }

        ${
          hasCertificateInfo
            ? `
              <div
                style="
                  padding:16px;
                  border-radius:14px;
                  background:#fffbea;
                  border:1px solid #eee2a9;
                "
              >

                <h4>
                  🏆 Certificate Information
                </h4>

                <div
                  style="
                    margin-top:9px;
                  "
                >

                  ${renderListOrText(
                    course.certificate_info
                  )}

                </div>

              </div>
            `
            : ""
        }

      </div>

    </div>

  `;

}

// ============================================================
// RENDER MODULE LEARNING OUTCOMES
// ============================================================

function renderModuleLearningOutcomes(
  module
) {

  if (
    !module.learning_outcomes ||
    (
      Array.isArray(
        module.learning_outcomes
      ) &&
      module.learning_outcomes.length === 0
    )
  ) {

    return "";

  }

  return `

    <div
      style="
        margin-bottom:16px;
        padding:14px;
        border-radius:12px;
        background:#eef7ff;
        border:1px solid #d9eaf8;
      "
    >

      <strong>
        🎯 Module Learning Outcomes
      </strong>

      <div
        style="
          margin-top:8px;
        "
      >

        ${renderListOrText(
          module.learning_outcomes
        )}

      </div>

    </div>

  `;

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

  const assessments =
    courseAssessmentCache[
      String(
        enrollment.course_id
      )
    ] || [];

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "study-card";

  card.setAttribute(
    "data-course-id",
    String(
      enrollment.course_id
    )
  );

  // ==========================================================
  // MODULES
  // ==========================================================

  let modulesHtml =
    "";

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

                            <div
                              class="lesson-top"
                            >

                              <span
                                class="lesson-number"
                              >

                                ${escapeHtml(
                                  lesson.lesson_number
                                )}

                              </span>

                              <div
                                class="lesson-main"
                              >

                                <div
                                  class="lesson-title"
                                >

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

                                <div
                                  class="lesson-description"
                                >

                                  Lesson
                                  ${escapeHtml(
                                    lesson.lesson_number
                                  )}

                                </div>

                                <div
                                  class="lesson-actions"
                                >

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

            return `

              <div
                class="module-card"
              >

                <button
                  type="button"
                  class="module-header"
                  data-module-target="${escapeHtml(
                    moduleKey
                  )}"
                  aria-expanded="false"
                >

                  <span
                    class="module-left"
                  >

                    <span
                      class="module-number"
                    >

                      ${escapeHtml(
                        module.module_number
                      )}

                    </span>

                    <span
                      class="module-name"
                    >

                      ${escapeHtml(
                        module.module_name
                      )}

                    </span>

                  </span>

                  <span
                    class="module-icon"
                  >
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

                  ${renderModuleLearningOutcomes(
                    module
                  )}

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

    <span
      class="funda-status approved"
    >
      ✓ Approved
    </span>

    ${
      course?.image_url
        ? `
          <div
            style="
              margin-top:14px;
              border-radius:14px;
              overflow:hidden;
            "
          >

            <img
              src="${escapeHtml(
                course.image_url
              )}"
              alt="${escapeHtml(
                course.title ||
                "Course"
              )}"
              style="
                width:100%;
                max-height:260px;
                object-fit:cover;
                display:block;
              "
              loading="lazy"
            >

          </div>
        `
        : ""
    }

    <h3
      class="study-title"
      style="margin-top:14px"
    >

      ${escapeHtml(
        course?.title ||
        "Course"
      )}

    </h3>

    <p
      class="study-description"
    >

      ${escapeHtml(
        course?.description ||
        "Funda Online Academy course."
      )}

    </p>

    <div class="study-meta">

      <span>
        💰 ${money(
          course?.price
        )}
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

    <div
      class="study-button"
    >

      <button
        type="button"
        class="btn green study-course-button"
      >

        📚 Study Course

      </button>

    </div>

    <!-- =====================================================
         COURSE INFORMATION
         ===================================================== -->

    ${renderCourseInformation(
      course,
      assessments
    )}

    <!-- =====================================================
         MODULES
         ===================================================== -->

    <div
      class="modules-container"
      style="
        margin-top:24px;
      "
    >

      <h3
        class="modules-heading"
      >

        📖 Modules & Lessons

      </h3>

      ${modulesHtml}

    </div>

    <!-- =====================================================
         PROGRESS
         ===================================================== -->

    <div
      class="progress-box"
      style="
        margin-top:24px;
      "
    >

      <div
        class="progress-label"
      >

        <span>
          📊 Course Progress
        </span>

        <span>
          ${courseProgress.percentage}%
        </span>

      </div>

      <div
        class="progress-track"
      >

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

          <div
            style="font-size:48px"
          >
            📚
          </div>

          <h3
            style="margin-top:10px"
          >

            No approved courses yet

          </h3>

          <p
            style="
              margin-top:8px;
              line-height:1.6;
            "
          >

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
    // LOAD MODULES FIRST
    // ========================================================

    setStatus(
      "Loading course modules…"
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

    const validCourseResults =
      courseResults.filter(
        result =>
          !result.error &&
          result.course
      );

    // ========================================================
    // COLLECT MODULE IDS
    // ========================================================

    const allModuleIds =
      [];

    validCourseResults.forEach(
      result => {

        result.modules.forEach(
          module => {

            allModuleIds.push(
              module.id
            );

          }
        );

      }
    );

    // ========================================================
    // LOAD LESSONS ONLY FOR ENROLLED COURSES
    // ========================================================

    setStatus(
      "Loading your lessons…"
    );

    const allLessons =
      await loadLessonsForModules(
        allModuleIds
      );

    // ========================================================
    // LOAD PROGRESS
    // ========================================================

    setStatus(
      "Loading your progress…"
    );

    const progress =
      await loadStudentProgress();

    // ========================================================
    // LOAD ASSESSMENTS
    // ========================================================

    const courseIds =
      validCourseResults.map(
        result =>
          result.course.id
      );

    setStatus(
      "Loading assessment information…"
    );

    await loadAssessmentsForCourses(
      courseIds
    );

    // ========================================================
    // LOAD RESULTS
    // ========================================================

    await loadStudentResults();

    // ========================================================
    // RENDER
    // ========================================================

    studyList.innerHTML =
      "";

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

            <p
              style="margin-top:8px"
            >

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
    // BUTTONS
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

          <p
            style="margin-top:8px"
          >

            Your student profile is connected.

          </p>

        </div>

      `;

      return;

    }

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

              <div
                class="card"
              >

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

                <h3
                  style="margin-top:10px"
                >

                  ${escapeHtml(
                    name
                  )}

                </h3>

                <p
                  style="margin-top:8px"
                >

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

            <div
              class="card"
            >

              <h3>

                ${money(
                  payment.amount
                )}

              </h3>

              <p
                style="margin-top:8px"
              >

                💳

                ${escapeHtml(
                  payment.payment_method ||
                  "Payment"
                )}

              </p>

              <p
                style="margin-top:8px"
              >

                Status:

                <strong>

                  ${escapeHtml(
                    payment.status ||
                    "pending"
                  )}

                </strong>

              </p>

              ${
                payment.notes
                  ? `
                    <p
                      style="
                        margin-top:8px;
                        line-height:1.6;
                      "
                    >

                      📝

                      ${escapeHtml(
                        payment.notes
                      )}

                    </p>
                  `
                  : ""
              }

              ${
                payment.proof_url
                  ? `
                    <p
                      style="margin-top:10px"
                    >

                      <a
                        href="${escapeHtml(
                          payment.proof_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn green"
                      >

                        📄 View Payment Proof

                      </a>

                    </p>
                  `
                  : ""
              }

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
      ".module-header[data-module-target]"
    )
    .forEach(
      button => {

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

      <div
        class="empty-study"
      >

        <div
          style="font-size:45px"
        >
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
    /<[a-z][\s\S]*>/i.test(
      text
    )
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
          .select(`
            id,
            module_id,
            lesson_number,
            title,
            content,
            video_url,
            document_url,
            created_at,
            updated_at,
            learning_objectives,
            key_terms,
            practical_activity,
            knowledge_check,
            illustration_url,
            illustration_caption,
            illustration_source
          `)
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
      // ILLUSTRATION
      // ======================================================

      if (
        currentLesson.illustration_url
      ) {

        html += `

          <div
            style="
              margin-top:22px;
              text-align:center;
            "
          >

            <img
              src="${escapeHtml(
                currentLesson.illustration_url
              )}"
              alt="${escapeHtml(
                currentLesson.illustration_caption ||
                currentLesson.title ||
                "Lesson illustration"
              )}"
              style="
                width:100%;
                max-width:850px;
                border-radius:14px;
                display:block;
                margin:0 auto;
              "
              loading="lazy"
            >

            ${
              currentLesson.illustration_caption
                ? `
                  <p
                    style="
                      margin-top:8px;
                      color:#68766f;
                      font-size:13px;
                    "
                  >

                    ${escapeHtml(
                      currentLesson.illustration_caption
                    )}

                  </p>
                `
                : ""
            }

            ${
              currentLesson.illustration_source
                ? `
                  <p
                    style="
                      margin-top:4px;
                      color:#8a948e;
                      font-size:12px;
                    "
                  >

                    Source:
                    ${escapeHtml(
                      currentLesson.illustration_source
                    )}

                  </p>
                `
                : ""
            }

          </div>

        `;

      }

      // ======================================================
      // LEARNING OBJECTIVES
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

            <div
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${renderListOrText(
                currentLesson.learning_objectives
              )}

            </div>

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

            <div
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${renderListOrText(
                currentLesson.key_terms
              )}

            </div>

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

            <div
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${renderListOrText(
                currentLesson.practical_activity
              )}

            </div>

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

            <div
              style="
                margin-top:12px;
                line-height:1.7;
              "
            >

              ${renderListOrText(
                currentLesson.knowledge_check
              )}

            </div>

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

          <div
            style="margin-top:20px"
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

      // ======================================================
      // DOCUMENT
      // ======================================================

      if (
        currentLesson.document_url
      ) {

        html += `

          <div
            style="margin-top:12px"
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

        <div
          class="error-study"
        >

          <strong>
            ⚠️ Lesson could not be opened
          </strong>

          <p
            style="margin-top:8px"
          >

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

  // IMPORTANT:
  // lesson_progress.student_id = auth.users.id

  if (
    !currentUser?.id ||
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
            currentUser.id
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

  // IMPORTANT:
  // lesson_progress.student_id must be auth.users.id

  if (
    !currentUser?.id ||
    !currentLesson?.id
  ) {

    alert(
      "Your student login could not be confirmed. Please log in again."
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
              currentUser.id,

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

      existing.student_id =
        currentUser.id;

      existing.completed =
        true;

      existing.completed_at =
        now;

      existing.updated_at =
        now;

    } else {

      studentProgressCache.push({

        student_id:
          currentUser.id,

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
    // REFRESH COURSE PROGRESS
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
          .select(`
            id,
            title,
            slug,
            description,
            duration,
            price,
            image_url,
            active,
            learning_outcomes,
            assessment_info,
            certificate_info,
            study_plan,
            practical_projects,
            materials_required,
            career_application
          `)
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

          <div
            style="font-size:45px"
          >
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

            <div
              class="
                card
                available-course-card
              "
            >

              <span
                class="available-badge"
              >
                ✓ Available
              </span>

              ${
                course.image_url
                  ? `
                    <img
                      src="${escapeHtml(
                        course.image_url
                      )}"
                      alt="${escapeHtml(
                        course.title
                      )}"
                      style="
                        width:100%;
                        max-height:220px;
                        object-fit:cover;
                        border-radius:12px;
                        margin-top:12px;
                      "
                      loading="lazy"
                    >
                  `
                  : ""
              }

              <h3
                style="margin-top:10px"
              >

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

              <div
                class="course-information"
              >

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

              ${
                course.learning_outcomes
                  ? `
                    <div
                      style="
                        margin-top:14px;
                        padding:14px;
                        background:#eef7ff;
                        border-radius:12px;
                      "
                    >

                      <strong>
                        🎯 Learning Outcomes
                      </strong>

                      <div
                        style="
                          margin-top:8px;
                        "
                      >

                        ${renderListOrText(
                          course.learning_outcomes
                        )}

                      </div>

                    </div>
                  `
                  : ""
              }

              ${
                course.assessment_info
                  ? `
                    <div
                      style="
                        margin-top:12px;
                        padding:14px;
                        background:#fff3f3;
                        border-radius:12px;
                      "
                    >

                      <strong>
                        📝 Assessment
                      </strong>

                      <div
                        style="
                          margin-top:8px;
                        "
                      >

                        ${renderListOrText(
                          course.assessment_info
                        )}

                      </div>

                    </div>
                  `
                  : ""
              }

              ${
                course.certificate_info
                  ? `
                    <div
                      style="
                        margin-top:12px;
                        padding:14px;
                        background:#fffbea;
                        border-radius:12px;
                      "
                    >

                      <strong>
                        🏆 Certificate
                      </strong>

                      <div
                        style="
                          margin-top:8px;
                        "
                      >

                        ${renderListOrText(
                          course.certificate_info
                        )}

                      </div>

                    </div>
                  `
                  : ""
              }

              <button
                type="button"
                class="btn green"
                disabled
                style="
                  margin-top:16px;
                "
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
    localStorage.getItem(
      key
    ) ===
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

    setStatus(
      "Loading available courses…"
    );

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

        <div
          class="error-study"
        >

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

        <div
          class="error-study"
        >

          <strong>
            ⚠️ Enrolments could not be loaded
          </strong>

          <p
            style="margin-top:10px"
          >

            ${escapeHtml(
              message
            )}

          </p>

        </div>

      `;

    }

    if (paymentsContainer) {

      paymentsContainer.innerHTML = `

        <div
          class="error-study"
        >

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
