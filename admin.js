// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
// Results • Certificates
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const message = document.getElementById("message");
const adminEmail = document.getElementById("admin-email");
const logoutBtn = document.getElementById("logout");

const studentsBox =
  document.getElementById("admin-students");

const coursesBox =
  document.getElementById("admin-courses");

const enrolmentsBox =
  document.getElementById("admin-enrolments");

const paymentsBox =
  document.getElementById("admin-payments");

const resultsBox =
  document.getElementById("admin-results");

const certificatesBox =
  document.getElementById("admin-certificates");

const courseForm =
  document.getElementById("course-form");

const courseId =
  document.getElementById("course-id");

const courseName =
  document.getElementById("course-name");

const coursePrice =
  document.getElementById("course-price");

const courseCategory =
  document.getElementById("course-category");

const courseDuration =
  document.getElementById("course-duration");

const courseImage =
  document.getElementById("course-image");

const courseDescription =
  document.getElementById("course-description");

const courseModules =
  document.getElementById("course-modules");

const cancelEdit =
  document.getElementById("cancel-edit");

const newCourseBtn =
  document.getElementById("new-course");


// ============================================================
// MESSAGE
// ============================================================

function showMessage(text, type = "error") {

  if (!message) return;

  message.textContent = text;
  message.className = "message " + type;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// DATE
// ============================================================

function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHTML(value);
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


// ============================================================
// MONEY
// ============================================================

function formatMoney(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return escapeHTML(value);
  }

  return "R" + number.toFixed(2);
}


// ============================================================
// STUDENT NAME
// ============================================================

function getStudentName(student) {

  if (!student) {
    return "Unknown student";
  }

  if (
    student.full_name &&
    String(student.full_name).trim()
  ) {
    return String(student.full_name).trim();
  }

  if (
    student.name &&
    String(student.name).trim()
  ) {
    return String(student.name).trim();
  }

  if (
    student.email &&
    String(student.email).trim()
  ) {
    return String(student.email).trim();
  }

  return "Unknown student";
}


// ============================================================
// COURSE NAME
// ============================================================

function getCourseName(course) {

  if (!course) {
    return "Unknown course";
  }

  return (
    course.title ||
    course.name ||
    "Unknown course"
  );
}


// ============================================================
// COURSE PRICE
// ============================================================

function getCoursePrice(course) {

  if (!course) {
    return null;
  }

  if (
    course.price !== null &&
    course.price !== undefined &&
    course.price !== ""
  ) {
    return course.price;
  }

  return null;
}


// ============================================================
// STATUS BADGE
// ============================================================

function statusBadge(status) {

  const clean =
    status ||
    "Pending";

  const lower =
    String(clean).toLowerCase();

  let className =
    "pending";

  if (
    lower === "approved" ||
    lower === "active" ||
    lower === "paid" ||
    lower === "completed" ||
    lower === "passed"
  ) {
    className = "approved";
  }

  if (
    lower === "rejected" ||
    lower === "cancelled" ||
    lower === "failed" ||
    lower === "unpaid"
  ) {
    className = "rejected";
  }

  return `
    <span class="status-badge ${className}">
      ${escapeHTML(clean)}
    </span>
  `;
}


// ============================================================
// SLUG
// ============================================================

function createSlug(title) {

  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


// ============================================================
// MODULES
// ============================================================

function modulesToArray(value) {

  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "object"
  ) {
    return Object.values(value);
  }

  return String(value)
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}


function modulesToText(value) {

  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (
    typeof value === "object"
  ) {
    return Object.values(value).join("\n");
  }

  return String(value);
}


// ============================================================
// ADMIN STYLES
// ============================================================

