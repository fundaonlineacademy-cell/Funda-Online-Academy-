// ============================================================
// FUNDA ONLINE ACADEMY
// LOGIN • REGISTRATION • PASSWORD RESET
// SELECTED COURSE ENROLMENT
// STUDENT + ADMIN LOGIN
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// GITHUB PAGES BASE PATH
// ============================================================
// Your website is published at:
//
// https://fundaonlineacademy-cell.github.io/Funda-Online-Academy-/
//
// All internal pages must therefore use this path.
// ============================================================

const BASE_PATH = "/Funda-Online-Academy-/";


// ============================================================
// PAGE ELEMENTS
// ============================================================

const loginForm =
  document.getElementById("login-form");

const signupForm =
  document.getElementById("signup-form");

const loginTab =
  document.getElementById("login-tab");

const signupTab =
  document.getElementById("signup-tab");

const forgotLink =
  document.getElementById("forgot");

const messageBox =
  document.getElementById("message");


// ============================================================
// REMEMBER SELECTED COURSE
// ============================================================

const authParams =
  new URLSearchParams(
    window.location.search
  );


// Accept:
//
// auth.html?course=...
//
// OR
//
// auth.html?enrol=...

const courseFromUrl =
  authParams.get("course") ||
  authParams.get("enrol");


if (courseFromUrl) {

  localStorage.setItem(
    "funda_pending_course",
    courseFromUrl
  );

}


// ============================================================
// GET PENDING COURSE
// ============================================================

function getPendingCourse() {

  return localStorage.getItem(
    "funda_pending_course"
  );

}


// ============================================================
// GET STUDENT DESTINATION
// ============================================================

function getStudentDestination() {

  const course =
    getPendingCourse();


  if (course) {

    return (
      BASE_PATH +
      "dashboard.html?enrol=" +
      encodeURIComponent(course)
    );

  }


  return (
    BASE_PATH +
    "dashboard.html"
  );

}


// ============================================================
// GET ADMIN DESTINATION
// ============================================================

function getAdminDestination() {

  return (
    BASE_PATH +
    "admin.html"
  );

}


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(
  message,
  success = false
) {

  if (!messageBox) {
    return;
  }


  messageBox.textContent =
    message;


  messageBox.classList.remove(
    "hidden"
  );


  if (success) {

    messageBox.style.background =
      "#e8f5e9";

    messageBox.style.color =
      "#166534";

  } else {

    messageBox.style.background =
      "#fef2f2";

    messageBox.style.color =
      "#991b1b";

  }

}


// ============================================================
// CLEAR MESSAGE
// ============================================================

function clearMessage() {

  if (!messageBox) {
    return;
  }


  messageBox.textContent =
    "";


  messageBox.classList.add(
    "hidden"
  );

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

  clearMessage();


  if (signupForm) {

    signupForm.classList.add(
      "hidden"
    );

  }


  if (loginForm) {

    loginForm.classList.remove(
      "hidden"
    );

  }

}


// ============================================================
// SHOW SIGNUP
// ============================================================

function showSignup() {

  clearMessage();


  if (loginForm) {

    loginForm.classList.add(
      "hidden"
    );

  }


  if (signupForm) {

    signupForm.classList.remove(
      "hidden"
    );

  }

}


// ============================================================
// LOGIN TAB
// ============================================================

if (loginTab) {

  loginTab.addEventListener(
    "click",
    function(e) {

      e.preventDefault();

      showLogin();

    }
  );

}


// ============================================================
// SIGNUP TAB
// ============================================================

if (signupTab) {

  signupTab.addEventListener(
    "click",
    function(e) {

      e.preventDefault();

      showSignup();

    }
  );

}


// ============================================================
// GET USER INFORMATION
// ============================================================

function getUserData(user) {

  if (!user) {

    return {

      fullName: "",
      gender: "",
      idNumber: "",
      phone: "",
      email: ""

    };

  }


  const metadata =
    user.user_metadata || {};


  return {

    fullName:
      metadata.full_name ||
      metadata.name ||
      "",

    gender:
      metadata.gender ||
      "",

    idNumber:
      metadata.id_number ||
      "",

    phone:
      metadata.phone ||
      "",

    email:
      user.email ||
      ""

  };

}


// ============================================================
// SYNC STUDENT PROFILE
// ============================================================

