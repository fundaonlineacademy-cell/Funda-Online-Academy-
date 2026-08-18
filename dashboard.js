// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COMPLETE REPLACEMENT dashboard.js
//
// Keeps:
// - Available Courses
// - Course duration
// - Available button
// - My Studies
// - Lessons
// - Review Lesson
// - Open Lesson
// - Mark Lesson Complete
// - Lesson progress
// - Student enrolments
// ============================================================

"use strict";

const { createClient } = window.supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const userName =
  document.getElementById("user-name");

const userEmail =
  document.getElementById("user-email");

const message =
  document.getElementById("message");

const systemStatus =
  document.getElementById("system-status");

const studyList =
  document.getElementById("study-list");

const enrolments =
  document.getElementById("enrolments");

const availableCourses =
  document.getElementById("available-courses");

const paymentList =
  document.getElementById("payment-list");

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
// STATE
// ============================================================

let currentUser = null;
let currentStudent = null;
let currentLesson = null;


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

  return "R " + number.toLocaleString(
    "en-ZA",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}


function durationOf(course) {

  return (
    course?.duration ||
    course?.course_duration ||
    course?.duration_text ||
    course?.length ||
    ""
  );
}


function courseNameOf(course) {

  return (
    course?.title ||
    course?.name ||
    course?.course_name ||
    "Course"
  );
}


function courseDescriptionOf(course) {

  return (
    course?.description ||
    course?.course_description ||
    "Funda Online Academy course."
  );
}


function setStatus(text) {

  if (systemStatus) {
    systemStatus.textContent = text;
  }
}


function showMessage(text, success = false) {

  if (!message) {
    return;
  }

  message.textContent = text;
  message.className =
    "message " +
    (success ? "success" : "error");
}


function timeout(promise, seconds = 12) {

  return Promise.race([

    promise,

    new Promise((_, reject) => {

      setTimeout(() => {

        reject(
          new Error(
            "The request took too long. Please try again."
          )
        );

      }, seconds * 1000);

    })

  ]);
}


// ============================================================
// AUTH
// ============================================================

async function getLoggedInUser() {

  const result = await timeout(
    db.auth.getUser(),
    12
  );

  if (result.error) {
    throw result.error;
  }

  if (!result.data?.user) {

    window.location.href =
      "login.html";

    return null;
  }

  return result.data.user;
}


// ============================================================
// IMPORTANT STUDENT LOOKUP
//
// We first use user_id.
// If the existing student table was created with the user's
// Auth UUID stored in another common field, we also try the
// email as a safe fallback.
//
// This prevents the dashboard from falsely saying that the
// student does not exist when the account is already registered.
// ============================================================

async function findStudent(user) {

  // ----------------------------------------------------------
  // 1. NORMAL / CORRECT CONNECTION
  // ----------------------------------------------------------

  const byUserId = await timeout(
    db
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .limit(1),
    12
  );

  if (!byUserId.error &&
      byUserId.data &&
      byUserId.data.length > 0) {

    return byUserId.data[0];
  }


  // ----------------------------------------------------------
  // 2. FALLBACK USING EMAIL
  // ----------------------------------------------------------

  if (user.email) {

    const byEmail = await timeout(
      db
        .from("students")
        .select("*")
        .eq("email", user.email)
        .limit(1),
      12
    );

    if (!byEmail.error &&
        byEmail.data &&
        byEmail.data.length > 0) {

      const student =
        byEmail.data[0];

      // Try to connect the existing student
      // record to the currently logged-in Auth user.

      if (
        !student.user_id ||
        String(student.user_id) !== String(user.id)
      ) {

        const updateResult =
          await db
            .from("students")
            .update({
              user_id: user.id,
              updated_at:
                new Date().toISOString()
            })
            .eq(
              "id",
              student.id
            );

        if (!updateResult.error) {

          student.user_id =
            user.id;

        }
      }

      return student;
    }
  }


  return null;
}


// ============================================================
// STUDENT HEADER
// ============================================================

async function loadStudentHeader() {

  if (userEmail) {
    userEmail.textContent =
      currentUser.email || "";
  }

  if (!currentStudent) {

    if (userName) {
      userName.textContent =
        currentUser.user_metadata?.full_name ||
        "Student";
    }

    return;
  }

  if (userName) {

    userName.textContent =
      currentStudent.full_name ||
      currentStudent.name ||
      currentStudent.first_name ||
      "Student";
  }
}


