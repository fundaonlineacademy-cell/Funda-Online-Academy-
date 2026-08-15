// ==========================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ENROLMENTS • COURSES • MODULES • LOGOUT
// SELECTED COURSE ENROLMENT
// ==========================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const msg = document.getElementById("message");


// ==========================================
// MESSAGE
// ==========================================

function show(text, ok = false) {

  if (!msg) return;

  msg.textContent = text;

  msg.className =
    "message " + (ok ? "success" : "error");
}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}


// ==========================================
// GET CURRENT STUDENT
// ==========================================

async function getStudent(userId) {

  const {
    data: student,
    error
  } = await db
    .from("students")
    .select(`
      id,
      user_id,
      full_name,
      gender,
      south_african_id,
      email,
      mobile_whatsapp
    `)
    .eq("user_id", userId)
    .maybeSingle();


  if (error) {

    console.error(
      "Student lookup error:",
      error
    );

    return null;
  }


  return student;
}


// ==========================================
// PROCESS SELECTED COURSE
// ==========================================

async function processPendingEnrollment(studentId) {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const courseName =
    params.get("enrol");


  // No selected course

  if (!courseName) {

    return;
  }


  // Remove course from URL immediately
  // so refreshing the page does not
  // repeat the process.

  window.history.replaceState(
    {},
    document.title,
    "dashboard.html"
  );


  // Find selected course

  const {
    data: course,
    error
  } = await db
    .from("courses")
    .select(`
      id,
      name,
      price
    `)
    .eq("name", courseName)
    .maybeSingle();


  if (error) {

    console.error(
      "Selected course lookup error:",
      error
    );

    localStorage.removeItem(
      "funda_pending_course"
    );

    show(
      "We could not load the selected course."
    );

    return;
  }


  if (!course) {

    localStorage.removeItem(
      "funda_pending_course"
    );

    show(
      "The selected course could not be found in the course catalogue."
    );

    return;
  }


  // Clear saved course

  localStorage.removeItem(
    "funda_pending_course"
  );


  // Start enrolment

  await enrol(
    course.id,
    studentId
  );
}


// ==========================================
// INITIALISE DASHBOARD
// ==========================================

async function init() {

  if (
    !window.SUPABASE_URL ||
    window.SUPABASE_URL.includes("PASTE_")
  ) {

    show(
      "Supabase is not connected yet."
    );

    return;
  }


  const {
    data: { session },
    error: sessionError
  } = await db.auth.getSession();


  if (
    sessionError ||
    !session ||
    !session.user
  ) {

    location.href =
      "auth.html";

    return;
  }


  const user =
    session.user;


  // ----------------------------------------
  // DISPLAY EMAIL
  // ----------------------------------------

  const emailBox =
    document.getElementById(
      "user-email"
    );


  if (emailBox) {

    emailBox.textContent =
      user.email || "";

  }


  // ----------------------------------------
  // GET STUDENT
  // ----------------------------------------

  const student =
    await getStudent(user.id);


  if (!student) {

    const nameBox =
      document.getElementById(
        "user-name"
      );


    if (nameBox) {

      nameBox.textContent =
        user.user_metadata?.full_name ||
        "Student";

    }


    show(
      "Your student record could not be found. Please contact Funda Online Academy."
    );

    return;
  }


  // ----------------------------------------
  // DISPLAY STUDENT NAME
  // ----------------------------------------

  const nameBox =
    document.getElementById(
      "user-name"
    );


  if (nameBox) {

    nameBox.textContent =
      student.full_name ||
      user.user_metadata?.full_name ||
      "Student";

  }


  // ----------------------------------------
  // LOAD DATA
  // ----------------------------------------

  await loadEnrollments(
    student.id
  );


  await loadAvailableCourses(
    student.id
  );


  // ----------------------------------------
  // PROCESS COURSE SELECTED
  // BEFORE LOGIN
  // ----------------------------------------

  await processPendingEnrollment(
    student.id
  );
}


// ==========================================
// STUDENT ENROLLMENTS
// ==========================================

