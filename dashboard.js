// ============================================================
// FUNDA ONLINE ACADEMY
// DASHBOARD DIAGNOSTIC VERSION
//
// PURPOSE:
// Find EXACTLY why "My Studies" stays on Loading.
//
// DO NOT change the HTML or database yet.
// Replace the ENTIRE dashboard.js with this file.
// ============================================================

console.log("==========================================");
console.log("FUNDA DASHBOARD DIAGNOSTIC STARTED");
console.log("==========================================");


// ============================================================
// ELEMENTS
// ============================================================

const messageEl = document.getElementById("message");
const studyListEl = document.getElementById("study-list");
const paymentListEl = document.getElementById("payment-list");
const enrolmentsEl = document.getElementById("enrolments");
const availableCoursesEl = document.getElementById("available-courses");


// ============================================================
// SIMPLE DISPLAY HELPERS
// ============================================================

function showMessage(text, type = "error") {

  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;

  messageEl.className =
    "message " +
    (type === "success" ? "success" : "error");
}


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


function diagnosticBox(title, text, success = false) {

  return `
    <div style="
      background:${success ? "#e8f7ed" : "#fff4f4"};
      border:2px solid ${success ? "#1f9d55" : "#d33"};
      border-radius:15px;
      padding:18px;
      margin-bottom:15px;
      line-height:1.6;
    ">

      <strong style="
        display:block;
        font-size:18px;
        margin-bottom:8px;
      ">
        ${success ? "✅" : "❌"} ${escapeHtml(title)}
      </strong>

      ${escapeHtml(text)}

    </div>
  `;
}


function showStudyDiagnostic(title, text, success = false) {

  if (!studyListEl) {
    return;
  }

  studyListEl.innerHTML =
    diagnosticBox(
      title,
      text,
      success
    );
}


// ============================================================
// STEP 1
// CHECK SUPABASE LIBRARY
// ============================================================

function checkSupabaseLibrary() {

  console.log("STEP 1: Checking Supabase library...");

  if (typeof supabase === "undefined") {

    showStudyDiagnostic(
      "STEP 1 FAILED — Supabase library not loaded",
      "The Supabase JavaScript library is not available. This means dashboard.js cannot create the database connection.",
      false
    );

    return false;
  }

  console.log("STEP 1 SUCCESS: Supabase library exists.");

  return true;
}


// ============================================================
// STEP 2
// CHECK CONFIGURATION
// ============================================================

function checkConfiguration() {

  console.log("STEP 2: Checking Supabase configuration...");

  console.log(
    "SUPABASE_URL:",
    window.SUPABASE_URL
  );

  console.log(
    "SUPABASE_ANON_KEY exists:",
    !!window.SUPABASE_ANON_KEY
  );


  if (!window.SUPABASE_URL) {

    showStudyDiagnostic(
      "STEP 2 FAILED — SUPABASE_URL missing",
      "supabase-config.js loaded incorrectly or does not define window.SUPABASE_URL.",
      false
    );

    return false;
  }


  if (!window.SUPABASE_ANON_KEY) {

    showStudyDiagnostic(
      "STEP 2 FAILED — SUPABASE_ANON_KEY missing",
      "supabase-config.js loaded incorrectly or does not define window.SUPABASE_ANON_KEY.",
      false
    );

    return false;
  }


  console.log("STEP 2 SUCCESS: Configuration exists.");

  return true;
}


// ============================================================
// CREATE DATABASE CONNECTION
// ============================================================

let db = null;

function createDatabaseConnection() {

  console.log("STEP 3: Creating Supabase connection...");

  try {

    db = supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log(
      "STEP 3 SUCCESS: Supabase client created."
    );

    return true;

  } catch (error) {

    console.error(
      "STEP 3 FAILED:",
      error
    );

    showStudyDiagnostic(
      "STEP 3 FAILED — Could not create Supabase connection",
      error.message || String(error),
      false
    );

    return false;
  }
}


// ============================================================
// STEP 4
// CHECK LOGGED-IN USER
// ============================================================

async function checkUser() {

  console.log("STEP 4: Checking authenticated user...");

  try {

    const result =
      await db.auth.getUser();


    console.log(
      "AUTH RESULT:",
      result
    );


    if (result.error) {

      throw result.error;
    }


    if (!result.data || !result.data.user) {

      showStudyDiagnostic(
        "STEP 4 FAILED — No logged-in user",
        "Supabase is working, but there is no authenticated user. Please log in again.",
        false
      );

      return null;
    }


    const user =
      result.data.user;


    console.log(
      "STEP 4 SUCCESS — User:",
      user.id,
      user.email
    );


    const userEmail =
      document.getElementById("user-email");


    if (userEmail) {

      userEmail.textContent =
        user.email || "";
    }


    return user;

  } catch (error) {

    console.error(
      "STEP 4 FAILED:",
      error
    );

    showStudyDiagnostic(
      "STEP 4 FAILED — Authentication error",
      error.message || String(error),
      false
    );

    return null;
  }
}