// ============================================================
// ENROLMENTS
// ============================================================

async function getStudentEnrollments() {

  if (!currentStudent?.id) {
    return [];
  }


  // First try the spelling used by the current dashboard.
  let result = await timeout(
    db
      .from("enrollments")
      .select("*")
      .eq(
        "student_id",
        currentStudent.id
      ),
    12
  );


  // If the table does not exist, try enrolments.
  if (
    result.error &&
    (
      result.error.code === "42P01" ||
      String(result.error.message || "")
        .toLowerCase()
        .includes("does not exist")
    )
  ) {

    result = await timeout(
      db
        .from("enrolments")
        .select("*")
        .eq(
          "student_id",
          currentStudent.id
        ),
      12
    );
  }


  if (result.error) {
    throw result.error;
  }


  return result.data || [];
}


// ============================================================
// COURSE
// ============================================================

async function getCourse(courseId) {

  const result = await timeout(
    db
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .limit(1),
    12
  );

  if (result.error) {
    throw result.error;
  }

  return result.data?.[0] || null;
}


// ============================================================
// MODULES
// ============================================================

async function getModules(courseId) {

  const result = await timeout(
    db
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order(
        "module_number",
        {
          ascending: true
        }
      ),
    12
  );

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}


// ============================================================
// LESSONS
// ============================================================

async function getLessonsForModules(modules) {

  if (!modules.length) {
    return [];
  }

  const moduleIds =
    modules.map(module => module.id);

  const result = await timeout(
    db
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order(
        "lesson_number",
        {
          ascending: true
        }
      ),
    12
  );

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}


// ============================================================
// LESSON CONTENT
// ============================================================

function lessonContent(lesson) {

  return (
    lesson.content ??
    lesson.lesson_content ??
    lesson.body ??
    lesson.lesson_body ??
    lesson.description ??
    ""
  );
}