function addAdminStyles() {

  if (
    document.getElementById(
      "funda-admin-extra-styles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "funda-admin-extra-styles";

  style.textContent = `

    .funda-admin-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .funda-admin-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 850px;
    }

    .funda-admin-table th {
      text-align: left;
      padding: 14px 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .funda-admin-table td {
      padding: 14px 12px;
      border-top: 1px solid #e8ece9;
      vertical-align: middle;
      white-space: normal;
    }

    .funda-admin-table tr:hover {
      background: #fafcfb;
    }

    .status-badge {
      display: inline-block;
      padding: 7px 13px;
      border-radius: 999px;
      font-weight: 700;
      white-space: nowrap;
    }

    .status-badge.pending {
      background: #fff3c7;
      color: #995a14;
    }

    .status-badge.approved {
      background: #dff5e7;
      color: #177245;
    }

    .status-badge.rejected {
      background: #fde3e3;
      color: #a52c2c;
    }

    .funda-action-select {
      padding: 9px 12px;
      border: 1px solid #b8c0bc;
      border-radius: 8px;
      background: white;
      font-size: 15px;
      min-width: 125px;
    }

    .funda-proof-link {
      color: #14804a;
      font-weight: 700;
      text-decoration: none;
    }

    .funda-proof-link:hover {
      text-decoration: underline;
    }

    .funda-course-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .funda-btn {
      border: 0;
      border-radius: 9px;
      padding: 9px 14px;
      cursor: pointer;
      font-weight: 700;
    }

    .funda-btn-edit {
      background: #e7f1ff;
      color: #1557a0;
    }

    .funda-btn-delete {
      background: #fde5e5;
      color: #a72828;
    }

    .funda-btn-view {
      background: #e7f7ee;
      color: #167245;
    }

    .funda-empty {
      padding: 25px;
      text-align: center;
      color: #69756f;
    }

    .funda-loading {
      padding: 25px;
      text-align: center;
      color: #69756f;
    }

    .funda-error {
      padding: 20px;
      border-radius: 10px;
      background: #fff0f0;
      color: #a52c2c;
    }

    .funda-small {
      font-size: 13px;
      color: #68736e;
      margin-top: 4px;
    }

    @media (max-width: 700px) {

      .funda-admin-table {
        min-width: 760px;
      }

      .funda-admin-table th,
      .funda-admin-table td {
        padding: 12px 10px;
      }

      .funda-action-select {
        min-width: 115px;
      }

    }

  `;

  document.head.appendChild(style);
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function checkAdminLogin() {

  const {
    data,
    error
  } = await db.auth.getUser();

  if (error) {

    console.error(
      "Authentication error:",
      error
    );

    window.location.href =
      "login.html";

    return null;
  }

  const user =
    data?.user;

  if (!user) {

    window.location.href =
      "login.html";

    return null;
  }

  if (adminEmail) {

    adminEmail.textContent =
      user.email ||
      "Administrator";
  }

  return user;
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await db.auth.signOut();

      window.location.href =
        "login.html";
    }
  );
}


// ============================================================
// STUDENT LOOKUP
//
// IMPORTANT:
// Enrolments may contain either:
// students.id
// OR
// students.user_id
//
// We check BOTH.
// This fixes "Unknown student" in most cases.
// ============================================================

async function getStudentsForEnrolments(
  enrolments
) {

  const rawIds = [
    ...enrolments.map(
      row => row.student_id
    ),
    ...enrolments.map(
      row => row.user_id
    )
  ]
    .filter(Boolean)
    .map(
      id => String(id)
    );

  const ids = [
    ...new Set(rawIds)
  ];

  if (!ids.length) {
    return [];
  }

  const results = [];

  // ----------------------------------------------------------
  // Search by students.id
  // ----------------------------------------------------------

  const byId =
    await db
      .from("students")
      .select("*")
      .in(
        "id",
        ids
      );

  if (!byId.error && byId.data) {

    results.push(
      ...byId.data
    );
  }

  // ----------------------------------------------------------
  // Search by students.user_id
  // ----------------------------------------------------------

  const byUserId =
    await db
      .from("students")
      .select("*")
      .in(
        "user_id",
        ids
      );

  if (!byUserId.error && byUserId.data) {

    results.push(
      ...byUserId.data
    );
  }

  // ----------------------------------------------------------
  // Remove duplicates
  // ----------------------------------------------------------

  const unique = {};
  
  results.forEach(
    student => {

      if (!student) {
        return;
      }

      const key =
        String(
          student.id ||
          student.user_id ||
          Math.random()
        );

      unique[key] =
        student;
    }
  );

  return Object.values(unique);
}


// ============================================================
// STUDENT MAP
// ============================================================

function createStudentMap(
  students
) {

  const map = {};

  students.forEach(
    student => {

      if (
        student.id !== null &&
        student.id !== undefined
      ) {

        map[
          String(student.id)
        ] = student;
      }

      if (
        student.user_id !== null &&
        student.user_id !== undefined
      ) {

        map[
          String(student.user_id)
        ] = student;
      }

    }
  );

  return map;
}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

  if (!studentsBox) {
    return;
  }

  studentsBox.innerHTML =
    `<div class="funda-loading">
      Loading students...
    </div>`;

  const {
    data,
    error
  } = await db
    .from("students")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Students error:",
      error
    );

    studentsBox.innerHTML = `
      <div class="funda-error">
        <strong>
          Could not load students.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}
      </div>
    `;

    return;
  }

  if (
    !data ||
    data.length === 0
  ) {

    studentsBox.innerHTML =
      `<div class="funda-empty">
        No students registered yet.
      </div>`;

    return;
  }

  studentsBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile / WhatsApp</th>
            <th>Gender</th>
            <th>Registration</th>
          </tr>
        </thead>

        <tbody>

          ${data.map(student => `

            <tr>

              <td>
                <strong>
                  ${escapeHTML(
                    getStudentName(
                      student
                    )
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  student.email ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.mobile_whatsapp ||
                  student.mobile ||
                  student.phone ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  student.gender ||
                  "—"
                )}
              </td>

              <td>
                ${formatDate(
                  student.created_at
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// COURSES
// ============================================================

async function loadCourses() {

  if (!coursesBox) {
    return;
  }

  coursesBox.innerHTML =
    `<div class="funda-loading">
      Loading courses...
    </div>`;

  const {
    data,
    error
  } = await db
    .from("courses")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Courses error:",
      error
    );

    coursesBox.innerHTML = `
      <div class="funda-error">

        <strong>
          Could not load courses.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

    return;
  }

  if (
    !data ||
    data.length === 0
  ) {

    coursesBox.innerHTML =
      `<div class="funda-empty">
        No courses found.
      </div>`;

    return;
  }

  coursesBox.innerHTML = `

    <div class="funda-admin-table-wrap">

      <table class="funda-admin-table">

        <thead>

          <tr>
            <th>Course</th>
            <th>Price</th>
            <th>Duration</th>
            <th>Active</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${data.map(course => `

            <tr>

              <td>

                <strong>
                  ${escapeHTML(
                    getCourseName(
                      course
                    )
                  )}
                </strong>

                ${
                  course.category
                    ? `
                      <div class="funda-small">
                        ${escapeHTML(
                          course.category
                        )}
                      </div>
                    `
                    : ""
                }

              </td>

              <td>
                ${formatMoney(
                  course.price
                )}
              </td>

              <td>
                ${escapeHTML(
                  course.duration ||
                  "—"
                )}
              </td>

              <td>

                ${statusBadge(
                  course.active
                    ? "Active"
                    : "Inactive"
                )}

              </td>

              <td>

                <div class="funda-course-actions">

                  <button
                    type="button"
                    class="funda-btn funda-btn-edit"
                    onclick="editCourse('${escapeHTML(
                      course.id
                    )}')">
                    Edit
                  </button>

                  <button
                    type="button"
                    class="funda-btn funda-btn-delete"
                    onclick="deleteCourse('${escapeHTML(
                      course.id
                    )}')">
                    Delete
                  </button>

                </div>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// EDIT COURSE
