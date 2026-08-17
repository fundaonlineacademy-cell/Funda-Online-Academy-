// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COMPLETE VERSION
//
// Students
// Enrolments
// Courses
// Course Modules
// Lessons
// Payments
// Policy Acceptance
// Progress
// Logout
//
// IMPORTANT:
// This version DOES NOT use enrollments.created_at.
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// GLOBAL ELEMENTS
// ============================================================

const messageEl = document.getElementById("message");
const userEmailEl = document.getElementById("user-email");
const userNameEl = document.getElementById("user-name");

const studyListEl = document.getElementById("study-list");
const paymentListEl = document.getElementById("payment-list");
const enrolmentsEl = document.getElementById("enrolments");
const availableCoursesEl = document.getElementById("available-courses");

const logoutBtn = document.getElementById("logout");

const policyCheckbox = document.getElementById("policy-checkbox");
const acceptPolicyBtn = document.getElementById("accept-policy-btn");
const policyAcceptedEl = document.getElementById("policy-accepted");


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let currentStudent = null;

let currentStudies = [];


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


function showMessage(text, type = "error") {

  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;

  messageEl.className =
    "message " +
    (type === "success" ? "success" : "error");
}


function hideMessage() {

  if (!messageEl) {
    return;
  }

  messageEl.className = "message hidden";
  messageEl.textContent = "";
}


function formatMoney(value) {

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return escapeHtml(value);
  }

  return "R" + number.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}


function statusClass(status) {

  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (
    value === "approved" ||
    value === "active" ||
    value === "paid"
  ) {
    return "approved";
  }

  if (
    value === "rejected" ||
    value === "failed" ||
    value === "cancelled"
  ) {
    return "rejected";
  }

  return "";
}


function isApproved(status) {

  const value = String(status || "")
    .toLowerCase()
    .trim();

  return (
    value === "approved" ||
    value === "active"
  );
}


