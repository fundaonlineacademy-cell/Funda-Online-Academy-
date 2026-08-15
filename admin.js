// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
// Assessments • Results
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const msg = document.getElementById("message");

let courses = [];
let editingId = null;


// ============================================================
// MESSAGES
// ============================================================

function show(message, ok = false) {

  if (!msg) return;

  msg.textContent = message;

  msg.className =
    "message " + (ok ? "success" : "error");

}


// ============================================================
// ESCAPE HTML
// ============================================================

function esc(value) {

  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));

}


// ============================================================
// DATE
// ============================================================

function formatDate(date) {

  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

}


// ============================================================
// FIND ENROLMENT DATE
// Works even if database uses a different date column.
// ============================================================

function getEnrolmentDate(enrolment) {

  return (
    enrolment.enrolled_at ||
    enrolment.created_at ||
    enrolment.enrollment_date ||
    enrolment.date ||
    enrolment.submitted_at ||
    null
  );

}


// ============================================================
// FIND ENROLMENT STATUS
// ============================================================

function getEnrolmentStatus(enrolment) {

  return (
    enrolment.enrollment_status ||
    enrolment.status ||
    "pending"
  );

}


// ============================================================
// COURSE FORM
// ============================================================

function resetForm() {

  editingId = null;

  const form =
    document.getElementById("course-form");

  if (form) {
    form.reset();
  }

  const id =
    document.getElementById("course-id");

  if (id) {
    id.value = "";
  }

  const button =
    document.querySelector(
      "#course-form button[type='submit']"
    );

  if (button) {
    button.textContent = "Save Course";
  }

}


// ============================================================
// FILL COURSE FORM
// ============================================================

function fill(course) {

  editingId = course.id;

  const id =
    document.getElementById("course-id");

  const name =
    document.getElementById("course-name");

  const price =
    document.getElementById("course-price");

  const category =
    document.getElementById("course-category");

  const duration =
    document.getElementById("course-duration");

  const image =
    document.getElementById("course-image");

  const description =
    document.getElementById("course-description");

  const modules =
    document.getElementById("course-modules");


  if (id) {
    id.value = course.id;
  }

  if (name) {
    name.value =
      course.title ||
      course.name ||
      "";
  }

  if (price) {
    price.value =
      course.price || 0;
  }

  if (category) {
    category.value =
      course.category || "";
  }

  if (duration) {
    duration.value =
      course.duration || "";
  }

  if (image) {
    image.value =
      course.image_url || "";
  }

  if (description) {
    description.value =
      course.description || "";
  }

  if (modules) {

    modules.value =
      Array.isArray(course.modules)
        ? course.modules.join("\n")
        : "";

  }


  const button =
    document.querySelector(
      "#course-form button[type='submit']"
    );

  if (button) {
    button.textContent =
      "Update Course";
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ============================================================
// ADMIN INITIALISATION
// ============================================================

async function init() {

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY ||
    window.SUPABASE_URL.includes("PASTE_")
  ) {

    show(
      "Supabase is not connected. Please check supabase-config.js."
    );

    return;
  }


  const {
    data: { session },
    error: sessionError
  } =
    await db.auth.getSession();


  if (sessionError) {

    console.error(sessionError);

    show(sessionError.message);

    return;
  }


  if (!session) {

    window.location.href =
      "auth.html";

    return;
  }


  const adminEmail =
    document.getElementById(
      "admin-email"
    );

  if (adminEmail) {

    adminEmail.textContent =
      session.user.email || "";

  }


  // ==========================================================
  // CHECK ADMIN ROLE
  // ==========================================================

  const {
    data: profile,
    error: profileError
  } =
    await db
      .from("profiles")
      .select("role")
      .eq(
        "id",
        session.user.id
      )
      .maybeSingle();


  if (profileError) {

    console.error(profileError);

    show(profileError.message);

    return;
  }


  if (
    !profile ||
    profile.role !== "admin"
  ) {

    show(
      "This account is not authorised as an administrator."
    );

    setTimeout(() => {

      window.location.href =
        "dashboard.html";

    }, 1800);

    return;
  }


  // ==========================================================
  // LOAD DATA
  //
  // Courses are loaded first because enrolments and
  // assessments use course information.
  // ==========================================================

  await loadStudents();

  await loadCourses();

  await Promise.all([
    loadEnrolments(),
    loadPayments(),
    loadAssessments()
  ]);

}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

  const box =
    document.getElementById(
      "admin-students"
    );

  if (!box) return;


  box.innerHTML =
    "<p>Loading registered students...</p>";


  const {
    data,
    error
  } =
    await db
      .from("profiles")
      .select(`
        id,
        full_name,
        gender,
        id_number,
        email,
        phone,
        role,
        created_at
      `)
      .neq(
        "role",
        "admin"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Student loading error:",
      error
    );

    box.innerHTML = `
      <div class="admin-error">
        <strong>
          Could not load students.
        </strong>

        <br><br>

        ${esc(error.message)}
      </div>
    `;

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    box.innerHTML = `
      <div class="empty-state">

        <strong>
          No registered students yet.
        </strong>

        <p>
          Students will appear here after
          they create an account.
        </p>

      </div>
    `;

    return;
  }


  box.innerHTML = `

    <div class="student-list">

      ${data.map(student => {

        const name =
          student.full_name ||
          "Student";

        const gender =
          student.gender ||
          "Not provided";

        const idNumber =
          student.id_number ||
          "Not provided";

        const email =
          student.email ||
          "Not provided";

        const phone =
          student.phone ||
          "Not provided";


        return `

          <div class="student-card">

            <div class="student-card-header">

              <div class="student-avatar">
                🎓
              </div>

              <div>

                <h3>
                  ${esc(name)}
                </h3>

                <span class="student-role">
                  ${esc(
                    student.role ||
                    "student"
                  )}
                </span>

              </div>

            </div>


            <div class="student-details">

              <div class="student-detail">

                <span class="detail-label">
                  Gender
                </span>

                <strong>
                  ${esc(gender)}
                </strong>

              </div>


              <div class="student-detail sensitive">

                <span class="detail-label">
                  South African ID Number
                </span>

                <strong>
                  ${esc(idNumber)}
                </strong>

              </div>


              <div class="student-detail">

                <span class="detail-label">
                  Email
                </span>

                <strong>
                  ${esc(email)}
                </strong>

              </div>


              <div class="student-detail">

                <span class="detail-label">
                  WhatsApp / Mobile
                </span>

                <strong>
                  ${esc(phone)}
                </strong>

              </div>


              <div class="student-detail">

                <span class="detail-label">
                  Registered
                </span>

                <strong>
                  ${formatDate(
                    student.created_at
                  )}
                </strong>

              </div>

            </div>

          </div>

        `;

      }).join("")}

    </div>

  `;


  addStudentStyles();

}