// ============================================================

async function editCourse(id) {

  const {
    data,
    error
  } = await db
    .from("courses")
    .select("*")
    .eq(
      "id",
      id
    )
    .single();

  if (error) {

    showMessage(
      "Could not load course: " +
      error.message,
      "error"
    );

    return;
  }

  if (courseId) {
    courseId.value =
      data.id || "";
  }

  if (courseName) {
    courseName.value =
      data.title || "";
  }

  if (coursePrice) {
    coursePrice.value =
      data.price ?? "";
  }

  if (courseCategory) {
    courseCategory.value =
      data.category || "";
  }

  if (courseDuration) {
    courseDuration.value =
      data.duration || "";
  }

  if (courseImage) {
    courseImage.value =
      data.image_url || "";
  }

  if (courseDescription) {
    courseDescription.value =
      data.description || "";
  }

  if (courseModules) {
    courseModules.value =
      modulesToText(
        data.modules
      );
  }

  if (courseForm) {

    courseForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  showMessage(
    "Course loaded for editing.",
    "success"
  );
}


window.editCourse =
  editCourse;


// ============================================================
// NEW COURSE
// ============================================================

if (newCourseBtn) {

  newCourseBtn.addEventListener(
    "click",
    () => {

      resetCourseForm();

      if (courseForm) {

        courseForm.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  );
}


// ============================================================
// RESET COURSE FORM
// ============================================================

function resetCourseForm() {

  if (courseForm) {
    courseForm.reset();
  }

  if (courseId) {
    courseId.value = "";
  }

  showMessage(
    "",
    "success"
  );
}


// ============================================================
// CANCEL EDIT
// ============================================================

if (cancelEdit) {

  cancelEdit.addEventListener(
    "click",
    () => {

      resetCourseForm();

    }
  );
}


// ============================================================
// SAVE COURSE
// ============================================================

if (courseForm) {

  courseForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const title =
        courseName?.value.trim();

      const price =
        coursePrice?.value;

      const category =
        courseCategory?.value.trim();

      const duration =
        courseDuration?.value.trim();

      const image =
        courseImage?.value.trim();

      const description =
        courseDescription?.value.trim();

      const modules =
        modulesToArray(
          courseModules?.value
        );

      if (!title) {

        showMessage(
          "Please enter the course name.",
          "error"
        );

        return;
      }

      showMessage(
        "Saving course...",
        "success"
      );

      const id =
        courseId?.value;

      const courseData = {

        title: title,

        slug:
          createSlug(title),

        description:
          description || null,

        duration:
          duration || null,

        price:
          price === ""
            ? null
            : Number(price),

        image_url:
          image || null,

        modules:
          modules,

        active:
          true

      };

      let result;

      if (id) {

        result =
          await db
            .from("courses")
            .update(
              courseData
            )
            .eq(
              "id",
              id
            );

      } else {

        result =
          await db
            .from("courses")
            .insert([
              courseData
            ]);
      }

      if (result.error) {

        console.error(
          "Save course error:",
          result.error
        );

        showMessage(
          "Could not save course: " +
          result.error.message,
          "error"
        );

        return;
      }

      showMessage(
        id
          ? "Course updated successfully."
          : "Course added successfully.",
        "success"
      );

      resetCourseForm();

      await loadCourses();

    }
  );
}


// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

  const confirmed =
    window.confirm(
      "Are you sure you want to delete this course?"
    );

  if (!confirmed) {
    return;
  }

  showMessage(
    "Deleting course...",
    "success"
  );

  const {
    error
  } = await db
    .from("courses")
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {

    console.error(
      "Delete course error:",
      error
    );

    showMessage(
      "Could not delete course: " +
      error.message,
      "error"
    );

    return;
  }

  showMessage(
    "Course deleted successfully.",
    "success"
  );

  await loadCourses();
}