async function syncStudentProfile(
  user
) {

  if (!user) {
    return false;
  }


  const userData =
    getUserData(user);


  const {
    data: existingProfile,
    error: findError
  } = await db
    .from("profiles")
    .select(
      "id, role"
    )
    .eq(
      "id",
      user.id
    )
    .maybeSingle();


  if (findError) {

    console.error(
      "Profile lookup error:",
      findError
    );

    return false;

  }


  // ========================================================
  // EXISTING PROFILE
  // ========================================================

  if (existingProfile) {

    // NEVER change an admin into a student.

    if (
      existingProfile.role ===
      "admin"
    ) {

      return true;

    }


    const {
      error
    } = await db
      .from("profiles")
      .update({

        full_name:
          userData.fullName,

        email:
          userData.email,

        gender:
          userData.gender,

        id_number:
          userData.idNumber,

        phone:
          userData.phone

      })
      .eq(
        "id",
        user.id
      );


    if (error) {

      console.error(
        "Profile update error:",
        error
      );

      return false;

    }


    return true;

  }


  // ========================================================
  // CREATE STUDENT PROFILE
  // ========================================================

  const {
    error
  } = await db
    .from("profiles")
    .insert({

      id:
        user.id,

      full_name:
        userData.fullName,

      email:
        userData.email,

      gender:
        userData.gender,

      id_number:
        userData.idNumber,

      phone:
        userData.phone,

      role:
        "student"

    });


  if (error) {

    console.error(
      "Profile creation error:",
      error
    );

    return false;

  }


  return true;

}


// ============================================================
// SYNC STUDENT RECORD
// ============================================================

async function syncStudentRecord(
  user
) {

  if (!user) {
    return false;
  }


  const userData =
    getUserData(user);


  const {
    data: existingStudent,
    error: findError
  } = await db
    .from("students")
    .select(
      "id"
    )
    .eq(
      "user_id",
      user.id
    )
    .maybeSingle();


  if (findError) {

    console.error(
      "Student lookup error:",
      findError
    );

    return false;

  }


  // ========================================================
  // UPDATE EXISTING STUDENT
  // ========================================================

  if (existingStudent) {

    const {
      error
    } = await db
      .from("students")
      .update({

        full_name:
          userData.fullName,

        gender:
          userData.gender,

        south_african_id:
          userData.idNumber,

        email:
          userData.email,

        mobile_whatsapp:
          userData.phone

      })
      .eq(
        "id",
        existingStudent.id
      );


    if (error) {

      console.error(
        "Student update error:",
        error
      );

      return false;

    }


    return true;

  }


  // ========================================================
  // CREATE NEW STUDENT
  // ========================================================

  const {
    error
  } = await db
    .from("students")
    .insert({

      user_id:
        user.id,

      full_name:
        userData.fullName,

      gender:
        userData.gender,

      south_african_id:
        userData.idNumber,

      email:
        userData.email,

      mobile_whatsapp:
        userData.phone

    });


  if (error) {

    console.error(
      "Student creation error:",
      error
    );

    return false;

  }


  return true;

}


// ============================================================
// SYNC BOTH STUDENT TABLES
// ============================================================

async function syncStudentAccount(
  user
) {

  if (!user) {
    return false;
  }


  const profileSaved =
    await syncStudentProfile(
      user
    );


  const studentSaved =
    await syncStudentRecord(
      user
    );


  if (!profileSaved) {

    console.warn(
      "Student profile could not be synchronized."
    );

  }


  if (!studentSaved) {

    console.warn(
      "Student record could not be synchronized."
    );

  }


  return (
    profileSaved &&
    studentSaved
  );

}


// ============================================================
// GET ACCOUNT ROLE
// ============================================================

async function getAccountRole(
  userId
) {

  if (!userId) {
    return null;
  }


  const {
    data: profile,
    error
  } = await db
    .from("profiles")
    .select(
      "role"
    )
    .eq(
      "id",
      userId
    )
    .maybeSingle();


  if (error) {

    console.error(
      "Role lookup error:",
      error
    );

    return null;

  }


  if (!profile) {

    return null;

  }


  return profile.role;

}


// ============================================================
// REDIRECT USER BASED ON ROLE
// ============================================================

