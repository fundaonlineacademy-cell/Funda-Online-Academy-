// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD
// SIX-TAB VERSION
// ============================================================

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const userNameEl =
  document.getElementById("user-name");

const userEmailEl =
  document.getElementById("user-email");

const studentEmailDisplay =
  document.getElementById("student-email-display");

const enrolmentsEl =
  document.getElementById("enrolments");

const coursesEl =
  document.getElementById("available-courses");

const paymentListEl =
  document.getElementById("payment-list");

const messageEl =
  document.getElementById("message");

const logoutBtn =
  document.getElementById("logout");

const declarationStatus =
  document.getElementById("declaration-status");

const declarationActions =
  document.getElementById("declaration-actions");

const acceptDeclarationBtn =
  document.getElementById("accept-declaration");

const rejectDeclarationBtn =
  document.getElementById("reject-declaration");


// ============================================================
// DATA
// ============================================================

let currentStudent = null;

let currentEnrolments = [];

let currentCourses = [];

let currentPayments = [];


// ============================================================
// SECURITY
// ============================================================

function escapeHTML(value){

  if(
    value === null ||
    value === undefined
  ){
    return "";
  }

  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


// ============================================================
// MONEY
// ============================================================

function formatMoney(value){

  const n = Number(value);

  if(!Number.isFinite(n)){
    return "R0.00";
  }

  return "R" +
    n.toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits:2,
        maximumFractionDigits:2
      }
    );
}


// ============================================================
// DATE
// ============================================================

function formatDate(value){

  if(!value){
    return "—";
  }

  const d =
    new Date(value);

  if(
    Number.isNaN(
      d.getTime()
    )
  ){
    return "—";
  }

  return d.toLocaleDateString(
    "en-ZA",
    {
      year:"numeric",
      month:"short",
      day:"numeric"
    }
  );
}


// ============================================================
// STATUS
// ============================================================

function statusOf(row){

  return String(
    row?.enrollment_status ??
    row?.status ??
    "pending"
  )
  .trim()
  .toLowerCase();
}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
  text,
  success=false
){

  if(!messageEl){
    return;
  }

  messageEl.textContent =
    text;

  messageEl.className =
    "message " +
    (success
      ? "success"
      : "error");

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}


// ============================================================
// CURRENT USER
// ============================================================

async function currentUser(){

  const {
    data,
    error
  } = await db.auth.getUser();

  if(error){

    console.error(
      "Auth error:",
      error
    );

    return null;
  }

  return data?.user || null;
}


// ============================================================
// STUDENT
// ============================================================

async function getStudent(userId){

  const {
    data,
    error
  } = await db
    .from("students")
    .select("*")
    .eq("user_id",userId)
    .maybeSingle();

  if(error){
    throw error;
  }

  return data;
}


// ============================================================
// COURSES
// ============================================================

async function getCourses(ids=null){

  let q =
    db
      .from("courses")
      .select("*");


  if(
    ids &&
    ids.length
  ){

    q =
      q.in(
        "id",
        ids
      );

  }else{

    q =
      q
        .eq("active",true)
        .order(
          "title",
          {
            ascending:true
          }
        );

  }


  const {
    data,
    error
  } = await q;


  if(!error){
    return data || [];
  }


  // Fallback for older course structure

  if(
    ids &&
    ids.length
  ){

    const fallback =
      await db
        .from("courses")
        .select("*")
        .in("id",ids);

    if(fallback.error){
      throw error;
    }

    return fallback.data || [];

  }


  const fallback =
    await db
      .from("courses")
      .select("*")
      .eq("active",true)
      .order(
        "name",
        {
          ascending:true
        }
      );


  if(fallback.error){
    throw error;
  }

  return fallback.data || [];
}


// ============================================================
// COURSE NAME
// ============================================================

function courseTitle(course){

  return (
    course?.title ||
    course?.name ||
    course?.course_name ||
    "Course"
  );
}


// ============================================================
// COURSE PRICE
// ============================================================

function coursePrice(course){

  return (
    course?.price ??
    course?.amount ??
    course?.course_price ??
    0
  );
}


// ============================================================
// PAYMENT RULE
// ============================================================

