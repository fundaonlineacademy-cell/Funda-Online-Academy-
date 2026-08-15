// ==========================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COURSES • ENROLMENTS • LOGOUT
// ==========================================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ==========================================================
// PAGE ELEMENTS
// ==========================================================

const userEmailEl = document.getElementById("user-email");
const userNameEl = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout");

const messageEl = document.getElementById("message");
const enrolmentsEl = document.getElementById("enrolments");
const coursesEl = document.getElementById("available-courses");


// ==========================================================
// MESSAGE
// ==========================================================

function showMessage(text, success = false) {

  if (!messageEl) return;

  messageEl.textContent = text;

  messageEl.classList.remove("hidden");
  messageEl.classList.remove("success");
  messageEl.classList.remove("error");

  messageEl.classList.add(success ? "success" : "error");
}


// ==========================================================
// ESCAPE HTML
// ==========================================================

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


// ==========================================================
// MONEY
// ==========================================================

function money(value) {

  const number = Number(value || 0);

  return "R" + number.toFixed(2);
}


// ==========================================================
// START
// ==========================================================

async function initDashboard() {

  console.log("FUNDA DASHBOARD STARTING");

  try {

    // ------------------------------------------------------
    // CHECK LOGIN
    // ------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } = await db.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const session = sessionData.session;

    if (!session) {

      console.log("No active session.");

      window.location.href = "login.html";

      return;
    }


    // ------------------------------------------------------
    // GET USER
    // ------------------------------------------------------

    const {
      data: userData,
      error: userError
    } = await db.auth.getUser();

    if (userError) {
      throw userError;
    }

    const user = userData.user;

    if (!user) {

      window.location.href = "login.html";

      return;
    }


    console.log("Logged in user:", user.id);
    console.log("Email:", user.email);


    // ------------------------------------------------------
    // SHOW EMAIL
    // ------------------------------------------------------

    if (userEmailEl) {

      userEmailEl.textContent =
        user.email || "";

    }


    // ------------------------------------------------------
    // LOAD STUDENT
    // ------------------------------------------------------

    const {
      data: students,
      error: studentError
    } = await db
      .from("students")
      .select("id, user_id, full_name, email")
      .eq("user_id", user.id)
      .limit(1);

    if (studentError) {

      console.error(
        "STUDENT ERROR:",
        studentError
      );

      throw studentError;
    }


    const student =
      students && students.length
        ? students[0]
        : null;


    // ------------------------------------------------------
    // STUDENT NOT FOUND
    // ------------------------------------------------------

    if (!student) {

      if (userNameEl) {
        userNameEl.textContent = "Student";
      }

      showMessage(
        "Your student profile could not be found. Please complete your registration first."
      );

      renderEmpty(
        enrolmentsEl,
        "No student profile found."
      );

      renderEmpty(
        coursesEl,
        "Courses cannot be loaded until your student profile is created."
      );

      return;
    }


    // ------------------------------------------------------
    // SHOW STUDENT NAME
    // ------------------------------------------------------

    if (userNameEl) {

      const firstName =
        (student.full_name || "Student")
          .trim()
          .split(/\s+/)[0];

      userNameEl.textContent =
        firstName || "Student";
    }


    console.log(
      "Student record:",
      student
    );


    // ------------------------------------------------------
    // LOAD COURSES
    // ------------------------------------------------------

    const {
      data: courses,
      error: courseError
    } = await db
      .from("courses")
      .select("id, title, price, active")
      .eq("active", true)
      .order("title", { ascending: true });


    if (courseError) {

      console.error(
        "COURSE ERROR:",
        courseError
      );

      throw courseError;
    }


    console.log(
      "Courses loaded:",
      courses
    );


    // ------------------------------------------------------
    // LOAD ENROLMENTS
    // ------------------------------------------------------

    const {
      data: enrolments,
      error: enrolmentError
    } = await db
      .from("enrollments")
      .select(
        "id, student_id, course_id, enrollment_status, enrolled_at"
      )
      .eq("student_id", student.id)
      .order("enrolled_at", {
        ascending: false
      });


    if (enrolmentError) {

      console.error(
        "ENROLMENT ERROR:",
        enrolmentError
      );

      throw enrolmentError;
    }


    console.log(
      "Enrolments loaded:",
      enrolments
    );


    // ------------------------------------------------------
    // DISPLAY
    // ------------------------------------------------------

    renderEnrolments(
      enrolments || [],
      courses || []
    );


    renderCourses(
      courses || [],
      enrolments || []
    );


    // ------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------

    console.log(
      "FUNDA DASHBOARD LOADED SUCCESSFULLY"
    );


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );


    const errorText =
      error?.message ||
      error?.error_description ||
      "Unable to load the student dashboard.";


    showMessage(
      "Dashboard error: " + errorText
    );


    renderEmpty(
      enrolmentsEl,
      "Unable to load enrolments."
    );


    renderEmpty(
      coursesEl,
      "Unable to load courses."
    );

  }

}


// ==========================================================
// EMPTY STATE
// ==========================================================

