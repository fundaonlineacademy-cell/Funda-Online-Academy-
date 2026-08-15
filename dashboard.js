// ==========================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// ENROLMENTS • COURSES • MODULES • LOGOUT
// ==========================================

const db = supabase.createClient(
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
      "STUDENT LOOKUP ERROR:",
      error
    );

    return null;
  }


  return student;
}


// ==========================================
// INITIALISE DASHBOARD
// ==========================================

async function init() {

  // Check Supabase configuration

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY ||
    window.SUPABASE_URL.includes("PASTE_")
  ) {

    show(
      "Supabase is not connected correctly."
    );

    return;
  }


  // Check logged-in session

  const {
    data: sessionData,
    error: sessionError
  } = await db.auth.getSession();


  if (
    sessionError ||
    !sessionData ||
    !sessionData.session ||
    !sessionData.session.user
  ) {

    location.href = "auth.html";

    return;
  }


  const user =
    sessionData.session.user;


  // ========================================
  // DISPLAY EMAIL
  // ========================================

  const emailBox =
    document.getElementById("user-email");


  if (emailBox) {

    emailBox.textContent =
      user.email || "";

  }


  // ========================================
  // GET STUDENT
  // ========================================

  const student =
    await getStudent(user.id);


  if (!student) {

    const nameBox =
      document.getElementById("user-name");


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


  // ========================================
  // DISPLAY STUDENT NAME
  // ========================================

  const nameBox =
    document.getElementById("user-name");


  if (nameBox) {

    nameBox.textContent =
      student.full_name ||
      user.user_metadata?.full_name ||
      "Student";

  }


  // ========================================
  // LOAD DASHBOARD DATA
  // ========================================

  await loadEnrollments(student.id);

  await loadAvailableCourses(student.id);
}


// ==========================================
// LOAD MY ENROLMENTS
// ==========================================

async function loadEnrollments(studentId) {

  const box =
    document.getElementById("enrolments");


  if (!box) return;


  // ----------------------------------------
  // FIRST GET ENROLMENTS
  // ----------------------------------------

  const {
    data: enrollments,
    error: enrollmentError
  } = await db
    .from("enrollments")
    .select(`
      id,
      student_id,
      course_id,
      enrollment_status,
      enrolled_at
    `)
    .eq("student_id", studentId)
    .order("enrolled_at", {
      ascending: false
    });


  if (enrollmentError) {

    console.error(
      "ENROLLMENTS ERROR:",
      enrollmentError
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


  // ----------------------------------------
  // NO ENROLMENTS
  // ----------------------------------------

  if (
    !enrollments ||
    enrollments.length === 0
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


  // ----------------------------------------
  // GET COURSE IDs
  // ----------------------------------------

  const courseIds =
    enrollments
      .map(item => item.course_id)
      .filter(Boolean);


  // ----------------------------------------
  // LOAD COURSES SEPARATELY
  // ----------------------------------------

  let courses = [];


  if (courseIds.length > 0) {

    const {
      data,
      error
    } = await db
      .from("courses")
      .select(`
        id,
        title,
        price,
        duration,
        description,
        image_url,
        active
      `)
      .in("id", courseIds);


    if (error) {

      console.error(
        "ENROLMENT COURSES ERROR:",
        error
      );

    } else {

      courses = data || [];

    }
  }


  // ----------------------------------------
  // CREATE COURSE LOOKUP
  // ----------------------------------------

  const courseMap =
    new Map(
      courses.map(course => [
        course.id,
        course
      ])
    );


  // ----------------------------------------
  // DISPLAY ENROLMENTS
  // ----------------------------------------

  box.innerHTML =
    enrollments.map(enrollment => {

      const course =
        courseMap.get(
          enrollment.course_id
        );


      const courseTitle =
        course?.title ||
        "Course";


      const price =
        Number(
          course?.price || 0
        );


      const status =
        enrollment.enrollment_status ||
        "pending";


      const date =
        enrollment.enrolled_at
          ? new Date(
              enrollment.enrolled_at
            ).toLocaleDateString("en-ZA")
          : "";


      return `
        <article class="card">

          ${
            course?.image_url
              ? `
                <img
                  class="course-image"
                  src="${escapeHtml(
                    course.image_url
                  )}"
                  alt="${escapeHtml(
                    courseTitle
                  )}"
                >
              `
              : ""
          }

          <h3>
            ${escapeHtml(
              courseTitle
            )}
          </h3>

          <p>
            <strong>Price:</strong>
            R${price.toLocaleString("en-ZA")}
          </p>

          <p>
            <strong>Status:</strong>

            <span class="status">
              ${escapeHtml(status)}
            </span>
          </p>

          ${
            course?.duration
              ? `
                <p>
                  <strong>Duration:</strong>
                  ${escapeHtml(
                    course.duration
                  )}
                </p>
              `
              : ""
          }

          ${
            date
              ? `
                <small>
                  Enrolled:
                  ${escapeHtml(date)}
                </small>
              `
              : ""
          }

        </article>
      `;

    }).join("");
}


