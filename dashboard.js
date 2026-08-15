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

const messageEl =
  document.getElementById("message");


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

    console.error(
      "AUTH ERROR:",
      error
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

    console.error(
      "STUDENT ERROR:",
      error
    );

    return null;
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


  if (student) {

    if (userNameEl) {

      userNameEl.textContent =
        student.full_name ||
        "Student";
    }

    return student;
  }


  // Fallback to Supabase user metadata

  const metadata =
    user.user_metadata || {};


  if (userNameEl) {

    userNameEl.textContent =
      metadata.full_name ||
      metadata.name ||
      "Student";
  }


  return null;
}


// ==========================================
// LOAD COURSES
// ==========================================

async function loadCourses(user, student) {

  if (!coursesEl) return;


  coursesEl.innerHTML =
    '<p class="loading">Loading courses…</p>';


  // ----------------------------------------
  // GET ALL ACTIVE COURSES
  // ----------------------------------------

  const {
    data: courses,
    error: coursesError
  } = await db
    .from("courses")
    .select(
      "id, title, slug, description, duration, price, image_url, modules, active"
    )
    .eq("active", true)
    .order("title", {
      ascending: true
    });


  if (coursesError) {

    console.error(
      "COURSES ERROR:",
      coursesError
    );

    coursesEl.innerHTML = `
      <div class="card">
        <h3>Could not load courses.</h3>
        <p>${escapeHTML(
          coursesError.message ||
          "Please try again."
        )}</p>
      </div>
    `;

    return;
  }


  if (!courses || courses.length === 0) {

    coursesEl.innerHTML = `
      <div class="card">
        <h3>No courses available</h3>
        <p>There are currently no active courses available.</p>
      </div>
    `;

    return;
  }


  // ----------------------------------------
  // GET STUDENT'S EXISTING ENROLMENTS
  // ----------------------------------------

  let enrolledCourseIds = [];


  if (student) {

    const {
      data: enrolments,
      error: enrolmentError
    } = await db
      .from("enrollments")
      .select(
        "id, course_id, enrollment_status"
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
        (enrolments || [])
          .map(function(item) {

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


      const duration =
        course.duration ||
        "Flexible";


      return `
        <div class="card">

          <h3>
            ${escapeHTML(course.title)}
          </h3>

          <hr>

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
              ${escapeHTML(duration)}
            </span>

          </div>


          ${
            course.description
              ? `
                <p>
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
                    margin-top:15px;
                  "
                >
                  Already Enrolled
                </button>
              `

              : `
                <button
                  class="btn green enrol-btn"
                  data-course-id="${escapeHTML(
                    course.id
                  )}"
                  data-course-title="${escapeHTML(
                    course.title
                  )}"
                  style="
                    width:100%;
                    margin-top:15px;
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

  const buttons =
    coursesEl.querySelectorAll(
      ".enrol-btn"
    );


  buttons.forEach(function(button) {

    button.addEventListener(
      "click",
      async function() {

        const courseId =
          button.dataset.courseId;

        const courseTitle =
          button.dataset.courseTitle;


        await requestEnrolment(
          user,
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
  user,
  student,
  courseId,
  courseTitle,
  button
) {

  if (!student) {

    alert(
      "Your student profile could not be found. Please log out and register again."
    );

    return;
  }


  button.disabled = true;

  button.textContent =
    "Requesting…";


  // ----------------------------------------
  // CHECK AGAIN
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
      "We could not check your enrolment. Please try again."
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
      "Your enrolment could not be submitted. Please try again."
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


  button.textContent =
    "Enrolment Requested";

  button.disabled = true;


  await loadEnrolments(
    user,
    student
  );
}


// ==========================================
// LOAD ENROLMENTS
// ==========================================

async function loadEnrolments(
  user,
  student
) {

  if (!enrolmentsEl) return;


  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';


  if (!student) {

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>Student profile not found</h3>
        <p>
          Please log out and register again.
        </p>
      </div>
    `;

    return;
  }


  // ----------------------------------------
  // GET ENROLMENTS
  // ----------------------------------------

  const {
    data: enrolments,
    error
  } = await db
    .from("enrollments")
    .select(
      "id, course_id, enrollment_status, enrolled_at"
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
        <h3>Could not load your enrolments.</h3>
        <p>
          ${escapeHTML(
            error.message ||
            "Please try again."
          )}
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

        <h3>
          No enrolments yet
        </h3>

        <p>
          Choose a course below and request
          enrolment to see it here.
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
      "ENROLMENT COURSE ERROR:",
      coursesError
    );

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>Could not load your courses.</h3>
        <p>
          ${escapeHTML(
            coursesError.message ||
            "Please try again."
          )}
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

            <h3>
              Course
            </h3>

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
            ${escapeHTML(
              enrolment.enrollment_status ||
              "Pending"
            )}
          </p>

        </div>
      `;

    }).join("");
}


// ==========================================
// PAYMENTS
// ==========================================
//
// IMPORTANT:
// There is currently NO payments table in
// the database structure you provided.
//
// Therefore we DO NOT query a payments table.
// This prevents the dashboard from showing
// a database error.
//
// We will build the real payment system later.
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

        console.error(
          "LOGOUT ERROR:",
          error
        );

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
// INITIALISE DASHBOARD
// ==========================================

async function initDashboard() {

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


    // --------------------------------------
    // STUDENT DETAILS
    // --------------------------------------

    const student =
      await loadStudentDetails(
        user
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


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );

    showMessage(
      "Something went wrong while loading your dashboard."
    );

  }
}


// ==========================================
// START
// ==========================================

initDashboard(); 