async function redirectUser(
  user
) {

  if (!user) {
    return;
  }


  const role =
    await getAccountRole(
      user.id
    );


  console.log(
    "FUNDA ACCOUNT ROLE:",
    role
  );


  // ========================================================
  // ADMIN
  // ========================================================

  if (
    role ===
    "admin"
  ) {

    showMessage(
      "Administrator login successful. Opening admin dashboard...",
      true
    );


    setTimeout(
      function() {

        window.location.href =
          getAdminDestination();

      },
      500
    );


    return;

  }


  // ========================================================
  // STUDENT
  // ========================================================

  if (
    role ===
    "student"
  ) {

    showMessage(
      "Login successful. Opening your student portal...",
      true
    );


    setTimeout(
      function() {

        window.location.href =
          getStudentDestination();

      },
      500
    );


    return;

  }


  // ========================================================
  // PROFILE DOES NOT HAVE A ROLE
  // ========================================================

  console.warn(
    "No valid account role found."
  );


  showMessage(
    "Your account was found, but the account role could not be loaded. Please contact Funda Online Academy."
  );

}


// ============================================================
// CHECK EXISTING SESSION
// ============================================================

async function checkExistingSession() {

  const {
    data,
    error
  } = await db.auth.getSession();


  if (error) {

    console.error(
      "Session error:",
      error
    );

    return;

  }


  if (
    !data ||
    !data.session ||
    !data.session.user
  ) {

    return;

  }


  const user =
    data.session.user;


  // ========================================================
  // DO NOT CREATE/UPDATE ADMIN AS STUDENT
  // ========================================================

  const role =
    await getAccountRole(
      user.id
    );


  if (
    role !==
    "admin"
  ) {

    await syncStudentAccount(
      user
    );

  }


  // ========================================================
  // REDIRECT
  // ========================================================

  if (
    role ===
    "admin"
  ) {

    window.location.href =
      getAdminDestination();

    return;

  }


  if (
    role ===
    "student"
  ) {

    window.location.href =
      getStudentDestination();

    return;

  }

}


// Run session check.

checkExistingSession();


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      clearMessage();


      const emailInput =
        document.getElementById(
          "login-email"
        );


      const passwordInput =
        document.getElementById(
          "login-password"
        );


      if (
        !emailInput ||
        !passwordInput
      ) {

        showMessage(
          "Login form fields could not be found."
        );

        return;

      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const password =
        passwordInput.value;


      // ======================================================
      // VALIDATION
      // ======================================================

      if (
        !email ||
        !password
      ) {

        showMessage(
          "Please enter your email and password."
        );

        return;

      }


      showMessage(
        "Logging in...",
        true
      );


      // ======================================================
      // SUPABASE LOGIN
      // ======================================================

      const {
        data,
        error
      } =
        await db.auth.signInWithPassword({

          email:
            email,

          password:
            password

        });


      if (error) {

        console.error(
          "Login error:",
          error
        );


        showMessage(
          error.message ||
          "Login failed. Please check your email and password."
        );


        return;

      }


      if (
        !data ||
        !data.user
      ) {

        showMessage(
          "Login could not be completed. Please try again."
        );


        return;

      }


      const user =
        data.user;


      // ======================================================
      // GET ROLE BEFORE STUDENT SYNC
      // ======================================================

      const role =
        await getAccountRole(
          user.id
        );


      console.log(
        "LOGIN USER:",
        user.email
      );


      console.log(
        "LOGIN ROLE:",
        role
      );


      // ======================================================
      // ADMIN
      // ======================================================

      if (
        role ===
        "admin"
      ) {

        showMessage(
          "Administrator login successful. Opening admin dashboard...",
          true
        );


        setTimeout(
          function() {

            window.location.href =
              getAdminDestination();

          },
          500
        );


        return;

      }


      // ======================================================
      // STUDENT
      // ======================================================

      if (
        role ===
        "student"
      ) {

        await syncStudentAccount(
          user
        );


        showMessage(
          "Login successful. Opening your student portal...",
          true
        );


        setTimeout(
          function() {

            window.location.href =
              getStudentDestination();

          },
          500
        );


        return;

      }


      // ======================================================
      // NO PROFILE
      // ======================================================

      showMessage(
        "Your login was successful, but your account profile could not be found. Please contact Funda Online Academy."
      );

    }
  );

}


