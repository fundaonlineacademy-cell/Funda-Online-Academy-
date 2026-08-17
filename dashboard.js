// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// STUDIES • ENROLMENTS • COURSES • PAYMENTS • POLICIES
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const userNameEl =
  document.getElementById("user-name");

const userEmailEl =
  document.getElementById("user-email");

const studyListEl =
  document.getElementById("study-list");

const enrolmentsEl =
  document.getElementById("enrolments");

const coursesEl =
  document.getElementById("available-courses");

const paymentListEl =
  document.getElementById("payment-list");

const messageEl =
  document.getElementById("message");

const logoutBtn =
  document.getElementById("logout");

const policyCheckbox =
  document.getElementById("policy-checkbox");

const acceptPolicyBtn =
  document.getElementById("accept-policy-btn");

const policyAcceptedEl =
  document.getElementById("policy-accepted");


// ============================================================
// POLICY
// ============================================================

const POLICY_VERSION =
  "FOA Terms v1.0";


const DECLARATION_TEXT = `
I confirm that I have read and understood the
Funda Online Academy payment rules, student
requirements, policies, assessment requirements
and terms and conditions.

I confirm that the information I provide to
Funda Online Academy is true and accurate.

I understand that I am responsible for following
the academy's rules and completing my course
requirements.

I understand the payment obligations associated
with my course and agree to comply with the
approved payment arrangement.

I understand that acceptance of these policies
does not automatically mean that my enrolment
has been approved.
`.trim();


// ============================================================
// GLOBAL USER / STUDENT
// ============================================================

let currentUserData = null;
let currentStudent = null;


// ============================================================
// HELPERS
// ============================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatMoney(value) {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "R0.00";
  }

  return "R" +
    number.toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}


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
    return "—";
  }

  return date.toLocaleString(
    "en-ZA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function showMessage(
  text,
  success = false
) {

  if (!messageEl) {
    return;
  }

  messageEl.textContent =
    text;

  messageEl.className =
    "message " +
    (
      success
        ? "success"
        : "error"
    );
}


function courseTitle(course) {

  if (!course) {
    return "Course";
  }

  return (
    course.title ||
    course.name ||
    course.course_name ||
    "Course"
  );
}


function coursePrice(course) {

  if (!course) {
    return 0;
  }

  return (
    course.price ??
    course.amount ??
    course.course_price ??
    0
  );
}


function enrollmentStatus(row) {

  return String(
    row?.enrollment_status ??
    row?.status ??
    "pending"
  )
  .trim()
  .toLowerCase();
}


function isApproved(row) {

  const status =
    enrollmentStatus(row);

  return (
    status === "approved" ||
    status === "active" ||
    status === "enrolled" ||
    status === "completed"
  );
}


// ============================================================
// AUTH
// ============================================================

async function getCurrentUser() {

  const {
    data,
    error
  } =
    await db.auth.getUser();

  if (error) {

    console.error(
      "Authentication error:",
      error
    );

    return null;
  }

  return data?.user || null;
}


// ============================================================
// STUDENT
// ============================================================

async function getStudent(
  userId
) {

  const {
    data,
    error
  } =
    await db
      .from("students")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


// ============================================================
// COURSES BY ID
// ============================================================

async function getCoursesByIds(
  ids
) {

  if (
    !ids ||
    !ids.length
  ) {
    return [];
  }

  const {
    data,
    error
  } =
    await db
      .from("courses")
      .select("*")
      .in(
        "id",
        ids
      );

  if (error) {
    throw error;
  }

  return data || [];
}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function getAvailableCourses() {

  const {
    data,
    error
  } =
    await db
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
      );

  if (error) {

    console.warn(
      "Active course query failed:",
      error
    );

    const fallback =
      await db
        .from("courses")
        .select("*")
        .order(
          "title",
          {
            ascending: true
          }
        );

    if (fallback.error) {
      throw error;
    }

    return fallback.data || [];
  }

  return data || [];
}


// ============================================================
// GET STUDENT ENROLMENTS
//
// IMPORTANT:
// The enrollments table does NOT have created_at.
// We use enrolled_at only.
// ============================================================

