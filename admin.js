// ============================================================
// FUNDA ONLINE ACADEMY
// ADMIN DASHBOARD
// Students • Courses • Enrolments • Payments
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


function esc(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
}


function formatDate(date) {

  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString(
    "en-ZA",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}


function money(value) {

  return "R" +
    Number(value || 0)
      .toLocaleString(
        "en-ZA",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
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


function fill(course) {

  editingId = course.id;

  const id =
    document.getElementById("course-id");

  if (id) {
    id.value = course.id;
  }

  const name =
    document.getElementById("course-name");

  if (name) {
    name.value = course.title || "";
  }

  const price =
    document.getElementById("course-price");

  if (price) {
    price.value = course.price || 0;
  }

  const category =
    document.getElementById("course-category");

  if (category) {
    category.value = course.category || "";
  }

  const duration =
    document.getElementById("course-duration");

  if (duration) {
    duration.value = course.duration || "";
  }

  const image =
    document.getElementById("course-image");

  if (image) {
    image.value = course.image_url || "";
  }

  const description =
    document.getElementById(
      "course-description"
    );

  if (description) {
    description.value =
      course.description || "";
  }

  const modules =
    document.getElementById(
      "course-modules"
    );

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
    button.textContent = "Update Course";
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
  } = await db.auth.getSession();


  if (sessionError) {

    console.error(
      "Session error:",
      sessionError
    );

    show(sessionError.message);

    return;
  }


  if (!session) {

    window.location.href = "auth.html";

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
  } = await db
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();


  if (profileError) {

    console.error(
      "Admin role error:",
      profileError
    );

    show(
      "Could not verify administrator access: " +
      profileError.message
    );

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
  // LOAD ADMIN DATA
  // ==========================================================

  await Promise.all([
    loadStudents(),
    loadCourses(),
    loadEnrolments(),
    loadPayments()
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


  // IMPORTANT:
  // Student information is stored in students,
  // not profiles.

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


  if (!data || !data.length) {

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
          student.sa_id_number ||
          "Not provided";

        const email =
          student.email ||
          "Not provided";

        const phone =
          student.phone ||
          student.mobile ||
          student.whatsapp ||
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
                  Student
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
// STUDENT STYLES
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
  } = await db
    .from("courses")
    .select("*")
    .order("title");


  if (error) {

    console.error(
      "Courses error:",
      error
    );

    show(error.message);

    return;
  }


  courses = data || [];


  const box =
    document.getElementById(
      "admin-courses"
    );


  if (!box) return;


  box.innerHTML = courses.map(
    course => `

      <div class="admin-row">

        <div>

          <strong>
            ${esc(course.title)}
          </strong>

          <small>

            ${esc(
              course.category || ""
            )}

            ·

            ${money(course.price)}

            ·

            ${esc(
              course.duration || ""
            )}

          </small>

        </div>


        <div class="row-actions">

          <button
            type="button"
            class="btn small ghost"
            data-edit="${esc(course.id)}"
          >
            Edit
          </button>


          <button
            type="button"
            class="btn small danger"
            data-delete="${esc(course.id)}"
          >
            Delete
          </button>

        </div>

      </div>

    `
  ).join("") ||
  "<p>No courses available.</p>";


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


  if (
    !confirm(
      `Delete "${course.title}"?`
    )
  ) {
    return;
  }


  const {
    error
  } = await db
    .from("courses")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(
      "Delete course error:",
      error
    );

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

        title,

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
          "Course save error:",
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
// COURSE BUTTONS
// ============================================================

const newCourse =
  document.getElementById(
    "new-course"
  );


if (newCourse) {

  newCourse.onclick =
    resetForm;

}


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
// ============================================================

async function loadEnrolments() {

  const box =
    document.getElementById(
      "admin-enrolments"
    );


  if (!box) return;


  box.innerHTML =
    "<p>Loading enrolments...</p>";


  // IMPORTANT:
  //
  // The correct relationship is:
  //
  // enrollments.student_id
  //       ↓
  // students.id
  //
  // NOT profiles.


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
      students (
        full_name,
        email
      ),
      courses (
        title,
        price
      )
    `)
    .order(
      "enrolled_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Enrolments loading error:",
      error
    );


    box.innerHTML = `
      <div class="admin-error">

        <strong>
          Could not load enrolments.
        </strong>

        <br><br>

        ${esc(error.message)}

      </div>
    `;

    return;
  }


  if (!data || !data.length) {

    box.innerHTML =
      "<p>No enrolment requests yet.</p>";

    return;
  }


  box.innerHTML = `

    <div style="overflow-x:auto; width:100%;">

      <table>

        <thead>

          <tr>

            <th>
              Student
            </th>

            <th>
              Email
            </th>

            <th>
              Course
            </th>

            <th>
              Price
            </th>

            <th>
              Status
            </th>

            <th>
              Date
            </th>

            <th>
              Action
            </th>

          </tr>

        </thead>


        <tbody>

          ${data.map(
            enrolment => {

              const student =
                enrolment.students;

              const course =
                enrolment.courses;

              const status =
                enrolment.enrollment_status ||
                "pending";


              return `

                <tr>

                  <td>

                    ${esc(
                      student?.full_name ||
                      "Student"
                    )}

                  </td>


                  <td>

                    ${esc(
                      student?.email ||
                      ""
                    )}

                  </td>


                  <td>

                    ${esc(
                      course?.title ||
                      ""
                    )}

                  </td>


                  <td>

                    ${money(
                      course?.price
                    )}

                  </td>


                  <td>

                    <strong>

                      ${esc(
                        status
                      )}

                    </strong>

                  </td>


                  <td>

                    ${formatDate(
                      enrolment.enrolled_at
                    )}

                  </td>


                  <td>

                    <select
                      data-status="${esc(
                        enrolment.id
                      )}"
                    >

                      <option
                        value="pending"
                        ${
                          status ===
                          "pending"
                            ? "selected"
                            : ""
                        }
                      >
                        Pending
                      </option>


                      <option
                        value="approved"
                        ${
                          status ===
                          "approved"
                            ? "selected"
                            : ""
                        }
                      >
                        Approved
                      </option>


                      <option
                        value="completed"
                        ${
                          status ===
                          "completed"
                            ? "selected"
                            : ""
                        }
                      >
                        Completed
                      </option>


                      <option
                        value="cancelled"
                        ${
                          status ===
                          "cancelled"
                            ? "selected"
                            : ""
                        }
                      >
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

  `;


  box
    .querySelectorAll(
      "[data-status]"
    )
    .forEach(select => {

      select.onchange =
        async () => {

          select.disabled =
            true;


          const {
            error
          } = await db
            .from("enrollments")
            .update({
              enrollment_status:
                select.value
            })
            .eq(
              "id",
              select.dataset.status
            );


          select.disabled =
            false;


          if (error) {

            console.error(
              "Enrolment status error:",
              error
            );

            show(
              error.message
            );

          } else {

            show(
              "Enrolment status updated.",
              true
            );

          }

        };

    });

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
    data,
    error
  } = await db
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
      created_at,
      updated_at,

      students (
        full_name,
        email
      ),

      enrollments (
        course_id,
        courses (
          title,
          price
        )
      )
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

        ${esc(error.message)}

      </div>
    `;

    return;
  }


  if (!data || !data.length) {

    box.innerHTML = `
      <div class="empty-state">

        <strong>
          No payment records yet.
        </strong>

        <p>
          Student payments will appear here
          after they submit them.
        </p>

      </div>
    `;

    return;
  }


  box.innerHTML = `

    <div style="overflow-x:auto; width:100%;">

      <table>

        <thead>

          <tr>

            <th>
              Student
            </th>

            <th>
              Course
            </th>

            <th>
              Amount
            </th>

            <th>
              Method
            </th>

            <th>
              Status
            </th>

            <th>
              Proof
            </th>

            <th>
              Date
            </th>

            <th>
              Action
            </th>

          </tr>

        </thead>


        <tbody>

          ${data.map(
            payment => {

              const student =
                payment.students;

              const enrolment =
                payment.enrollments;

              const course =
                enrolment?.courses;


              return `

                <tr>

                  <td>

                    <strong>

                      ${esc(
                        student?.full_name ||
                        "Student"
                      )}

                    </strong>

                    <br>

                    <small>

                      ${esc(
                        student?.email ||
                        ""
                      )}

                    </small>

                  </td>


                  <td>

                    ${esc(
                      course?.title ||
                      "Course"
                    )}

                  </td>


                  <td>

                    <strong>

                      ${money(
                        payment.amount
                      )}

                    </strong>

                  </td>


                  <td>

                    ${esc(
                      payment.payment_method ||
                      "—"
                    )}

                  </td>


                  <td>

                    <span
                      class="payment-status ${esc(
                        payment.status
                      )}"
                    >

                      ${esc(
                        payment.status ||
                        "pending"
                      )}

                    </span>

                  </td>


                  <td>

                    ${
                      payment.proof_url
                      ?
                      `
                        <button
                          type="button"
                          class="btn small ghost"
                          data-proof="${esc(
                            payment.proof_url
                          )}"
                        >
                          View Proof
                        </button>
                      `
                      :
                      `
                        <span>
                          No proof
                        </span>
                      `
                    }

                  </td>


                  <td>

                    ${formatDate(
                      payment.created_at
                    )}

                  </td>


                  <td>

                    <select
                      data-payment-status="${esc(
                        payment.id
                      )}"
                    >

                      <option
                        value="pending"
                        ${
                          payment.status ===
                          "pending"
                            ? "selected"
                            : ""
                        }
                      >
                        Pending
                      </option>


                      <option
                        value="submitted"
                        ${
                          payment.status ===
                          "submitted"
                            ? "selected"
                            : ""
                        }
                      >
                        Submitted
                      </option>


                      <option
                        value="verified"
                        ${
                          payment.status ===
                          "verified"
                            ? "selected"
                            : ""
                        }
                      >
                        Verified
                      </option>


                      <option
                        value="rejected"
                        ${
                          payment.status ===
                          "rejected"
                            ? "selected"
                            : ""
                        }
                      >
                        Rejected
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

  `;


  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================

  box
    .querySelectorAll(
      "[data-payment-status]"
    )
    .forEach(select => {

      select.onchange =
        async () => {

          select.disabled =
            true;


          const paymentId =
            select.dataset.paymentStatus;


          const {
            error
          } = await db
            .from("payments")
            .update({
              status:
                select.value,

              updated_at:
                new Date().toISOString()
            })
            .eq(
              "id",
              paymentId
            );


          select.disabled =
            false;


          if (error) {

            console.error(
              "Payment status error:",
              error
            );

            show(
              error.message
            );

            return;
          }


          show(
            "Payment status updated successfully.",
            true
          );


          await loadPayments();

        };

    });


  // ==========================================================
  // PAYMENT PROOF
  // ==========================================================

  box
    .querySelectorAll(
      "[data-proof]"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          const proofPath =
            button.dataset.proof;


          if (!proofPath) {
            return;
          }


          button.disabled =
            true;

          button.textContent =
            "Opening...";


          try {

            const {
              data,
              error
            } = await db.storage
              .from("payment-proofs")
              .createSignedUrl(
                proofPath,
                300
              );


            if (error) {

              console.error(
                "Proof URL error:",
                error
              );

              show(
                "Could not open the proof of payment."
              );

              return;
            }


            if (
              data?.signedUrl
            ) {

              window.open(
                data.signedUrl,
                "_blank"
              );

            }

          } finally {

            button.disabled =
              false;

            button.textContent =
              "View Proof";

          }

        };

    });

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
// START
// ============================================================

init(); 
