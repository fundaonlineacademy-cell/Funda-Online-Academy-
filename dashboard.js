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

const userEmailEl = document.getElementById("user-email");
const userNameEl = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout");
const enrolmentsEl = document.getElementById("enrolments");
const coursesEl = document.getElementById("available-courses");
const paymentListEl = document.getElementById("payment-list");
const messageEl = document.getElementById("message");


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text, success = false) {

  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.classList.remove("hidden");

  if (success) {
    messageEl.style.background = "#e8f5e9";
    messageEl.style.color = "#166534";
  } else {
    messageEl.style.background = "#fef2f2";
    messageEl.style.color = "#991b1b";
  }
}


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

    console.error("AUTH ERROR:", error);

    showMessage(
      "We could not verify your login. Please log in again."
    );

    return null;
  }

  return data.user || null;
}


// ==========================================
// GET STUDENT RECORD
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

    console.error("STUDENT ERROR:", error);

    return null;
  }

  return data;
}


// ==========================================
// LOAD STUDENT DETAILS
// ==========================================

async function loadStudentDetails(user) {

  if (userEmailEl) {
    userEmailEl.textContent = user.email || "";
  }

  const student = await getStudent(user.id);

  if (student) {

    if (userNameEl) {
      userNameEl.textContent =
        student.full_name || "Student";
    }

    return student;
  }

  const metadata = user.user_metadata || {};

  if (userNameEl) {

    userNameEl.textContent =
      metadata.full_name ||
      metadata.name ||
      "Student";
  }

  return null;
}


// ==========================================
// LOAD ENROLMENTS
// ==========================================

async function loadEnrolments(user, student) {

  if (!enrolmentsEl) return;

  enrolmentsEl.innerHTML =
    '<p class="loading">Loading...</p>';

  if (!student) {

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>Student profile not found</h3>
        <p>
          Your login was successful, but your student
          profile could not be found.
        </p>
      </div>
    `;

    return;
  }


  console.log(
    "Loading enrolments for student:",
    student.id
  );


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
      "ENROLMENTS ERROR:",
      error
    );

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>Could not load your enrolments</h3>
        <p>
          ${escapeHTML(error.message)}
        </p>
      </div>
    `;

    return;
  }


  console.log(
    "Enrolments found:",
    enrolments
  );


  if (!enrolments || enrolments.length === 0) {

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>No enrolments yet</h3>
        <p>
          Choose a course below to request enrolment.
        </p>
      </div>
    `;

    return;
  }


  // ----------------------------------------
  // GET COURSE INFORMATION
  // ----------------------------------------

  const courseIds = enrolments.map(function(item) {
    return item.course_id;
  });


  const {
    data: courses,
    error: coursesError
  } = await db
    .from("courses")
    .select(
      "id, title, description, duration, price"
    )
    .in(
      "id",
      courseIds
    );


  if (coursesError) {

    console.error(
      "ENROLMENT COURSES ERROR:",
      coursesError
    );

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>Could not load course information</h3>
        <p>
          ${escapeHTML(coursesError.message)}
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
        (courses || []).find(function(item) {

          return item.id === enrolment.course_id;

        });


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
              course.duration || "Flexible"
            )}
          </p>

          <p>
            <strong>Status:</strong>
            <span>
              ${escapeHTML(status)}
            </span>
          </p>

        </div>
      `;

    }).join("");
}


// ==========================================
// LOAD AVAILABLE COURSES
// ==========================================

