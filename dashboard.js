// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COMPLETE REPLACEMENT VERSION
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
// IMPORTANT DATABASE NOTES:
//
// enrollments:
//   id
//   student_id
//   course_id
//   enrollment_status
//
// course_modules:
//   id
//   course_id
//   module_number
//   module_name
//   description
//
// lessons:
//   id
//   module_number
//   module_name
//   lesson_number
//   title
//
// This version does NOT use enrollments.created_at.
// ============================================================


const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// GLOBAL ELEMENTS
// ============================================================

const messageEl =
  document.getElementById("message");

const userEmailEl =
  document.getElementById("user-email");

const userNameEl =
  document.getElementById("user-name");

const studyListEl =
  document.getElementById("study-list");

const paymentListEl =
  document.getElementById("payment-list");

const enrolmentsEl =
  document.getElementById("enrolments");

const availableCoursesEl =
  document.getElementById("available-courses");

const logoutBtn =
  document.getElementById("logout");

const policyCheckbox =
  document.getElementById("policy-checkbox");

const acceptPolicyBtn =
  document.getElementById("accept-policy-btn");

const policyAcceptedEl =
  document.getElementById("policy-accepted");


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
// Safe timeout helper
// ------------------------------------------------------------

function withTimeout(
  promise,
  milliseconds = 15000,
  label = "Database request"
) {

  return Promise.race([

    promise,

    new Promise((_, reject) => {

      setTimeout(() => {

        reject(
          new Error(
            `${label} timed out. Please check your internet connection or Supabase settings.`
          )
        );

      }, milliseconds);

    })

  ]);
}


// ------------------------------------------------------------
// Message
// ------------------------------------------------------------

function showMessage(
  text,
  type = "error"
) {

  if (!messageEl) {
    return;
  }

  messageEl.textContent =
    text;

  messageEl.className =
    "message " +
    (
      type === "success"
        ? "success"
        : "error"
    );
}


function hideMessage() {

  if (!messageEl) {
    return;
  }

  messageEl.className =
    "message hidden";

  messageEl.textContent =
    "";
}


// ------------------------------------------------------------
// Money
// ------------------------------------------------------------

function formatMoney(value) {

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
    "R" +
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
// Date
// ------------------------------------------------------------

function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return escapeHtml(value);
  }

  return date.toLocaleString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


// ------------------------------------------------------------
// Status class
// ------------------------------------------------------------

function statusClass(status) {

  const value =
    String(status || "")
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


// ------------------------------------------------------------
// Approved status
// ------------------------------------------------------------

function isApproved(status) {

  const value =
    String(status || "")
      .toLowerCase()
      .trim();

  return (
    value === "approved" ||
    value === "active"
  );
}


// ------------------------------------------------------------
// Loading
// ------------------------------------------------------------

function setLoading(
  element,
  text
) {

  if (!element) {
    return;
  }

  element.innerHTML = `

    <div class="card">

      <p class="loading">
        ${escapeHtml(text)}
      </p>

    </div>

  `;
}


// ------------------------------------------------------------
// Empty
// ------------------------------------------------------------

function setEmpty(
  element,
  text
) {

  if (!element) {
    return;
  }

  element.innerHTML = `

    <div class="empty-study">

      <p>
        ${escapeHtml(text)}
      </p>

    </div>

  `;
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function getCurrentUser() {

  const result =
    await withTimeout(
      db.auth.getUser(),
      15000,
      "Authentication"
    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  if (
    !data ||
    !data.user
  ) {

    throw new Error(
      "You are not logged in. Please log in again."
    );

  }

  return data.user;
}


// ============================================================
// LOAD STUDENT
// ============================================================

async function loadStudent(
  userId
) {

  const result =
    await withTimeout(

      db
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),

      15000,

      "Student profile request"

    );

  const {
    data,
    error
  } = result;

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
// DISPLAY USER
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

    userNameEl.textContent =
      name;

  }
}


// ============================================================
// LOAD ENROLMENTS
// ============================================================
//
// IMPORTANT:
// NO created_at is selected.
// ============================================================

async function loadEnrolments() {

  if (!currentStudent?.id) {

    throw new Error(
      "Student record is not available."
    );

  }

  const result =
    await withTimeout(

      db
        .from("enrollments")
        .select(`
          id,
          student_id,
          course_id,
          enrollment_status
        `)
        .eq(
          "student_id",
          currentStudent.id
        )
        .order(
          "id",
          {
            ascending: false
          }
        ),

      15000,

      "Enrolments request"

    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  return data || [];
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
        .eq("id", courseId)
        .maybeSingle(),

      15000,

      "Course request"

    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  return data;
}


// ============================================================
// LOAD MODULES
// ============================================================
//
// Your current database confirms:
//
// course_modules
//   id
//   course_id
//   module_number
//   module_name
//   description
//
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
          description
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
        ),

      15000,

      "Course modules request"

    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  return data || [];
}