// ============================================================
// REGISTRATION
// ============================================================

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      clearMessage();


      // ======================================================
      // GET FIELDS
      // ======================================================

      const nameInput =
        document.getElementById(
          "signup-name"
        );


      const genderInput =
        document.getElementById(
          "signup-gender"
        );


      const idInput =
        document.getElementById(
          "signup-id-number"
        );


      const phoneInput =
        document.getElementById(
          "signup-phone"
        );


      const emailInput =
        document.getElementById(
          "signup-email"
        );


      const passwordInput =
        document.getElementById(
          "signup-password"
        );


      const confirmPasswordInput =
        document.getElementById(
          "signup-confirm-password"
        );


      if (
        !nameInput ||
        !genderInput ||
        !idInput ||
        !phoneInput ||
        !emailInput ||
        !passwordInput ||
        !confirmPasswordInput
      ) {

        showMessage(
          "Registration form fields could not be found."
        );

        return;

      }


      // ======================================================
      // READ VALUES
      // ======================================================

      const name =
        nameInput.value
          .trim();


      const gender =
        genderInput.value
          .trim();


      const idNumber =
        idInput.value
          .trim();


      const phone =
        phoneInput.value
          .trim();


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const password =
        passwordInput.value;


      const confirmPassword =
        confirmPasswordInput.value;


      // ======================================================
      // VALIDATION
      // ======================================================

      if (
        !name ||
        !gender ||
        !idNumber ||
        !phone ||
        !email ||
        !password ||
        !confirmPassword
      ) {

        showMessage(
          "Please complete all registration fields."
        );

        return;

      }


      // ======================================================
      // SOUTH AFRICAN ID VALIDATION
      // ======================================================

      if (
        !/^\d{13}$/.test(
          idNumber
        )
      ) {

        showMessage(
          "Please enter a valid 13-digit South African ID number."
        );

        return;

      }


      // ======================================================
      // PASSWORD VALIDATION
      // ======================================================

      if (
        password.length <
        6
      ) {

        showMessage(
          "Your password must contain at least 6 characters."
        );

        return;

      }


      if (
        password !==
        confirmPassword
      ) {

        showMessage(
          "The passwords do not match."
        );

        return;

      }


      // ======================================================
      // CREATE ACCOUNT
      // ======================================================

      showMessage(
        "Creating your student account...",
        true
      );


      const {
        data,
        error
      } =
        await db.auth.signUp({

          email:
            email,

          password:
            password,

          options: {

            data: {

              full_name:
                name,

              gender:
                gender,

              id_number:
                idNumber,

              phone:
                phone

            }

          }

        });


      // ======================================================
      // REGISTRATION ERROR
      // ======================================================

      if (error) {

        console.error(
          "Registration error:",
          error
        );


        showMessage(
          error.message ||
          "Registration failed. Please try again."
        );


        return;

      }


      if (
        !data ||
        !data.user
      ) {

        showMessage(
          "Account could not be created. Please try again."
        );


        return;

      }


      // ======================================================
      // ACCOUNT CREATED + SESSION
      // ======================================================

      if (
        data.session
      ) {

        await syncStudentAccount(
          data.user
        );


        showMessage(
          "Student account created successfully. Opening your student portal...",
          true
        );


        setTimeout(
          function() {

            window.location.href =
              getStudentDestination();

          },
          900
        );


        return;

      }


      // ======================================================
      // EMAIL CONFIRMATION REQUIRED
      // ======================================================

      showMessage(
        "Your student account has been created. Please check your email to confirm your account, then log in.",
        true
      );


      signupForm.reset();


      setTimeout(
        function() {

          showLogin();

        },
        3000
      );

    }
  );

}


// ============================================================
// FORGOT PASSWORD
// ============================================================

if (forgotLink) {

  forgotLink.addEventListener(
    "click",
    async function(e) {

      e.preventDefault();

      clearMessage();


      const emailInput =
        document.getElementById(
          "login-email"
        );


      if (!emailInput) {

        showMessage(
          "Email field could not be found."
        );

        return;

      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      if (!email) {

        showMessage(
          "Please enter your email address first."
        );

        return;

      }


      // ======================================================
      // PASSWORD RESET URL
      // ======================================================

      const resetUrl =
        window.location.origin +
        BASE_PATH +
        "auth.html";


      const {
        error
      } =
        await db.auth.resetPasswordForEmail(

          email,

          {
            redirectTo:
              resetUrl
          }

        );


      if (error) {

        console.error(
          "Password reset error:",
          error
        );


        showMessage(
          error.message ||
          "Password reset could not be requested."
        );


        return;

      }


      showMessage(
        "Password reset instructions have been sent to your email.",
        true
      );

    }
  );

}


// ============================================================
// END OF AUTH.JS
// ============================================================