// ==========================================
// LOAD AVAILABLE COURSES
// ==========================================

async function loadAvailableCourses(studentId) {

  const box =
    document.getElementById(
      "available-courses"
    );


  if (!box) return;


  // ----------------------------------------
  // GET COURSES
  // ----------------------------------------

  const {
    data: courses,
    error
  } = await db
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
      active
    `)
    .eq("active", true)
    .order("title", {
      ascending: true
    });


  if (error) {

    console.error(
      "COURSES ERROR:",
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
  // GET STUDENT'S EXISTING ENROLMENTS
  // ----------------------------------------

  const {
    data: mine,
    error: enrollmentError
  } = await db
    .from("enrollments")
    .select("course_id")
    .eq("student_id", studentId);


  if (enrollmentError) {

    console.error(
      "STUDENT ENROLMENT CHECK ERROR:",
      enrollmentError
    );

  }


  const enrolled =
    new Set(
      (mine || []).map(
        item => item.course_id
      )
    );


  // ----------------------------------------
  // NO COURSES
  // ----------------------------------------

  if (
    !courses ||
    courses.length === 0
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
    courses.map(course => {

      const alreadyEnrolled =
        enrolled.has(course.id);


      return `
        <article class="card course">

          ${
            course.image_url
              ? `
                <img
                  class="course-image"
                  src="${escapeHtml(
                    course.image_url
                  )}"
                  alt="${escapeHtml(
                    course.title
                  )}"
                >
              `
              : ""
          }


          <h3>
            ${escapeHtml(
              course.title ||
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
                course.price || 0
              ).toLocaleString("en-ZA")}

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

    }).join("");


  // ----------------------------------------
  // LOAD MODULES
  // ----------------------------------------

  for (const course of courses) {

    await loadCourseModules(
      course.id
    );

  }


  // ----------------------------------------
  // ENROL BUTTONS
  // ----------------------------------------

  box
    .querySelectorAll("[data-enrol]")
    .forEach(button => {

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

    });
}


// ==========================================
// COURSE MODULES
// ==========================================

async function loadCourseModules(courseId) {

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
    .select(`
      id,
      course_id,
      module_number,
      module_name
    `)
    .eq("course_id", courseId)
    .order("module_number", {
      ascending: true
    });


  if (error) {

    console.error(
      "MODULES ERROR:",
      error
    );


    box.innerHTML = "";

    return;
  }


  if (
    !modules ||
    modules.length === 0
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
        modules.map(module => {

          return `
            <li>
              ${
                module.module_number
                  ? module.module_number +
                    ". "
                  : ""
              }

              ${escapeHtml(
                module.module_name ||
                "Module"
              )}

            </li>
          `;

        }).join("")
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

  const confirmed =
    confirm(
      "Send an enrolment request for this course?"
    );


  if (!confirmed) return;


  // ----------------------------------------
  // CHECK SESSION
  // ----------------------------------------

  const {
    data: sessionData
  } = await db.auth.getSession();


  if (
    !sessionData ||
    !sessionData.session ||
    !sessionData.session.user
  ) {

    show(
      "Your session has expired. Please log in again."
    );


    setTimeout(() => {

      location.href =
        "auth.html";

    }, 1500);


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
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();


  if (checkError) {

    console.error(
      "DUPLICATE ENROLMENT CHECK ERROR:",
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
  // CREATE ENROLMENT
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
      "ENROLMENT CREATION ERROR:",
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


  show(
    "Enrolment request sent successfully.",
    true
  );


  // ----------------------------------------
  // REFRESH DASHBOARD
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
  document.getElementById("logout");


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