function setLoading(element, text) {

  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="card">
      <p class="loading">${escapeHtml(text)}</p>
    </div>
  `;
}


function setEmpty(element, text) {

  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="empty-study">
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function getCurrentUser() {

  const {
    data,
    error
  } = await db.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data || !data.user) {
    throw new Error(
      "You are not logged in. Please log in again."
    );
  }

  return data.user;
}


// ============================================================
// LOAD STUDENT RECORD
// ============================================================

async function loadStudent(userId) {

  const {
    data,
    error
  } = await db
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Your student profile could not be found. Please contact Funda Online Academy."
    );
  }

  return data;
}


// ============================================================
// DISPLAY USER INFORMATION
// ============================================================

function displayUser() {

  if (!currentUser) {
    return;
  }

  if (userEmailEl) {
    userEmailEl.textContent =
      currentUser.email || "";
  }

  if (userNameEl) {

    const name =
      currentStudent?.full_name ||
      currentUser.user_metadata?.full_name ||
      "Student";

    userNameEl.textContent = name;
  }
}


// ============================================================
// LOAD ENROLMENTS
// ============================================================
//
// IMPORTANT:
// We intentionally DO NOT select created_at.
// Your enrollments table does not have that column.
// ============================================================

async function loadEnrolments() {

  const {
    data,
    error
  } = await db
    .from("enrollments")
    .select(`
      id,
      student_id,
      course_id,
      enrollment_status
    `)
    .eq("student_id", currentStudent.id)
    .order("id", {
      ascending: false
    });

  if (error) {
    throw error;
  }

  return data || [];
}


// ============================================================
// LOAD COURSE
// ============================================================

async function loadCourse(courseId) {

  const {
    data,
    error
  } = await db
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


// ============================================================
// LOAD MODULES
// ============================================================

async function loadModules(courseId) {

  const {
    data,
    error
  } = await db
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

  if (error) {
    throw error;
  }

  return data || [];
}


// ============================================================
// LOAD LESSONS
// ============================================================
//
// The lesson records supplied earlier contain:
//
// id
// module_number
// module_name
// lesson_number
// title
//
// We therefore load lessons by module_number and course/module
// information rather than depending on a foreign-key relation.
// ============================================================

async function loadLessons(moduleNumber, moduleName) {

  const queries = [

    db
      .from("lessons")
      .select("*")
      .eq("module_number", moduleNumber)
      .eq("module_name", moduleName)
      .order("lesson_number", {
        ascending: true
      }),

    db
      .from("course_lessons")
      .select("*")
      .eq("module_number", moduleNumber)
      .eq("module_name", moduleName)
      .order("lesson_number", {
        ascending: true
      })

  ];


  // Try lessons table first.
  const first = await queries[0];

  if (!first.error) {
    return first.data || [];
  }


  // If the project uses course_lessons instead,
  // try that table.
  const second = await queries[1];

  if (!second.error) {
    return second.data || [];
  }


  // Neither table worked.
  // Return an empty list instead of breaking My Studies.
  console.warn(
    "Lessons table could not be loaded:",
    first.error,
    second.error
  );

  return [];
}


// ============================================================
// LOAD ALL STUDY DATA
// ============================================================

async function loadStudies() {

  if (!studyListEl) {
    return;
  }

  setLoading(
    studyListEl,
    "Loading your studies…"
  );


  try {

    const enrolments = await loadEnrolments();


    // Only approved/active courses appear in My Studies.
    const approved = enrolments.filter(
      enrollment =>
        isApproved(enrollment.enrollment_status)
    );


    if (!approved.length) {

      setEmpty(
        studyListEl,
        "You do not have any approved courses yet."
      );

      currentStudies = [];

      return;
    }


    const studies = [];


    for (const enrollment of approved) {

      try {

        const course =
          await loadCourse(enrollment.course_id);


        if (!course) {
          continue;
        }


        const modules =
          await loadModules(enrollment.course_id);


        const modulesWithLessons = [];


        for (const module of modules) {

          const lessons =
            await loadLessons(
              module.module_number,
              module.module_name
            );


          modulesWithLessons.push({
            ...module,
            lessons
          });
        }


        studies.push({

          enrollment,

          course,

          modules: modulesWithLessons

        });

      } catch (courseError) {

        console.error(
          "Could not load course:",
          enrollment.course_id,
          courseError
        );

      }

    }


    currentStudies = studies;


    if (!studies.length) {

      setEmpty(
        studyListEl,
        "Your approved enrolment was found, but the course information could not be loaded."
      );

      return;
    }


    renderStudies(studies);

  } catch (error) {

    console.error(
      "My Studies error:",
      error
    );

    studyListEl.innerHTML = `
      <div class="card">
        <p class="loading">
          Unable to load your studies.
        </p>

        <p style="
          margin-top:10px;
          color:#a51d1d;
          line-height:1.6;
        ">
          ${escapeHtml(error.message || "Unknown error")}
        </p>
      </div>
    `;
  }
}


// ============================================================
// COURSE FIELD HELPERS
// ============================================================

function getCourseName(course) {

  return (
    course.name ||
    course.course_name ||
    course.title ||
    "Course"
  );
}


function getCourseDescription(course) {

  return (
    course.description ||
    course.course_description ||
    "Your approved Funda Online Academy course."
  );
}


function getCoursePrice(course) {

  return (
    course.price ??
    course.course_price ??
    course.amount ??
    null
  );
}


// ============================================================
// RENDER STUDIES
// ============================================================

function renderStudies(studies) {

  if (!studyListEl) {
    return;
  }


  studyListEl.innerHTML = "";


  studies.forEach(
    (study, studyIndex) => {

      const {
        enrollment,
        course,
        modules
      } = study;


      const courseName =
        getCourseName(course);


      const description =
        getCourseDescription(course);


      const price =
        getCoursePrice(course);


      const totalLessons =
        modules.reduce(
          (total, module) =>
            total +
            (module.lessons?.length || 0),
          0
        );


      const totalModules =
        modules.length;


      const card =
        document.createElement("div");

      card.className =
        "study-card";


      card.innerHTML = `

        <div class="study-header">

          <div>

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

              ${
                price !== null
                  ? `
                    <span>
                      💰 ${formatMoney(price)}
                    </span>
                  `
                  : ""
              }

              <span>
                📚 ${totalModules} module${totalModules === 1 ? "" : "s"}
              </span>

              <span>
                📖 ${totalLessons} lesson${totalLessons === 1 ? "" : "s"}
              </span>

              <span>
                ✅ ${escapeHtml(
                  enrollment.enrollment_status || "approved"
                )}
              </span>

            </div>

          </div>

        </div>


        <div class="funda-card-actions">

          <button
            type="button"
            class="btn green study-button"
            data-study-index="${studyIndex}">

            📚 Study Course

          </button>

        </div>


        <div
          class="modules-container"
          id="modules-${studyIndex}">

        </div>

      `;


      studyListEl.appendChild(card);


      const modulesContainer =
        card.querySelector(
          `#modules-${studyIndex}`
        );


      renderModules(
        modulesContainer,
        modules,
        studyIndex
      );


      const studyButton =
        card.querySelector(
          `[data-study-index="${studyIndex}"]`
        );


      if (studyButton) {

        studyButton.addEventListener(
          "click",
          () => {

            modulesContainer.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }
        );
      }

    }
  );
}


