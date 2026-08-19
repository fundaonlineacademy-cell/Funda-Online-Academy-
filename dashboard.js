// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
//
// FIXED:
// ✅ Student profile loading
// ✅ Auth account → student connection
// ✅ Student enrolments
// ✅ Approved courses
// ✅ Course modules
// ✅ Lessons
// ✅ Carpentry lessons
// ✅ Lesson viewer
// ✅ Review Lesson
// ✅ Lesson completion
// ✅ Saved progress
// ✅ Course progress percentage
// ✅ Policy declaration
// ✅ Logout
// ============================================================

"use strict";

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
            "The database request took too long. Please refresh the page and try again."
          )
        );

      }, milliseconds);

    })

  ]);
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

      <p style="margin-top:8px">

        ${escapeHtml(
          error?.message ||
          String(error)
        )}

      </p>

    </div>

  `;
}


// ============================================================
// GET AUTHENTICATED USER
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

  return user;
}


// ============================================================
// STUDENT PROFILE
//
// IMPORTANT:
// We use the secure database function:
//
// get_my_student_profile()
//
// This function uses auth.uid() inside Supabase,
// so the student account cannot access somebody else's
// student information.
// ============================================================

async function loadStudentProfile(
  user
) {

  if (!user || !user.id) {

    throw new Error(
      "The logged-in student ID could not be determined."
    );

  }

  console.log(
    "AUTH USER:",
    user.id,
    user.email
  );


  // ----------------------------------------------------------
  // PRIMARY METHOD
  // Secure RPC
  // ----------------------------------------------------------

  const rpcResult =
    await withTimeout(

      db.rpc(
        "get_my_student_profile"
      )

    );


  if (rpcResult.error) {

    console.warn(
      "Student profile RPC failed:",
      rpcResult.error
    );

  } else if (
    rpcResult.data &&
    rpcResult.data.length > 0
  ) {

    const student =
      rpcResult.data[0];

    console.log(
      "STUDENT PROFILE FOUND:",
      student
    );

    return student;

  }


  // ----------------------------------------------------------
  // FALLBACK
  // Direct user_id lookup
  // ----------------------------------------------------------

  console.log(
    "Trying direct student profile lookup..."
  );


  const directResult =
    await withTimeout(

      db
        .from("students")
        .select(
          "id,user_id,full_name,email"
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle()

    );


  if (directResult.error) {
    throw directResult.error;
  }


  if (directResult.data) {

    console.log(
      "STUDENT PROFILE FOUND BY DIRECT LOOKUP:",
      directResult.data
    );

    return directResult.data;

  }


  throw new Error(
    "Your login is working, but your student profile could not be connected to this account. Please contact Funda Online Academy administration."
  );
}


// ============================================================
// APPROVED ENROLMENTS
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
        .eq(
          "enrollment_status",
          "approved"
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


  console.log(
    "APPROVED ENROLMENTS:",
    result.data
  );


  return result.data || [];
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
        .select("*")
        .order(
          "module_id",
          {
            ascending: true
          }
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
// LOAD CURRENT STUDENT PROGRESS
//
// IMPORTANT:
// lesson_progress.student_id now correctly refers to
// students.id.
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
          "id,student_id,lesson_id,completed,completed_at,updated_at"
        )
        .eq(
          "student_id",
          currentStudent.id
        )

    );


  if (result.error) {

    console.warn(
      "Could not load lesson progress:",
      result.error
    );

    return [];
  }


  return result.data || [];
}


// ============================================================
// LESSON CONTENT
// ============================================================

function getLessonContent(
  lesson
) {

  return (
    lesson.content ??
    lesson.lesson_content ??
    lesson.body ??
    lesson.lesson_body ??
    lesson.description ??
    ""
  );
}


// ============================================================
// FORMAT LESSON CONTENT
// ============================================================

function formatLessonContent(
  value
) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {

    return `

      <div class="empty-study">

        <div style="font-size:42px">
          📖
        </div>

        <h3 style="margin-top:10px">
          Learning content is being prepared
        </h3>

        <p style="margin-top:8px;line-height:1.6">

          This lesson has been created,
          but learning content has not yet
          been added.

        </p>

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
    .map(paragraph => {

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

    })
    .join("");
}


// ============================================================
// GET LESSONS FOR MODULE
// ============================================================