async function getStudentEnrolments(
  studentId
) {

  const {
    data,
    error
  } =
    await db
      .from("enrollments")
      .select(`
        id,
        student_id,
        course_id,
        enrollment_status,
        status,
        amount,
        enrolled_at
      `)
      .eq(
        "student_id",
        studentId
      )
      .order(
        "enrolled_at",
        {
          ascending: false
        }
      );

  if (error) {
    throw error;
  }

  return data || [];
}


// ============================================================
// MY STUDIES
// ============================================================

async function loadMyStudies(
  studentId
) {

  if (!studyListEl) {
    return;
  }

  studyListEl.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading your studies…
      </p>

    </div>

  `;


  try {

    // --------------------------------------------------------
    // GET ENROLMENTS
    // --------------------------------------------------------

    const enrolments =
      await getStudentEnrolments(
        studentId
      );


    console.log(
      "FUNDA - Student enrolments:",
      enrolments
    );


    // --------------------------------------------------------
    // APPROVED ENROLMENTS
    // --------------------------------------------------------

    const approvedEnrolments =
      enrolments.filter(
        row =>
          isApproved(row)
      );


    console.log(
      "FUNDA - Approved enrolments:",
      approvedEnrolments
    );


    // --------------------------------------------------------
    // NO APPROVED COURSES
    // --------------------------------------------------------

    if (
      !approvedEnrolments.length
    ) {

      studyListEl.innerHTML = `

        <div class="empty-study">

          <h3>
            📚 No approved courses yet
          </h3>

          <p style="margin-top:10px">

            Your approved courses will appear here.

          </p>

          <p style="margin-top:8px;color:#68766f">

            Once Funda Online Academy approves
            your enrolment, your course will
            appear in My Studies.

          </p>

        </div>

      `;

      return;
    }


    // --------------------------------------------------------
    // COURSE IDS
    // --------------------------------------------------------

    const courseIds =
      [
        ...new Set(
          approvedEnrolments
            .map(
              row =>
                row.course_id
            )
            .filter(Boolean)
        )
      ];


    console.log(
      "FUNDA - Approved course IDs:",
      courseIds
    );


    if (!courseIds.length) {

      studyListEl.innerHTML = `

        <div class="empty-study">

          <h3>
            Course information unavailable
          </h3>

          <p style="margin-top:10px">

            Your enrolment is approved, but
            the course ID is missing.

          </p>

        </div>

      `;

      return;
    }


    // --------------------------------------------------------
    // LOAD COURSES
    // --------------------------------------------------------

    const courses =
      await getCoursesByIds(
        courseIds
      );


    console.log(
      "FUNDA - Courses returned:",
      courses
    );


    const courseMap =
      new Map(
        courses.map(
          course => [
            String(course.id),
            course
          ]
        )
      );


    // --------------------------------------------------------
    // RENDER APPROVED STUDIES
    // --------------------------------------------------------

    studyListEl.innerHTML =
      approvedEnrolments
        .map(
          enrolment => {

            const course =
              courseMap.get(
                String(
                  enrolment.course_id
                )
              );


            if (!course) {

              return `

                <div class="study-card">

                  <span class="funda-status approved">
                    approved
                  </span>

                  <h3 class="study-title">
                    Course
                  </h3>

                  <p class="study-description">

                    Your enrolment has been approved,
                    but the course information could
                    not be loaded.

                  </p>

                </div>

              `;

            }


            const modules =
              normaliseModules(
                course.modules
              );


            return `

              <article
                class="study-card"
                data-course-card="${escapeHTML(course.id)}">

                <div class="study-header">

                  <div>

                    <span class="funda-status approved">

                      ${escapeHTML(
                        enrollmentStatus(enrolment)
                      )}

                    </span>


                    <h3 class="study-title">

                      ${escapeHTML(
                        courseTitle(course)
                      )}

                    </h3>


                    <p class="study-description">

                      ${escapeHTML(
                        course.description ||
                        "Your approved Funda Online Academy course."
                      )}

                    </p>


                    <div class="study-meta">

                      <span>
                        💰 ${formatMoney(
                          enrolment.amount ??
                          coursePrice(course)
                        )}
                      </span>


                      <span>
                        📅 ${escapeHTML(
                          formatDate(
                            enrolment.enrolled_at
                          )
                        )}
                      </span>


                      <span>
                        📚 ${modules.length}
                        module${modules.length === 1 ? "" : "s"}
                      </span>

                    </div>

                  </div>


                  <div class="study-button">

                    <a
                      class="btn green"
                      href="course-study.html?id=${encodeURIComponent(course.id)}">

                      📚 Study Course

                    </a>

                  </div>

                </div>


                ${
                  modules.length

                    ? `

                      <div class="modules-container">

                        <h4 style="margin-bottom:14px">

                          📖 Course Modules

                        </h4>

                        ${renderStudyModules(
                          modules,
                          course.id
                        )}

                      </div>

                    `

                    : `

                      <div class="modules-container">

                        <div class="empty-study">

                          <p>

                            📖 Course modules are being
                            prepared by the academy.

                          </p>

                          <a
                            href="course-study.html?id=${encodeURIComponent(course.id)}"
                            class="btn green"
                            style="margin-top:12px">

                            Open Course

                          </a>

                        </div>

                      </div>

                    `
                }

              </article>

            `;

          }
        )
        .join("");


    attachModuleEvents();


  } catch (error) {

    console.error(
      "FUNDA MY STUDIES ERROR:",
      error
    );


    studyListEl.innerHTML = `

      <div class="error-card">

        <h3>
          Unable to load your studies
        </h3>

        <p style="margin-top:10px">

          ${escapeHTML(
            error.message ||
            "Please refresh the page and try again."
          )}

        </p>

      </div>

    `;

  }

}


// ============================================================
// NORMALISE MODULES
// ============================================================

function normaliseModules(
  modules
) {

  if (!modules) {
    return [];
  }


  if (
    Array.isArray(modules)
  ) {
    return modules;
  }


  if (
    typeof modules === "string"
  ) {

    try {

      const parsed =
        JSON.parse(modules);

      if (
        Array.isArray(parsed)
      ) {
        return parsed;
      }

      return [parsed];

    } catch (error) {

      return [
        {
          title: "Course Material",
          content: modules
        }
      ];

    }

  }


  if (
    typeof modules === "object"
  ) {

    return [
      modules
    ];

  }


  return [];
}


// ============================================================
// MODULE TITLE
// ============================================================

function moduleTitle(
  module,
  index
) {

  if (
    typeof module === "string"
  ) {

    return (
      "Module " +
      (index + 1)
    );

  }

  return (
    module?.title ||
    module?.name ||
    module?.module_title ||
    module?.heading ||
    (
      "Module " +
      (index + 1)
    )
  );
}


// ============================================================
// MODULE CONTENT
// ============================================================

function moduleContent(
  module
) {

  if (
    typeof module === "string"
  ) {
    return module;
  }

  return (
    module?.content ||
    module?.description ||
    module?.details ||
    module?.text ||
    ""
  );
}


// ============================================================
// LESSONS
// ============================================================

function moduleLessons(
  module
) {

  if (
    typeof module !== "object" ||
    !module
  ) {
    return [];
  }

  if (
    Array.isArray(
      module.lessons
    )
  ) {

    return module.lessons;

  }

  return [];
}


// ============================================================
// RENDER MODULES
// ============================================================

function renderStudyModules(
  modules,
  courseId
) {

  return modules
    .map(
      (module, index) => {

        const title =
          moduleTitle(
            module,
            index
          );


        const content =
          moduleContent(
            module
          );


        const lessons =
          moduleLessons(
            module
          );


        return `

          <div class="module-card">

            <button
              type="button"
              class="module-header"
              data-module-index="${index}">

              <span>

                <span class="module-number">
                  ${index + 1}
                </span>

                ${escapeHTML(title)}

              </span>


              <span class="module-arrow">
                +
              </span>

            </button>


            <div
              class="module-content"
              data-module-content="${index}">

              ${
                content

                  ? `

                    <p
                      style="
                        line-height:1.7;
                        margin-bottom:15px
                      ">

                      ${escapeHTML(content)
                        .replaceAll(
                          "\n",
                          "<br>"
                        )}

                    </p>

                  `

                  : ""
              }


              ${
                lessons.length

                  ? `

                    <h4 style="margin-bottom:12px">
                      Lessons
                    </h4>

                    ${lessons
                      .map(
                        (lesson, lessonIndex) => {

                          const lessonTitle =
                            typeof lesson === "string"

                              ? (
                                  "Lesson " +
                                  (lessonIndex + 1)
                                )

                              : (
                                  lesson?.title ||
                                  lesson?.name ||
                                  (
                                    "Lesson " +
                                    (lessonIndex + 1)
                                  )
                                );


                          const lessonDescription =
                            typeof lesson === "string"

                              ? lesson

                              : (
                                  lesson?.description ||
                                  lesson?.content ||
                                  ""
                                );


                          const lessonUrl =
                            typeof lesson === "object"

                              ? (
                                  lesson?.url ||
                                  lesson?.link ||
                                  lesson?.file_url ||
                                  ""
                                )

                              : "";


                          return `

                            <div class="lesson-item">

                              <div class="lesson-top">

                                <div>

                                  <div class="lesson-title">

                                    ${escapeHTML(
                                      lessonTitle
                                    )}

                                  </div>


                                  ${
                                    lessonDescription

                                      ? `

                                        <div class="lesson-description">

                                          ${escapeHTML(
                                            lessonDescription
                                          )}

                                        </div>

                                      `

                                      : ""
                                  }

                                </div>

                              </div>


                              ${
                                lessonUrl

                                  ? `

                                    <div class="lesson-actions">

                                      <a
                                        href="${escapeHTML(lessonUrl)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="lesson-link">

                                        📖 Open Lesson

                                      </a>

                                    </div>

                                  `

                                  : ""
                              }

                            </div>

                          `;

                        }
                      )
                      .join("")}

                  `

                  : ""

              }


              <a
                href="course-study.html?id=${encodeURIComponent(courseId)}"
                class="btn green"
                style="margin-top:10px">

                📚 Open Full Course

              </a>

            </div>

          </div>

        `;

      }
    )
    .join("");

}


// ============================================================
// MODULE EVENTS
// ============================================================

function attachModuleEvents() {

  document
    .querySelectorAll(
      ".module-header"
    )
    .forEach(
      button => {

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


            const wasOpen =
              content.classList.contains(
                "open"
              );


            document
              .querySelectorAll(
                ".module-content"
              )
              .forEach(
                item => {

                  item.classList.remove(
                    "open"
                  );

                }
              );


            document
              .querySelectorAll(
                ".module-arrow"
              )
              .forEach(
                arrow => {

                  arrow.textContent =
                    "+";

                }
              );


            if (!wasOpen) {

              content.classList.add(
                "open"
              );


              const arrow =
                button.querySelector(
                  ".module-arrow"
                );


              if (arrow) {

                arrow.textContent =
                  "−";

              }

            }

          }
        );

      }
    );

}


// ============================================================
// ENROLMENTS
// ============================================================

async function loadEnrolments(
  studentId
) {

  if (!enrolmentsEl) {
    return;
  }


  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';


  try {

    const rows =
      await getStudentEnrolments(
        studentId
      );


    if (
      !rows.length
    ) {

      enrolmentsEl.innerHTML = `

        <div class="card">

          <h3>
            No enrolments yet
          </h3>

          <p>
            Choose a course below to begin
            your learning journey.
          </p>

        </div>

      `;

      return;
    }


    const ids =
      [
        ...new Set(
          rows
            .map(
              row =>
                row.course_id
            )
            .filter(Boolean)
        )
      ];


    const courses =
      await getCoursesByIds(
        ids
      );


    const courseMap =
      new Map(
        courses.map(
          course => [
            String(course.id),
            course
          ]
        )
      );


    enrolmentsEl.innerHTML =
      rows
        .map(
          row => {

            const course =
              courseMap.get(
                String(
                  row.course_id
                )
              );


            const status =
              enrollmentStatus(
                row
              );


            const amount =
              row.amount ??
              coursePrice(course);


            return `

              <div class="card">

                <span
                  class="funda-status ${escapeHTML(status)}">

                  ${escapeHTML(status)}

                </span>


                <h3>

                  ${escapeHTML(
                    courseTitle(course)
                  )}

                </h3>


                <p>

                  ${escapeHTML(
                    course?.description ||
                    "Funda Online Academy course."
                  )}

                </p>


                <p class="funda-info">

                  <strong>
                    Course fee:
                  </strong>

                  ${formatMoney(amount)}

                </p>


                <p class="funda-info">

                  <strong>
                    Enrolled:
                  </strong>

                  ${escapeHTML(
                    formatDate(
                      row.enrolled_at
                    )
                  )}

                </p>


                ${
                  isApproved(row)

                    ? `

                      <div class="funda-card-actions">

                        <a
                          href="course-study.html?id=${encodeURIComponent(row.course_id)}"
                          class="btn green">

                          📚 Study Course

                        </a>

                      </div>

                    `

                    : `

                      <p
                        style="
                          margin-top:14px;
                          color:#777
                        ">

                        Your enrolment is awaiting
                        academy approval.

                      </p>

                    `
                }

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Enrolments error:",
      error
    );


    enrolmentsEl.innerHTML = `

      <div class="card">

        <h3>
          Unable to load enrolments
        </h3>

        <p>

          ${escapeHTML(
            error.message ||
            "Please refresh and try again."
          )}

        </p>

      </div>

    `;

  }

}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses(
  studentId
) {

  if (!coursesEl) {
    return;
  }


  coursesEl.innerHTML =
    '<p class="loading">Loading courses…</p>';


  try {

    const courses =
      await getAvailableCourses();


    if (
      !courses.length
    ) {

      coursesEl.innerHTML = `

        <div class="card">

          <h3>
            No courses available
          </h3>

          <p>
            Courses will appear here when
            available.
          </p>

        </div>

      `;

      return;
    }


    const {
      data: existing,
      error
    } =
      await db
        .from("enrollments")
        .select(
          "course_id,enrollment_status,status"
        )
        .eq(
          "student_id",
          studentId
        );


    if (error) {
      throw error;
    }


    const enrolled =
      new Map(
        (existing || [])
          .map(
            row => [
              String(
                row.course_id
              ),
              enrollmentStatus(row)
            ]
          )
      );


    coursesEl.innerHTML =
      courses
        .map(
          course => {

            const id =
              String(course.id);


            const status =
              enrolled.get(id);


            return `

              <div class="card">

                <h3>

                  ${escapeHTML(
                    courseTitle(course)
                  )}

                </h3>


                <p>

                  ${escapeHTML(
                    course.description ||
                    "Online short course."
                  )}

                </p>


                <p class="funda-info">

                  <strong>
                    Course fee:
                  </strong>

                  ${formatMoney(
                    coursePrice(course)
                  )}

                </p>


                ${
                  status

                    ? `

                      <span
                        class="funda-status ${escapeHTML(status)}">

                        ${escapeHTML(status)}

                      </span>

                    `

                    : `

                      <button
                        type="button"
                        class="btn green enrol-btn"
                        data-course-id="${escapeHTML(id)}">

                        Enrol Now

                      </button>

                    `
                }

              </div>

            `;

          }
        )
        .join("");


    document
      .querySelectorAll(
        ".enrol-btn"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              enrolStudent(
                studentId,
                button.dataset.courseId,
                button
              );

            }
          );

        }
      );


  } catch (error) {

    console.error(
      "Available courses error:",
      error
    );


    coursesEl.innerHTML = `

      <div class="card">

        <h3>
          Unable to load courses
        </h3>

        <p>

          ${escapeHTML(
            error.message ||
            "Please refresh the page and try again."
          )}

        </p>

      </div>

    `;

  }

}