// ============================================================
// RENDER MODULES
// ============================================================

function renderModules(
  container,
  modules,
  studyIndex
) {

  if (!container) {
    return;
  }


  if (!modules.length) {

    container.innerHTML = `

      <div class="empty-study">

        <p>
          📖 Course modules are being prepared
          by the academy.
        </p>

      </div>

    `;

    return;
  }


  const heading =
    document.createElement("h3");

  heading.style.margin =
    "0 0 16px";


  heading.textContent =
    "📖 Course Modules";


  container.appendChild(heading);


  modules.forEach(
    (module, moduleIndex) => {

      const moduleCard =
        document.createElement("div");

      moduleCard.className =
        "module-card";


      const lessons =
        module.lessons || [];


      const moduleHeader =
        document.createElement("button");

      moduleHeader.type =
        "button";

      moduleHeader.className =
        "module-header";


      moduleHeader.innerHTML = `

        <span>

          <span class="module-number">
            ${escapeHtml(module.module_number)}
          </span>

          ${escapeHtml(module.module_name)}

        </span>

        <span class="module-toggle">
          +
        </span>

      `;


      const moduleContent =
        document.createElement("div");

      moduleContent.className =
        "module-content";


      // Module description
      if (module.description) {

        const description =
          document.createElement("p");

        description.className =
          "lesson-description";

        description.style.marginBottom =
          "15px";

        description.textContent =
          module.description;

        moduleContent.appendChild(
          description
        );
      }


      // Lessons
      if (!lessons.length) {

        const noLessons =
          document.createElement("div");

        noLessons.className =
          "empty-study";

        noLessons.style.padding =
          "20px";

        noLessons.innerHTML = `
          <p>
            📖 Lessons for this module
            are being prepared by the academy.
          </p>
        `;

        moduleContent.appendChild(
          noLessons
        );

      } else {

        lessons.forEach(
          lesson => {

            renderLesson(
              moduleContent,
              lesson,
              studyIndex,
              moduleIndex
            );

          }
        );
      }


      moduleCard.appendChild(
        moduleHeader
      );

      moduleCard.appendChild(
        moduleContent
      );

      container.appendChild(
        moduleCard
      );


      moduleHeader.addEventListener(
        "click",
        () => {

          const isOpen =
            moduleContent.classList.contains(
              "open"
            );


          // Close all other modules
          container
            .querySelectorAll(
              ".module-content"
            )
            .forEach(
              element => {

                element.classList.remove(
                  "open"
                );

              }
            );


          container
            .querySelectorAll(
              ".module-toggle"
            )
            .forEach(
              element => {

                element.textContent =
                  "+";

              }
            );


          if (!isOpen) {

            moduleContent.classList.add(
              "open"
            );

            moduleHeader
              .querySelector(
                ".module-toggle"
              )
              .textContent = "−";
          }

        }
      );

    }
  );
}


// ============================================================
// RENDER LESSON
// ============================================================