function paymentRuleFor(course){

  const price =
    Number(
      coursePrice(course)
    );


  if(
    Number.isFinite(price) &&
    price > 2000
  ){

    return `
      <div class="payment-rule">
        <strong>Payment plan:</strong>
        Minimum 50% upfront.
        The remaining balance is payable on completion.
        A payment plan may be arranged with the academy.
      </div>
    `;

  }


  return `
    <div class="payment-rule">
      <strong>Payment requirement:</strong>
      Full course amount must be paid.
    </div>
  `;
}


// ============================================================
// LOAD ENROLMENTS
// ============================================================

async function loadEnrolments(
  studentId
){

  enrolmentsEl.innerHTML =
    '<p class="loading">Loading enrolments…</p>';


  try{

    const {
      data:rows,
      error
    } = await db
      .from("enrollments")
      .select("*")
      .eq(
        "student_id",
        studentId
      )
      .order(
        "enrolled_at",
        {
          ascending:false
        }
      );


    if(error){
      throw error;
    }


    currentEnrolments =
      rows || [];


    updateOverview();


    if(!currentEnrolments.length){

      enrolmentsEl.innerHTML = `
        <div class="empty-card">

          <h3>No enrolments yet</h3>

          <p>
            Choose a course from the Available Courses tab
            to start your learning journey.
          </p>

          <div class="funda-card-actions">

            <button
              type="button"
              class="btn green"
              data-open-tab="courses"
            >
              🎓 Browse Courses
            </button>

          </div>

        </div>
      `;

      attachTabButtons();

      return;
    }


    const ids = [
      ...new Set(
        currentEnrolments
          .map(
            r => r.course_id
          )
          .filter(Boolean)
      )
    ];


    const courses =
      await getCourses(ids);


    const map =
      new Map(
        courses.map(
          c => [
            String(c.id),
            c
          ]
        )
      );


    enrolmentsEl.innerHTML =
      currentEnrolments
        .map(row => {

          const course =
            map.get(
              String(
                row.course_id
              )
            );


          const status =
            statusOf(row);


          const approved =
            status === "approved" ||
            status === "active";


          const amount =
            row.amount ??
            coursePrice(course);


          return `
            <div class="dashboard-card">

              <span
                class="funda-status ${escapeHTML(status)}"
              >
                ${escapeHTML(status)}
              </span>

              <h3>
                ${escapeHTML(
                  courseTitle(course)
                )}
              </h3>

              <p>
                ${escapeHTML(
                  course?.description ||
                  "Your enrolled online course."
                )}
              </p>

              <p style="margin-top:10px">
                <strong>Course fee:</strong>
                ${formatMoney(amount)}
              </p>

              <p>
                <strong>Enrolled:</strong>
                ${formatDate(
                  row.enrolled_at ||
                  row.created_at
                )}
              </p>

              ${
                approved

                ? `

                  ${paymentRuleFor(course)}

                  <div class="funda-card-actions">

                    <button
                      class="btn green study-btn"
                      data-course-id="${escapeHTML(
                        row.course_id
                      )}"
                    >
                      📚 Study Course
                    </button>

                  </div>
                `

                :

                `
                  <p style="margin-top:14px;color:#777">
                    Your enrolment is awaiting approval.
                  </p>
                `
              }

            </div>
          `;

        })
        .join("");


    document
      .querySelectorAll(".study-btn")
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () => {

            const id =
              btn.dataset.courseId;

            if(id){

              location.href =
                "course-study.html?id=" +
                encodeURIComponent(id);

            }

          }
        );

      });


  }catch(err){

    console.error(
      "Enrolments:",
      err
    );


    enrolmentsEl.innerHTML = `
      <div class="dashboard-card">

        <h3>
          Unable to load enrolments
        </h3>

        <p>
          ${escapeHTML(
            err.message ||
            "Please refresh and try again."
          )}
        </p>

      </div>
    `;

  }

}


// ============================================================
// AVAILABLE COURSES
// ============================================================