// ============================================================
// LOAD LESSONS
// ============================================================
//
// Your supplied lesson records have:
//
// id
// module_number
// module_name
// lesson_number
// title
//
// We therefore do NOT depend on a course_id column.
//
// ============================================================

async function loadLessons(
  moduleNumber,
  moduleName
) {

  // ----------------------------------------------------------
  // Try lessons table
  // ----------------------------------------------------------

  try {

    const result =
      await withTimeout(

        db
          .from("lessons")
          .select("*")
          .eq(
            "module_number",
            moduleNumber
          )
          .eq(
            "module_name",
            moduleName
          )
          .order(
            "lesson_number",
            {
              ascending: true
            }
          ),

        10000,

        "Lessons request"

      );

    if (!result.error) {

      return {
        data: result.data || [],
        source: "lessons",
        error: null
      };

    }

    console.warn(
      "lessons table returned an error:",
      result.error
    );

  } catch (error) {

    console.warn(
      "lessons table could not be loaded:",
      error
    );

  }


  // ----------------------------------------------------------
  // Try course_lessons table
  // ----------------------------------------------------------

  try {

    const result =
      await withTimeout(

        db
          .from("course_lessons")
          .select("*")
          .eq(
            "module_number",
            moduleNumber
          )
          .eq(
            "module_name",
            moduleName
          )
          .order(
            "lesson_number",
            {
              ascending: true
            }
          ),

        10000,

        "Course lessons request"

      );

    if (!result.error) {

      return {
        data: result.data || [],
        source: "course_lessons",
        error: null
      };

    }

    console.warn(
      "course_lessons table returned an error:",
      result.error
    );

  } catch (error) {

    console.warn(
      "course_lessons table could not be loaded:",
      error
    );

  }


  // ----------------------------------------------------------
  // Do not break the course.
  // ----------------------------------------------------------

  return {
    data: [],
    source: null,
    error: "Lessons could not be loaded."
  };
}