function renderLesson(
  container,
  lesson,
  studyIndex,
  moduleIndex
) {

  const lessonItem =
    document.createElement("div");

  lessonItem.className =
    "lesson-item";


  const title =
    lesson.title ||
    lesson.lesson_title ||
    "Lesson";


  const description =
    lesson.description ||
    lesson.content ||
    lesson.lesson_description ||
    "";


  const lessonNumber =
    lesson.lesson_number ??
    "";


  lessonItem.innerHTML = `

    <div class="lesson-top">

      <div>

        <div class="lesson-title">

          ${
            lessonNumber
              ? `Lesson ${escapeHtml(lessonNumber)}: `
              : ""
          }

          ${escapeHtml(title)}

        </div>

        ${
          description
            ? `
              <div class="lesson-description">
                ${escapeHtml(description)}
              </div>
            `
            : ""
        }

      </div>

    </div>


    <div class="lesson-actions">

      <button
        type="button"
        class="lesson-complete"
        data-lesson-id="${escapeHtml(lesson.id || "")}">

        ✓ Mark Complete

      </button>

    </div>

  `;


  container.appendChild(
    lessonItem
  );


  const completeButton =
    lessonItem.querySelector(
      ".lesson-complete"
    );


  if (completeButton) {

    const storageKey =
      "foa_completed_lesson_" +
      (lesson.id || title);


    const alreadyCompleted =
      localStorage.getItem(
        storageKey
      ) === "true";


    if (alreadyCompleted) {

      completeButton.textContent =
        "✓ Completed";

      completeButton.classList.add(
        "completed"
      );

    }


    completeButton.addEventListener(
      "click",
      () => {

        if (
          completeButton.classList.contains(
            "completed"
          )
        ) {
          return;
        }


        localStorage.setItem(
          storageKey,
          "true"
        );


        completeButton.textContent =
          "✓ Completed";


        completeButton.classList.add(
          "completed"
        );


        showMessage(
          "Lesson marked as completed.",
          "success"
        );

      }
    );

  }
}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  if (!paymentListEl) {
    return;
  }


  setLoading(
    paymentListEl,
    "Loading payment history…"
  );


  try {

    const {
      data,
      error
    } = await db
      .from("payments")
      .select("*")
      .eq("student_id", currentStudent.id)
      .order("id", {
        ascending: false
      });


    if (error) {
      throw error;
    }


    if (!data || !data.length) {

      setEmpty(
        paymentListEl,
        "No payment records are available yet."
      );

      return;
    }


    paymentListEl.innerHTML =
      data.map(
        payment => `

          <div class="payment-card">

            <span class="funda-status ${statusClass(
              payment.status ||
              payment.payment_status
            )}">

              ${escapeHtml(
                payment.status ||
                payment.payment_status ||
                "pending"
              )}

            </span>

            <p class="funda-info">

              <strong>Amount:</strong>

              ${formatMoney(
                payment.amount ||
                payment.total_amount
              )}

            </p>

            ${
              payment.payment_method
                ? `
                  <p class="funda-info">
                    <strong>Method:</strong>
                    ${escapeHtml(
                      payment.payment_method
                    )}
                  </p>
                `
                : ""
            }

          </div>

        `
      ).join("");

  } catch (error) {

    console.warn(
      "Payments could not be loaded:",
      error
    );


    setEmpty(
      paymentListEl,
      "No payment history is available yet."
    );
  }
}


// ============================================================
// MY ENROLMENTS
// ============================================================

async function renderEnrolments() {

  if (!enrolmentsEl) {
    return;
  }


  try {

    const enrolments =
      await loadEnrolments();


    if (!enrolments.length) {

      setEmpty(
        enrolmentsEl,
        "You have no enrolments yet."
      );

      return;
    }


    enrolmentsEl.innerHTML = "";


    for (const enrollment of enrolments) {

      let course = null;


      try {

        course =
          await loadCourse(
            enrollment.course_id
          );

      } catch (error) {

        console.warn(
          "Could not load enrolment course:",
          error
        );

      }


      const card =
        document.createElement("div");

      card.className =
        "card";


      card.innerHTML = `

        <span class="funda-status ${statusClass(
          enrollment.enrollment_status
        )}">

          ${escapeHtml(
            enrollment.enrollment_status ||
            "pending"
          )}

        </span>


        <h3>

          ${escapeHtml(
            getCourseName(
              course || {}
            )
          )}

        </h3>


        <p class="funda-info">

          Enrollment ID:
          ${escapeHtml(enrollment.id)}

        </p>

      `;


      enrolmentsEl.appendChild(
        card
      );
    }

  } catch (error) {

    console.error(
      "Enrolments error:",
      error
    );


    setEmpty(
      enrolmentsEl,
      "Unable to load your enrolments."
    );
  }
}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses() {

  if (!availableCoursesEl) {
    return;
  }


  try {

    const {
      data,
      error
    } = await db
      .from("courses")
      .select("*")
      .order("id", {
        ascending: true
      });


    if (error) {
      throw error;
    }


    if (!data || !data.length) {

      setEmpty(
        availableCoursesEl,
        "No courses are currently available."
      );

      return;
    }


    availableCoursesEl.innerHTML =
      data.map(
        course => {

          const name =
            getCourseName(course);


          const description =
            getCourseDescription(course);


          const price =
            getCoursePrice(course);


          return `

            <div class="card">

              <h3>
                ${escapeHtml(name)}
              </h3>

              <p class="funda-info">
                ${escapeHtml(description)}
              </p>

              ${
                price !== null
                  ? `
                    <p class="funda-info">
                      <strong>
                        ${formatMoney(price)}
                      </strong>
                    </p>
                  `
                  : ""
              }

              <div class="funda-card-actions">

                <a
                  class="btn green"
                  href="index.html#courses">

                  View Course

                </a>

              </div>

            </div>

          `;

        }
      ).join("");

  } catch (error) {

    console.warn(
      "Available courses could not be loaded:",
      error
    );


    setEmpty(
      availableCoursesEl,
      "Courses could not be loaded at this time."
    );
  }
}