// ============================================================
// ENROL STUDENT
// ============================================================

async function enrolStudent(
  studentId,
  courseId,
  button
) {

  if (
    !studentId ||
    !courseId ||
    !button
  ) {
    return;
  }


  button.disabled =
    true;

  button.textContent =
    "Enrolling…";


  try {

    // --------------------------------------------------------
    // POLICY CHECK
    // --------------------------------------------------------

    const {
      data: policy,
      error: policyError
    } =
      await db
        .from("policy_acceptances")
        .select(
          "id,policies_accepted,declaration_accepted"
        )
        .eq(
          "student_id",
          studentId
        )
        .eq(
          "policy_version",
          POLICY_VERSION
        )
        .maybeSingle();


    if (policyError) {
      throw policyError;
    }


    if (
      !policy ||
      policy.policies_accepted !== true ||
      policy.declaration_accepted !== true
    ) {

      showMessage(
        "Please accept the Funda Online Academy policies before enrolling."
      );


      document
        .getElementById("policies")
        ?.scrollIntoView({
          behavior: "smooth"
        });


      button.disabled =
        false;

      button.textContent =
        "Enrol Now";

      return;
    }


    // --------------------------------------------------------
    // EXISTING ENROLMENT
    // --------------------------------------------------------

    const {
      data: existing,
      error: checkError
    } =
      await db
        .from("enrollments")
        .select(
          "id,enrollment_status,status"
        )
        .eq(
          "student_id",
          studentId
        )
        .eq(
          "course_id",
          courseId
        )
        .maybeSingle();


    if (checkError) {
      throw checkError;
    }


    if (existing) {

      showMessage(
        "You are already enrolled in this course."
      );

      button.disabled =
        false;

      button.textContent =
        "Enrol Now";

      return;
    }


    // --------------------------------------------------------
    // COURSE
    // --------------------------------------------------------

    const {
      data: course,
      error: courseError
    } =
      await db
        .from("courses")
        .select("*")
        .eq(
          "id",
          courseId
        )
        .maybeSingle();


    if (courseError) {
      throw courseError;
    }


    if (!course) {
      throw new Error(
        "Course could not be found."
      );
    }


    // --------------------------------------------------------
    // CREATE ENROLMENT
    // --------------------------------------------------------

    const payload = {

      student_id:
        studentId,

      course_id:
        courseId,

      enrollment_status:
        "pending",

      enrolled_at:
        new Date().toISOString(),

      amount:
        course.price ??
        null

    };


    const {
      error: insertError
    } =
      await db
        .from("enrollments")
        .insert(
          payload
        );


    if (insertError) {
      throw insertError;
    }


    showMessage(
      "Enrolment submitted successfully. Please wait for academy approval.",
      true
    );


    await Promise.all([

      loadMyStudies(
        studentId
      ),

      loadEnrolments(
        studentId
      ),

      loadAvailableCourses(
        studentId
      )

    ]);


  } catch (error) {

    console.error(
      "Enrolment error:",
      error
    );


    showMessage(
      "Unable to complete enrolment: " +
      (
        error.message ||
        "Please try again."
      )
    );


    button.disabled =
      false;

    button.textContent =
      "Enrol Now";

  }

}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments(
  studentId
) {

  if (!paymentListEl) {
    return;
  }


  paymentListEl.innerHTML = `

    <div class="card">

      <p class="loading">
        Loading payment history…
      </p>

    </div>

  `;


  try {

    const {
      data: payments,
      error
    } =
      await db
        .from("payments")
        .select("*")
        .eq(
          "student_id",
          studentId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !payments ||
      !payments.length
    ) {

      paymentListEl.innerHTML = `

        <div class="card">

          <h3>
            Payment History
          </h3>

          <p>
            No payment records have been
            recorded yet.
          </p>

        </div>

      `;

      return;
    }


    const courseIds =
      [
        ...new Set(
          payments
            .map(
              payment =>
                payment.course_id
            )
            .filter(Boolean)
        )
      ];


    const courses =
      await getCoursesByIds(
        courseIds
      );


    const courseMap =
      new Map(
        courses.map(
          course => [
            String(course.id),
            course
          ]
        )
      );


    paymentListEl.innerHTML = `

      <div
        style="
          display:flex;
          flex-direction:column;
          gap:14px
        ">

        ${
          payments
            .map(
              payment => {

                const course =
                  courseMap.get(
                    String(
                      payment.course_id
                    )
                  );


                const status =
                  String(
                    payment.payment_status ??
                    payment.status ??
                    "pending"
                  )
                  .trim()
                  .toLowerCase();


                const method =
                  payment.payment_method ||
                  payment.method ||
                  "Not specified";


                const amount =
                  payment.amount ??
                  coursePrice(course);


                const proof =
                  payment.proof_url ||
                  payment.proof_of_payment_url ||
                  payment.receipt_url ||
                  payment.file_url;


                return `

                  <div class="payment-card">

                    <h3>

                      ${escapeHTML(
                        courseTitle(course)
                      )}

                    </h3>


                    <p class="funda-info">

                      <strong>
                        Amount:
                      </strong>

                      ${formatMoney(amount)}

                    </p>


                    <p class="funda-info">

                      <strong>
                        Method:
                      </strong>

                      ${escapeHTML(method)}

                    </p>


                    <p class="funda-info">

                      <strong>
                        Date:
                      </strong>

                      ${escapeHTML(
                        formatDate(
                          payment.created_at ||
                          payment.paid_at
                        )
                      )}

                    </p>


                    <p class="funda-info">

                      <strong>
                        Status:
                      </strong>

                      <span
                        class="funda-status ${escapeHTML(status)}">

                        ${escapeHTML(status)}

                      </span>

                    </p>


                    <p class="funda-info">

                      <strong>
                        Proof:
                      </strong>

                      ${
                        proof

                          ? `

                            <a
                              class="btn green"
                              target="_blank"
                              rel="noopener noreferrer"
                              href="${escapeHTML(proof)}">

                              View submitted proof

                            </a>

                          `

                          : "Not available"
                      }

                    </p>

                  </div>

                `;

              }
            )
            .join("")
        }

      </div>

    `;


  } catch (error) {

    console.error(
      "Payments error:",
      error
    );


    paymentListEl.innerHTML = `

      <div class="card">

        <h3>
          Payment History
        </h3>

        <p>
          Payment information could not
          be loaded right now.
        </p>

      </div>

    `;

  }

}