async function loadAvailableCourses(
  studentId
){

  coursesEl.innerHTML =
    '<p class="loading">Loading courses…</p>';


  try{

    const courses =
      await getCourses();


    currentCourses =
      courses;


    updateOverview();


    if(!courses.length){

      coursesEl.innerHTML = `
        <div class="empty-card">

          <h3>No courses available</h3>

          <p>
            Courses will appear here when they become available.
          </p>

        </div>
      `;

      return;
    }


    const {
      data:existing,
      error
    } = await db
      .from("enrollments")
      .select(
        "course_id,enrollment_status"
      )
      .eq(
        "student_id",
        studentId
      );


    if(error){

      console.warn(
        "Existing enrolments:",
        error
      );

    }


    const enrolled =
      new Map(
        (existing || [])
          .map(
            r => [
              String(r.course_id),
              statusOf(r)
            ]
          )
      );


    coursesEl.innerHTML =
      courses
        .map(course => {

          const id =
            String(course.id);

          const status =
            enrolled.get(id);


          return `
            <div class="dashboard-card">

              <div class="card-icon">
                🎓
              </div>

              <h3>
                ${escapeHTML(
                  courseTitle(course)
                )}
              </h3>

              <p>
                ${escapeHTML(
                  course.description ||
                  "Online short course."
                )}
              </p>

              <p style="margin-top:12px">
                <strong>Course fee:</strong>
                ${formatMoney(
                  coursePrice(course)
                )}
              </p>

              ${paymentRuleFor(course)}

              <div class="funda-card-actions">

                ${
                  status

                  ?

                  `
                    <span
                      class="funda-status ${escapeHTML(status)}"
                    >
                      ${escapeHTML(status)}
                    </span>
                  `

                  :

                  `
                    <button
                      type="button"
                      class="btn green enrol-btn"
                      data-course-id="${escapeHTML(id)}"
                    >
                      Enrol Now
                    </button>
                  `
                }

              </div>

            </div>
          `;

        })
        .join("");


    document
      .querySelectorAll(".enrol-btn")
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () => {

            enrolStudent(
              studentId,
              btn.dataset.courseId,
              btn
            );

          }
        );

      });


  }catch(err){

    console.error(
      "Courses:",
      err
    );


    coursesEl.innerHTML = `
      <div class="dashboard-card">

        <h3>
          Unable to load courses
        </h3>

        <p>
          ${escapeHTML(
            err.message ||
            "Please refresh and try again."
          )}
        </p>

      </div>
    `;

  }

}


// ============================================================
// ENROL STUDENT
// ============================================================

