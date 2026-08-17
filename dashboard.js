// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// FIXED STUDIES VERSION
//
// This version:
// - Checks authentication
// - Loads student
// - Loads enrolments
// - Loads approved courses
// - Loads course modules
// - Loads lessons
// - Shows real errors instead of staying on "Loading..."
// - Does NOT use enrollments.created_at
// - Does NOT depend on course_lessons
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

if (
  typeof supabase === "undefined" ||
  typeof window.SUPABASE_URL === "undefined" ||
  typeof window.SUPABASE_ANON_KEY === "undefined"
) {

  document.addEventListener("DOMContentLoaded", () => {

    const box = document.getElementById("study-list");

    if (box) {

      box.innerHTML = `
        <div class="card">
          <p style="color:#a51d1d;font-weight:700;">
            Dashboard configuration error.
          </p>

          <p style="margin-top:10px;line-height:1.6;">
            Supabase configuration could not be loaded.
          </p>
        </div>
      `;

    }

  });

  throw new Error("Supabase configuration is missing.");
}


const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
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
// GLOBAL STATE
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


function showMessage(
  text,
  type = "error"
) {

  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;

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

  messageEl.textContent = "";

  messageEl.className =
    "message hidden";
}


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

  if (
    Number.isNaN(number)
  ) {
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
// TIMEOUT PROTECTION
//
// This is important.
// If Supabase gets stuck, the page will no longer remain
// permanently on "Loading your studies..."
// ============================================================

function withTimeout(
  promise,
  milliseconds,
  message
) {

  return Promise.race([

    promise,

    new Promise(
      (_, reject) => {

        setTimeout(
          () => {

            reject(
              new Error(message)
            );

          },
          milliseconds
        );

      }
    )

  ]);
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function getCurrentUser() {

  console.log(
    "[FOA] Checking logged-in user..."
  );

  const result =
    await withTimeout(
      db.auth.getUser(),
      10000,
      "Supabase authentication request timed out."
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

  console.log(
    "[FOA] User found:",
    data.user.id
  );

  return data.user;
}


// ============================================================
// STUDENT
// ============================================================

async function loadStudent(
  userId
) {

  console.log(
    "[FOA] Loading student record..."
  );

  const result =
    await withTimeout(

      db
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),

      10000,

      "Student profile request timed out."

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
      "Your student profile could not be found."
    );

  }

  console.log(
    "[FOA] Student found:",
    data.id
  );

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
// ENROLMENTS
//
// IMPORTANT:
// We DO NOT use created_at.
// ============================================================

async function loadEnrolments() {

  console.log(
    "[FOA] Loading enrolments..."
  );

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
        ),

      10000,

      "Enrolments request timed out."

    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  console.log(
    "[FOA] Enrolments found:",
    data?.length || 0
  );

  return data || [];
}


// ============================================================
// COURSE
// ============================================================

async function loadCourse(
  courseId
) {

  console.log(
    "[FOA] Loading course:",
    courseId
  );

  const result =
    await withTimeout(

      db
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .maybeSingle(),

      10000,

      "Course request timed out."

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
// MODULES
// ============================================================

async function loadModules(
  courseId
) {

  console.log(
    "[FOA] Loading modules..."
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

      10000,

      "Course modules request timed out."

    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  console.log(
    "[FOA] Modules found:",
    data?.length || 0
  );

  return data || [];
}


// ============================================================
// LESSONS
//
// Your supplied lesson records are in:
//
// lessons
//
// Columns:
//
// id
// module_number
// module_name
// lesson_number
// title
//
// We load ALL lessons once and match them to modules.
// ============================================================

async function loadAllLessons() {

  console.log(
    "[FOA] Loading lessons..."
  );

  const result =
    await withTimeout(

      db
        .from("lessons")
        .select("*")
        .order(
          "module_number",
          {
            ascending: true
          }
        )
        .order(
          "lesson_number",
          {
            ascending: true
          }
        ),

      10000,

      "Lessons request timed out."

    );

  const {
    data,
    error
  } = result;

  if (error) {
    throw error;
  }

  console.log(
    "[FOA] Lessons found:",
    data?.length || 0
  );

  return data || [];
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
    return "";
  }

  return (
    course.description ||
    course.course_description ||
    "Your Funda Online Academy course."
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
// LOAD STUDIES
// ============================================================

async function loadStudies() {

  if (!studyListEl) {
    return;
  }

  console.log(
    "[FOA] ==============================="
  );

  console.log(
    "[FOA] STARTING MY STUDIES"
  );

  console.log(
    "[FOA] ==============================="
  );

  setLoading(
    studyListEl,
    "Loading your studies…"
  );


  try {

    // --------------------------------------------------------
    // STEP 1
    // --------------------------------------------------------

    const enrolments =
      await loadEnrolments();


    if (!enrolments.length) {

      setEmpty(
        studyListEl,
        "You do not have any enrolments yet."
      );

      return;
    }


    // --------------------------------------------------------
    // STEP 2
    // --------------------------------------------------------

    const approved =
      enrolments.filter(
        enrollment =>
          isApproved(
            enrollment.enrollment_status
          )
      );


    console.log(
      "[FOA] Approved enrolments:",
      approved.length
    );


    if (!approved.length) {

      setEmpty(
        studyListEl,
        "Your enrolment is still awaiting approval."
      );

      return;
    }


    // --------------------------------------------------------
    // STEP 3
    // Load lessons once.
    // --------------------------------------------------------

    let allLessons = [];

    try {

      allLessons =
        await loadAllLessons();

    } catch (lessonError) {

      console.error(
        "[FOA] Lessons error:",
        lessonError
      );

      // We don't stop the entire course from appearing.
      allLessons = [];

    }


    const studies = [];


    // --------------------------------------------------------
    // STEP 4
    // Load every approved course.
    // --------------------------------------------------------

    for (
      const enrollment
      of approved
    ) {

      console.log(
        "[FOA] Processing enrolment:",
        enrollment.id
      );


      const course =
        await loadCourse(
          enrollment.course_id
        );


      if (!course) {

        console.warn(
          "[FOA] Course not found:",
          enrollment.course_id
        );

        continue;
      }


      const modules =
        await loadModules(
          enrollment.course_id
        );


      // ------------------------------------------------------
      // Match lessons to each module.
      // ------------------------------------------------------

      const modulesWithLessons =
        modules.map(
          module => {

            const moduleNumber =
              Number(
                module.module_number
              );


            const moduleName =
              String(
                module.module_name || ""
              )
              .trim()
              .toLowerCase();


            const lessons =
              allLessons.filter(
                lesson => {

                  const lessonNumber =
                    Number(
                      lesson.module_number
                    );


                  const lessonName =
                    String(
                      lesson.module_name || ""
                    )
                    .trim()
                    .toLowerCase();


                  return (
                    lessonNumber ===
                      moduleNumber
                    &&
                    lessonName ===
                      moduleName
                  );

                }
              );


            return {

              ...module,

              lessons

            };

          }
        );


      studies.push({

        enrollment,

        course,

        modules:
          modulesWithLessons

      });

    }


    currentStudies =
      studies;


    // --------------------------------------------------------
    // STEP 5
    // --------------------------------------------------------

    if (!studies.length) {

      setEmpty(
        studyListEl,
        "Your approved enrolment was found, but the course could not be loaded."
      );

      return;
    }


    console.log(
      "[FOA] Studies successfully loaded:",
      studies.length
    );


    renderStudies(
      studies
    );


  } catch (error) {

    console.error(
      "[FOA] MY STUDIES FAILED:",
      error
    );


    studyListEl.innerHTML = `

      <div class="card">

        <p style="
          color:#a51d1d;
          font-weight:700;
          font-size:18px;
        ">
          ❌ My Studies could not load
        </p>

        <p style="
          margin-top:12px;
          line-height:1.6;
        ">
          ${escapeHtml(
            error.message ||
            "Unknown error"
          )}
        </p>

        <p style="
          margin-top:12px;
          color:#68766f;
          font-size:13px;
        ">
          This message is intentionally shown so
          we can identify exactly what is failing.
        </p>

      </div>

    `;

  }

}


// ============================================================
// RENDER STUDIES
// ============================================================

function renderStudies(
  studies
) {

  studyListEl.innerHTML = "";


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


      const totalModules =
        modules.length;


      const totalLessons =
        modules.reduce(
          (
            total,
            module
          ) =>
            total +
            (
              module.lessons?.length ||
              0
            ),
          0
        );


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
                      💰 ${formatMoney(
                        price
                      )}
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
                ✅ Approved
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
        modules
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
  modules
) {

  if (!container) {
    return;
  }


  if (!modules.length) {

    container.innerHTML = `

      <div class="empty-study">

        <p>
          📖 No modules were found for this course.
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
    module => {

      const moduleCard =
        document.createElement(
          "div"
        );

      moduleCard.className =
        "module-card";


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


      if (
        module.description
      ) {

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


      const lessons =
        module.lessons || [];


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
              lesson
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


            const toggle =
              moduleHeader.querySelector(
                ".module-toggle"
              );


            if (toggle) {

              toggle.textContent =
                "−";

            }

          }

        }
      );

    }
  );

}


// ============================================================
// LESSON
// ============================================================

function renderLesson(
  container,
  lesson
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
        class="lesson-complete">

        ✓ Mark Complete

      </button>

    </div>

  `;


  container.appendChild(
    lessonItem
  );


  const button =
    lessonItem.querySelector(
      ".lesson-complete"
    );


  if (!button) {
    return;
  }


  const storageKey =
    "foa_completed_lesson_" +
    (
      lesson.id ||
      title
    );


  if (
    localStorage.getItem(
      storageKey
    ) === "true"
  ) {

    button.textContent =
      "✓ Completed";

    button.classList.add(
      "completed"
    );

  }


  button.addEventListener(
    "click",
    () => {

      if (
        button.classList.contains(
          "completed"
        )
      ) {
        return;
      }


      localStorage.setItem(
        storageKey,
        "true"
      );


      button.textContent =
        "✓ Completed";

      button.classList.add(
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
          ),

        10000,

        "Payment request timed out."

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

              <strong>
                Amount:
              </strong>

              ${formatMoney(
                payment.amount ||
                payment.total_amount
              )}

            </p>

          </div>

        `
      ).join("");


  } catch (error) {

    console.warn(
      "[FOA] Payments unavailable:",
      error
    );

    setEmpty(
      paymentListEl,
      "Payment history is currently unavailable."
    );

  }

}


// ============================================================
// ENROLMENTS DISPLAY
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
      const enrollment
      of enrolments
    ) {

      let course = null;


      try {

        course =
          await loadCourse(
            enrollment.course_id
          );

      } catch (error) {

        console.warn(
          "[FOA] Enrolment course error:",
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
              course
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
      "[FOA] Enrolments display error:",
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
          .select("*"),

        10000,

        "Courses request timed out."

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
      "[FOA] Courses unavailable:",
      error
    );


    setEmpty(
      availableCoursesEl,
      "Courses could not be loaded at this time."
    );

  }

}


// ============================================================
// POLICY
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


  if (
    storageKey &&
    localStorage.getItem(
      storageKey
    ) === "true"
  ) {

    showPolicyAccepted();

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


      const {
        error
      } =
        await db.auth.signOut();


      if (error) {

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
// AUTH STATE
// ============================================================

db.auth.onAuthStateChange(
  (
    event
  ) => {

    if (
      event === "SIGNED_OUT"
    ) {

      window.location.href =
        "login.html";

    }

  }
);


// ============================================================
// INITIALISE
// ============================================================

async function initDashboard() {

  console.log(
    "[FOA] DASHBOARD STARTING"
  );


  hideMessage();


  try {

    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    currentUser =
      await getCurrentUser();


    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    currentStudent =
      await loadStudent(
        currentUser.id
      );


    // --------------------------------------------------------
    // DISPLAY
    // --------------------------------------------------------

    displayUser();


    // --------------------------------------------------------
    // POLICY
    // --------------------------------------------------------

    setupPolicy();


    // --------------------------------------------------------
    // STUDIES
    // --------------------------------------------------------

    await loadStudies();


    // --------------------------------------------------------
    // Other dashboard sections
    // --------------------------------------------------------

    await Promise.allSettled([

      loadPayments(),

      renderEnrolments(),

      loadAvailableCourses()

    ]);


    console.log(
      "[FOA] DASHBOARD FINISHED"
    );


  } catch (error) {

    console.error(
      "[FOA] DASHBOARD INITIALISATION FAILED:",
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
            font-size:18px;
          ">
            ❌ Dashboard error
          </p>

          <p style="
            margin-top:12px;
            line-height:1.6;
          ">
            ${escapeHtml(
              error.message ||
              "Unknown error"
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