// ============================================================
// STUDENT CSS
// ============================================================

function addStudentStyles() {

  if (
    document.getElementById(
      "student-mobile-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");

  style.id =
    "student-mobile-style";


  style.textContent = `

    .student-list {
      display: grid;
      gap: 18px;
      width: 100%;
    }

    .student-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 4px 14px rgba(0,0,0,.05);
    }

    .student-card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid #edf2f7;
    }

    .student-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f0fdf4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 25px;
      flex-shrink: 0;
    }

    .student-card h3 {
      margin: 0 0 5px;
      font-size: 19px;
      color: #0f172a;
    }

    .student-role {
      display: inline-block;
      background: #e8f5e9;
      color: #166534;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: bold;
      text-transform: capitalize;
    }

    .student-details {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .student-detail {
      padding: 11px 12px;
      background: #f8fafc;
      border-radius: 9px;
    }

    .detail-label {
      display: block;
      color: #64748b;
      font-size: 12px;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .student-detail strong {
      display: block;
      color: #0f172a;
      font-size: 14px;
      word-break: break-word;
    }

    .student-detail.sensitive {
      background: #fffaf0;
    }

    .empty-state {
      padding: 25px;
      text-align: center;
      color: #64748b;
    }

    .admin-error {
      padding: 18px;
      border-radius: 10px;
      background: #fef2f2;
      color: #991b1b;
      overflow-wrap: anywhere;
    }

    @media (min-width: 700px) {

      .student-details {
        grid-template-columns: 1fr 1fr;
      }

    }

  `;


  document.head.appendChild(style);

}


// ============================================================
// COURSES
// ============================================================

async function loadCourses() {

  const {
    data,
    error
  } =
    await db
      .from("courses")
      .select("*")
      .order("title");


  if (error) {

    console.error(error);

    show(error.message);

    return;
  }


  courses =
    data || [];


  const box =
    document.getElementById(
      "admin-courses"
    );


  if (!box) return;


  box.innerHTML =

    courses.map(course => `

      <div class="admin-row">

        <div>

          <strong>
            ${esc(
              course.title ||
              course.name ||
              "Course"
            )}
          </strong>

          <small>

            ${esc(
              course.category || ""
            )}

            · R${Number(
              course.price || 0
            ).toLocaleString("en-ZA")}

            · ${esc(
              course.duration || ""
            )}

          </small>

        </div>


        <div class="row-actions">

          <button
            type="button"
            class="btn small ghost"
            data-edit="${course.id}">
            Edit
          </button>


          <button
            type="button"
            class="btn small danger"
            data-delete="${course.id}">
            Delete
          </button>

        </div>

      </div>

    `).join("")

    || "<p>No courses available.</p>";


  box
    .querySelectorAll("[data-edit]")
    .forEach(button => {

      button.onclick = () => {

        const course =
          courses.find(
            c =>
              c.id ===
              button.dataset.edit
          );

        if (course) {
          fill(course);
        }

      };

    });


  box
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.onclick = () => {

        deleteCourse(
          button.dataset.delete
        );

      };

    });

}


// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

  const course =
    courses.find(
      c => c.id === id
    );


  if (!course) return;


  const courseName =
    course.title ||
    course.name ||
    "this course";


  if (
    !confirm(
      `Delete "${courseName}"?`
    )
  ) {
    return;
  }


  const {
    error
  } =
    await db
      .from("courses")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    show(error.message);

    return;
  }


  show(
    "Course deleted successfully.",
    true
  );


  await loadCourses();

}


// ============================================================
// SAVE COURSE
// ============================================================

const courseForm =
  document.getElementById(
    "course-form"
  );


if (courseForm) {

  courseForm.onsubmit =
    async event => {

      event.preventDefault();


      const title =
        document
          .getElementById(
            "course-name"
          )
          .value
          .trim();


      if (!title) {

        show(
          "Please enter a course name."
        );

        return;
      }


      const payload = {

        title: title,

        price:
          Number(
            document
              .getElementById(
                "course-price"
              )
              .value
          ) || 0,

        category:
          document
            .getElementById(
              "course-category"
            )
            .value
            .trim(),

        duration:
          document
            .getElementById(
              "course-duration"
            )
            .value
            .trim(),

        image_url:
          document
            .getElementById(
              "course-image"
            )
            .value
            .trim() || null,

        description:
          document
            .getElementById(
              "course-description"
            )
            .value
            .trim(),

        modules:
          document
            .getElementById(
              "course-modules"
            )
            .value
            .split("\n")
            .map(x => x.trim())
            .filter(Boolean),

        active: true,

        updated_at:
          new Date().toISOString()

      };


      let result;


      if (editingId) {

        result =
          await db
            .from("courses")
            .update(payload)
            .eq(
              "id",
              editingId
            );

      } else {

        result =
          await db
            .from("courses")
            .insert(payload);

      }


      if (result.error) {

        console.error(
          result.error
        );

        show(
          result.error.message
        );

        return;
      }


      show(
        editingId
          ? "Course updated successfully."
          : "Course added successfully.",
        true
      );


      resetForm();

      await loadCourses();

    };

}


// ============================================================
// NEW COURSE BUTTON
// ============================================================

const newCourse =
  document.getElementById(
    "new-course"
  );


if (newCourse) {

  newCourse.onclick =
    resetForm;

}


// ============================================================
// CANCEL EDIT
// ============================================================

const cancelEdit =
  document.getElementById(
    "cancel-edit"
  );


if (cancelEdit) {

  cancelEdit.onclick =
    resetForm;

}


// ============================================================
// ENROLMENTS
// IMPORTANT:
// We use select("*") because the database does NOT contain
// enrollments.created_at.
// ============================================================