async function enrolStudent(
  studentId,
  courseId,
  button
){

  if(
    !studentId ||
    !courseId
  ){
    return;
  }


  // Require declaration

  const accepted =
    localStorage.getItem(
      "foa_declaration_accepted"
    );


  if(accepted !== "true"){

    showMessage(
      "Please read and accept the Student Information Declaration before enrolling."
    );


    openTab("policies");

    return;

  }


  button.disabled =
    true;

  button.textContent =
    "Enrolling…";


  try{

    const {
      data:existing,
      error:checkError
    } = await db
      .from("enrollments")
      .select(
        "id,enrollment_status"
      )
      .eq(
        "student_id",
        studentId
      )
      .eq(
        "course_id",
        courseId
      )
      .maybeSingle();


    if(checkError){
      throw checkError;
    }


    if(existing){

      showMessage(
        "You are already enrolled in this course."
      );

      button.disabled =
        false;

      button.textContent =
        "Enrol Now";

      return;

    }


    const {
      data:course,
      error:courseError
    } = await db
      .from("courses")
      .select("*")
      .eq(
        "id",
        courseId
      )
      .maybeSingle();


    if(courseError){
      throw courseError;
    }


    const payload = {

      student_id:
        studentId,

      course_id:
        courseId,

      enrollment_status:
        "pending",

      enrolled_at:
        new Date().toISOString(),

      amount:
        course?.price ??
        null

    };


    const {
      error:insertError
    } = await db
      .from("enrollments")
      .insert(
        payload
      );


    if(insertError){
      throw insertError;
    }


    showMessage(
      "Enrolment submitted successfully. Please wait for academy approval.",
      true
    );


    await Promise.all([
      loadEnrolments(studentId),
      loadAvailableCourses(studentId)
    ]);


    openTab("enrolments");


  }catch(err){

    console.error(
      "Enrolment:",
      err
    );


    showMessage(
      "Unable to complete enrolment: " +
      (
        err.message ||
        "Please try again."
      )
    );


    button.disabled =
      false;

    button.textContent =
      "Enrol Now";

  }

}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments(
  studentId
){

  paymentListEl.innerHTML = `
    <div class="dashboard-card">

      <p class="loading">
        Loading payment history…
      </p>

    </div>
  `;


  try{

    const {
      data:payments,
      error
    } = await db
      .from("payments")
      .select("*")
      .eq(
        "student_id",
        studentId
      )
      .order(
        "created_at",
        {
          ascending:false
        }
      );


    if(error){
      throw error;
    }


    currentPayments =
      payments || [];


    updateOverview();


    if(!currentPayments.length){

      paymentListEl.innerHTML = `
        <div class="dashboard-card">

          <h3>
            Payment History
          </h3>

          <p>
            No payment records have been recorded yet.
          </p>

          <div class="funda-card-actions">

            <button
              class="btn green"
              type="button"
              data-open-tab="banking"
            >
              🏦 View Banking Information
            </button>

          </div>

        </div>
      `;

      attachTabButtons();

      return;

    }


    const courseIds =
      [
        ...new Set(
          currentPayments
            .map(
              p => p.course_id
            )
            .filter(Boolean)
        )
      ];


    let courseMap =
      new Map();


    if(courseIds.length){

      const courses =
        await getCourses(
          courseIds
        );

      courseMap =
        new Map(
          courses.map(
            c => [
              String(c.id),
              c
            ]
          )
        );

    }


    paymentListEl.innerHTML =
      `
        <div style="
          display:flex;
          flex-direction:column;
          gap:14px;
        ">

          ${
            currentPayments
              .map(p => {

                const course =
                  courseMap.get(
                    String(
                      p.course_id
                    )
                  );


                const status =
                  String(
                    p.payment_status ??
                    p.status ??
                    "pending"
                  ).toLowerCase();


                const proof =
                  p.proof_url ||
                  p.proof_of_payment_url ||
                  p.receipt_url ||
                  p.file_url;


                const method =
                  p.payment_method ||
                  p.method ||
                  "Not specified";


                const amount =
                  p.amount ??
                  coursePrice(course);


                return `

                  <div class="dashboard-card">

                    <h3>
                      ${escapeHTML(
                        courseTitle(course)
                      )}
                    </h3>

                    <p>
                      <strong>Amount:</strong>
                      ${formatMoney(amount)}
                    </p>

                    <p>
                      <strong>Method:</strong>
                      ${escapeHTML(method)}
                    </p>

                    <p>
                      <strong>Date:</strong>
                      ${formatDate(
                        p.created_at ||
                        p.paid_at
                      )}
                    </p>

                    <p>
                      <strong>Status:</strong>

                      <span
                        class="funda-status ${escapeHTML(status)}"
                      >
                        ${escapeHTML(status)}
                      </span>

                    </p>

                    <p>
                      <strong>Proof:</strong>

                      ${
                        proof

                        ?

                        `
                          <a
                            class="btn green"
                            target="_blank"
                            rel="noopener noreferrer"
                            href="${escapeHTML(proof)}"
                          >
                            View submitted proof
                          </a>
                        `

                        :

                        "Not available"
                      }

                    </p>

                  </div>

                `;

              })
              .join("")
          }

        </div>
      `;


  }catch(err){

    console.error(
      "Payments:",
      err
    );


    paymentListEl.innerHTML = `
      <div class="dashboard-card">

        <h3>
          Payment History
        </h3>

        <p>
          Payment information could not be loaded right now.
        </p>

      </div>
    `;

  }

}


// ============================================================
// DECLARATION
// ============================================================

function loadDeclaration(){

  const accepted =
    localStorage.getItem(
      "foa_declaration_accepted"
    );


  if(
    accepted === "true"
  ){

    declarationStatus.innerHTML = `
      <div class="accepted-box">
        ✓ Declaration accepted.
        You may now enrol for courses.
      </div>
    `;

    declarationActions.style.display =
      "none";

  }else{

    declarationStatus.innerHTML = `
      <p style="margin-bottom:15px;color:#8a6500">
        Please accept the declaration before enrolling.
      </p>
    `;

    declarationActions.style.display =
      "flex";

  }

}


