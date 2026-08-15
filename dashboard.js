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
// TIMEOUT HELPER
// ==========================================

function withTimeout(promise, milliseconds = 10000) {

  return Promise.race([

    promise,

    new Promise(function(resolve, reject) {

      setTimeout(function() {

        reject(
          new Error(
            "The database request took too long. Please refresh the page."
          )
        );

      }, milliseconds);

    })

  ]);
}


// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {

  try {

    const result =
      await withTimeout(
        db.auth.getUser(),
        10000
      );

    if (result.error) {

      console.error(
        "AUTH ERROR:",
        result.error
      );

      return null;
    }

    return result.data.user || null;

  } catch (error) {

    console.error(
      "AUTH TIMEOUT/ERROR:",
      error
    );

    return null;
  }
}


// ==========================================
// GET STUDENT RECORD
// ==========================================

async function getStudent(userId) {

  try {

    const result =
      await withTimeout(

        db
          .from("students")
          .select(
            "id, user_id, full_name, gender, south_african_id, email, mobile_whatsapp"
          )
          .eq("user_id", userId)
          .maybeSingle(),

        10000
      );


    if (result.error) {

      console.error(
        "STUDENT ERROR:",
        result.error
      );

      return null;
    }


    return result.data || null;

  } catch (error) {

    console.error(
      "STUDENT TIMEOUT/ERROR:",
      error
    );

    return null;
  }
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


  // ----------------------------------------
  // FALLBACK TO AUTH METADATA
  // ----------------------------------------

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


  try {

    const result =
      await withTimeout(

        db
          .from("courses")
          .select(
            "id, title, slug, description, duration, price, active"
          )
          .eq("active", true)
          .order("title", {
            ascending: true
          }),

        10000
      );


    if (result.error) {

      throw result.error;
    }


    const courses =
      result.data || [];


    if (courses.length === 0) {

      coursesEl.innerHTML = `
        <div class="card">

          <h3>No courses available</h3>

          <p>
            There are currently no active courses available.
          </p>

        </div>
      `;

      return;
    }


    // --------------------------------------
    // FIND STUDENT'S ENROLLED COURSES
    // --------------------------------------

    let enrolledCourseIds = [];


    if (student) {

      try {

        const enrolmentResult =
          await withTimeout(

            db
              .from("enrollments")
              .select(
                "id, course_id, enrollment_status"
              )
              .eq(
                "student_id",
                student.id
              ),

            10000
          );


        if (!enrolmentResult.error) {

          enrolledCourseIds =
            (enrolmentResult.data || [])
              .map(function(item) {

                return item.course_id;

              });
        }

      } catch (error) {

        console.error(
          "ENROLMENT CHECK ERROR:",
          error
        );
      }
    }


    // --------------------------------------
    // DISPLAY COURSES
    // --------------------------------------

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


    // --------------------------------------
    // ENROL BUTTONS
    // --------------------------------------

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


  } catch (error) {

    console.error(
      "COURSES LOAD ERROR:",
      error
    );


    coursesEl.innerHTML = `
      <div class="card">

        <h3>
          Could not load courses
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


  try {

    // --------------------------------------
    // CHECK EXISTING ENROLMENT
    // --------------------------------------

    const checkResult =
      await withTimeout(

        db
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
          .maybeSingle(),

        10000
      );


    if (checkResult.error) {

      throw checkResult.error;
    }


    if (checkResult.data) {

      button.textContent =
        "Already Enrolled";

      return;
    }


    // --------------------------------------
    // CREATE ENROLMENT
    // --------------------------------------

    const insertResult =
      await withTimeout(

        db
          .from("enrollments")
          .insert({

            student_id:
              student.id,

            course_id:
              courseId,

            enrollment_status:
              "pending"

          }),

        10000
      );


    if (insertResult.error) {

      throw insertResult.error;
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


  } catch (error) {

    console.error(
      "ENROLMENT ERROR:",
      error
    );


    alert(
      error.message ||
      "Your enrolment could not be submitted. Please try again."
    );


    button.disabled = false;

    button.textContent =
      "Enrol Now";
  }
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

        <h3>
          Student profile not found
        </h3>

        <p>
          Please log out and register again.
        </p>

      </div>
    `;

    return;
  }


  try {

    // --------------------------------------
    // GET ENROLMENTS
    // --------------------------------------

    const enrolmentResult =
      await withTimeout(

        db
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
          ),

        10000
      );


    if (enrolmentResult.error) {

      throw enrolmentResult.error;
    }


    const enrolments =
      enrolmentResult.data || [];


    if (enrolments.length === 0) {

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


    // --------------------------------------
    // GET COURSE DETAILS
    // --------------------------------------

    const courseIds =
      enrolments.map(function(item) {

        return item.course_id;

      });


    const courseResult =
      await withTimeout(

        db
          .from("courses")
          .select(
            "id, title, description, duration, price"
          )
          .in(
            "id",
            courseIds
          ),

        10000
      );


    if (courseResult.error) {

      throw courseResult.error;
    }


    const courses =
      courseResult.data || [];


    // --------------------------------------
    // DISPLAY ENROLMENTS
    // --------------------------------------

    enrolmentsEl.innerHTML =
      enrolments.map(function(enrolment) {

        const course =
          courses.find(
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

          </div>
        `;

      }).join("");


  } catch (error) {

    console.error(
      "ENROLMENTS LOAD ERROR:",
      error
    );


    enrolmentsEl.innerHTML = `
      <div class="card">

        <h3>
          Could not load your enrolments
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


// ==========================================
// PAYMENTS
// ==========================================

function loadPayments() {

  if (!paymentListEl) return;


  /*
    IMPORTANT:

    The payment section is already working
    on your website.

    We are deliberately NOT changing the
    payment form here.

    The payment table and payment policies
    have already been configured in Supabase.
  */


  // If another payment system has already
  // inserted content into this area, leave it.

  if (
    paymentListEl.innerHTML.trim() === ""
  ) {

    paymentListEl.innerHTML = `
      <div class="card">

        <h3>
          Course Payments
        </h3>

        <p>
          Your payment information will
          appear here after your enrolment
          has been processed.
        </p>

      </div>
    `;
  }
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


      try {

        const result =
          await withTimeout(
            db.auth.signOut(),
            10000
          );


        if (result.error) {

          throw result.error;
        }


        window.location.href =
          "login.html";


      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );


        alert(
          error.message ||
          "Could not log out. Please try again."
        );


        logoutBtn.disabled = false;

        logoutBtn.textContent =
          "Logout";
      }

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
    // SHOW EMAIL IMMEDIATELY
    // --------------------------------------

    if (userEmailEl) {

      userEmailEl.textContent =
        user.email || "";
    }


    // --------------------------------------
    // LOAD STUDENT
    // --------------------------------------

    const student =
      await loadStudentDetails(
        user
      );


    // --------------------------------------
    // LOAD ENROLMENTS AND COURSES
    // --------------------------------------
    //
    // These run independently.
    // One failure will no longer leave
    // both sections stuck on Loading...
    //

    await Promise.allSettled([

      loadEnrolments(
        user,
        student
      ),

      loadCourses(
        user,
        student
      )

    ]);


    // --------------------------------------
    // PAYMENTS
    // --------------------------------------

    loadPayments();


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );


    showMessage(
      error.message ||
      "Something went wrong while loading your dashboard."
    );
  }
}


// ==========================================
// START DASH