async function loadEnrolments() {

  const box =
    document.getElementById(
      "admin-enrolments"
    );


  if (!box) return;


  box.innerHTML =
    "<p>Loading student enrolments...</p>";


  // ==========================================================
  // DO NOT REQUEST created_at DIRECTLY.
  // The previous error came from requesting a column that
  // does not exist in the enrollments table.
  // ==========================================================

  const {
    data: enrolments,
    error: enrolmentError
  } =
    await db
      .from("enrollments")
      .select("*");


  if (enrolmentError) {

    console.error(
      "Enrolment loading error:",
      enrolmentError
    );


    box.innerHTML = `
      <div class="admin-error">

        <strong>
          Could not load enrolments.
        </strong>

        <br><br>

        ${esc(
          enrolmentError.message
        )}

      </div>
    `;

    return;
  }


  if (
    !enrolments ||
    enrolments.length === 0
  ) {

    box.innerHTML = `
      <div class="empty-state">

        <strong>
          No student enrolments yet.
        </strong>

        <p>
          Student course requests will
          appear here.
        </p>

      </div>
    `;

    return;
  }


  // ==========================================================
  // COURSE LOOKUP
  // ==========================================================

  const courseIds = [
    ...new Set(
      enrolments
        .map(e => e.course_id)
        .filter(Boolean)
    )
  ];


  let courseData = [];


  if (courseIds.length > 0) {

    const {
      data,
      error
    } =
      await db
        .from("courses")
        .select(`
          id,
          title,
          price
        `)
        .in(
          "id",
          courseIds
        );


    if (!error) {

      courseData =
        data || [];

    } else {

      console.error(
        "Course lookup error:",
        error
      );

    }

  }


  const courseLookup = {};


  courseData.forEach(course => {

    courseLookup[
      course.id
    ] = course;

  });


  // ==========================================================
  // STUDENT LOOKUP
  // ==========================================================

  const studentIds = [
    ...new Set(
      enrolments
        .map(e => e.student_id)
        .filter(Boolean)
    )
  ];


  let studentData = [];


  if (studentIds.length > 0) {

    const {
      data,
      error
    } =
      await db
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone
        `)
        .in(
          "id",
          studentIds
        );


    if (!error) {

      studentData =
        data || [];

    } else {

      console.error(
        "Student lookup error:",
        error
      );

    }

  }


  const studentLookup = {};


  studentData.forEach(student => {

    studentLookup[
      student.id
    ] = student;

  });


  // ==========================================================
  // RESPONSIVE ENROLMENT DISPLAY
  // ==========================================================

  box.innerHTML = `

    <div class="enrolment-desktop">

      <div class="admin-table-wrapper">

        <table class="admin-table enrolment-table">

          <thead>

            <tr>

              <th>Student</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            ${enrolments.map(
              enrolment => {

                const course =
                  courseLookup[
                    enrolment.course_id
                  ] || {};


                const student =
                  studentLookup[
                    enrolment.student_id
                  ] || {};


                const studentName =
                  student.full_name ||
                  student.email ||
                  "Student";


                const courseName =
                  course.title ||
                  course.name ||
                  "Course";


                const amount =
                  enrolment.amount ??
                  course.price ??
                  0;


                const status =
                  getEnrolmentStatus(
                    enrolment
                  );


                const date =
                  getEnrolmentDate(
                    enrolment
                  );


                return `

                  <tr>

                    <td>
                      ${esc(
                        studentName
                      )}
                    </td>

                    <td>
                      ${esc(
                        courseName
                      )}
                    </td>

                    <td>
                      R${Number(
                        amount || 0
                      ).toLocaleString(
                        "en-ZA"
                      )}
                    </td>

                    <td>

                      <span
                        class="enrolment-status ${esc(
                          status
                        )}">

                        ${esc(status)}

                      </span>

                    </td>

                    <td>
                      ${formatDate(date)}
                    </td>

                    <td>

                      <select
                        class="status-select"
                        data-enrolment-status="${esc(
                          enrolment.id
                        )}">

                        <option
                          value="pending"
                          ${
                            status === "pending"
                              ? "selected"
                              : ""
                          }>
                          Pending
                        </option>

                        <option
                          value="approved"
                          ${
                            status === "approved"
                              ? "selected"
                              : ""
                          }>
                          Approved
                        </option>

                        <option
                          value="completed"
                          ${
                            status === "completed"
                              ? "selected"
                              : ""
                          }>
                          Completed
                        </option>

                        <option
                          value="cancelled"
                          ${
                            status === "cancelled"
                              ? "selected"
                              : ""
                          }>
                          Cancelled
                        </option>

                      </select>

                    </td>

                  </tr>

                `;

              }
            ).join("")}

          </tbody>

        </table>

      </div>

    </div>


    <div class="enrolment-mobile">

      ${enrolments.map(
        enrolment => {

          const course =
            courseLookup[
              enrolment.course_id
            ] || {};


          const student =
            studentLookup[
              enrolment.student_id
            ] || {};


          const studentName =
            student.full_name ||
            student.email ||
            "Student";


          const courseName =
            course.title ||
            course.name ||
            "Course";


          const amount =
            enrolment.amount ??
            course.price ??
            0;


          const status =
            getEnrolmentStatus(
              enrolment
            );


          const date =
            getEnrolmentDate(
              enrolment
            );


          return `

            <div class="enrolment-card">

              <div class="enrolment-card-header">

                <div>

                  <span class="mobile-label">
                    Student
                  </span>

                  <strong>
                    ${esc(studentName)}
                  </strong>

                </div>

                <span
                  class="enrolment-status ${esc(
                    status
                  )}">

                  ${esc(status)}

                </span>

              </div>


              <div class="enrolment-card-details">

                <div>

                  <span class="mobile-label">
                    Course
                  </span>

                  <strong>
                    ${esc(courseName)}
                  </strong>

                </div>


                <div>

                  <span class="mobile-label">
                    Amount
                  </span>

                  <strong>
                    R${Number(
                      amount || 0
                    ).toLocaleString(
                      "en-ZA"
                    )}
                  </strong>

                </div>


                <div>

                  <span class="mobile-label">
                    Date
                  </span>

                  <strong>
                    ${formatDate(date)}
                  </strong>

                </div>

              </div>


              <div class="enrolment-card-action">

                <label>
                  Update enrolment status
                </label>

                <select
                  class="status-select"
                  data-enrolment-status="${esc(
                    enrolment.id
                  )}">

                  <option
                    value="pending"
                    ${
                      status === "pending"
                        ? "selected"
                        : ""
                    }>
                    Pending
                  </option>

                  <option
                    value="approved"
                    ${
                      status === "approved"
                        ? "selected"
                        : ""
                    }>
                    Approved
                  </option>

                  <option
                    value="completed"
                    ${
                      status === "completed"
                        ? "selected"
                        : ""
                    }>
                    Completed
                  </option>

                  <option
                    value="cancelled"
                    ${
                      status === "cancelled"
                        ? "selected"
                        : ""
                    }>
                    Cancelled
                  </option>

                </select>

              </div>

            </div>

          `;

        }
      ).join("")}

    </div>

  `;


  // ==========================================================
  // STATUS UPDATE
  // ==========================================================

  box
    .querySelectorAll(
      "[data-enrolment-status]"
    )
    .forEach(select => {

      select.onchange =
        async () => {

          const enrolmentId =
            select.dataset.enrolmentStatus;


          const {
            error
          } =
            await db
              .from("enrollments")
              .update({

                enrollment_status:
                  select.value,

                status:
                  select.value

              })
              .eq(
                "id",
                enrolmentId
              );


          if (error) {

            // Some databases only have enrollment_status
            // and not status. Try the correct column alone.

            const retry =
              await db
                .from("enrollments")
                .update({
                  enrollment_status:
                    select.value
                })
                .eq(
                  "id",
                  enrolmentId
                );


            if (retry.error) {

              show(
                "Could not update enrolment: " +
                retry.error.message
              );

              return;
            }

          }


          show(
            "Enrolment status updated successfully.",
            true
          );


          await loadEnrolments();

        };

    });


  addEnrolmentStyles();

}


// ============================================================
// ENROLMENT CSS
// ============================================================

function addEnrolmentStyles() {

  if (
    document.getElementById(
      "enrolment-responsive-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");

  style.id =
    "enrolment-responsive-style";


  style.textContent = `

    .enrolment-desktop {
      width: 100%;
    }

    .enrolment-mobile {
      display: none;
    }

    .admin-table-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 720px;
    }

    .admin-table th,
    .admin-table td {
      padding: 14px 12px;
      text-align: left;
      vertical-align: middle;
      border-bottom: 1px solid #edf2f7;
    }

    .admin-table th {
      color: #0f172a;
      font-weight: 800;
      white-space: nowrap;
    }

    .admin-table td {
      color: #334155;
    }

    .status-select {
      min-width: 130px;
      padding: 9px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      font: inherit;
    }

    .enrolment-status {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 25px;
      font-size: 13px;
      font-weight: 800;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .enrolment-status.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .enrolment-status.approved {
      background: #dcfce7;
      color: #166534;
    }

    .enrolment-status.completed {
      background: #dbeafe;
      color: #1e40af;
    }

    .enrolment-status.cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .enrolment-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 15px;
      box-shadow: 0 4px 14px rgba(0,0,0,.05);
    }

    .enrolment-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 15px;
      margin-bottom: 15px;
      border-bottom: 1px solid #edf2f7;
    }

    .enrolment-card-header strong {
      display: block;
      font-size: 17px;
      color: #0f172a;
      word-break: break-word;
    }

    .mobile-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 5px;
    }

    .enrolment-card-details {
      display: grid;
      gap: 12px;
    }

    .enrolment-card-details > div {
      background: #f8fafc;
      padding: 11px 12px;
      border-radius: 9px;
    }

    .enrolment-card-details strong {
      color: #0f172a;
      word-break: break-word;
    }

    .enrolment-card-action {
      margin-top: 16px;
      padding-top: 15px;
      border-top: 1px solid #edf2f7;
    }

    .enrolment-card-action label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 7px;
    }

    .enrolment-card-action .status-select {
      width: 100%;
    }

    @media (max-width: 700px) {

      .enrolment-desktop {
        display: none;
      }

      .enrolment-mobile {
        display: block;
        width: 100%;
      }

    }

  `;


  document.head.appendChild(style);

}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  const box =
    document.getElementById(
      "admin-payments"
    );


  if (!box) return;


  box.innerHTML =
    "<p>Loading payment records...</p>";


  const {
    data: payments,
    error
  } =
    await db
      .from("payments")
      .select(`
        id,
        student_id,
        enrolment_id,
        amount,
        payment_method,
        status,
        proof_url,
        notes,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Payment loading error:",
      error
    );


    box.innerHTML = `
      <div class="admin-error">

        <strong>
          Could not load payments.
        </strong>

        <br><br>

        ${esc(
          error.message
        )}

      </div>
    `;

    return;
  }


  if (
    !payments ||
    payments.length === 0
  ) {

    box.innerHTML = `
      <div class="empty-state">
        <strong>
          No payment records yet.
        </strong>

        <p>
          Payment records will appear here
          when students submit payments.
        </p>
      </div>
    `;

    return;
  }


  // ==========================================================
  // STUDENT LOOKUP
  // ==========================================================

  const studentIds = [
    ...new Set(
      payments
        .map(p => p.student_id)
        .filter(Boolean)
    )
  ];


  let studentData = [];


  if (studentIds.length > 0) {

    const {
      data,
      error: studentError
    } =
      await db
        .from("profiles")
        .select(`
          id,
          full_name,
          email
        `)
        .in(
          "id",
          studentIds
        );


    if (!studentError) {

      studentData =
        data || [];

    }

  }


  const studentLookup = {};


  studentData.forEach(student => {

    studentLookup[
      student.id
    ] = student;

  });


  // ==========================================================
  // DESKTOP PAYMENT TABLE
  // ==========================================================

  box.innerHTML = `

    <div class="payment-desktop">

      <div class="admin-table-wrapper">

        <table class="admin-table payment-table">

          <thead>

            <tr>

              <th>Student</th>
              <th>Course Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Proof</th>
              <th>Date</th>

            </tr>

          </thead>

          <tbody>

            ${payments.map(
              payment => {

                const student =
                  studentLookup[
                    payment.student_id
                  ] || {};


                const studentName =
                  student.full_name ||
                  student.email ||
                  "Student";


                const status =
                  payment.status ||
                  "pending";


                return `

                  <tr>

                    <td>
                      ${esc(studentName)}
                    </td>

                    <td>
                      R${Number(
                        payment.amount || 0
                      ).toLocaleString(
                        "en-ZA"
                      )}
                    </td>

                    <td>
                      ${esc(
                        payment.payment_method ||
                        "Not provided"
                      )}
                    </td>

                    <td>

                      <span
                        class="payment-status ${esc(
                          status
                        )}">

                        ${esc(status)}

                      </span>

                    </td>

                    <td>

                      ${
                        payment.proof_url
                          ? `
                            <a
                              class="proof-link"
                              href="${esc(
                                payment.proof_url
                              )}"
                              target="_blank"
                              rel="noopener">

                              View Proof

                            </a>
                          `
                          : "No proof"
                      }

                    </td>

                    <td>
                      ${formatDate(
                        payment.created_at
                      )}
                    </td>

                  </tr>

                `;

              }
            ).join("")}

          </tbody>

        </table>

      </div>

    </div>


    <!-- =====================================================
         MOBILE PAYMENT CARDS
         ===================================================== -->

    <div class="payment-mobile">

      ${payments.map(
        payment => {

          const student =
            studentLookup[
              payment.student_id
            ] || {};


          const studentName =
            student.full_name ||
            student.email ||
            "Student";


          const status =
            payment.status ||
            "pending";


          return `

            <div class="payment-card">

              <div class="payment-card-header">

                <div>

                  <span class="mobile-label">
                    Student
                  </span>

                  <strong>
                    ${esc(studentName)}
                  </strong>

                </div>


                <span
                  class="payment-status ${esc(
                    status
                  )}">

                  ${esc(status)}

                </span>

              </div>


              <div class="payment-card-details">

                <div>

                  <span class="mobile-label">
                    Amount
                  </span>

                  <strong>
                    R${Number(
                      payment.amount || 0
                    ).toLocaleString(
                      "en-ZA"
                    )}
                  </strong>

                </div>


                <div>

                  <span class="mobile-label">
                    Method
                  </span>

                  <strong>
                    ${esc(
                      payment.payment_method ||
                      "Not provided"
                    )}
                  </strong>

                </div>


                <div>

                  <span class="mobile-label">
                    Date
                  </span>

                  <strong>
                    ${formatDate(
                      payment.created_at
                    )}
                  </strong>

                </div>

              </div>


              <div class="payment-proof">

                <span class="mobile-label">
                  Payment Proof
                </span>

                ${
                  payment.proof_url
                    ? `
                      <a
                        class="proof-link"
                        href="${esc(
                          payment.proof_url
                        )}"
                        target="_blank"
                        rel="noopener">

                        View Payment Proof

                      </a>
                    `
                    : `
                      <span>
                        No proof uploaded
                      </span>
                    `
                }

              </div>

            </div>

          `;

        }
      ).join("")}

    </div>

  `;


  addPaymentStyles();

}


