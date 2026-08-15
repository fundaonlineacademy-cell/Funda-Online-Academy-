// ==========================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COURSES • ENROLMENTS • PAYMENTS • LOGOUT
// ==========================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ==========================================
// PAGE ELEMENTS
// ==========================================

const userEmailEl =
  document.getElementById("user-email");

const userNameEl =
  document.getElementById("user-name");

const logoutBtn =
  document.getElementById("logout");

const enrolmentsEl =
  document.getElementById("enrolments");

const coursesEl =
  document.getElementById("available-courses");

const paymentListEl =
  document.getElementById("payment-list");


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

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


// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {

  const {
    data,
    error
  } = await db.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user || null;
}


// ==========================================
// GET STUDENT
// ==========================================

async function getStudent(userId) {

  const {
    data,
    error
  } = await db
    .from("students")
    .select(
      "id, user_id, full_name, gender, south_african_id, email, mobile_whatsapp"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


// ==========================================
// LOAD STUDENT DETAILS
// ==========================================

async function loadStudentDetails(user) {

  if (userEmailEl) {
    userEmailEl.textContent =
      user.email || "";
  }

  const student =
    await getStudent(user.id);

  if (student && userNameEl) {

    userNameEl.textContent =
      student.full_name ||
      "Student";

  }

  return student;
}


// ==========================================
// LOAD ENROLMENTS
// ==========================================

async function loadEnrolments(student) {

  if (!enrolmentsEl) return;

  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';


  if (!student) {

    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>Student profile not found</h3>

        <p>
          Your student profile could not be found.
        </p>

      </div>
    `;

    return;
  }


  const {
    data: enrolments,
    error
  } = await db
    .from("enrollments")
    .select(
      "id, student_id, course_id, enrollment_status, enrolled_at"
    )
    .eq(
      "student_id",
      student.id
    )
    .order(
      "enrolled_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "ENROLLMENTS ERROR:",
      error
    );

    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>Could not load enrolments</h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

    return;
  }


  if (
    !enrolments ||
    enrolments.length === 0
  ) {

    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>No enrolments yet</h3>

        <p>
          Choose a course below to request
          enrolment.
        </p>

      </div>
    `;

    return;
  }


  // ----------------------------------------
  // GET COURSE DETAILS
  // ----------------------------------------

  const courseIds =
    enrolments.map(function(item) {

      return item.course_id;

    });


  const {
    data: courses,
    error: courseError
  } = await db
    .from("courses")
    .select(
      "id, title, description, duration, price"
    )
    .in(
      "id",
      courseIds
    );


  if (courseError) {

    console.error(
      "COURSE ERROR:",
      courseError
    );

    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>Could not load course information</h3>

        <p>
          ${escapeHTML(courseError.message)}
        </p>

      </div>
    `;

    return;
  }


  // ----------------------------------------
  // DISPLAY ENROLMENTS
  // ----------------------------------------

  enrolmentsEl.innerHTML =
    enrolments.map(function(enrolment) {

      const course =
        (courses || []).find(
          function(item) {

            return item.id ===
              enrolment.course_id;

          }
        );


      if (!course) {

        return `
          <div class="card">

            <h3>Course</h3>

            <p>
              Course information unavailable.
            </p>

          </div>
        `;

      }


      const price =
        Number(course.price || 0)
          .toLocaleString(
            "en-ZA",
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            }
          );


      const status =
        enrolment.enrollment_status ||
        "pending";


      return `
        <div class="card">

          <h3>
            ${escapeHTML(course.title)}
          </h3>

          <hr>

          <p>
            <strong>Price:</strong>
            R${price}
          </p>

          <p>
            <strong>Duration:</strong>
            ${escapeHTML(
              course.duration ||
              "Flexible"
            )}
          </p>

          <p>
            <strong>Status:</strong>
            ${escapeHTML(status)}
          </p>

          ${
            status.toLowerCase() === "pending"
              ? `
                <p style="
                  margin-top:15px;
                  color:#9a6700;
                  font-weight:600;
                ">
                  Your enrolment is awaiting
                  processing by Funda Online Academy.
                </p>
              `
              : ""
          }

        </div>
      `;

    }).join("");
}


// ==========================================
// LOAD AVAILABLE COURSES
// ==========================================

async function loadCourses(student) {

  if (!coursesEl) return;

  coursesEl.innerHTML =
    '<p class="loading">Loading courses…</p>';


  const {
    data: courses,
    error
  } = await db
    .from("courses")
    .select(
      "id, title, slug, description, duration, price, image_url, modules, active"
    )
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

    console.error(
      "COURSES ERROR:",
      error
    );

    coursesEl.innerHTML = `
      <div class="card">

        <h3>Could not load courses</h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

    return;
  }


  if (
    !courses ||
    courses.length === 0
  ) {

    coursesEl.innerHTML = `
      <div class="card">

        <h3>No courses available</h3>

        <p>
          There are currently no active courses.
        </p>

      </div>
    `;

    return;
  }


  // ----------------------------------------
  // GET EXISTING ENROLMENTS
  // ----------------------------------------

  let enrolledCourseIds = [];


  if (student) {

    const {
      data: enrolments
    } = await db
      .from("enrollments")
      .select("course_id")
      .eq(
        "student_id",
        student.id
      );


    enrolledCourseIds =
      (enrolments || [])
        .map(function(item) {

          return item.course_id;

        });

  }


  // ----------------------------------------
  // DISPLAY COURSES
  // ----------------------------------------

  coursesEl.innerHTML =
    courses.map(function(course) {

      const alreadyEnrolled =
        enrolledCourseIds.includes(
          course.id
        );


      const price =
        Number(course.price || 0)
          .toLocaleString(
            "en-ZA",
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            }
          );


      return `
        <div class="card">

          <h3>
            ${escapeHTML(course.title)}
          </h3>

          <hr>

          <p style="
            color:#2f9e1c;
            font-size:1.4rem;
            font-weight:700;
            margin:15px 0;
          ">
            R${price}
          </p>

          ${
            course.duration
              ? `
                <p>
                  <strong>Duration:</strong>
                  ${escapeHTML(course.duration)}
                </p>
              `
              : ""
          }

          ${
            course.description
              ? `
                <p style="margin-top:12px;">
                  ${escapeHTML(
                    course.description
                  )}
                </p>
              `
              : ""
          }

          ${
            alreadyEnrolled

              ? `
                <button
                  class="btn ghost"
                  disabled
                  style="
                    width:100%;
                    margin-top:18px;
                  "
                >
                  Already Enrolled
                </button>
              `

              : `
                <button
                  class="btn green enrol-btn"
                  data-course-id="${escapeHTML(course.id)}"
                  data-course-title="${escapeHTML(course.title)}"
                  style="
                    width:100%;
                    margin-top:18px;
                  "
                >
                  Enrol Now
                </button>
              `
          }

        </div>
      `;

    }).join("");


  // ----------------------------------------
  // ENROL BUTTONS
  // ----------------------------------------

  coursesEl
    .querySelectorAll(".enrol-btn")
    .forEach(function(button) {

      button.addEventListener(
        "click",
        async function() {

          await requestEnrolment(
            student,
            button.dataset.courseId,
            button.dataset.courseTitle,
            button
          );

        }
      );

    });
}


// ==========================================
// REQUEST ENROLMENT
// ==========================================

async function requestEnrolment(
  student,
  courseId,
  courseTitle,
  button
) {

  if (!student) {

    alert(
      "Your student profile could not be found."
    );

    return;
  }


  button.disabled = true;

  button.textContent =
    "Requesting…";


  const {
    data: existing,
    error: checkError
  } = await db
    .from("enrollments")
    .select("id")
    .eq(
      "student_id",
      student.id
    )
    .eq(
      "course_id",
      courseId
    )
    .maybeSingle();


  if (checkError) {

    alert(
      "Could not check enrolment: " +
      checkError.message
    );

    button.disabled = false;

    button.textContent =
      "Enrol Now";

    return;
  }


  if (existing) {

    button.textContent =
      "Already Enrolled";

    return;
  }


  const {
    error
  } = await db
    .from("enrollments")
    .insert({

      student_id:
        student.id,

      course_id:
        courseId,

      enrollment_status:
        "pending"

    });


  if (error) {

    alert(
      "Could not submit enrolment: " +
      error.message
    );

    button.disabled = false;

    button.textContent =
      "Enrol Now";

    return;
  }


  alert(
    "Your enrolment request for " +
    courseTitle +
    " has been submitted successfully."
  );


  await loadEnrolments(
    student
  );

  await loadCourses(
    student
  );

}


// ==========================================
// PAYMENTS
// ==========================================

function loadPayments() {

  if (!paymentListEl) return;


  paymentListEl.innerHTML = `
    <div class="card">

      <h3>
        Course Payments
      </h3>

      <p>
        Payment information will appear here
        after your course enrolment has been
        processed.
      </p>

      <p style="
        margin-top:12px;
        color:#666;
      ">
        Your payment status will be updated
        by Funda Online Academy.
      </p>

    </div>
  `;
}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function() {

      logoutBtn.disabled = true;

      logoutBtn.textContent =
        "Logging out…";


      const {
        error
      } = await db.auth.signOut();


      if (error) {

        alert(
          "Could not log out. Please try again."
        );

        logoutBtn.disabled = false;

        logoutBtn.textContent =
          "Logout";

        return;
      }


      window.location.href =
        "login.html";

    }
  );

}


// ==========================================
// START DASHBOARD
// ==========================================

async function initDashboard() {

  try {

    const user =
      await getCurrentUser();


    if (!user) {

      window.location.href =
        "login.html";

      return;
    }


    const student =
      await loadStudentDetails(
        user
      );


    await loadEnrolments(
      student
    );


    await loadCourses(
      student
    );


    loadPayments();


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );


    const message =
      error && error.message
        ? error.message
        : "Unknown error.";


    if (enrolmentsEl) {

      enrolmentsEl.innerHTML = `
        <div class="card">

          <h3>
            Dashboard error
          </h3>

          <p style="color:#991b1b;">
            ${escapeHTML(message)}
          </p>

        </div>
      `;

    }


    if (coursesEl) {

      coursesEl.innerHTML = `
        <div class="card">

          <h3>
            Courses could not be loaded
          </h3>

          <p style="color:#991b1b;">
            ${escapeHTML(message)}
          </p>

        </div>
      `;

    }

  }

}


initDashboard(); 