// ============================================================
// POLICY ACCEPTANCE
// ============================================================

async function loadPolicyAcceptance(
  student
) {

  if (
    !student ||
    !student.id
  ) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await db
        .from("policy_acceptances")
        .select("*")
        .eq(
          "student_id",
          student.id
        )
        .eq(
          "policy_version",
          POLICY_VERSION
        )
        .maybeSingle();


    if (error) {

      console.error(
        "Policy error:",
        error
      );

      return;
    }


    if (
      data &&
      data.policies_accepted === true &&
      data.declaration_accepted === true
    ) {

      showPolicyAccepted(
        data
      );

    } else {

      showPolicyForm();

    }

  } catch (error) {

    console.error(
      "Policy loading error:",
      error
    );

  }

}


// ============================================================
// SHOW POLICY FORM
// ============================================================

function showPolicyForm() {

  if (policyCheckbox) {

    policyCheckbox.checked =
      false;

    policyCheckbox.disabled =
      false;

  }


  if (acceptPolicyBtn) {

    acceptPolicyBtn.style.display =
      "inline-block";

    acceptPolicyBtn.disabled =
      false;

    acceptPolicyBtn.textContent =
      "✅ Accept & Continue";

  }


  if (policyAcceptedEl) {

    policyAcceptedEl.style.display =
      "none";

    policyAcceptedEl.innerHTML =
      "";

  }

}