// ============================================================
// ACCEPT DECLARATION
// ============================================================

function acceptDeclaration(){

  localStorage.setItem(
    "foa_declaration_accepted",
    "true"
  );


  loadDeclaration();


  showMessage(
    "Thank you. Your declaration has been accepted.",
    true
  );

}


// ============================================================
// REJECT DECLARATION
// ============================================================

function rejectDeclaration(){

  localStorage.removeItem(
    "foa_declaration_accepted"
  );


  loadDeclaration();


  showMessage(
    "You have rejected the declaration. You will need to accept it before enrolling for a course."
  );

}


// ============================================================
// TAB SYSTEM
// ============================================================

function openTab(tabName){

  document
    .querySelectorAll(
      ".dashboard-tab"
    )
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.tab === tabName
      );

    });


  document
    .querySelectorAll(
      ".tab-content"
    )
    .forEach(section => {

      section.classList.toggle(
        "active",
        section.id ===
        "tab-" + tabName
      );

    });


  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


// ============================================================
// ATTACH TAB BUTTONS
// ============================================================

function attachTabButtons(){

  document
    .querySelectorAll(
      "[data-open-tab]"
    )
    .forEach(button => {

      button.onclick =
        () => {

          openTab(
            button.dataset.openTab
          );

        };

    });

}


// ============================================================
// OVERVIEW
// ============================================================

function updateOverview(){

  const enrolmentCount =
    document.getElementById(
      "overview-enrolment-count"
    );

  const courseCount =
    document.getElementById(
      "overview-course-count"
    );

  const paymentCount =
    document.getElementById(
      "overview-payment-count"
    );


  if(enrolmentCount){

    enrolmentCount.textContent =
      currentEnrolments.length;

  }


  if(courseCount){

    courseCount.textContent =
      currentCourses.length;

  }


  if(paymentCount){

    paymentCount.textContent =
      currentPayments.length;

  }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout(){

  const {
    error
  } = await db.auth.signOut();


  if(error){

    showMessage(
      "Unable to log out. Please try again."
    );

    return;

  }


  location.href =
    "auth.html";

}


// ============================================================
// INITIALISE
// ============================================================

async function initDashboard(){

  try{

    const user =
      await currentUser();


    if(!user){

      location.href =
        "auth.html";

      return;

    }


    const student =
      await getStudent(
        user.id
      );


    if(!student){

      showMessage(
        "Your student profile could not be found. Please contact the academy."
      );


      if(userEmailEl){

        userEmailEl.textContent =
          user.email || "";

      }

      return;

    }


    currentStudent =
      student;


    const name =
      student.full_name ||
      student.name ||
      user.user_metadata?.full_name ||
      "Student";


    if(userNameEl){

      userNameEl.textContent =
        name;

    }


    if(userEmailEl){

      userEmailEl.textContent =
        user.email || "";

    }


    if(studentEmailDisplay){

      studentEmailDisplay.textContent =
        user.email || "";

    }


    loadDeclaration();


    await Promise.all([

      loadEnrolments(
        student.id
      ),

      loadAvailableCourses(
        student.id
      ),

      loadPayments(
        student.id
      )

    ]);


    attachTabButtons();


  }catch(err){

    console.error(
      "Dashboard:",
      err
    );


    showMessage(
      "Unable to load your dashboard: " +
      (
        err.message ||
        "Please refresh the page."
      )
    );

  }

}


// ============================================================
// EVENTS
// ============================================================

document
  .querySelectorAll(
    ".dashboard-tab"
  )
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        openTab(
          tab.dataset.tab
        );

      }
    );

  });


if(acceptDeclarationBtn){

  acceptDeclarationBtn.addEventListener(
    "click",
    acceptDeclaration
  );

}


if(rejectDeclarationBtn){

  rejectDeclarationBtn.addEventListener(
    "click",
    rejectDeclaration
  );

}


if(logoutBtn){

  logoutBtn.addEventListener(
    "click",
    logout
  );

}


if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initDashboard
  );

}else{

  initDashboard();

      }