async function loadEnrollments(studentId) {

  const box =
    document.getElementById(
      "enrolments"
    );


  if (!box) return;


  const {
    data,
    error
  } = await db
    .from("enrollments")
    .select(`
      id,
      student_id,
      course_id,
      enrollment_status,
      enrolled_at,
      courses (
        id,
        name,
        price
      )
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

    console.error(
      "Enrollments error:",
      error
    );


    box.innerHTML = `
      <div class="card">

        <p>
          Could not load your enrolments.
        </p>

      </div>
    `;

    return;
  }


  if (
    !data ||
    !data.length
  ) {

    box.innerHTML = `
      <div class="empty card">

        <h3>
          No enrolments yet
        </h3>

        <p>
          Choose a course below and
          request enrolment to see it here.
        </p>

        <a
          class="btn green"
          href="#available-courses"
        >
          Browse Courses
        </a>

      </div>
    `;

    return;
  }


  box.innerHTML =
    data.map(
      enrollment => {

        const courseName =
          enrollment.courses?.name ||
          "Course";


        const price =
          Number(
            enrollment.courses?.price ||
            0
          );


        const status =
          enrollment.enrollment_status ||
          "pending";


        const date =
          enrollment.enrolled_at
            ? new Date(
                enrollment.enrolled_at
              ).toLocaleDateString(
                "en-ZA"
              )
            : "";


        return `
          <article class="card">

            <h3>
              ${escapeHtml(
                courseName
              )}
            </h3>

            <p>
              <strong>
                Price:
              </strong>

              R${price.toLocaleString(
                "en-ZA"
              )}
            </p>

            <p>
              <strong>
                Status:
              </strong>

              <span class="status">
                ${escapeHtml(
                  status
                )}
              </span>
            </p>

            ${
              date
                ? `
                  <small>
                    Enrolled:
                    ${escapeHtml(
                      date
                    )}
                  </small>
                `
                : ""
            }

          </article>
        `;

      }
    ).join("");
}


// ==========================================
// AVAILABLE COURSES
// ==========================================

async function loadAvailableCourses(
  studentId
) {

  const box =
    document.getElementById(
      "available-courses"
    );


  if (!box) return;


  const {
    data: courses,
    error
  } = await db
    .from("courses")
    .select(`
      id,
      name,
      price,
      category,
      duration,
      description,
      image_url,
      active
    `)
    .eq(
      "active",
      true
    )
    .order(
      "name",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Courses error:",
      error
    );


    box.innerHTML = `
      <div class="card">

        <p>
          Could not load courses.
        </p>

      </div>
    `;

    return;
  }


  // ----------------------------------------
  // GET EXISTING ENROLLMENTS
  // ----------------------------------------

  const {
    data: mine,
    error: enrollmentError
  } = await db
    .from("enrollments")
    .select(
      "course_id"
    )
    .eq(
      "student_id",
      studentId
    );


  if (enrollmentError) {

    console.error(
      "Student courses error:",
      enrollmentError
    );

  }


  const enrolled =
    new Set(
      (mine || []).map(
        item =>
          item.course_id
      )
    );


  if (
    !courses ||
    !courses.length
  ) {

    box.innerHTML = `
      <div class="card">

        <h3>
          No courses available
        </h3>

        <p>
          Courses will appear here when
          they are published.
        </p>

      </div>
    `;

    return;
  }


  // ----------------------------------------
  // DISPLAY COURSES
  // ----------------------------------------

  box.innerHTML =
    courses.map(
      course => {

        const alreadyEnrolled =
          enrolled.has(
            course.id
          );


        return `
          <article
            class="card course"
          >

            ${
              course.image_url
                ? `
                  <img
                    class="course-image"
                    src="${escapeHtml(
                      course.image_url
                    )}"
                    alt="${escapeHtml(
                      course.name
                    )}"
                  >
                `
                : ""
            }


            ${
              course.category
                ? `
                  <div class="tag">
                    ${escapeHtml(
                      course.category
                    )}
                  </div>
                `
                : ""
            }


            <h3>
              ${escapeHtml(
                course.name ||
                "Course"
              )}
            </h3>


            ${
              course.description
                ? `
                  <p class="course-desc">
                    ${escapeHtml(
                      course.description
                    )}
                  </p>
                `
                : ""
            }


            <div
              class="course-modules"
              id="modules-${course.id}"
            >

              <p>
                Loading modules...
              </p>

            </div>


            <div class="course-foot">

              <span class="price">
                R${Number(
                  course.price ||
                  0
                ).toLocaleString(
                  "en-ZA"
                )}
              </span>


              ${
                course.duration
                  ? `
                    <span class="duration">
                      ${escapeHtml(
                        course.duration
                      )}
                    </span>
                  `
                  : ""
              }

            </div>


            ${
              alreadyEnrolled

                ? `
                  <button
                    type="button"
                    class="btn ghost full"
                    disabled
                  >
                    Already Enrolled
                  </button>
                `

                : `
                  <button
                    type="button"
                    class="btn green full"
                    data-enrol="${course.id}"
                  >
                    Enrol Now
                  </button>
                `
            }

          </article>
        `;

      }
    ).join("");


  // ----------------------------------------
  // LOAD MODULES
  // ----------------------------------------

  for (
    const course of courses
  ) {

    await loadCourseModules(
      course.id
    );

  }


  // ----------------------------------------
  // ENROL BUTTONS
  // ----------------------------------------

  box
    .querySelectorAll(
      "[data-enrol]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async function(e) {

            e.preventDefault();

            e.stopPropagation();


            const courseId =
              button.dataset.enrol;


            await enrol(
              courseId,
              studentId
            );

          }
        );

      }
    );
}


// ==========================================
// COURSE MODULES
// ==========================================

async function loadCourseModules(
  courseId
) {

  const box =
    document.getElementById(
      `modules-${courseId}`
    );


  if (!box) return;


  const {
    data: modules,
    error
  } = await db
    .from("course_modules")
    .select("*")
    .eq(
      "course_id",
      courseId
    );


  if (error) {

    console.error(
      "Course modules error:",
      error
    );

    box.innerHTML = "";

    return;
  }


  if (
    !modules ||
    !modules.length
  ) {

    box.innerHTML = "";

    return;
  }


  box.innerHTML = `
    <h4>
      Course Modules
    </h4>

    <ul>
      ${
        modules.map(
          module => {

            const title =
              module.module_name ||
              module.name ||
              module.title ||
              module.module_title ||
              module.description ||
              "Module";


            return `
              <li>
                ${escapeHtml(
                  title
                )}
              </li>
            `;

          }
        ).join("")
      }
    </ul>
  `;
}


// ==========================================
// REQUEST ENROLMENT
// ==========================================

async function enrol(
  courseId,
  studentId
) {

  // ----------------------------------------
  // GET COURSE INFORMATION
  // ----------------------------------------

  const {
    data: course,
    error: courseError
  } = await db
    .from("courses")
    .select(`
      id,
      name,
      price
    `)
    .eq(
      "id",
      courseId
    )
    .maybeSingle();


  if (courseError) {

    console.error(
      "Course lookup error:",
      courseError
    );

    show(
      "Could not load the selected course."
    );

    return;
  }


  if (!course) {

    show(
      "The selected course could not be found."
    );

    return;
  }


  const price =
    Number(
      course.price || 0
    );


  // ----------------------------------------
  // CONFIRM ENROLMENT
  // ----------------------------------------

  const confirmed =
    confirm(
      "Send an enrolment request for " +
      course.name +
      "?\n\n" +
      "Course price: R" +
      price.toLocaleString("en-ZA")
    );


  if (!confirmed) {

    return;
  }


  // ----------------------------------------
  // CHECK SESSION
  // ----------------------------------------

  const {
    data: { session }
  } = await db.auth.getSession();


  if (
    !session ||
    !session.user
  ) {

    show(
      "Your session has expired. Please log in again."
    );


    setTimeout(
      () => {

        location.href =
          "auth.html";

      },
      1500
    );


    return;
  }


  // ----------------------------------------
  // CHECK DUPLICATE
  // ----------------------------------------

  const {
    data: existing,
    error: checkError
  } = await db
    .from("enrollments")
    .select("id")
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

    console.error(
      "Enrollment check error:",
      checkError
    );


    show(
      "Could not check your existing enrolment."
    );

    return;
  }


  if (existing) {

    show(
      "You have already requested this course."
    );

    return;
  }


  // ----------------------------------------
  // CREATE ENROLLMENT
  // ----------------------------------------

  const {
    data: newEnrollment,
    error
  } = await db
    .from("enrollments")
    .insert({

      student_id:
        studentId,

      course_id:
        courseId,

      enrollment_status:
        "pending"

    })
    .select()
    .single();


  if (error) {

    console.error(
      "Enrollment creation error:",
      error
    );


    show(
      "Could not send enrolment request: " +
      error.message
    );

    return;
  }


  console.log(
    "Enrollment created:",
    newEnrollment
  );


  // ----------------------------------------
  // SUCCESS
  // ----------------------------------------

  show(
    "Enrolment request sent successfully.",
    true
  );


  // ----------------------------------------
  // REFRESH
  // ----------------------------------------

  await loadEnrollments(
    studentId
  );


  await loadAvailableCourses(
    studentId
  );
}


// ==========================================
// LOGOUT
// ==========================================

const logoutButton =
  document.getElementById(
    "logout"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function(e) {

      e.preventDefault();


      await db.auth.signOut();


      location.href =
        "index.html";

    }
  );

}


// ==========================================
// START DASHBOARD
// ==========================================

init();