// ============================================================
// SHOW ACCEPTED POLICY
// ============================================================

function showPolicyAccepted(
  record
) {

  if (policyCheckbox) {

    policyCheckbox.checked =
      true;

    policyCheckbox.disabled =
      true;

  }


  if (acceptPolicyBtn) {

    acceptPolicyBtn.style.display =
      "none";

  }


  if (policyAcceptedEl) {

    policyAcceptedEl.style.display =
      "block";

    policyAcceptedEl.innerHTML = `

      <strong>
        ✅ Policies Accepted
      </strong>

      <div>
        Your Funda Online Academy policies
        and declaration have been accepted.
      </div>

      <div class="policy-version">

        Policy version:
        ${escapeHTML(
          record.policy_version ||
          POLICY_VERSION
        )}

      </div>

      <div class="policy-version">

        Accepted:
        ${escapeHTML(
          formatDate(
            record.accepted_at
          )
        )}

      </div>

    `;

  }

}


// ============================================================
// ACCEPT POLICIES
// ============================================================

async function acceptPolicies() {

  if (!policyCheckbox) {
    return;
  }


  if (
    !policyCheckbox.checked
  ) {

    showMessage(
      "Please tick the acceptance box before continuing."
    );

    return;
  }


  if (!currentStudent) {

    showMessage(
      "Your student profile could not be found."
    );

    return;
  }


  acceptPolicyBtn.disabled =
    true;

  acceptPolicyBtn.textContent =
    "Saving acceptance…";


  try {

    const {
      data: existing,
      error: checkError
    } =
      await db
        .from("policy_acceptances")
        .select("*")
        .eq(
          "student_id",
          currentStudent.id
        )
        .eq(
          "policy_version",
          POLICY_VERSION
        )
        .maybeSingle();


    if (checkError) {
      throw checkError;
    }


    if (
      existing &&
      existing.policies_accepted === true &&
      existing.declaration_accepted === true
    ) {

      showPolicyAccepted(
        existing
      );

      showMessage(
        "Your policies have already been accepted.",
        true
      );

      return;
    }


    const payload = {

      student_id:
        currentStudent.id,

      user_id:
        currentUserData.id,

      policy_version:
        POLICY_VERSION,

      policies_accepted:
        true,

      declaration_accepted:
        true,

      declaration_text:
        DECLARATION_TEXT

    };


    const {
      data,
      error
    } =
      await db
        .from("policy_acceptances")
        .insert(
          payload
        )
        .select("*")
        .single();


    if (error) {
      throw error;
    }


    showPolicyAccepted(
      data
    );


    showMessage(
      "Policies accepted successfully.",
      true
    );


  } catch (error) {

    console.error(
      "Policy acceptance error:",
      error
    );


    showMessage(
      "Unable to save your policy acceptance: " +
      (
        error.message ||
        "Please try again."
      )
    );


    acceptPolicyBtn.disabled =
      false;

    acceptPolicyBtn.textContent =
      "✅ Accept & Continue";

  }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  const {
    error
  } =
    await db.auth.signOut();


  if (error) {

    showMessage(
      "Unable to log out. Please try again."
    );

    return;
  }


  window.location.href =
    "auth.html";

}