function getModuleLessons(
  module,
  lessons
) {

  return lessons

    .filter(lesson => {

      const sameId =
        lesson.module_id &&
        String(
          lesson.module_id
        ) ===
        String(
          module.id
        );


      const sameNumber =
        lesson.module_number !==
          undefined &&
        module.module_number !==
          undefined &&
        Number(
          lesson.module_number
        ) ===
        Number(
          module.module_number
        );


      return (
        sameId ||
        sameNumber
      );

    })

    .sort((a, b) => {

      return (
        Number(
          a.lesson_number || 0
        ) -
        Number(
          b.lesson_number || 0
        )
      );

    });
}


// ============================================================
// COURSE PROGRESS
// ============================================================

function calculateCourseProgress(
  courseLessons,
  progress
) {

  if (
    !courseLessons ||
    courseLessons.length === 0
  ) {

    return {
      completed: 0,
      total: 0,
      percentage: 0
    };

  }


  const completedLessonIds =
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


  courseLessons.forEach(
    lesson => {

      if (
        completedLessonIds.has(
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
    courseLessons.length;


  const percentage =
    total > 0
      ? Math.round(
          (
            completed /
            total
          ) * 100
        )
      : 0;


  return {
    completed,
    total,
    percentage
  };
}


// ============================================================
// RENDER COURSE
// ============================================================

async function renderMyCourse(
  enrollment,
  allLessons,
  progress
) {

  const course =
    await loadCourse(
      enrollment.course_id
    );


  if (!course) {
    return null;
  }


  const modules =
    await loadModules(
      enrollment.course_id
    );


  const courseLessons =
    allLessons.filter(
      lesson => {

        return modules.some(
          module => {

            const sameId =
              lesson.module_id &&
              String(
                lesson.module_id
              ) ===
              String(
                module.id
              );


            const sameNumber =
              lesson.module_number !==
                undefined &&
              module.module_number !==
                undefined &&
              Number(
                lesson.module_number
              ) ===
              Number(
                module.module_number
              );


            return (
              sameId ||
              sameNumber
            );

          }
        );

      }
    );


  const courseName =
    course.title ||
    course.name ||
    course.course_name ||
    "Course";


  const description =
    course.description ||
    course.course_description ||
    "Your Funda Online Academy course.";


  const price =
    course.price ??
    course.amount ??
    course.course_price ??
    null;


  const duration =
    course.duration ||
    course.course_duration ||
    course.duration_text ||
    course.length ||
    "";


  const courseProgress =
    calculateCourseProgress(
      courseLessons,
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

        <h3 style="margin-top:10px">
          Course modules are being prepared
        </h3>

      </div>

    `;

  } else {

    modulesHtml =
      modules
        .map(
          (module, index) => {

            const moduleLessons =
              getModuleLessons(
                module,
                courseLessons
              );


            let lessonsHtml =
              "";


            if (
              moduleLessons.length ===
              0
            ) {

              lessonsHtml = `

                <div class="empty-study">

                  <strong>
                    📖 Lessons are being prepared
                  </strong>

                </div>

              `;

            } else {

              lessonsHtml = `

                <div class="lesson-list">

                  ${
                    moduleLessons
                      .map(
                        lesson => {

                          const lessonTitle =
                            lesson.title ||
                            lesson.lesson_title ||
                            "Lesson";


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
                                    lesson.lesson_number ||
                                    ""
                                  )}

                                </span>


                                <div class="lesson-main">

                                  <div class="lesson-title">

                                    ${
                                      completed
                                        ? "✅ "
                                        : "📖 "
                                    }

                                    ${escapeHtml(
                                      lessonTitle
                                    )}

                                  </div>


                                  <div class="lesson-description">

                                    Lesson
                                    ${escapeHtml(
                                      lesson.lesson_number ||
                                      ""
                                    )}

                                    in

                                    ${escapeHtml(
                                      module.module_name ||
                                      module.name ||
                                      "Module"
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
                                        module.name ||
                                        "Module"
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
                                        module.module_name ||
                                        module.name ||
                                        "Module"
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

            }


            return `

              <div class="module-card">

                <button
                  type="button"
                  class="module-header"
                  data-module-index="${index}"
                >

                  <span class="module-left">

                    <span class="module-number">

                      ${escapeHtml(
                        module.module_number ||
                        index + 1
                      )}

                    </span>


                    <span class="module-name">

                      ${escapeHtml(
                        module.module_name ||
                        module.name ||
                        "Module"
                      )}

                    </span>

                  </span>


                  <span class="module-icon">
                    +
                  </span>

                </button>


                <div
                  class="module-content"
                  data-module-content="${index}"
                >

                  <p class="module-description">

                    ${escapeHtml(
                      module.description ||
                      module.module_description ||
                      "Learning material for this module."
                    )}

                  </p>


                  <p
                    style="
                      margin-bottom:14px;
                      font-size:14px;
                      color:#68766f;
                      font-weight:700;
                    "
                  >

                    📖 ${moduleLessons.length}

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
        description
      )}

    </p>


    <div class="study-meta">

      <span>
        💰 ${money(price)}
      </span>


      <span>

        ⏱️

        ${
          duration
            ? escapeHtml(duration)
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

        📖 ${courseLessons.length}

        ${
          courseLessons.length === 1
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
            width:${courseProgress.percentage}%
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
              Your lesson progress will appear here
              as you complete lessons.
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

              🎉 Course lessons completed!

              <br>

              Your assessment and final
              completion journey can continue.

            </div>

          `

          : ""
      }

    </div>

  `;


  if (studyList) {

    studyList.appendChild(
      card
    );

  }


  return {
    course,
    modules,
    lessons: courseLessons
  };
}


// ============================================================
// MODULE BUTTONS
// ============================================================

function setupModuleButtons() {

  document
    .querySelectorAll(
      "[data-module-index]"
    )
    .forEach(button => {

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

    });
}


// ============================================================
// LESSON BUTTONS
// ============================================================

function setupLessonButtons() {

  document
    .querySelectorAll(
      ".lesson-open, .review-lesson"
    )
    .forEach(button => {

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

    });
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
      "The lesson viewer could not be found on this page."
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
      "✅ Mark Lesson Complete";

  }


  try {

    const result =
      await withTimeout(

        db
          .from("lessons")
          .select("*")
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
        "The lesson could not be found."
      );

    }


    currentLesson =
      result.data;


    const title =
      currentLesson.title ||
      currentLesson.lesson_title ||
      "Lesson";


    if (lessonViewerTitle) {

      lessonViewerTitle.textContent =
        title;

    }


    if (lessonViewerModule) {

      lessonViewerModule.textContent =
        moduleName ||
        "Course Lesson";

    }


    if (lessonViewerContent) {

      lessonViewerContent.innerHTML =
        formatLessonContent(
          getLessonContent(
            currentLesson
          )
        );

    }


    if (completeLessonButton) {

      completeLessonButton.disabled =
        false;

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

        <div class="dashboard-start-error">

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
    !currentStudent ||
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
        "Progress check:",
        result.error
      );

      return;

    }


    if (
      result.data &&
      result.data.completed
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
      "Progress check error:",
      error
    );

  }
}


// ============================================================
// COMPLETE CURRENT LESSON
// ============================================================

async function completeCurrentLesson() {

  if (
    !currentStudent ||
    !currentLesson
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
            // IMPORTANT:
            // This must be students.id,
            // NOT auth.users.id.
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


    // Refresh the course display
    // so the percentage changes immediately.
    await loadMyStudies();


  } catch (error) {

    console.error(
      "LESSON COMPLETION ERROR:",
      error
    );


    completeLessonButton.disabled =
      false;


    completeLessonButton.textContent =
      "✅ Mark Lesson Complete";


    alert(

      "The lesson opened successfully, but your progress could not be saved yet.\n\n" +

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

    const enrolments =
      await loadStudentEnrolments(
        currentStudent.id
      );


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
            Once a course is approved, it will
            appear here.

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

        await renderMyCourse(
          enrollment,
          allLessons,
          progress
        );

      } catch (error) {

        console.error(
          "COURSE LOADING ERROR:",
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

    const enrolments =
      await loadStudentEnrolments(
        currentStudent.id
      );


    if (
      enrolments.length === 0
    ) {

      enrolmentsContainer.innerHTML = `

        <div class="empty-study">

          <div style="font-size:40px">
            📝
          </div>

          <h3 style="margin-top:10px">
            No approved enrolments
          </h3>

          <p style="margin-top:8px">

            Your profile is connected correctly.
            Approved enrolments will appear here.

          </p>

        </div>

      `;

      return;

    }


    const cards = [];


    for (
      const enrollment of enrolments
    ) {

      try {

        const course =
          await loadCourse(
            enrollment.course_id
          );


        const name =
          course?.title ||
          course?.name ||
          course?.course_name ||
          "Course";


        const duration =
          course?.duration ||
          course?.course_duration ||
          course?.duration_text ||
          course?.length ||
          "";


        cards.push(`

          <div class="card">

            <span class="funda-status approved">
              ✓ Approved
            </span>


            <h3 style="margin-top:8px">

              ${escapeHtml(
                name
              )}

            </h3>


            <p style="margin-top:8px">

              Your enrolment has been approved.

            </p>


            ${
              duration

                ? `

                  <div
                    class="course-information"
                    style="margin-top:15px"
                  >

                    <span>

                      ⏱️ Duration:
                      ${escapeHtml(
                        duration
                      )}

                    </span>

                  </div>

                `

                : ""
            }

          </div>

        `);

      } catch (error) {

        console.warn(
          "Could not load enrolment course:",
          error
        );

      }

    }


    if (
      cards.length > 0
    ) {

      enrolmentsContainer.innerHTML =
        cards.join("");

    } else {

      enrolmentsContainer.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Enrolments were found,
            but the course information could
            not be loaded.
          </strong>

        </div>

      `;

    }

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
          .select("*")
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

          <h3 style="margin-top:10px">
            No courses found
          </h3>

        </div>

      `;

      return;

    }


    availableCourses.innerHTML =
      courses
        .map(
          course => {

            const name =
              course.title ||
              course.name ||
              course.course_name ||
              "Course";


            const description =
              course.description ||
              course.course_description ||
              "Funda Online Academy course.";


            const price =
              course.price ??
              course.amount ??
              course.course_price ??
              null;


            const duration =
              course.duration ||
              course.course_duration ||
              course.duration_text ||
              course.length ||
              "";


            return `

              <div class="card available-course-card">

                <div class="available-course-top">

                  <span class="available-badge">
                    ✓ Available
                  </span>

                </div>


                <h3>

                  ${escapeHtml(
                    name
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
                    description
                  )}

                </p>


                <div class="course-information">

                  <span>
                    💰 ${money(price)}
                  </span>


                  <span>

                    ⏱️

                    ${
                      duration
                        ? escapeHtml(
                            duration
                          )
                        : "Duration to be confirmed"
                    }

                  </span>

                </div>


                <button
                  type="button"
                  class="btn green available-course-button"
                  disabled
                >

                  ✓ Available

                </button>

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
      currentUser.email || "";

  }


  if (userName) {

    userName.textContent =
      currentStudent.full_name ||
      currentUser.user_metadata?.full_name ||
      currentUser.email ||
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
// LOAD POLICY STATUS
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

        Your policy declaration has already
        been accepted on this device.

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
    async () => {

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

          Thank you. Your acceptance has
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

        await db.auth.signOut();

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


    currentUser =
      await getLoggedInUser();


    if (!currentUser) {
      return;
    }


    console.log(
      "AUTHENTICATED USER:",
      currentUser.id,
      currentUser.email
    );


    setStatus(
      "Finding your student profile…"
    );


    currentStudent =
      await loadStudentProfile(
        currentUser
      );


    if (!currentStudent) {

      throw new Error(
        "Student profile could not be loaded."
      );

    }


    console.log(
      "CONNECTED STUDENT:",
      currentStudent
    );


    loadHeader();


    await loadPolicyStatus();


    setStatus(
      "Loading your courses…"
    );


    // Load the three dashboard areas.
    await loadMyStudies();

    await loadMyEnrolments();

    await loadAvailableCourses();


    setStatus(
      "Student learning system ready."
    );


    console.log(
      "======================================"
    );

    console.log(
      "FUNDA STUDENT DASHBOARD READY"
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
      "======================================"
    );


  } catch (error) {

    console.error(
      "DASHBOARD START ERROR:",
      error
    );


    setStatus(
      "Student dashboard could not finish loading."
    );


    if (studyList) {

      studyList.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Student dashboard error
          </strong>


          <p style="margin-top:10px">

            ${escapeHtml(
              error.message ||
              String(error)
            )}

          </p>


          <p
            style="
              margin-top:12px;
              font-size:13px;
              color:#68766f;
            "
          >

            Your login session is being checked
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
// RUN
// ============================================================

initDashboard();