// ============================================================
// PAYMENT CSS
// ============================================================

function addPaymentStyles() {

  if (
    document.getElementById(
      "payment-responsive-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");

  style.id =
    "payment-responsive-style";


  style.textContent = `

    .payment-desktop {
      width: 100%;
    }

    .payment-mobile {
      display: none;
    }

    .payment-status {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 25px;
      font-size: 13px;
      font-weight: 800;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .payment-status.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .payment-status.approved,
    .payment-status.paid,
    .payment-status.completed {
      background: #dcfce7;
      color: #166534;
    }

    .payment-status.failed,
    .payment-status.cancelled,
    .payment-status.rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .payment-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 15px;
      box-shadow: 0 4px 14px rgba(0,0,0,.05);
    }

    .payment-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding-bottom: 15px;
      margin-bottom: 15px;
      border-bottom: 1px solid #edf2f7;
    }

    .payment-card-header strong {
      display: block;
      color: #0f172a;
      font-size: 17px;
      word-break: break-word;
    }

    .payment-card-details {
      display: grid;
      gap: 12px;
    }

    .payment-card-details > div {
      background: #f8fafc;
      padding: 11px 12px;
      border-radius: 9px;
    }

    .payment-card-details strong {
      color: #0f172a;
      word-break: break-word;
    }

    .payment-proof {
      margin-top: 16px;
      padding-top: 15px;
      border-top: 1px solid #edf2f7;
    }

    .proof-link {
      color: #15803d;
      font-weight: 800;
      text-decoration: none;
    }

    .proof-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 700px) {

      .payment-desktop {
        display: none;
      }

      .payment-mobile {
        display: block;
        width: 100%;
      }

    }

  `;


  document.head.appendChild(style);

}


// ============================================================
// ASSESSMENTS
// ============================================================

async function loadAssessments() {

  const box =
    document.getElementById(
      "admin-results"
    );


  if (!box) return;


  box.innerHTML = `

    <div class="assessment-admin">

      <div class="assessment-admin-header">

        <div>

          <h3>
            Assessment Manager
          </h3>

          <p>
            Create assessments and manage
            student results.
          </p>

        </div>

        <button
          type="button"
          class="btn green"
          id="create-assessment-btn">

          + Create Assessment

        </button>

      </div>


      <div
        id="assessment-form-area"
        class="assessment-form-area hidden">
      </div>


      <div
        id="assessment-list-area">

        <p>
          Loading assessments...
        </p>

      </div>

    </div>

  `;


  addAssessmentStyles();


  const createButton =
    document.getElementById(
      "create-assessment-btn"
    );


  if (createButton) {

    createButton.onclick =
      () => showAssessmentForm();

  }


  await renderAssessmentList();

}


// ============================================================
// ASSESSMENT LIST
// ============================================================

async function renderAssessmentList() {

  const box =
    document.getElementById(
      "assessment-list-area"
    );


  if (!box) return;


  const {
    data: assessments,
    error
  } =
    await db
      .from("assessments")
      .select(`
        id,
        course_id,
        title,
        description,
        instructions,
        questions,
        total_marks,
        pass_mark,
        active,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    box.innerHTML = `
      <div class="admin-error">
        ${esc(error.message)}
      </div>
    `;

    return;
  }


  if (
    !assessments ||
    assessments.length === 0
  ) {

    box.innerHTML = `

      <div class="empty-state">

        <strong>
          No assessments created yet.
        </strong>

        <p>
          Click "Create Assessment" to create
          the first assessment.
        </p>

      </div>

    `;

    return;
  }


  box.innerHTML = `

    <div class="assessment-list">

      ${assessments.map(
        assessment => {

          const course =
            courses.find(
              c =>
                c.id ===
                assessment.course_id
            );


          const courseName =
            course?.title ||
            course?.name ||
            "Course";


          const questions =
            Array.isArray(
              assessment.questions
            )
              ? assessment.questions
              : [];


          return `

            <div class="assessment-card">

              <div class="assessment-card-top">

                <div>

                  <span class="assessment-course">
                    ${esc(courseName)}
                  </span>

                  <h3>
                    ${esc(
                      assessment.title
                    )}
                  </h3>

                  <p>
                    ${esc(
                      assessment.description ||
                      "No description provided."
                    )}
                  </p>

                </div>


                <span
                  class="assessment-active ${
                    assessment.active
                      ? "active"
                      : "inactive"
                  }">

                  ${
                    assessment.active
                      ? "Active"
                      : "Inactive"
                  }

                </span>

              </div>


              <div class="assessment-meta">

                <span>
                  Questions:
                  <strong>
                    ${questions.length}
                  </strong>
                </span>

                <span>
                  Total marks:
                  <strong>
                    ${Number(
                      assessment.total_marks || 0
                    )}
                  </strong>
                </span>

                <span>
                  Pass mark:
                  <strong>
                    ${Number(
                      assessment.pass_mark || 0
                    )}%
                  </strong>
                </span>

              </div>


              <div class="assessment-actions">

                <button
                  type="button"
                  class="btn small ghost"
                  data-edit-assessment="${assessment.id}">
                  Edit
                </button>


                <button
                  type="button"
                  class="btn small ghost"
                  data-view-submissions="${assessment.id}">
                  Student Submissions
                </button>


                <button
                  type="button"
                  class="btn small danger"
                  data-delete-assessment="${assessment.id}">
                  Delete
                </button>

              </div>


              <div
                id="submissions-${assessment.id}"
                class="submissions-area hidden">
              </div>

            </div>

          `;

        }
      ).join("")}

    </div>

  `;


  box
    .querySelectorAll(
      "[data-edit-assessment]"
    )
    .forEach(button => {

      button.onclick = () => {

        const assessment =
          assessments.find(
            a =>
              a.id ===
              button.dataset.editAssessment
          );

        if (assessment) {

          showAssessmentForm(
            assessment
          );

        }

      };

    });


  box
    .querySelectorAll(
      "[data-view-submissions]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          loadSubmissions(
            button.dataset.viewSubmissions
          );

    });


  box
    .querySelectorAll(
      "[data-delete-assessment]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          deleteAssessment(
            button.dataset.deleteAssessment
          );

    });

}


// ============================================================
// SHOW ASSESSMENT FORM
// ============================================================

function showAssessmentForm(existing = null) {

  const area =
    document.getElementById(
      "assessment-form-area"
    );


  if (!area) return;


  const questions =
    existing &&
    Array.isArray(existing.questions)
      ? existing.questions
      : [];


  area.classList.remove(
    "hidden"
  );


  area.innerHTML = `

    <div class="assessment-editor">

      <h3>
        ${
          existing
            ? "Edit Assessment"
            : "Create Assessment"
        }
      </h3>


      <label>
        Course
      </label>

      <select id="assessment-course" required>

        <option value="">
          Select a course
        </option>

        ${courses.map(course => {

          const name =
            course.title ||
            course.name ||
            "Course";


          return `

            <option
              value="${course.id}"
              ${
                existing &&
                existing.course_id ===
                course.id
                  ? "selected"
                  : ""
              }>

              ${esc(name)}

            </option>

          `;

        }).join("")}

      </select>


      <label>
        Assessment title
      </label>

      <input
        id="assessment-title"
        value="${esc(
          existing?.title || ""
        )}"
        placeholder="e.g. Final Course Assessment"
        required
      >


      <label>
        Description
      </label>

      <textarea
        id="assessment-description"
        placeholder="Briefly describe this assessment..."
      >${esc(
        existing?.description || ""
      )}</textarea>


      <label>
        Instructions
      </label>

      <textarea
        id="assessment-instructions"
        placeholder="Tell students how to complete the assessment..."
      >${esc(
        existing?.instructions || ""
      )}</textarea>


      <div class="assessment-number-grid">

        <div>

          <label>
            Total marks
          </label>

          <input
            id="assessment-total"
            type="number"
            min="0"
            value="${Number(
              existing?.total_marks || 0
            )}"
          >

        </div>


        <div>

          <label>
            Pass percentage
          </label>

          <input
            id="assessment-pass"
            type="number"
            min="0"
            max="100"
            value="${Number(
              existing?.pass_mark || 50
            )}"
          >

        </div>

      </div>


      <div class="question-builder">

        <div class="question-builder-header">

          <h4>
            Questions
          </h4>

          <button
            type="button"
            class="btn small green"
            id="add-question-btn">

            + Add Question

          </button>

        </div>


        <div id="question-list"></div>

      </div>


      <div class="assessment-editor-actions">

        <button
          type="button"
          class="btn green"
          id="save-assessment-btn">

          Save Assessment

        </button>


        <button
          type="button"
          class="btn ghost"
          id="cancel-assessment-btn">

          Cancel

        </button>

      </div>

    </div>

  `;


  questions.forEach(
    question =>
      addQuestionRow(
        question
      )
  );


  const addQuestionButton =
    document.getElementById(
      "add-question-btn"
    );


  if (addQuestionButton) {

    addQuestionButton.onclick =
      () => addQuestionRow();

  }


  const cancelButton =
    document.getElementById(
      "cancel-assessment-btn"
    );


  if (cancelButton) {

    cancelButton.onclick =
      () => {

        area.classList.add(
          "hidden"
        );

        area.innerHTML = "";

      };

  }


  const saveButton =
    document.getElementById(
      "save-assessment-btn"
    );


  if (saveButton) {

    saveButton.onclick =
      () =>
        saveAssessment(
          existing?.id || null
        );

  }

}


// ============================================================
// ADD QUESTION ROW
// ============================================================

function addQuestionRow(question = null) {

  const list =
    document.getElementById(
      "question-list"
    );


  if (!list) return;


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "question-row";


  const options =
    Array.isArray(
      question?.options
    )
      ? question.options.join("\n")
      : "";


  row.innerHTML = `

    <div class="question-row-header">

      <strong>
        Question
      </strong>

      <button
        type="button"
        class="btn small danger remove-question">

        Remove

      </button>

    </div>


    <label>
      Question text
    </label>

    <textarea
      class="question-text"
      placeholder="Enter the question..."
    >${esc(
      question?.text || ""
    )}</textarea>


    <label>
      Question type
    </label>

    <select class="question-type">

      <option
        value="text"
        ${
          question?.type === "text"
            ? "selected"
            : ""
        }>
        Written answer
      </option>

      <option
        value="multiple_choice"
        ${
          question?.type ===
          "multiple_choice"
            ? "selected"
            : ""
        }>
        Multiple choice
      </option>

    </select>


    <label>
      Marks
    </label>

    <input
      type="number"
      min="1"
      class="question-marks"
      value="${Number(
        question?.marks || 1
      )}"
    >


    <label>
      Options

      <small>
        One option per line. Use this for multiple-choice questions.
      </small>

    </label>

    <textarea
      class="question-options"
      placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
    >${esc(options)}</textarea>


    <label>
      Correct answer

      <small>
        For multiple choice, enter the exact correct option.
      </small>

    </label>

    <input
      class="question-correct"
      value="${esc(
        question?.correct_answer || ""
      )}"
      placeholder="Correct answer"
    >

  `;


  const removeButton =
    row.querySelector(
      ".remove-question"
    );


  if (removeButton) {

    removeButton.onclick =
      () => row.remove();

  }


  list.appendChild(row);

}


// ============================================================
// SAVE ASSESSMENT
// ============================================================

async function saveAssessment(id = null) {

  const courseId =
    document.getElementById(
      "assessment-course"
    )?.value;


  const title =
    document.getElementById(
      "assessment-title"
    )?.value
      .trim();


  const description =
    document.getElementById(
      "assessment-description"
    )?.value
      .trim();


  const instructions =
    document.getElementById(
      "assessment-instructions"
    )?.value
      .trim();


  const passMark =
    Number(
      document.getElementById(
        "assessment-pass"
      )?.value
    ) || 50;


  if (!courseId) {

    show(
      "Please select a course."
    );

    return;
  }


  if (!title) {

    show(
      "Please enter an assessment title."
    );

    return;
  }


  if (
    passMark < 0 ||
    passMark > 100
  ) {

    show(
      "Pass percentage must be between 0 and 100."
    );

    return;
  }


  const rows =
    [
      ...document.querySelectorAll(
        "#question-list .question-row"
      )
    ];


  const questions =
    rows.map(row => {

      const text =
        row.querySelector(
          ".question-text"
        )?.value
          .trim() || "";


      const type =
        row.querySelector(
          ".question-type"
        )?.value ||
        "text";


      const marks =
        Number(
          row.querySelector(
            ".question-marks"
          )?.value
        ) || 1;


      const options =
        row.querySelector(
          ".question-options"
        )?.value
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean) || [];


      const correctAnswer =
        row.querySelector(
          ".question-correct"
        )?.value
          .trim() || "";


      return {

        text,

        type,

        marks,

        options,

        correct_answer:
          correctAnswer

      };

    })
    .filter(
      question =>
        question.text
    );


  const calculatedTotal =
    questions.reduce(
      (sum, question) =>
        sum +
        Number(
          question.marks || 0
        ),
      0
    );


  const totalMarks =
    calculatedTotal > 0
      ? calculatedTotal
      : Number(
          document.getElementById(
            "assessment-total"
          )?.value
        ) || 0;


  if (
    questions.length === 0
  ) {

    show(
      "Please add at least one question."
    );

    return;
  }


  const payload = {

    course_id:
      courseId,

    title:
      title,

    description:
      description || null,

    instructions:
      instructions || null,

    questions:
      questions,

    total_marks:
      totalMarks,

    pass_mark:
      passMark,

    active:
      true,

    updated_at:
      new Date().toISOString()

  };


  let result;


  if (id) {

    result =
      await db
        .from("assessments")
        .update(payload)
        .eq(
          "id",
          id
        );

  } else {

    result =
      await db
        .from("assessments")
        .insert(payload);

  }


  if (result.error) {

    console.error(
      "Assessment save error:",
      result.error
    );


    show(
      result.error.message
    );

    return;
  }


  show(
    id
      ? "Assessment updated successfully."
      : "Assessment created successfully.",
    true
  );


  const area =
    document.getElementById(
      "assessment-form-area"
    );


  if (area) {

    area.classList.add(
      "hidden"
    );

    area.innerHTML = "";

  }


  await renderAssessmentList();

}


// ============================================================
// DELETE ASSESSMENT
// ============================================================

async function deleteAssessment(id) {

  if (
    !confirm(
      "Delete this assessment? Student submissions for this assessment will also be deleted."
    )
  ) {
    return;
  }


  const {
    error
  } =
    await db
      .from("assessments")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    show(
      error.message
    );

    return;
  }


  show(
    "Assessment deleted successfully.",
    true
  );


  await renderAssessmentList();

}


// ============================================================
// LOAD STUDENT SUBMISSIONS
// ============================================================

async function loadSubmissions(
  assessmentId
) {

  const box =
    document.getElementById(
      `submissions-${assessmentId}`
    );


  if (!box) return;


  box.classList.remove(
    "hidden"
  );


  box.innerHTML =
    "<p>Loading student submissions...</p>";


  const {
    data: submissions,
    error
  } =
    await db
      .from("assessment_submissions")
      .select(`
        id,
        assessment_id,
        student_id,
        answers,
        score,
        percentage,
        status,
        feedback,
        submitted_at,
        marked_at
      `)
      .eq(
        "assessment_id",
        assessmentId
      )
      .order(
        "submitted_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    box.innerHTML = `
      <div class="admin-error">
        ${esc(error.message)}
      </div>
    `;

    return;
  }


  if (
    !submissions ||
    submissions.length === 0
  ) {

    box.innerHTML = `
      <div class="empty-state">

        <strong>
          No student submissions yet.
        </strong>

        <p>
          Submissions will appear here when
          students complete this assessment.
        </p>

      </div>
    `;

    return;
  }


  const studentIds = [
    ...new Set(
      submissions
        .map(s => s.student_id)
        .filter(Boolean)
    )
  ];


  let students = [];


  if (studentIds.length > 0) {

    const {
      data,
      error: studentError
    } =
      await db
        .from("profiles")
        .select(`
          id,
          full_name,
          email
        `)
        .in(
          "id",
          studentIds
        );


    if (!studentError) {

      students =
        data || [];

    }

  }


  const studentLookup = {};


  students.forEach(student => {

    studentLookup[
      student.id
    ] = student;

  });


  box.innerHTML = `

    <div class="submission-list">

      ${submissions.map(
        submission => {

          const student =
            studentLookup[
              submission.student_id
            ] || {};


          const studentName =
            student.full_name ||
            student.email ||
            "Student";


          return `

            <div class="submission-card">

              <div class="submission-header">

                <div>

                  <strong>
                    ${esc(studentName)}
                  </strong>

                  <small>
                    ${esc(
                      student.email || ""
                    )}
                  </small>

                </div>


                <span
                  class="result-badge ${esc(
                    submission.status ||
                    "submitted"
                  )}">

                  ${esc(
                    submission.status ||
                    "submitted"
                  )}

                </span>

              </div>


              <div class="submission-meta">

                <span>
                  Score:
                  <strong>
                    ${
                      submission.score === null ||
                      submission.score === undefined
                        ? "Not marked"
                        : submission.score
                    }
                  </strong>
                </span>


                <span>
                  Percentage:
                  <strong>
                    ${
                      submission.percentage === null ||
                      submission.percentage === undefined
                        ? "Not marked"
                        : submission.percentage + "%"
                    }
                  </strong>
                </span>


                <span>
                  Submitted:
                  <strong>
                    ${formatDate(
                      submission.submitted_at
                    )}
                  </strong>
                </span>

              </div>


              <div class="submission-answers">

                <h4>
                  Student Answers
                </h4>

                ${renderAnswers(
                  submission.answers
                )}

              </div>


              <div class="mark-submission">

                <h4>
                  Mark Result
                </h4>


                <div class="mark-grid">

                  <div>

                    <label>
                      Score
                    </label>

                    <input
                      type="number"
                      min="0"
                      class="mark-score"
                      value="${
                        submission.score ?? ""
                      }"
                    >

                  </div>


                  <div>

                    <label>
                      Percentage
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      class="mark-percentage"
                      value="${
                        submission.percentage ?? ""
                      }"
                    >

                  </div>

                </div>


                <label>
                  Feedback
                </label>

                <textarea
                  class="mark-feedback"
                  placeholder="Enter feedback for the student..."
                >${esc(
                  submission.feedback || ""
                )}</textarea>


                <button
                  type="button"
                  class="btn green save-result"
                  data-submission-id="${submission.id}">

                  Save Result

                </button>

              </div>

            </div>

          `;

        }
      ).join("")}

    </div>

  `;


  box
    .querySelectorAll(
      ".save-result"
    )
    .forEach(button => {

      button.onclick =
        () =>
          saveStudentResult(
            button.dataset.submissionId,
            box
          );

    });

}


// ============================================================
// RENDER STUDENT ANSWERS
// ============================================================

function renderAnswers(answers) {

  if (
    !answers ||
    !Array.isArray(answers) ||
    answers.length === 0
  ) {

    return `
      <p>
        No answers recorded.
      </p>
    `;

  }


  return `

    <div class="answer-list">

      ${answers.map(
        (answer, index) => {

          const question =
            answer.question ||
            answer.question_text ||
            `Question ${index + 1}`;


          const value =
            answer.answer ??
            answer.value ??
            "";


          return `

            <div class="answer-item">

              <strong>
                ${esc(question)}
              </strong>

              <p>
                ${esc(value)}
              </p>

            </div>

          `;

        }
      ).join("")}

    </div>

  `;

}


// ============================================================
// SAVE STUDENT RESULT
// ============================================================

async function saveStudentResult(
  submissionId,
  container
) {

  const button =
    container.querySelector(
      `[data-submission-id="${submissionId}"]`
    );


  const card =
    button?.closest(
      ".submission-card"
    );


  if (!card) return;


  const score =
    Number(
      card.querySelector(
        ".mark-score"
      )?.value
    );


  const percentage =
    Number(
      card.querySelector(
        ".mark-percentage"
      )?.value
    );


  const feedback =
    card.querySelector(
      ".mark-feedback"
    )?.value
      .trim() || null;


  if (
    !Number.isFinite(score)
  ) {

    show(
      "Please enter the student's score."
    );

    return;
  }


  if (
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {

    show(
      "Please enter a percentage between 0 and 100."
    );

    return;
  }


  const {
    data: submission,
    error: submissionError
  } =
    await db
      .from("assessment_submissions")
      .select(`
        id,
        assessment_id
      `)
      .eq(
        "id",
        submissionId
      )
      .maybeSingle();


  if (submissionError) {

    show(
      submissionError.message
    );

    return;
  }


  if (!submission) {

    show(
      "Submission could not be found."
    );

    return;
  }


  const {
    data: assessment,
    error: assessmentError
  } =
    await db
      .from("assessments")
      .select(`
        id,
        pass_mark
      `)
      .eq(
        "id",
        submission.assessment_id
      )
      .maybeSingle();


  if (assessmentError) {

    show(
      assessmentError.message
    );

    return;
  }


  const status =
    percentage >=
    Number(
      assessment?.pass_mark || 50
    )
      ? "passed"
      : "failed";


  const {
    data: {
      session
    }
  } =
    await db.auth.getSession();


  const {
    error
  } =
    await db
      .from("assessment_submissions")
      .update({

        score,

        percentage,

        feedback,

        status,

        marked_at:
          new Date().toISOString(),

        marked_by:
          session?.user?.id || null,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        submissionId
      );


  if (error) {

    console.error(
      "Result save error:",
      error
    );

    show(
      error.message
    );

    return;
  }


  show(
    `Result saved: ${status.toUpperCase()}.`,
    true
  );


  await loadSubmissions(
    submission.assessment_id
  );

}


// ============================================================
// ASSESSMENT CSS
// ============================================================

function addAssessmentStyles() {

  if (
    document.getElementById(
      "assessment-admin-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "assessment-admin-style";


  style.textContent = `

    .assessment-admin {
      width: 100%;
    }

    .assessment-admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .assessment-admin-header h3 {
      margin: 0 0 5px;
      color: #0f172a;
    }

    .assessment-admin-header p {
      margin: 0;
      color: #64748b;
    }

    .assessment-form-area {
      margin-bottom: 25px;
    }

    .assessment-editor {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 15px;
      padding: 20px;
    }

    .assessment-editor h3 {
      margin-top: 0;
    }

    .assessment-editor label,
    .mark-submission label,
    .question-row label {
      display: block;
      margin: 12px 0 6px;
      font-weight: 700;
      color: #334155;
    }

    .assessment-editor input,
    .assessment-editor select,
    .assessment-editor textarea,
    .mark-submission input,
    .mark-submission textarea,
    .question-row input,
    .question-row select,
    .question-row textarea {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      background: #ffffff;
      font: inherit;
      max-width: 100%;
    }

    .assessment-editor textarea,
    .question-row textarea,
    .mark-submission textarea {
      min-height: 90px;
      resize: vertical;
    }

    .assessment-number-grid,
    .mark-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .question-builder {
      margin-top: 25px;
    }

    .question-builder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .question-builder-header h4 {
      margin: 0;
    }

    .question-row {
      background: #ffffff;
      border: 1px solid #dbe3ea;
      border-radius: 12px;
      padding: 16px;
      margin-top: 15px;
    }

    .question-row-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .question-row small {
      display: block;
      color: #64748b;
      font-weight: normal;
      margin-top: 3px;
    }

    .assessment-editor-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .assessment-card {
      border: 1px solid #e2e8f0;
      border-radius: 15px;
      padding: 18px;
      margin-bottom: 16px;
      background: #ffffff;
    }

    .assessment-card-top {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      align-items: flex-start;
    }

    .assessment-card h3 {
      margin: 6px 0;
      color: #0f172a;
    }

    .assessment-card p {
      color: #64748b;
    }

    .assessment-course {
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
    }

    .assessment-active,
    .result-badge {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .assessment-active.active,
    .result-badge.passed {
      background: #dcfce7;
      color: #166534;
    }

    .assessment-active.inactive,
    .result-badge.failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .result-badge.submitted {
      background: #fef3c7;
      color: #92400e;
    }

    .result-badge.marked {
      background: #dbeafe;
      color: #1e40af;
    }

    .assessment-meta,
    .submission-meta {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      padding: 12px 0;
      margin-top: 12px;
      border-top: 1px solid #edf2f7;
      border-bottom: 1px solid #edf2f7;
      color: #64748b;
      font-size: 14px;
    }

    .assessment-meta strong,
    .submission-meta strong {
      color: #0f172a;
    }

    .assessment-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
    }

    .submissions-area {
      margin-top: 18px;
    }

    .submission-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-top: 12px;
    }

    .submission-header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .submission-header strong,
    .submission-header small {
      display: block;
    }

    .submission-header small {
      color: #64748b;
      margin-top: 4px;
    }

    .submission-answers {
      margin-top: 15px;
    }

    .submission-answers h4,
    .mark-submission h4 {
      margin-bottom: 10px;
    }

    .answer-item {
      background: #ffffff;
      border-radius: 9px;
      padding: 11px;
      margin-top: 8px;
    }

    .answer-item p {
      margin: 6px 0 0;
      color: #475569;
    }

    .mark-submission {
      margin-top: 18px;
      padding-top: 15px;
      border-top: 1px solid #dbe3ea;
    }

    .hidden {
      display: none !important;
    }

    @media (max-width: 650px) {

      .assessment-number-grid,
      .mark-grid {
        grid-template-columns: 1fr;
      }

      .assessment-card-top {
        flex-direction: column;
      }

      .assessment-meta,
      .submission-meta {
        flex-direction: column;
        gap: 7px;
      }

      .assessment-editor {
        padding: 15px;
      }

    }

  `;


  document.head.appendChild(style);

}


// ============================================================
// LOGOUT
// ============================================================

const logout =
  document.getElementById(
    "logout"
  );


if (logout) {

  logout.onclick =
    async () => {

      await db.auth.signOut();

      window.location.href =
        "index.html";

    };

}


// ============================================================
// START ADMIN DASHBOARD
// ============================================================

init();