window.deleteCourse =
  deleteCourse;


// ============================================================
// ENROLMENTS
// ============================================================

async function loadEnrolments() {

  if (!enrolmentsBox) {
    return;
  }

  enrolmentsBox.innerHTML =
    `<div class="funda-loading">
      Loading enrolments...
    </div>`;

  const {
    data: enrolments,
    error
  } = await db
    .from("enrollments")
    .select("*")
    .order(
      "enrolled_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Enrolments error:",
      error
    );

    enrolmentsBox.innerHTML = `
      <div class="funda-error">

        <strong>
          Could not load enrolments.
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

    return;
  }

  if (
    !enrolments ||
    enrolments.length === 0
  ) {

    enrolmentsBox.innerHTML =
      `<div class="funda-empty">
        No enrolments found.
      </div>`;

    return;
  }


  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------

  const students =
    await getStudentsForEnrolments(
      enrolments
    );

  const studentMap =
    createStudentMap(
      students
    );


  // ----------------------------------------------------------
  // COURSES
  // ----------------------------------------------------------

  const courseIds = [
    ...new Set(
      enrolments
        .map(
          row => row.course_id
        )
        .filter(Boolean)
        .map(
          id => String(id)
        )
    )
  ];

  let courses = [];

  if (courseIds.length) {

    const result =
      await db
        .from("courses")
        .select("*")
       