// ============================================================
// INITIALISE DASHBOARD
// ============================================================

async function initDashboard() {

  try {

    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    currentUserData =
      await getCurrentUser();


    if (!currentUserData) {

      window.location.href =
        "auth.html";

      return;
    }


    if (userEmailEl) {

      userEmailEl.textContent =
        currentUserData.email ||
        "";

    }


    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    currentStudent =
      await getStudent(
        currentUserData.id
      );


    if (!currentStudent) {

      showMessage(
        "Your student profile could not be found. Please contact the academy."
      );

      return;
    }


    const name =
      currentStudent.full_name ||
      currentStudent.name ||
      currentUserData
        .user_metadata
        ?.full_name ||
      "Student";


    if (userNameEl) {

      userNameEl.textContent =
        name;

    }


    // --------------------------------------------------------
    // LOAD DASHBOARD
    // --------------------------------------------------------

    await Promise.all([

      loadMyStudies(
        currentStudent.id
      ),

      loadEnrolments(
        currentStudent.id
      ),

      loadAvailableCourses(
        currentStudent.id
      ),

      loadPayments(
        currentStudent.id
      ),

      loadPolicyAcceptance(
        currentStudent
      )

    ]);


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );


    showMessage(
      "Unable to load your dashboard: " +
      (
        error.message ||
        "Please refresh the page."
      )
    );

  }

}


// ============================================================
// EVENTS
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    logout
  );

}


if (acceptPolicyBtn) {

  acceptPolicyBtn.addEventListener(
    "click",
    acceptPolicies
  );

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