function formatLessonContent(content) {

  if (
    content === null ||
    content === undefined ||
    String(content).trim() === ""
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
          The lesson has been created, but the
          learning material has not yet been added.
        </p>

      </div>

    `;
  }


  const text = String(content);


  // Keep existing HTML lesson content.
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
// RENDER AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses() {

  if (!availableCourses) {
    return;
  }


  availableCourses.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading courses…
      </p>

    </div>

  `;


  try {

    const result = await timeout(
      db
        .from("courses")
        .select("*")
        .order(
          "title",
          {
            ascending: true
          }
        ),
      12
    );


    if (result.error) {
      throw result.error;
    }


    const courses =
      result.data || [];


    if (!courses.length) {

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
      courses.map(course => {

        const name =
          courseNameOf(course);

        const description =
          courseDescriptionOf(course);

        const duration =
          durationOf(course);

        const price =
          course.price ??
          course.amount ??
          course.course_price ??
          null;


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

      }).join("");


  } catch (error) {

    console.error(
      "Available courses error:",
      error
    );

    availableCourses.innerHTML = `

      <div class="error-study">

        <strong>
          ⚠️ Courses could not be loaded
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
// RENDER ENROLMENTS
// ============================================================

async function loadEnrolments() {

  if (!enrolments) {
    return;
  }


  enrolments.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading enrolments…
      </p>

    </div>

  `;


  if (!currentStudent) {

    enrolments.innerHTML = `

      <div class="empty-study">

        <h3>
          Student profile not connected
        </h3>

        <p style="margin-top:8px">
          Your login is working, but your registered
          student profile could not be connected.
        </p>

      </div>

    `;

    return;
  }


  try {

    const rows =
      await getStudentEnrollments();


    if (!rows.length) {

      enrolments.innerHTML = `

        <div class="empty-study">

          <div style="font-size:45px">
            📝
          </div>

          <h3 style="margin-top:10px">
            No enrolments yet
          </h3>

          <p style="margin-top:8px;line-height:1.6">
            Your approved enrolments will appear here.
          </p>

        </div>

      `;

      return;
    }


    const cards = [];


    for (const row of rows) {

      try {

        const course =
          await getCourse(
            row.course_id
          );


        const name =
          courseNameOf(course);


        const duration =
          durationOf(course);


        const status =
          row.enrollment_status ||
          row.status ||
          "pending";


        cards.push(`

          <div class="card">

            <span
              class="funda-status ${
                escapeHtml(
                  String(status).toLowerCase()
                )
              }"
            >
              ${escapeHtml(status)}
            </span>

            <h3 style="margin-top:5px">
              ${escapeHtml(name)}
            </h3>

            ${
              duration
                ? `
                  <p
                    style="
                      margin-top:12px;
                      font-weight:700;
                      color:#0c8f55;
                    "
                  >
                    ⏱️ Duration:
                    ${escapeHtml(duration)}
                  </p>
                `
                : ""
            }

          </div>

        `);

      } catch (error) {

        console.error(
          "Enrolment course error:",
          error
        );

      }
    }


    if (cards.length) {

      enrolments.innerHTML =
        cards.join("");

    } else {

      enrolments.innerHTML = `

        <div class="empty-study">

          <p>
            Enrolments were found, but the
            associated course could not be displayed.
          </p>

        </div>

      `;
    }


  } catch (error) {

    console.error(
      "Enrolment loading error:",
      error
    );


    enrolments.innerHTML = `

      <div class="error-study">

        <strong>
          ⚠️ Enrolments could not be loaded
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
// LOAD MY STUDIES
// ============================================================

async function loadMyStudies() {

  if (!studyList) {
    return;
  }


  studyList.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading your studies…
      </p>

    </div>

  `;


  if (!currentStudent) {

    studyList.innerHTML = `

      <div class="empty-study">

        <div style="font-size:48px">
          👤
        </div>

        <h3 style="margin-top:10px">
          Student profile not connected
        </h3>

        <p style="margin-top:8px;line-height:1.6">

          Your login is working, but no student
          profile is connected to this account.

        </p>

      </div>

    `;

    return;
  }


  try {

    const rows =
      await getStudentEnrollments();


    const approved =
      rows.filter(row => {

        const status =
          String(
            row.enrollment_status ||
            row.status ||
            ""
          ).toLowerCase();

        return (
          status === "approved" ||
          status === "active" ||
          status === "paid"
        );
      });


    if (!approved.length) {

      studyList.innerHTML = `

        <div class="empty-study">

          <div style="font-size:48px">
            📚
          </div>

          <h3 style="margin-top:10px">
            No approved courses yet
          </h3>

          <p style="margin-top:8px;line-height:1.6">
            Once your enrolment is approved,
            your course and lessons will appear here.
          </p>

        </div>

      `;

      return;
    }


    const studies = [];


    for (const enrollment of approved) {

      try {

        const course =
          await getCourse(
            enrollment.course_id
          );


        if (!course) {
          continue;
        }


        const modules =
          await getModules(
            enrollment.course_id
          );


        let lessons = [];


        try {

          lessons =
            await getLessonsForModules(
              modules
            );

        } catch (error) {

          console.warn(
            "Lessons could not load:",
            error
          );

        }


        studies.push({
          enrollment,
          course,
          modules,
          lessons
        });

      } catch (error) {

        console.error(
          "Study loading error:",
          error
        );
      }
    }


    if (!studies.length) {

      studyList.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Your enrolment was found,
            but the course could not be loaded.
          </strong>

        </div>

      `;

      return;
    }


    studyList.innerHTML = "";


    studies.forEach(
      renderStudy
    );


    setupModuleButtons();
    setupLessonButtons();


  } catch (error) {

    console.error(
      "My studies error:",
      error
    );


    studyList.innerHTML = `

      <div class="error-study">

        <strong>
          ⚠️ My Studies could not be loaded
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
// RENDER STUDY
// ============================================================

function renderStudy(study) {

  const course =
    study.course;

  const modules =
    study.modules || [];

  const lessons =
    study.lessons || [];


  const name =
    courseNameOf(course);

  const description =
    courseDescriptionOf(course);

  const duration =
    durationOf(course);

  const price =
    course.price ??
    course.amount ??
    course.course_price ??
    null;


  const card =
    document.createElement("div");

  card.className =
    "study-card";


  let modulesHtml = "";


  modules.forEach(
    (module, index) => {

      const moduleLessons =
        lessons.filter(
          lesson =>
            String(
              lesson.module_id
            ) ===
            String(
              module.id
            )
        );


      modulesHtml += `

        <div class="module-card">

          <button
            type="button"
            class="module-header"
            data-module-index="${index}"
          >

            <span class="module-left">

              <span class="module-number">
                ${escapeHtml(
                  module.module_number ??
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


            <div class="lesson-list">

              ${
                moduleLessons.length
                  ? moduleLessons.map(
                      lesson => {

                        const lessonTitle =
                          lesson.title ||
                          lesson.lesson_title ||
                          "Lesson";


                        return `

                          <div class="lesson-item">

                            <div class="lesson-top">

                              <span class="lesson-number">

                                ${escapeHtml(
                                  lesson.lesson_number ??
                                  ""
                                )}

                              </span>


                              <div class="lesson-main">

                                <div class="lesson-title">

                                  ${escapeHtml(
                                    lessonTitle
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
                    ).join("")
                  : `
                    <div class="empty-study">
                      Lessons are being prepared.
                    </div>
                  `
              }

            </div>

          </div>

        </div>

      `;
    }
  );


  if (!modules.length) {

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
  }


  card.innerHTML = `

    <span class="funda-status approved">
      Approved
    </span>


    <h3 class="study-title">
      ${escapeHtml(name)}
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

        <span class="course-progress-number">
          0%
        </span>

      </div>


      <div class="progress-track">

        <div
          class="progress-bar"
          style="width:0%"
        ></div>

      </div>

    </div>

  `;


  studyList.appendChild(
    card
  );
}


// ============================================================
// MODULE OPEN/CLOSE
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
            button.dataset.moduleIndex;

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
            button.dataset.lessonId,
            button.dataset.moduleName
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


  currentLesson = null;


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

    <p class="loading">
      Loading lesson…
    </p>

  `;


  lessonCompleteMessage.style.display =
    "none";


  completeLessonButton.disabled =
    true;


  try {

    const result =
      await timeout(
        db
          .from("lessons")
          .select("*")
          .eq("id", lessonId)
          .limit(1),
        12
      );


    if (result.error) {
      throw result.error;
    }


    const lesson =
      result.data?.[0];


    if (!lesson) {
      throw new Error(
        "Lesson could not be found."
      );
    }


    currentLesson =
      lesson;


    lessonViewerTitle.textContent =
      lesson.title ||
      lesson.lesson_title ||
      "Lesson";


    lessonViewerModule.textContent =
      moduleName ||
      "Course Lesson";


    lessonViewerContent.innerHTML =
      formatLessonContent(
        lessonContent(lesson)
      );


    completeLessonButton.disabled =
      false;


    await checkLessonCompletion(
      lesson.id
    );


  } catch (error) {

    console.error(
      "Lesson error:",
      error
    );


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

  currentLesson = null;
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
      lessonViewer?.classList.contains(
        "show"
      )
    ) {
      closeLesson();
    }

  }
);


// ============================================================
// LESSON PROGRESS
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
        .limit(1);


    if (result.error) {

      console.warn(
        "Progress check:",
        result.error
      );

      return;
    }


    const progress =
      result.data?.[0];


    if (
      progress &&
      progress.completed
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


      completeLessonButton.disabled =
        true;

    } else {

      lessonCompleteMessage.style.display =
        "none";


      completeLessonButton.textContent =
        "✅ Mark Lesson Complete";


      completeLessonButton.disabled =
        false;
    }


  } catch (error) {

    console.warn(
      "Progress check error:",
      error
    );

  }
}


async function completeCurrentLesson() {

  if (
    !currentUser ||
    !currentLesson
  ) {
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
      "The lesson was opened, but your progress could not be saved yet.\n\n" +
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
// PAYMENTS
// ============================================================

async function loadPayments() {

  if (!paymentList || !currentStudent) {
    return;
  }


  paymentList.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading payment history…
      </p>

    </div>

  `;


  try {

    const result =
      await timeout(
        db
          .from("payments")
          .select("*")
          .eq(
            "student_id",
            currentStudent.id
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          ),
        12
      );


    if (result.error) {

      // Payments are optional.
      // Do not allow payment errors to break
      // the student dashboard.

      console.warn(
        "Payments:",
        result.error
      );


      paymentList.innerHTML = `

        <div class="payment-card">

          <strong>
            Payment history
          </strong>

          <p style="margin-top:8px">
            No payment history is available yet.
          </p>

        </div>

      `;

      return;
    }


    const payments =
      result.data || [];


    if (!payments.length) {

      paymentList.innerHTML = `

        <div class="payment-card">

          <strong>
            No payments recorded yet.
          </strong>

          <p style="margin-top:8px">
            Payment records will appear here.
          </p>

        </div>

      `;

      return;
    }


    paymentList.innerHTML =
      payments.map(payment => {

        return `

          <div class="payment-card">

            <strong>
              Payment
            </strong>

            <p style="margin-top:8px">
              Amount:
              ${money(
                payment.amount
              )}
            </p>

            <p style="margin-top:5px">
              Status:
              ${escapeHtml(
                payment.status ||
                "Recorded"
              )}
            </p>

          </div>

        `;

      }).join("");


  } catch (error) {

    console.warn(
      "Payment loading:",
      error
    );


    paymentList.innerHTML = `

      <div class="payment-card">

        Payment history will appear here.

      </div>

    `;
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

        Your declaration has already been
        accepted on this device.

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


      if (!currentUser) {
        return;
      }


      localStorage.setItem(
        "foa_policy_accepted_" +
        currentUser.id,
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
          been recorded.

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

      logoutButton.disabled =
        true;

      logoutButton.textContent =
        "Logging out…";


      try {

        await db.auth.signOut();

        window.location.href =
          "login.html";

      } catch (error) {

        console.error(
          "Logout:",
          error
        );

        logoutButton.disabled =
          false;

        logoutButton.textContent =
          "Logout";

        alert(
          "Unable to log out. Please try again."
        );
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
      "Connecting to student account…"
    );


    currentUser =
      await getLoggedInUser();


    if (!currentUser) {
      return;
    }


    // --------------------------------------------------------
    // COURSES LOAD INDEPENDENTLY
    // --------------------------------------------------------

    // This means the course section can load even if the
    // student profile has a problem.

    loadAvailableCourses();


    // --------------------------------------------------------
    // STUDENT CONNECTION
    // --------------------------------------------------------

    setStatus(
      "Checking student profile…"
    );


    try {

      currentStudent =
        await findStudent(
          currentUser
        );

    } catch (error) {

      console.error(
        "Student lookup:",
        error
      );

      currentStudent =
        null;
    }


    await loadStudentHeader();


    // --------------------------------------------------------
    // IF STUDENT PROFILE WAS FOUND
    // --------------------------------------------------------

    if (currentStudent) {

      setStatus(
        "Student account connected."
      );


      // These are deliberately independent.
      // A problem with one cannot keep the whole
      // dashboard spinning forever.

      loadMyStudies();

      loadEnrolments();

      loadPayments();

      loadPolicyStatus();


    } else {

      setStatus(
        "Login connected, but student profile needs attention."
      );


      if (studyList) {

        studyList.innerHTML = `

          <div class="empty-study">

            <div style="font-size:48px">
              👤
            </div>

            <h3 style="margin-top:10px">
              Student profile not connected
            </h3>

            <p style="margin-top:8px;line-height:1.6">

              Your login is working, but no student
              profile is connected to this account.

            </p>

            <p
              style="
                margin-top:10px;
                font-size:14px;
                color:#68766f;
              "
            >

              Your available courses are still shown
              below.

            </p>

          </div>

        `;
      }


      if (enrolments) {

        enrolments.innerHTML = `

          <div class="empty-study">

            <h3>
              Enrolments are waiting for your
              student profile
            </h3>

            <p style="margin-top:8px">

              Once the student account is connected,
              your enrolments will appear here.

            </p>

          </div>

        `;
      }
    }


    setStatus(
      "Student dashboard ready."
    );


  } catch (error) {

    console.error(
      "Dashboard startup error:",
      error
    );


    setStatus(
      "Dashboard could not connect."
    );


    if (studyList) {

      studyList.innerHTML = `

        <div class="error-study">

          <strong>
            ⚠️ Dashboard connection problem
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
// START
// ============================================================

initDashboard();
