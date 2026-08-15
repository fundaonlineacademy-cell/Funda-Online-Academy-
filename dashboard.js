// ==========================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// STABLE VERSION
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
// HTML ESCAPE
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
// SHOW ERROR
// ==========================================

function showError(element, title, error) {

  if (!element) return;

  const text =
    error && error.message
      ? error.message
      : "Unknown error.";

  element.innerHTML = `
    <div class="card">

      <h3>${escapeHTML(title)}</h3>

      <p style="color:#991b1b;">
        ${escapeHTML(text)}
      </p>

    </div>
  `;
}


// ==========================================
// GET LOGGED-IN USER
// ==========================================

async function getCurrentUser() {

  console.log("1. Checking logged-in user...");

  const {
    data,
    error
  } = await db.auth.getUser();

  if (error) {

    console.error(
      "AUTH ERROR:",
      error
    );

    throw error;
  }

  if (!data || !data.user) {

    throw new Error(
      "No logged-in user was found."
    );
  }

  console.log(
    "2. Logged-in user:",
    data.user.email
  );

  return data.user;
}


// ==========================================
// GET STUDENT PROFILE
// ==========================================

async function getStudent(userId) {

  console.log(
    "3. Loading student profile..."
  );

  const {
    data,
    error
  } = await db
    .from("students")
    .select(
      "id, user_id, full_name, gender, south_african_id, email, mobile_whatsapp"
    )
    .eq(
      "user_id",
      userId
    )
    .maybeSingle();

  if (error) {

    console.error(
      "STUDENT PROFILE ERROR:",
      error
    );

    throw error;
  }

  if (!data) {

    throw new Error(
      "Your student profile could not be found."
    );
  }

  console.log(
    "4. Student profile found:",
    data.full_name
  );

  return data;
}


// ==========================================
// LOAD STUDENT INFORMATION
// ==========================================

async function loadStudentDetails(user) {

  if (userEmailEl) {

    userEmailEl.textContent =
      user.email || "";
  }

  const student =
    await getStudent(user.id);

  if (userNameEl) {

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

  if (!enrolmentsEl) return [];

  console.log(
    "5. Loading enrolments..."
  );

  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';

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

    showError(
      enrolmentsEl,
      "Could not load your enrolments",
      error
    );

    return [];
  }

  console.log(
    "6. Enrolments found:",
    enrolments
  );

  if (
    !enrolments ||
    enrolments.length === 0
  ) {

    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>No enrolments yet</h3>

        <p>
          You have not enrolled in a course yet.
        </p>

      </div>
    `;

    return [];
  }


  // ----------------------------------------
  // GET COURSE INFORMATION
  // ----------------------------------------

  const courseIds =
    enrolments.map(function(item) {

      return item.course_id;

    });


  console.log(
    "7. Loading enrolled course details..."
  );


  const {
    data: courses,
    error: coursesError
  } = await db
    .from("courses")
    .select(
      "id, title, description, duration, price, active"
    )
    .in(
      "id",
      courseIds
    );


  if (coursesError) {

    console.error(
      "ENROLLED COURSE ERROR:",
      coursesError
    );

    showError(
      enrolmentsEl,
      "Could not load your course information",
      coursesError
    );

    return enrolments;
  }


  console.log(
    "8. Enrolled courses found:",
    courses
  );


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
            <span>
              ${escapeHTML(status)}
            </span>
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


  return enrolments;
}


// ==========================================
// LOAD AVAILABLE COURSES
// ==========================================

async function loadCourses(student) {

  if (!coursesEl) return;

  console.log(
    "9. Loading available courses..."
  );

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
      "AVAILABLE COURSES ERROR:",
      error
    );

    showError(
      coursesEl,
      "Could not load available courses",
      error
    );

    return;
  }


  console.log(
    "10. Available courses found:",
    courses
  );


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
  // FIND COURSES ALREADY ENROLLED IN
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


    if (!enrolmentError) {

      enrolledCourseIds =
        (enrolments || [])
          .map(function(item) {

            return item.course_id;

          });

    } else {

      console.warn(
        "Could not check existing enrolments:",
        enrolmentError
      );

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
                  ${escapeHTML(course.description)}
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
                  data-course-title="${escape 
