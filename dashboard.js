// ==========================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// COURSES • ENROLMENTS • PAYMENTS
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

const paymentListEl = document.getElementById("payment-list");
const enrolmentsEl = document.getElementById("enrolments");
const coursesEl = document.getElementById("available-courses");


// ==========================================================
// GLOBAL DATA
// ==========================================================

let currentUser = null;
let currentStudent = null;
let currentEnrolments = [];
let currentCourses = [];
let currentPayments = [];


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


function hideMessage() {
  if (!messageEl) return;

  messageEl.textContent = "";
  messageEl.classList.add("hidden");
}


// ==========================================================
// HTML ESCAPE
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
// DATE
// ==========================================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}


// ==========================================================
// STATUS
// ==========================================================

function statusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "approved") {
    return "approved";
  }

  if (value === "rejected") {
    return "rejected";
  }

  return "pending";
}


function statusText(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "approved") {
    return "APPROVED";
  }

  if (value === "rejected") {
    return "REJECTED";
  }

  return "PENDING APPROVAL";
}


// ==========================================================
// AUTHENTICATION
// ==========================================================

async function getCurrentUser() {

  const {
    data,
    error
  } = await db.auth.getUser();

  if (error) {
    console.error("Auth error:", error);
    return null;
  }

  return data?.user || null;
}


// ==========================================================
// LOGOUT
// ==========================================================

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      await db.auth.signOut();

      window.location.href = "login.html";

    } catch (error) {

      console.error("Logout error:", error);

      showMessage(
        "Unable to log out. Please try again."
      );

    }

  });

}


// ==========================================================
// LOAD STUDENT RECORD
// ==========================================================

async function loadStudent() {

  const {
    data,
    error
  } = await db
    .from("students")
    .select("id,user_id,full_name,email")
    .eq("user_id", currentUser.id)
    .limit(1)
    .maybeSingle();


  if (error) {

    console.error("Student query error:", error);

    throw new Error(
      "We could not load your student profile."
    );

  }


  if (!data) {

    throw new Error(
      "Your student profile could not be found."
    );

  }


  currentStudent = data;


  if (userNameEl) {

    userNameEl.textContent =
      data.full_name || "Student";

  }


  if (userEmailEl) {

    userEmailEl.textContent =
      data.email ||
      currentUser.email ||
      "";

  }

}


// ==========================================================
// LOAD ENROLMENTS
// ==========================================================

async function loadEnrolments() {

  if (!enrolmentsEl) return;


  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';


  const {
    data,
    error
  } = await db
    .from("enrollments")
    .select(
      "id,student_id,course_id,enrollment_status,enrolled_at"
    )
    .eq("student_id", currentStudent.id)
    .order("enrolled_at", {
      ascending: false
    });


  if (error) {

    console.error("Enrolments error:", error);

    enrolmentsEl.innerHTML =
      '<p class="error">Unable to load your enrolments.</p>';

    return;

  }


  currentEnrolments = data || [];


  await loadEnrolmentCourses();

}


// ==========================================================
// LOAD COURSE INFORMATION FOR ENROLMENTS
// ==========================================================

