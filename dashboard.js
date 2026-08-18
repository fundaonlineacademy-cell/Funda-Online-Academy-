// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// FIXED PROFILE + ENROLMENTS LOADING
// Lessons • Completion • Review Lesson
// ============================================================

"use strict";

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

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


function showError(container, title, error) {

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
// AUTHENTICATED USER
// ============================================================

async function getLoggedInUser() {

  const result = await withTimeout(
    db.auth.getUser()
  );

  if (result.error) {
    throw result.error;
  }

  if (
    !result.data ||
    !result.data.user
  ) {

    window.location.href =
      "login.html";

    return null;
  }

  return result.data.user;
}


// ============================================================
// STUDENT PROFILE
//
// IMPORTANT FIX:
// We use auth.uid() equivalent directly:
// students.user_id = authenticated user's ID
// ============================================================

async function loadStudentProfile(user) {

  if (!user || !user.id) {
    throw new Error(
      "The logged-in student ID could not be determined."
    );
  }

  console.log(
    "Looking for student profile using user_id:",
    user.id
  );

  const result = await withTimeout(

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

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {

    throw new Error(
      "Your login is working, but no student profile is connected to this account."
    );

  }

  console.log(
    "Student profile found:",
    result.data
  );

  return result.data;
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

  const result = await withTimeout(

    db
      .from("enrollments")
      .select(
        "id,student_id,course_id,enrollment_status"
      )
      .eq(
        "student_id",
        studentId
      )
      .eq(
        "enrollment_status",
        "approved"
      )

  );

  if (result.error) {
    throw result.error;
  }

  console.log(
    "Approved enrolments:",
    result.data
  );

  return result.data || [];
}


// ============================================================
// COURSE
// ============================================================

async function loadCourse(courseId) {

  const result = await withTimeout(

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

async function loadModules(courseId) {

  const result = await withTimeout(

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

  const result = await withTimeout(

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
// LESSON CONTENT
// ============================================================

function getLessonContent(lesson) {

  return (
    lesson.content ??
    lesson.lesson_content ??
    lesson.body ??
    lesson.lesson_body ??
    lesson.description ??
    ""
  );
}


function formatLessonContent(value) {

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

          This lesson has been created, but
          learning content has not yet been added.

        </p>

      </div>

    `;
  }

  const text = String(value);

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
          ${escapeHtml(paragraph)
            .replace(/\n/g, "<br>")}
        </p>
      `;

    })
    .join("");
}


// ============================================================
// FIND LESSONS FOR MODULE
// ============================================================

function getModuleLessons(
  module,
  lessons
) {

  return lessons
    .filter(lesson => {

      const sameId =
        lesson.module_id &&
        String(lesson.module_id) ===
        String(module.id);

      const sameNumber =
        lesson.module_number !== undefined &&
        module.module_number !== undefined &&
        Number(lesson.module_number) ===
        Number(module.module_number);

      return sameId || sameNumber;

    })
    .sort((a, b) => {

      return Number(
        a.lesson_number || 0
      ) -
      Number(
        b.lesson_number || 0
      );

    });
}


// ============================================================
// RENDER COURSE
// ============================================================

async function renderMyCourse(
  enrollment,
  allLessons
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
    allLessons.filter(lesson => {

      return modules.some(module => {

        const sameId =
          lesson.module_id &&
          String(lesson.module_id) ===
          String(module.id);

        const sameNumber =
          lesson.module_number !== undefined &&
          module.module_number !== undefined &&
          Number(lesson.module_number) ===
          Number(module.module_number);

        return sameId || sameNumber;

      });

    });

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

  const card =
    document.createElement("div");

  card.className =
    "study-card";

  let modulesHtml = "";

  if (modules.length === 0) {

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
      modules.map((module, index) => {

        const moduleLessons =
          getModuleLessons(
            module,
            courseLessons
          );

        let lessonsHtml = "";

        if (moduleLessons.length === 0) {

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

              ${moduleLessons
                .map(lesson => {

                  const lessonTitle =
                    lesson.title ||
                    lesson.lesson_title ||
                    "Lesson";

                  return `

                    <div class="lesson-item">

                      <div class="lesson-top">

                        <span class="lesson-number">

                          ${escapeHtml(
                            lesson.lesson_number || ""
                          )}

                        </span>

                        <div class="lesson-main">

                          <div class="lesson-title">

                            ${escapeHtml(
                              lessonTitle
                            )}

                          </div>

                          <div class="lesson-description">

                            Lesson
                            ${escapeHtml(
                              lesson.lesson_number || ""
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

                })
                .join("")}

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

      }).join("");

  }

  card.innerHTML = `

    <span class="funda-status approved">
      Approved
    </span>

    <h3 class="study-title">

      ${escapeHtml(courseName)}

    </h3>

    <p class="study-description">

      ${escapeHtml(description)}

    </p>

    <div class="study-meta">

      <span>
        💰 ${money(price)}
      </span>

      <span>
        ⏱️ ${
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
          0%
        </span>

      </div>

      <div class="progress-track">

        <div
          class="progress-bar"
          style="width:0%"
        ></div>

      </div>

      <p
        style="
          margin-top:8px;
          color:#68766f;
          font-size:13px;
        "
      >

        Your lesson progress will appear here
        as lessons are completed.

      </p>

    </div>

  `;

  studyList.appendChild(card);

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
              icon.textContent = "+";
            }

          } else {

            content.classList.add(
              "open"
            );

            if (icon) {
              icon.textContent = "−";
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

  lessonViewer.classList.add(
    "show"
  );

  lessonViewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

  lessonViewerContent.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading lesson content…
      </p>

    </div>

  `;

  lessonCompleteMessage.style.display =
    "none";

  completeLessonButton.disabled =
    true;

  completeLessonButton.textContent =
    "✅ Mark Lesson Complete";

  try {

    const result =
      await withTimeout(

        db
          .from("lessons")
          .select("*")
          .eq("id", lessonId)
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

    lessonViewerTitle.textContent =
      title;

    lessonViewerModule.textContent =
      moduleName ||
      "Course Lesson";

    lessonViewerContent.innerHTML =
      formatLessonContent(
        getLessonContent(
          currentLesson
        )
      );

    completeLessonButton.disabled =
      false;

    await checkLessonCompletion(
      currentLesson.id
    );

  } catch (error) {

    console.error(
      "Lesson error:",
      error
    );

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


// ============================================================
// CLOSE LESSON
// ============================================================

function closeLesson() {

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
    !currentUser ||
    !lessonId
  ) {
    return;
  }

  try {

    const result =
      await db
        .from("lesson_progress")
        .select("*")
        .eq(
          "student_id",
          currentUser.id
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

      lessonCompleteMessage.style.display =
        "block";

      lessonCompleteMessage.innerHTML = `

        <strong>
          ✅ Lesson completed
        </strong>

        Your progress has already been saved.

      `;

      completeLessonButton.textContent =
        "✅ Lesson Completed";

    } else {

      lessonCompleteMessage.style.display =
        "none";

      completeLessonButton.textContent =
        "✅ Mark Lesson Complete";

    }

  } catch (error) {

    console.warn(
      "Progress check error:",
      error
    );

  }
}


// ============================================================
// COMPLETE LESSON
// ============================================================

async function completeCurrentLesson() {

  if (
    !currentUser ||
    !currentLesson
  ) {

    alert(
      "Your student login could not be confirmed. Please log in again."
    );

    return;
  }

  completeLessonButton.disabled =
    true;

  completeLessonButton.textContent =
    "Saving…";

  try {

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
              new Date().toISOString(),

            updated_at:
              new Date().toISOString()
          },

          {
            onConflict:
              "student_id,lesson_id"
          }

        );

    if (result.error) {
      throw result.error;
    }

    lessonCompleteMessage.style.display =
      "block";

    lessonCompleteMessage.innerHTML = `

      <strong>
        ✅ Lesson completed successfully.
      </strong>

      Your progress has been saved.

    `;

    completeLessonButton.textContent =
      "✅ Lesson Completed";

    completeLessonButton.disabled =
      true;

  } catch (error) {

    console.error(
      "Lesson completion:",
      error
    );

    completeLessonButton.disabled =
      false;

    completeLessonButton.textContent =
      "✅ Mark Lesson Complete";

    alert(
      "The lesson was opened successfully, but progress could not be saved yet.\n\n" +
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

    if (enrolments.length === 0) {

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

    studyList.innerHTML = "";

    for (
      const enrollment of enrolments
    ) {

      try {

        await renderMyCourse(
          enrollment,
          allLessons
        );

      } catch (error) {

        console.error(
          "Course loading error:",
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
      "My studies error:",
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

    if (enrolments.length === 0) {

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
              Approved
            </span>

            <h3 style="margin-top:8px">

              ${escapeHtml(name)}

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
                      ${escapeHtml(duration)}

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

    if (cards.length > 0) {

      enrolmentsContainer.innerHTML =
        cards.join("");

    } else {

      enrolmentsContainer.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Enrolments were found, but the course information could not be loaded.
          </strong>

        </div>

      `;

    }

  } catch (error) {

    console.error(
      "Enrolments error:",
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

    if (courses.length === 0) {

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
        .map(course => {

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

                ${escapeHtml(name)}

              </h3>

              <p
                style="
                  margin-top:8px;
                  line-height:1.6;
                  color:#53625b;
                "
              >

                ${escapeHtml(description)}

              </p>

              <div class="course-information">

                <span>
                  💰 ${money(price)}
                </span>

                <span>

                  ⏱️ ${
                    duration
                      ? escapeHtml(duration)
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

        })
        .join("");

  } catch (error) {

    console.error(
      "Available courses:",
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

        Your policy declaration has already
        been accepted on this device.

      `;

    }

  }
}


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

      } finally {

        window.location.href =
          "login.html";

      }

    }
  );

}


// ============================================================
// START
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
      "AUTH USER:",
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

    console.log(
      "STUDENT:",
      currentStudent
    );

    loadHeader();

    await loadPolicyStatus();

    setStatus(
      "Loading your courses…"
    );

    /*
     * Load these independently.
     * If one fails, the other sections still work.
     */

    await loadMyStudies();

    await loadMyEnrolments();

    await loadAvailableCourses();

    setStatus(
      "Student learning system ready."
    );

    console.log(
      "FUNDA DASHBOARD READY"
    );

  } catch (error) {

    console.error(
      "DASHBOARD START ERROR:",
      error
    );

    setStatus(
      "Student dashboard could not finish loading."
    );

    /*
     * IMPORTANT:
     * Do not replace working course/lesson content
     * with the old generic profile-not-found screen.
     */

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