// ============================================================
// STEP 5
// CHECK STUDENT RECORD
// ============================================================

async function checkStudent(user) {

  console.log(
    "STEP 5: Looking for student record..."
  );

  console.log(
    "Searching students.user_id =",
    user.id
  );


  try {

    const result =
      await db
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();


    console.log(
      "STUDENT QUERY RESULT:",
      result
    );


    if (result.error) {

      throw result.error;
    }


    if (!result.data) {

      showStudyDiagnostic(
        "STEP 5 FAILED — Student record not found",
        "The logged-in Supabase user exists, but there is no matching row in the students table where user_id equals the logged-in user's ID.",
        false
      );

      return null;
    }


    console.log(
      "STEP 5 SUCCESS — Student:",
      result.data
    );


    const userName =
      document.getElementById("user-name");


    if (userName) {

      userName.textContent =
        result.data.full_name ||
        "Student";
    }


    return result.data;

  } catch (error) {

    console.error(
      "STEP 5 FAILED:",
      error
    );

    showStudyDiagnostic(
      "STEP 5 FAILED — Cannot read students table",
      error.message || String(error),
      false
    );

    return null;
  }
}


// ============================================================
// STEP 6
// CHECK ENROLLMENTS
// ============================================================

async function checkEnrollments(student) {

  console.log(
    "STEP 6: Checking enrollments..."
  );

  console.log(
    "Searching enrollments.student_id =",
    student.id
  );


  try {

    const result =
      await db
        .from("enrollments")
        .select(`
          id,
          student_id,
          course_id,
          enrollment_status
        `)
        .eq("student_id", student.id);


    console.log(
      "ENROLLMENTS QUERY RESULT:",
      result
    );


    if (result.error) {

      throw result.error;
    }


    const enrollments =
      result.data || [];


    console.log(
      "Number of enrollments:",
      enrollments.length
    );


    if (!enrollments.length) {

      showStudyDiagnostic(
        "STEP 6 SUCCESS — No enrolments found",
        "The database connection is working and the student record was found, but this student currently has no rows in the enrollments table.",
        true
      );

      return [];
    }


    showStudyDiagnostic(
      "STEP 6 SUCCESS — Enrolments found",
      "The dashboard can successfully read the student's enrolments. Number found: " + enrollments.length,
      true
    );


    return enrollments;

  } catch (error) {

    console.error(
      "STEP 6 FAILED:",
      error
    );

    showStudyDiagnostic(
      "STEP 6 FAILED — Cannot read enrollments",
      error.message || String(error),
      false
    );

    return null;
  }
}


// ============================================================
// STEP 7
// CHECK COURSES
// ============================================================

async function checkCourses(enrollments) {

  console.log(
    "STEP 7: Checking courses..."
  );


  if (!enrollments || !enrollments.length) {

    console.log(
      "STEP 7 SKIPPED — no enrollments."
    );

    return;
  }


  for (const enrollment of enrollments) {

    console.log(
      "Checking course:",
      enrollment.course_id
    );


    try {

      const result =
        await db
          .from("courses")
          .select("*")
          .eq("id", enrollment.course_id)
          .maybeSingle();


      console.log(
        "COURSE RESULT:",
        result
      );


      if (result.error) {

        console.error(
          "Course query error:",
          result.error
        );

        showStudyDiagnostic(
          "STEP 7 FAILED — Course could not be read",
          result.error.message || String(result.error),
          false
        );

        return;
      }


      if (!result.data) {

        showStudyDiagnostic(
          "STEP 7 FAILED — Course not found",
          "The enrolment points to course ID " +
          enrollment.course_id +
          ", but no matching course was found in the courses table.",
          false
        );

        return;
      }


      console.log(
        "STEP 7 SUCCESS — Course found:",
        result.data
      );
    }

    catch (error) {

      console.error(
        "Course check error:",
        error
      );

      showStudyDiagnostic(
        "STEP 7 FAILED — Course query error",
        error.message || String(error),
        false
      );

      return;
    }
  }


  showStudyDiagnostic(
    "STEP 7 SUCCESS — Course found",
    "The student's enrolment points to a course that can be read successfully from the courses table.",
    true
  );
}