async function loadEnrolmentCourses() {

  if (!enrolmentsEl) return;


  if (!currentEnrolments.length) {

    enrolmentsEl.innerHTML = `
      <div class="card">
        <h3>No enrolments yet</h3>
        <p>
          You have not enrolled in a course yet.
          Browse the available courses below to get started.
        </p>
      </div>
    `;

    await loadPayments();

    return;

  }


  const courseIds = [
    ...new Set(
      currentEnrolments
        .map(item => item.course_id)
        .filter(Boolean)
    )
  ];


  let courses = [];


  if (courseIds.length) {

    const {
      data,
      error
    } = await db
      .from("courses")
      .select("id,title,price,active")
      .in("id", courseIds);


    if (error) {

      console.error(
        "Enrolment courses error:",
        error
      );

    } else {

      courses = data || [];

    }

  }


  const courseMap = {};

  courses.forEach(course => {

    courseMap[course.id] = course;

  });


  enrolmentsEl.innerHTML =
    currentEnrolments
      .map(enrolment => {

        const course =
          courseMap[enrolment.course_id];


        const title =
          course?.title ||
          "Course";


        const price =
          course?.price || 0;


        const status =
          enrolment.enrollment_status ||
          "pending";


        return `
          <div class="card">

            <h3>
              ${escapeHtml(title)}
            </h3>

            <p>
              <strong>Course fee:</strong><br>
              ${money(price)}
            </p>

            <p>
              <strong>Status:</strong><br>
              ${escapeHtml(status)}
            </p>

            <p>
              <strong>Enrolled:</strong><br>
              ${formatDate(enrolment.enrolled_at)}
            </p>

            <span class="badge ${statusClass(status)}">
              ${escapeHtml(statusText(status))}
            </span>

          </div>
        `;

      })
      .join("");


  await loadPayments();

}


// ==========================================================
// LOAD AVAILABLE COURSES
// ==========================================================