function renderEmpty(element, text) {

  if (!element) return;

  element.innerHTML = `
    <div class="card">
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}


// ==========================================================
// RENDER ENROLMENTS
// ==========================================================

function renderEnrolments(
  enrolments,
  courses
) {

  if (!enrolmentsEl) return;


  if (!enrolments.length) {

    renderEmpty(
      enrolmentsEl,
      "You have not enrolled in any courses yet."
    );

    return;
  }


  const courseMap = {};

  courses.forEach(course => {

    courseMap[course.id] = course;

  });


  enrolmentsEl.innerHTML =
    enrolments.map(enrolment => {

      const course =
        courseMap[enrolment.course_id];


      const title =
        course?.title ||
        "Course";


      const price =
        course?.price;


      const status =
        enrolment.enrollment_status ||
        "pending";


      const date =
        enrolment.enrolled_at
          ? new Date(
              enrolment.enrolled_at
            ).toLocaleDateString()
          : "";


      return `
        <div class="card">

          <h3>
            ${escapeHtml(title)}
          </h3>

          ${
            price !== undefined
              ? `<p><strong>Course fee:</strong> ${money(price)}</p>`
              : ""
          }

          <p>
            <strong>Status:</strong>
            ${escapeHtml(status)}
          </p>

          ${
            date
              ? `<p><strong>Enrolled:</strong> ${escapeHtml(date)}</p>`
              : ""
          }

          <div style="margin-top:15px;">

            ${
              status === "pending"
                ? `
                  <span class="badge">
                    PENDING APPROVAL
                  </span>
                `
                : `
                  <span class="badge">
                    ${escapeHtml(status.toUpperCase())}
                  </span>
                `
            }

          </div>

        </div>
      `;

    }).join("");

}


// ==========================================================
// RENDER AVAILABLE COURSES
// ==========================================================

function renderCourses(
  courses,
  enrolments
) {

  if (!coursesEl) return;


  if (!courses.length) {

    renderEmpty(
      coursesEl,
      "There are no active courses available at the moment."
    );

    return;
  }


  const enrolledIds =
    new Set(
      enrolments.map(
        item => item.course_id
      )
    );


  coursesEl.innerHTML =
    courses.map(course => {

      const alreadyEnrolled =
        enrolledIds.has(course.id);


      return `
        <div class="card">

          <h3>
            ${escapeHtml(course.title)}
          </h3>

          <p>
            <strong>Course fee:</strong>
            ${money(course.price)}
          </p>

          ${
            alreadyEnrolled
              ? `
                <button
                  class="btn ghost"
                  type="button"
                  disabled
                >
                  Already Enrolled
                </button>
              `
              : `
                <button
                  class="btn green enrol-btn"
                  type="button"
                  data-course-id="${escapeHtml(course.id)}"
                >
                  Enrol Now
                </button>
              `
          }

        </div>
      `;

    }).join("");


  // --------------------------------------------------------
  // ENROL BUTTONS
  // --------------------------------------------------------

  document
    .querySelectorAll(".enrol-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async function () {

          const courseId =
            this.dataset.courseId;

          await enrolInCourse(
            courseId,
            this
          );

        }
      );

    });

}


// ==========================================================
// ENROL IN COURSE
// ==========================================================

async function enrolInCourse(
  courseId,
  button
) {

  try {

    button.disabled = true;

    button.textContent =
      "Enrolling…";


    // ------------------------------------------------------
    // CURRENT USER
    // ------------------------------------------------------

    const {
      data: userData,
      error: userError
    } = await db.auth.getUser();


    if (userError) {
      throw userError;
    }


    const user =
      userData.user;


    if (!user) {

      window.location.href =
        "login.html";

      return;
    }


    // ------------------------------------------------------
    // STUDENT
    // ------------------------------------------------------

    const {
      data: students,
      error: studentError
    } = await db
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);


    if (studentError) {
      throw studentError;
    }


    if (!students || !students.length) {

      throw new Error(
        "Student profile not found."
      );

    }


    const studentId =
      students[0].id;


    // ------------------------------------------------------
    // CHECK EXISTING ENROLMENT
    // ------------------------------------------------------

    const {
      data: existing,
      error: existingError
    } = await db
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .limit(1);


    if (existingError) {
      throw existingError;
    }


    if (existing && existing.length) {

      showMessage(
        "You are already enrolled in this course."
      );

      button.disabled = true;

      button.textContent =
        "Already Enrolled";

      return;
    }


    // ------------------------------------------------------
    // CREATE ENROLMENT
    // ------------------------------------------------------

    const {
      error: insertError
    } = await db
      .from("enrollments")
      .insert({

        student_id:
          studentId,

        course_id:
          courseId,

        enrollment_status:
          "pending"

      });


    if (insertError) {
      throw insertError;
    }


    // ------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------

    showMessage(
      "Course enrolment submitted successfully. Your enrolment is pending approval.",
      true
    );


    button.disabled = true;

    button.textContent =
      "Enrolled";


    // Reload dashboard

    setTimeout(
      () => {
        initDashboard();
      },
      800
    );


  } catch (error) {

    console.error(
      "ENROLMENT ERROR:",
      error
    );


    showMessage(
      "Unable to enrol: " +
      (
        error?.message ||
        "Please try again."
      )
    );


    button.disabled = false;

    button.textContent =
      "Enrol Now";

  }

}


// ==========================================================
// LOGOUT
// ==========================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      try {

        logoutBtn.disabled = true;

        logoutBtn.textContent =
          "Logging out…";


        const {
          error
        } = await db.auth.signOut();


        if (error) {
          throw error;
        }


        window.location.href =
          "login.html";


      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );


        logoutBtn.disabled = false;

        logoutBtn.textContent =
          "Logout";


        showMessage(
          "Unable to log out. Please try again."
        );

      }

    }
  );

}


// ==========================================================
// AUTH STATE
// ==========================================================

db.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );


    if (
      event === "SIGNED_OUT" ||
      !session
    ) {

      window.location.href =
        "login.html";

    }

  }
);


// ==========================================================
// START DASHBOARD
// ==========================================================

initDashboard(); 