async function loadCourses(user, student) {

  if (!coursesEl) return;

  coursesEl.innerHTML =
    '<p class="loading">Loading...</p>';


  console.log("Loading active courses...");


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


  console.log(
    "Courses found:",
    courses
  );


  if (!courses || courses.length === 0) {

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
  // FIND ALREADY ENROLLED COURSES
  // ----------------------------------------

  let enrolledCourseIds = [];


  if (student) {

    const {
      data: enrolments,
      error: enrolmentError
    } = await db
      .from("enrollments")
      .select(
        "course_id"
      )
      .eq(
        "student_id",
        student.id
      );


    if (enrolmentError) {

      console.error(
        "ENROLMENT CHECK ERROR:",
        enrolmentError
      );

    } else {

      enrolledCourseIds =
        (enrolments || []).map(function(item) {

          return item.course_id;

        });
    }
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

          ${
            course.image_url
              ? `
                <img
                  src="${escapeHTML(course.image_url)}"
                  alt="${escapeHTML(course.title)}"
                  style="
                    width:100%;
                    max-height:220px;
                    object-fit:cover;
                    border-radius:12px;
                    margin-bottom:15px;
                  "
                >
              `
              : ""
          }

          <h3>
            ${escapeHTML(course.title)}
          </h3>

          <hr>

          <p>
            ${
              escapeHTML(
                course.description ||
                "Online short course from Funda Online Academy."
              )
            }
          </p>

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            margin:20px 0;
          ">

            <strong style="
              color:#2f9e1c;
              font-size:1.4rem;
            ">
              R${price}
            </strong>

            <span style="
              color:#666;
              font-weight:600;
            ">
              ${escapeHTML(
                course.duration || "Flexible"
              )}
            </span>

          </div>

          ${
            alreadyEnrolled

              ? `
                <button
                  class="btn ghost"
                  disabled
                  style="width:100%;"
                >
                  Already Enrolled
                </button>
              `

              : `
                <button
                  class="btn green enrol-btn"
                  data-course-id="${escapeHTML(course.id)}"
                  data-course-title="${escapeHTML(course.title)}"
                  style="width:100%;"
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

  const buttons =
    coursesEl.querySelectorAll(
      ".enrol-btn"
    );


  buttons.forEach(function(button) {

    button.addEventListener(
      "click",
      async function() {

        if (!student) {

          alert(
            "Your student profile could not be found."
          );

          return;
        }


        const courseId =
          button.dataset.courseId;

        const courseTitle =
          button.dataset.courseTitle;


        await requestEnrolment(
          student,
          courseId,
          courseTitle,
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

  button.disabled = true;

  button.textContent =
    "Requesting...";


  // ----------------------------------------
  // CHECK EXISTING ENROLMENT
  // ----------------------------------------

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

    console.error(
      "ENROLMENT CHECK ERROR:",
      checkError
    );

    alert(
      "We could not check your enrolment."
    );

    button.disabled = false;
    button.textContent = "Enrol Now";

    return;
  }


  if (existing) {

    button.textContent =
      "Already Enrolled";

    return;
  }


  // ----------------------------------------
  // CREATE ENROLMENT
  // ----------------------------------------

  const {
    error: insertError
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


  if (insertError) {

    console.error(
      "ENROLMENT INSERT ERROR:",
      insertError
    );

    alert(
      "Your enrolment could not be submitted.\n\n" +
      insertError.message
    );

    button.disabled = false;
    button.textContent = "Enrol Now";

    return;
  }


  alert(
    "Your enrolment request for " +
    courseTitle +
    " was submitted successfully."
  );


  button.textContent =
    "Enrolment Requested";

  button.disabled = true;


  // Refresh the enrolments
  const user =
    await getCurrentUser();

  if (user) {

    await loadEnrolments(
      user,
      student
    );
  }
}


// ==========================================
// LOAD PAYMENTS
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
        after your enrolment has been processed.
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
        "Logging out...";


      const {
        error
      } = await db.auth.signOut();


      if (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

        alert(
          "Could not log out. Please try again."
        );

        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";

        return;
      }


      window.location.href =
        "login.html";

    }
  );
}


// ==========================================
// INITIALISE DASHBOARD
// ==========================================

async function initDashboard() {

  console.log(
    "================================"
  );

  console.log(
    "FUNDA STUDENT DASHBOARD STARTING"
  );

  console.log(
    "================================"
  );


  try {

    // --------------------------------------
    // CHECK LOGIN
    // --------------------------------------

    const user =
      await getCurrentUser();


    if (!user) {

      window.location.href =
        "login.html";

      return;
    }


    console.log(
      "Logged in user:",
      user.id
    );


    // --------------------------------------
    // STUDENT DETAILS
    // --------------------------------------

    const student =
      await loadStudentDetails(
        user
      );


    console.log(
      "Student record:",
      student
    );


    // --------------------------------------
    // LOAD ENROLMENTS
    // --------------------------------------

    await loadEnrolments(
      user,
      student
    );


    // --------------------------------------
    // LOAD COURSES
    // --------------------------------------

    await loadCourses(
      user,
      student
    );


    // --------------------------------------
    // LOAD PAYMENTS
    // --------------------------------------

    loadPayments();


    console.log(
      "DASHBOARD LOADED SUCCESSFULLY"
    );


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );


    if (enrolmentsEl) {

      enrolmentsEl.innerHTML = `
        <div class="card">

          <h3>
            Dashboard error
          </h3>

          <p>
            ${escapeHTML(
              error.message ||
              "Something went wrong."
            )}
          </p>

        </div>
      `;
    }


    if (coursesEl) {

      coursesEl.innerHTML = `
        <div class="card">

          <h3>
            Dashboard error
          </h3>

          <p>
            ${escapeHTML(
              error.message ||
              "Something went wrong."
            )}
          </p>

        </div>
      `;
    }


    showMessage(
      "Something went wrong while loading your dashboard."
    );
  }
}


// ==========================================
// START DASHBOARD
// ==========================================

initDashboard();