async function loadCourses() {

  if (!coursesEl) return;


  coursesEl.innerHTML =
    '<p class="loading">Loading courses…</p>';


  const {
    data,
    error
  } = await db
    .from("courses")
    .select("id,title,price,active")
    .eq("active", true)
    .order("title", {
      ascending: true
    });


  if (error) {

    console.error("Courses error:", error);

    coursesEl.innerHTML =
      '<p class="error">Unable to load courses.</p>';

    return;

  }


  currentCourses = data || [];


  if (!currentCourses.length) {

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


  const enrolledCourseIds =
    new Set(
      currentEnrolments.map(
        item => item.course_id
      )
    );


  coursesEl.innerHTML =
    currentCourses
      .map(course => {

        const alreadyEnrolled =
          enrolledCourseIds.has(course.id);


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

              ?

              `
                <button
                  class="btn ghost"
                  type="button"
                  disabled
                >
                  Already Enrolled
                </button>
              `

              :

              `
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

      })
      .join("");


  document
    .querySelectorAll(".enrol-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const courseId =
            button.dataset.courseId;

          enrolInCourse(
            courseId,
            button
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

  if (!currentStudent) {

    showMessage(
      "Your student profile is not available."
    );

    return;

  }


  const course =
    currentCourses.find(
      item => item.id === courseId
    );


  if (!course) {

    showMessage(
      "The selected course could not be found."
    );

    return;

  }


  const alreadyEnrolled =
    currentEnrolments.some(
      item => item.course_id === courseId
    );


  if (alreadyEnrolled) {

    showMessage(
      "You are already enrolled in this course."
    );

    return;

  }


  if (button) {

    button.disabled = true;
    button.textContent = "Enrolling…";

  }


  hideMessage();


  const {
    data,
    error
  } = await db
    .from("enrollments")
    .insert({
      student_id: currentStudent.id,
      course_id: courseId,
      enrollment_status: "pending"
    })
    .select()
    .single();


  if (error) {

    console.error(
      "Enrolment insert error:",
      error
    );


    if (
      error.code === "23505"
    ) {

      showMessage(
        "You are already enrolled in this course."
      );

    } else {

      showMessage(
        "We could not complete your enrolment. Please try again."
      );

    }


    if (button) {

      button.disabled = false;
      button.textContent = "Enrol Now";

    }


    return;

  }


  currentEnrolments.unshift(data);


  showMessage(
    `${course.title} enrolment submitted successfully.`,
    true
  );


  await loadEnrolments();
  await loadCourses();

}


// ==========================================================
// LOAD PAYMENTS
// ==========================================================

async function loadPayments() {

  if (!paymentListEl) return;


  paymentListEl.innerHTML = `
    <div class="card">
      <p class="loading">
        Loading payment information…
      </p>
    </div>
  `;


  const {
    data,
    error
  } = await db
    .from("payments")
    .select(
      "id,student_id,enrolment_id,amount,payment_method,status,proof_url,notes,created_at,updated_at"
    )
    .eq("student_id", currentStudent.id)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Payments error:",
      error
    );


    paymentListEl.innerHTML = `
      <div class="card">
        <h3>Payments</h3>
        <p>
          Payment information could not be loaded.
        </p>
      </div>
    `;

    return;

  }


  currentPayments = data || [];


  renderPayments();

}


// ==========================================================
// RENDER PAYMENTS
// ==========================================================

function renderPayments() {

  if (!paymentListEl) return;


  if (!currentEnrolments.length) {

    paymentListEl.innerHTML = `
      <div class="card">

        <h3>
          Course Payments
        </h3>

        <p>
          Enrol in a course first to submit
          your payment information.
        </p>

      </div>
    `;

    return;

  }


  const courseMap = {};


  currentCourses.forEach(course => {

    courseMap[course.id] = course;

  });


  const enrolmentCourseIds =
    currentEnrolments
      .map(item => item.course_id)
      .filter(Boolean);


  if (enrolmentCourseIds.length) {

    loadPaymentCourseData(
      enrolmentCourseIds
    );

  }


  paymentListEl.innerHTML = `
    <div class="card">

      <h3>
        Submit Payment
      </h3>

      <p>
        Select one of your enrolments below
        and submit your payment information.
      </p>

      <form id="payment-form">

        <label for="payment-enrolment">
          Course
        </label>

        <select
          id="payment-enrolment"
          required
        >

          <option value="">
            Select your course
          </option>

          ${currentEnrolments
            .map(enrolment => {

              const course =
                courseMap[
                  enrolment.course_id
                ];


              return `
                <option
                  value="${escapeHtml(enrolment.id)}"
                >
                  ${escapeHtml(
                    course?.title ||
                    "Course"
                  )}
                  -
                  ${money(
                    course?.price || 0
                  )}
                </option>
              `;

            })
            .join("")}

        </select>


        <label for="payment-amount">
          Amount Paid (R)
        </label>

        <input
          id="payment-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Enter amount"
          required
        >


        <label for="payment-method">
          Payment Method
        </label>

        <select
          id="payment-method"
          required
        >

          <option value="">
            Select payment method
          </option>

          <option value="EFT / Bank Transfer">
            EFT / Bank Transfer
          </option>

          <option value="Cash Deposit">
            Cash Deposit
          </option>

          <option value="Other">
            Other
          </option>

        </select>


        <label for="payment-proof">
          Proof of Payment
        </label>

        <input
          id="payment-proof"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
        >

        <small>
          Accepted formats: PDF, JPG, JPEG or PNG.
          Maximum file size: 5 MB.
        </small>


        <label for="payment-notes">
          Notes
        </label>

        <textarea
          id="payment-notes"
          rows="4"
          placeholder="Optional payment notes"
        ></textarea>


        <button
          id="submit-payment"
          class="btn green"
          type="submit"
        >
          Submit Payment
        </button>

      </form>

    </div>


    <div class="payment-history">

      <h3>
        Payment History
      </h3>

      <div id="payment-history-list">
        ${renderPaymentHistory()}
      </div>

    </div>
  `;


  const paymentForm =
    document.getElementById(
      "payment-form"
    );


  if (paymentForm) {

    paymentForm.addEventListener(
      "submit",
      submitPayment
    );

  }


  const enrolmentSelect =
    document.getElementById(
      "payment-enrolment"
    );


  if (enrolmentSelect) {

    enrolmentSelect.addEventListener(
      "change",
      updatePaymentAmount
    );

  }

}


// ==========================================================
// LOAD COURSE DATA USED BY PAYMENTS
// ==========================================================

async function loadPaymentCourseData(
  courseIds
) {

  const missingIds =
    courseIds.filter(
      id =>
        !currentCourses.some(
          course => course.id === id
        )
    );


  if (!missingIds.length) {

    renderPaymentAmountDefaults();

    return;

  }


  const {
    data,
    error
  } = await db
    .from("courses")
    .select("id,title,price,active")
    .in("id", missingIds);


  if (error) {

    console.error(
      "Payment course lookup error:",
      error
    );

    return;

  }


  currentCourses = [
    ...currentCourses,
    ...(data || [])
  ];


  renderPaymentAmountDefaults();

}


// ==========================================================
// DEFAULT PAYMENT AMOUNT
// ==========================================================

function renderPaymentAmountDefaults() {

  const select =
    document.getElementById(
      "payment-enrolment"
    );


  if (!select) return;


  updatePaymentAmount();

}


// ==========================================================
// UPDATE PAYMENT AMOUNT
// ==========================================================

function updatePaymentAmount() {

  const select =
    document.getElementById(
      "payment-enrolment"
    );

  const amountInput =
    document.getElementById(
      "payment-amount"
    );


  if (!select || !amountInput) {
    return;
  }


  const enrolmentId =
    select.value;


  const enrolment =
    currentEnrolments.find(
      item => item.id === enrolmentId
    );


  if (!enrolment) {

    amountInput.value = "";

    return;

  }


  const course =
    currentCourses.find(
      item =>
        item.id === enrolment.course_id
    );


  if (!course) return;


  amountInput.value =
    Number(course.price || 0)
      .toFixed(2);

}


// ==========================================================
// PAYMENT HISTORY
// ==========================================================

function renderPaymentHistory() {

  if (!currentPayments.length) {

    return `
      <div class="card">

        <p>
          No payments have been submitted yet.
        </p>

      </div>
    `;

  }


  return currentPayments
    .map(payment => {

      const enrolment =
        currentEnrolments.find(
          item =>
            item.id === payment.enrolment_id
        );


      const course =
        currentCourses.find(
          item =>
            item.id ===
            enrolment?.course_id
        );


      return `
        <div class="card">

          <h3>
            ${escapeHtml(
              course?.title ||
              "Course Payment"
            )}
          </h3>

          <p>
            <strong>Amount paid:</strong><br>
            ${money(payment.amount)}
          </p>

          <p>
            <strong>Payment method:</strong><br>
            ${escapeHtml(
              payment.payment_method ||
              "—"
            )}
          </p>

          <p>
            <strong>Date:</strong><br>
            ${formatDate(
              payment.created_at
            )}
          </p>

          <span
            class="badge ${statusClass(
              payment.status
            )}"
          >
            ${escapeHtml(
              statusText(payment.status)
            )}
          </span>

          ${
            payment.proof_url
              ?
              `
                <p>
                  <strong>
                    Proof of payment:
                  </strong><br>
                  Submitted
                </p>
              `
              :
              ""
          }

        </div>
      `;

    })
    .join("");

}


// ==========================================================
// SUBMIT PAYMENT
// ==========================================================

async function submitPayment(event) {

  event.preventDefault();


  hideMessage();


  const submitButton =
    document.getElementById(
      "submit-payment"
    );


  const enrolmentSelect =
    document.getElementById(
      "payment-enrolment"
    );


  const amountInput =
    document.getElementById(
      "payment-amount"
    );


  const methodSelect =
    document.getElementById(
      "payment-method"
    );


  const proofInput =
    document.getElementById(
      "payment-proof"
    );


  const notesInput =
    document.getElementById(
      "payment-notes"
    );


  const enrolmentId =
    enrolmentSelect?.value;


  const amount =
    Number(amountInput?.value);


  const paymentMethod =
    methodSelect?.value;


  const notes =
    notesInput?.value.trim() || null;


  if (!enrolmentId) {

    showMessage(
      "Please select your course."
    );

    return;

  }


  if (
    !amount ||
    amount <= 0
  ) {

    showMessage(
      "Please enter the amount you paid."
    );

    return;

  }


  if (!paymentMethod) {

    showMessage(
      "Please select your payment method."
    );

    return;

  }


  const enrolment =
    currentEnrolments.find(
      item => item.id === enrolmentId
    );


  if (!enrolment) {

    showMessage(
      "The selected enrolment could not be found."
    );

    return;

  }


  const existingPending =
    currentPayments.find(
      payment =>
        payment.enrolment_id === enrolmentId &&
        payment.status === "pending"
    );


  if (existingPending) {

    showMessage(
      "You already have a payment awaiting approval for this course."
    );

    return;

  }


  let proofFile = null;


  if (
    proofInput &&
    proofInput.files &&
    proofInput.files.length
  ) {

    proofFile =
      proofInput.files[0];


    if (
      proofFile.size >
      5 * 1024 * 1024
    ) {

      showMessage(
        "The proof of payment must be 5 MB or smaller."
      );

      return;

    }


    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];


    if (
      !allowedTypes.includes(
        proofFile.type
      )
    ) {

      showMessage(
        "Please upload a PDF, JPG, JPEG or PNG file."
      );

      return;

    }

  }


  if (submitButton) {

    submitButton.disabled = true;
    submitButton.textContent =
      "Submitting…";

  }


  try {

    const paymentId =
      crypto.randomUUID();


    let proofPath = null;


    // ------------------------------------------------------
    // UPLOAD PROOF FIRST
    // ------------------------------------------------------

    if (proofFile) {

      const extension =
        proofFile.name
          .split(".")
          .pop()
          .toLowerCase();


      proofPath =
        `${currentUser.id}/${paymentId}.${extension}`;


      const {
        error: uploadError
      } = await db.storage
        .from("payment-proofs")
        .upload(
          proofPath,
          proofFile,
          {
            cacheControl: "3600",
            upsert: false
          }
        );


      if (uploadError) {

        console.error(
          "Proof upload error:",
          uploadError
        );

        throw new Error(
          "The proof of payment could not be uploaded."
        );

      }

    }


    // ------------------------------------------------------
    // CREATE PAYMENT RECORD
    // ------------------------------------------------------

    const {
      data,
      error
    } = await db
      .from("payments")
      .insert({
        id: paymentId,
        student_id: currentStudent.id,
        enrolment_id: enrolmentId,
        amount: amount,
        payment_method: paymentMethod,
        status: "pending",
        proof_url: proofPath,
        notes: notes
      })
      .select()
      .single();


    if (error) {

      console.error(
        "Payment insert error:",
        error
      );


      // Remove uploaded proof if database insert failed.

      if (proofPath) {

        await db.storage
          .from("payment-proofs")
          .remove([
            proofPath
          ]);

      }


      throw new Error(
        "Your payment could not be submitted."
      );

    }


    currentPayments.unshift(data);


    showMessage(
      "Payment submitted successfully. Your payment is now awaiting approval.",
      true
    );


    // Reset form.

    const form =
      document.getElementById(
        "payment-form"
      );


    if (form) {
      form.reset();
    }


    await loadPayments();


  } catch (error) {

    console.error(
      "Payment submission error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to submit payment. Please try again."
    );

  } finally {

    if (submitButton) {

      submitButton.disabled = false;
      submitButton.textContent =
        "Submit Payment";

    }

  }

}


// ==========================================================
// INITIALISE DASHBOARD
// ==========================================================

async function init() {

  try {

    hideMessage();


    currentUser =
      await getCurrentUser();


    if (!currentUser) {

      window.location.href =
        "login.html";

      return;

    }


    await loadStudent();

    await loadEnrolments();

    await loadCourses();


    console.log(
      "FUNDA STUDENT DASHBOARD READY"
    );


  } catch (error) {

    console.error(
      "Dashboard initialisation error:",
      error
    );


    if (enrolmentsEl) {

      enrolmentsEl.innerHTML =
        `
          <div class="card">
            <h3>Dashboard Error</h3>
            <p>
              ${escapeHtml(
                error.message ||
                "Unable to load the dashboard."
              )}
            </p>
          </div>
        `;

    }


    showMessage(
      error.message ||
      "Unable to load your dashboard."
    );

  }

}


// ==========================================================
// START
// ==========================================================

init(); 