// ============================================================
// STEP 8
// CHECK COURSE MODULES
// ============================================================

async function checkModules(enrollments) {

  console.log(
    "STEP 8: Checking course_modules..."
  );


  if (!enrollments || !enrollments.length) {

    console.log(
      "STEP 8 SKIPPED — no enrolments."
    );

    return;
  }


  const courseId =
    enrollments[0].course_id;


  try {

    const result =
      await db
        .from("course_modules")
        .select(`
          id,
          course_id,
          module_number,
          module_name,
          description
        `)
        .eq("course_id", courseId)
        .order("module_number", {
          ascending: true
        });


    console.log(
      "MODULE QUERY RESULT:",
      result
    );


    if (result.error) {

      showStudyDiagnostic(
        "STEP 8 FAILED — Cannot read course_modules",
        result.error.message || String(result.error),
        false
      );

      return;
    }


    const modules =
      result.data || [];


    if (!modules.length) {

      showStudyDiagnostic(
        "STEP 8 SUCCESS — No modules found",
        "The course exists, but no course_modules rows were found for this course ID.",
        true
      );

      return;
    }


    console.log(
      "STEP 8 SUCCESS — Modules found:",
      modules.length
    );


    showStudyDiagnostic(
      "STEP 8 SUCCESS — Course modules found",
      "The dashboard can read " +
      modules.length +
      " course module(s).",
      true
    );

  } catch (error) {

    console.error(
      "STEP 8 FAILED:",
      error
    );

    showStudyDiagnostic(
      "STEP 8 FAILED — Module query error",
      error.message || String(error),
      false
    );
  }
}


// ============================================================
// STEP 9
// CHECK LESSONS
// ============================================================

async function checkLessons(enrollments) {

  console.log(
    "STEP 9: Checking lessons table..."
  );


  if (!enrollments || !enrollments.length) {

    console.log(
      "STEP 9 SKIPPED — no enrolments."
    );

    return;
  }


  try {

    const result =
      await db
        .from("lessons")
        .select(`
          id,
          module_number,
          module_name,
          lesson_number,
          title
        `)
        .limit(10);


    console.log(
      "LESSONS RESULT:",
      result
    );


    if (result.error) {

      showStudyDiagnostic(
        "STEP 9 FAILED — Cannot read lessons table",
        result.error.message || String(result.error),
        false
      );

      return;
    }


    const lessons =
      result.data || [];


    showStudyDiagnostic(
      "STEP 9 SUCCESS — Lessons table works",
      "The lessons table can be read successfully. Diagnostic rows found: " + lessons.length,
      true
    );


    console.log(
      "LESSONS FOUND:",
      lessons
    );

  } catch (error) {

    console.error(
      "STEP 9 FAILED:",
      error
    );

    showStudyDiagnostic(
      "STEP 9 FAILED — Lessons query error",
      error.message || String(error),
      false
    );
  }
}


// ============================================================
// SHOW FINAL RESULT
// ============================================================

function showFinalSuccess() {

  showStudyDiagnostic(
    "🎉 DATABASE CONNECTION TEST PASSED",
    "Supabase, authentication, the student record, enrolments, courses and course modules are all responding. We can now rebuild My Studies using the actual database structure instead of guessing.",
    true
  );
}


// ============================================================
// MAIN DIAGNOSTIC
// ============================================================

async function runDiagnostic() {

  console.log(
    "=========================================="
  );

  console.log(
    "RUNNING FUNDA ONLINE ACADEMY DIAGNOSTIC"
  );

  console.log(
    "=========================================="
  );


  if (!checkSupabaseLibrary()) {
    return;
  }


  if (!checkConfiguration()) {
    return;
  }


  if (!createDatabaseConnection()) {
    return;
  }


  const user =
    await checkUser();


  if (!user) {
    return;
  }


  const student =
    await checkStudent(user);


  if (!student) {
    return;
  }


  const enrollments =
    await checkEnrollments(student);


  if (!enrollments) {
    return;
  }


  await checkCourses(enrollments);

  await checkModules(enrollments);

  await checkLessons(enrollments);


  console.log(
    "=========================================="
  );

  console.log(
    "DIAGNOSTIC FINISHED"
  );

  console.log(
    "=========================================="
  );


  showFinalSuccess();
}


// ============================================================
// START
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "DOM READY — starting diagnostic..."
    );

    runDiagnostic();

  }
);