// ============================================================
// POLICY ACCEPTANCE
// ============================================================

function setupPolicy() {

  if (
    !policyCheckbox ||
    !acceptPolicyBtn
  ) {
    return;
  }


  const storageKey =
    currentUser
      ? "foa_policy_accepted_" +
        currentUser.id
      : null;


  if (storageKey) {

    const alreadyAccepted =
      localStorage.getItem(
        storageKey
      ) === "true";


    if (alreadyAccepted) {

      showPolicyAccepted();

    }

  }


  acceptPolicyBtn.addEventListener(
    "click",
    () => {

      if (!policyCheckbox.checked) {

        showMessage(
          "Please tick the declaration checkbox before continuing.",
          "error"
        );

        return;
      }


      if (storageKey) {

        localStorage.setItem(
          storageKey,
          "true"
        );

      }


      showPolicyAccepted();


      showMessage(
        "Your policy declaration has been accepted.",
        "success"
      );

    }
  );
}


function showPolicyAccepted() {

  if (policyAcceptedEl) {

    policyAcceptedEl.style.display =
      "block";


    policyAcceptedEl.innerHTML = `

      <strong>
        ✅ Declaration Accepted
      </strong>

      You have confirmed that you have read
      and accepted the Funda Online Academy
      Terms, Payment Rules, Policies and
      Student Declaration.

    `;

  }


  if (policyCheckbox) {

    policyCheckbox.checked =
      true;

  }


  if (acceptPolicyBtn) {

    acceptPolicyBtn.textContent =
      "✅ Declaration Accepted";

    acceptPolicyBtn.disabled =
      true;

  }
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      logoutBtn.disabled =
        true;

      logoutBtn.textContent =
        "Logging out…";


      const {
        error
      } = await db.auth.signOut();


      if (error) {

        console.error(
          "Logout error:",
          error
        );


        logoutBtn.disabled =
          false;

        logoutBtn.textContent =
          "Logout";

        showMessage(
          error.message,
          "error"
        );

        return;
      }


      window.location.href =
        "login.html";

    }
  );
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

db.auth.onAuthStateChange(
  (event, session) => {

    if (event === "SIGNED_OUT") {

      window.location.href =
        "login.html";

    }

  }
);


// ============================================================
// INITIALISE DASHBOARD
// ============================================================

async function initDashboard() {

  try {

    hideMessage();


    // --------------------------------------------------------
    // 1. AUTHENTICATED USER
    // --------------------------------------------------------

    currentUser =
      await getCurrentUser();


    // --------------------------------------------------------
    // 2. STUDENT RECORD
    // --------------------------------------------------------

    currentStudent =
      await loadStudent(
        currentUser.id
      );


    // --------------------------------------------------------
    // 3. DISPLAY USER
    // --------------------------------------------------------

    displayUser();


    // --------------------------------------------------------
    // 4. POLICY
    // --------------------------------------------------------

    setupPolicy();


    // --------------------------------------------------------
    // 5. LOAD DASHBOARD DATA
    // --------------------------------------------------------

    await Promise.allSettled([

      loadStudies(),

      loadPayments(),

      renderEnrolments(),

      loadAvailableCourses()

    ]);


  } catch (error) {

    console.error(
      "Dashboard initialisation error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to load your dashboard.",
      "error"
    );


    if (studyListEl) {

      studyListEl.innerHTML = `

        <div class="card">

          <p style="
            color:#a51d1d;
            font-weight:700;
          ">
            Unable to load your studies.
          </p>

          <p style="
            margin-top:10px;
            line-height:1.6;
          ">
            ${escapeHtml(
              error.message ||
              "Please log in again."
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

document.addEventListener(
  "DOMContentLoaded",
  initDashboard
);