// ============================================================
// LOAD STUDIES
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

    // --------------------------------------------------------
    // 1. Get enrolments
    // --------------------------------------------------------

    const enrolments =
      await loadEnrolments();


    console.log(
      "FOA enrolments:",
      enrolments
    );


    // --------------------------------------------------------
    // 2. Approved / active only
    // --------------------------------------------------------

    const approved =
      enrolments.filter(
        enrollment =>
          isApproved(
            enrollment.enrollment_status
          )
      );


    console.log(
      "FOA approved enrolments:",
      approved
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


    // --------------------------------------------------------
    // 3. Load each approved course
    // --------------------------------------------------------

    for (
      const enrollment of approved
    ) {

      try {

        console.log(
          "FOA loading course:",
          enrollment.course_id
        );


        const course =
          await loadCourse(
            enrollment.course_id
          );


        if (!course) {

          console.warn(
            "Course not found:",
            enrollment.course_id
          );

          continue;
        }


        // ----------------------------------------------------
        // 4. Load modules
        // ----------------------------------------------------

        const modules =
          await loadModules(
            enrollment.course_id
          );


        console.log(
          "FOA modules:",
          modules
        );


        const modulesWithLessons = [];


        // ----------------------------------------------------
        // 5. Load lessons for every module
        //
        // A lesson failure will NOT stop modules.
        // ----------------------------------------------------

        for (
          const module of modules
        ) {

          let lessons = [];

          try {

            const lessonResult =
              await loadLessons(
                module.module_number,
                module.module_name
              );

            lessons =
              lessonResult.data || [];


          } catch (lessonError) {

            console.warn(
              "Lesson loading failed for module:",
              module.module_name,
              lessonError
            );

          }


          modulesWithLessons.push({

            ...module,

            lessons

          });

        }


        studies.push({

          enrollment,

          course,

          modules:
            modulesWithLessons

        });


      } catch (courseError) {

        console.error(
          "Could not load approved course:",
          enrollment.course_id,
          courseError
        );

      }

    }


    currentStudies =
      studies;


    // --------------------------------------------------------
    // 6. Nothing loaded
    // --------------------------------------------------------

    if (!studies.length) {

      setEmpty(
        studyListEl,
        "Your approved enrolment was found, but the course information could not be loaded."
      );

      return;
    }


    // --------------------------------------------------------
    // 7. RENDER IMMEDIATELY
    // --------------------------------------------------------

    renderStudies(
      studies
    );


  } catch (error) {

    console.error(
      "MY STUDIES ERROR:",
      error
    );


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
            "Unknown database error."
          )}
        </p>

        <p style="
          margin-top:10px;
          color:#68766f;
          font-size:13px;
        ">
          Please refresh the page. If the problem continues,
          the error above will help us identify the Supabase
          table or security setting causing it.
        </p>

      </div>

    `;

  }
}


// ============================================================
// COURSE FIELD HELPERS
// ============================================================

function getCourseName(
  course
) {

  if (!course) {
    return "Course";
  }

  return (
    course.name ||
    course.course_name ||
    course.title ||
    "Course"
  );
}


function getCourseDescription(
  course
) {

  if (!course) {
    return "Your approved Funda Online Academy course.";
  }

  return (
    course.description ||
    course.course_description ||
    "Your approved Funda Online Academy course."
  );
}


function getCoursePrice(
  course
) {

  if (!course) {
    return null;
  }

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

function renderStudies(
  studies
) {

  if (!studyListEl) {
    return;
  }


  studyListEl.innerHTML =
    "";


  studies.forEach(
    (
      study,
      studyIndex
    ) => {

      const {
        enrollment,
        course,
        modules
      } = study;


      const courseName =
        getCourseName(
          course
        );


      const description =
        getCourseDescription(
          course
        );


      const price =
        getCoursePrice(
          course
        );


      const totalLessons =
        modules.reduce(
          (
            total,
            module
          ) => {

            return (
              total +
              (
                module.lessons?.length ||
                0
              )
            );

          },
          0
        );


      const totalModules =
        modules.length;


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "study-card";


      card.innerHTML = `

        <div class="study-header">

          <div>

            <span class="funda-status approved">
              Approved
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
                📚 ${totalModules}
                module${totalModules === 1 ? "" : "s"}
              </span>

              <span>
                📖 ${totalLessons}
                lesson${totalLessons === 1 ? "" : "s"}
              </span>

              <span>
                ✅ ${escapeHtml(
                  enrollment.enrollment_status ||
                  "approved"
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


      studyListEl.appendChild(
        card
      );


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
    document.createElement(
      "h3"
    );


  heading.style.margin =
    "0 0 16px";


  heading.textContent =
    "📖 Course Modules";


  container.appendChild(
    heading
  );


  modules.forEach(
    (
      module,
      moduleIndex
    ) => {

      const moduleCard =
        document.createElement(
          "div"
        );


      moduleCard.className =
        "module-card";


      const lessons =
        module.lessons ||
        [];


      const moduleHeader =
        document.createElement(
          "button"
        );


      moduleHeader.type =
        "button";


      moduleHeader.className =
        "module-header";


      moduleHeader.innerHTML = `

        <span>

          <span class="module-number">
            ${escapeHtml(
              module.module_number
            )}
          </span>

          ${escapeHtml(
            module.module_name
          )}

        </span>

        <span class="module-toggle">
          +
        </span>

      `;


      const moduleContent =
        document.createElement(
          "div"
        );


      moduleContent.className =
        "module-content";


      // ------------------------------------------------------
      // Module description
      // ------------------------------------------------------

      if (module.description) {

        const description =
          document.createElement(
            "p"
          );


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


      // ------------------------------------------------------
      // Lessons
      // ------------------------------------------------------

      if (!lessons.length) {

        const noLessons =
          document.createElement(
            "div"
          );


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


      // ------------------------------------------------------
      // Module open/close
      // ------------------------------------------------------

      moduleHeader.addEventListener(
        "click",
        () => {

          const isOpen =
            moduleContent.classList.contains(
              "open"
            );


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
              .textContent =
                "−";

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
    document.createElement(
      "div"
    );


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
              ? `
                Lesson
                ${escapeHtml(
                  lessonNumber
                )}:
              `
              : ""
          }

          ${escapeHtml(
            title
          )}

        </div>

        ${
          description
            ? `
              <div class="lesson-description">
                ${escapeHtml(
                  description
                )}
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
        data-lesson-id="${escapeHtml(
          lesson.id || ""
        )}">

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


  if (!completeButton) {
    return;
  }


  const storageKey =
    "foa_completed_lesson_" +
    (
      lesson.id ||
      title
    );


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

    const result =
      await withTimeout(

        db
          .from("payments")
          .select("*")
          .eq(
            "student_id",
            currentStudent.id
          )
          .order(
            "id",
            {
              ascending: false
            }
          ),

        15000,

        "Payments request"

      );


    const {
      data,
      error
    } = result;


    if (error) {
      throw error;
    }


    if (
      !data ||
      !data.length
    ) {

      setEmpty(
        paymentListEl,
        "No payment records are available yet."
      );

      return;
    }


    paymentListEl.innerHTML =
      data.map(
        payment => {

          const status =
            payment.status ||
            payment.payment_status ||
            "pending";


          const amount =
            payment.amount ||
            payment.total_amount;


          return `

            <div class="payment-card">

              <span class="funda-status ${statusClass(
                status
              )}">

                ${escapeHtml(
                  status
                )}

              </span>

              <p class="funda-info">

                <strong>
                  Amount:
                </strong>

                ${formatMoney(
                  amount
                )}

              </p>

              ${
                payment.payment_method
                  ? `
                    <p class="funda-info">

                      <strong>
                        Method:
                      </strong>

                      ${escapeHtml(
                        payment.payment_method
                      )}

                    </p>
                  `
                  : ""
              }

              ${
                payment.created_at
                  ? `
                    <p class="funda-info">

                      <strong>
                        Date:
                      </strong>

                      ${formatDate(
                        payment.created_at
                      )}

                    </p>
                  `
                  : ""
              }

            </div>

          `;

        }
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


    enrolmentsEl.innerHTML =
      "";


    for (
      const enrollment of enrolments
    ) {

      let course =
        null;


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
        document.createElement(
          "div"
        );


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
          ${escapeHtml(
            enrollment.id
          )}

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

    const result =
      await withTimeout(

        db
          .from("courses")
          .select("*")
          .order(
            "id",
            {
              ascending: true
            }
          ),

        15000,

        "Available courses request"

      );


    const {
      data,
      error
    } = result;


    if (error) {
      throw error;
    }


    if (
      !data ||
      !data.length
    ) {

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
            getCourseName(
              course
            );


          const description =
            getCourseDescription(
              course
            );


          const price =
            getCoursePrice(
              course
            );


          return `

            <div class="card">

              <h3>
                ${escapeHtml(
                  name
                )}
              </h3>

              <p class="funda-info">
                ${escapeHtml(
                  description
                )}
              </p>

              ${
                price !== null
                  ? `
                    <p class="funda-info">

                      <strong>
                        ${formatMoney(
                          price
                        )}
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

      if (
        !policyCheckbox.checked
      ) {

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


      try {

        const {
          error
        } =
          await db.auth.signOut();


        if (error) {
          throw error;
        }


        window.location.href =
          "login.html";


      } catch (error) {

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

      }

    }
  );
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

db.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {

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


    console.log(
      "===================================="
    );

    console.log(
      "FOA STUDENT DASHBOARD STARTING"
    );

    console.log(
      "===================================="
    );


    // --------------------------------------------------------
    // 1. AUTHENTICATED USER
    // --------------------------------------------------------

    currentUser =
      await getCurrentUser();


    console.log(
      "FOA current user:",
      currentUser.id
    );


    // --------------------------------------------------------
    // 2. STUDENT
    // --------------------------------------------------------

    currentStudent =
      await loadStudent(
        currentUser.id
      );


    console.log(
      "FOA student:",
      currentStudent
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
    // 5. LOAD DASHBOARD
    //
    // Each section is independent.
    // --------------------------------------------------------

    await Promise.allSettled([

      loadStudies(),

      loadPayments(),

      renderEnrolments(),

      loadAvailableCourses()

    ]);


    console.log(
      "FOA dashboard loading completed."
    );


  } catch (error) {

    console.error(
      "DASHBOARD INITIALISATION ERROR:",
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

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initDashboard
  );

} else {

  initDashboard();

}
