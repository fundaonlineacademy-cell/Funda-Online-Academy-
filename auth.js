// ==========================================
// FUNDA ONLINE ACADEMY
// LOGIN • REGISTRATION • PASSWORD RESET
// STUDENT / ADMIN LOGIN ROUTING
// ==========================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const forgotLink = document.getElementById("forgot");

const messageBox = document.getElementById("message");


// ==========================================
// REMEMBER SELECTED COURSE
// ==========================================

const authParams = new URLSearchParams(
  window.location.search
);

const courseFromUrl =
  authParams.get("course") ||
  authParams.get("enrol");

if (courseFromUrl) {
  localStorage.setItem(
    "funda_pending_course",
    courseFromUrl
  );
}


// ==========================================
// GET PENDING COURSE
// ==========================================

function getPendingCourse() {

  return localStorage.getItem(
    "funda_pending_course"
  );

}


// ==========================================
// STUDENT DESTINATION
// ==========================================

function getStudentDestination() {

  const course = getPendingCourse();

  if (course) {

    return (
      "dashboard.html?enrol=" +
      encodeURIComponent(course)
    );

  }

  return "dashboard.html";

}


// ==========================================
// MESSAGES
// ==========================================

function showMessage(
  message,
  success = false
) {

  if (!messageBox) return;

  messageBox.textContent = message;

  messageBox.classList.remove("hidden");

  if (success) {

    messageBox.style.background = "#e8f5e9";
    messageBox.style.color = "#166534";

  } else {

    messageBox.style.background = "#fef2f2";
    messageBox.style.color = "#991b1b";

  }

}


function clearMessage() {

  if (!messageBox) return;

  messageBox.textContent = "";

  messageBox.classList.add("hidden");

}


// ==========================================
// LOGIN / SIGNUP TABS
// ==========================================

function showLogin() {

  clearMessage();

  if (signupForm) {
    signupForm.classList.add("hidden");
  }

  if (loginForm) {
    loginForm.classList.remove("hidden");
  }

}


function showSignup() {

  clearMessage();

  if (loginForm) {
    loginForm.classList.add("hidden");
  }

  if (signupForm) {
    signupForm.classList.remove("hidden");
  }

}


if (loginTab) {

  loginTab.addEventListener(
    "click",
    function(e) {

      e.preventDefault();

      showLogin();

    }
  );

}


if (signupTab) {

  signupTab.addEventListener(
    "click",
    function(e) {

      e.preventDefault();

      showSignup();

    }
  );

}


// ==========================================
// GET USER ROLE
// ==========================================

async function getUserRole(userId) {

  if (!userId) {
    return null;
  }

  const {
    data,
    error
  } = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {

    console.error(
      "Role lookup error:",
      error
    );

    return null;

  }

  if (!data) {

    return null;

  }

  return data.role;

}


// ==========================================
// SAVE / SYNC STUDENT PROFILE
// ==========================================

async function syncStudentProfile(user) {

  if (!user) return false;

  const metadata =
    user.user_metadata || {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    "";

  const gender =
    metadata.gender ||
    "";

  const idNumber =
    metadata.id_number ||
    "";

  const phone =
    metadata.phone ||
    "";

  const email =
    user.email ||
    "";


  // ----------------------------------------
  // CHECK IF PROFILE EXISTS
  // ----------------------------------------

  const {
    data: existingProfile,
    error: findError
  } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();


  if (findError) {

    console.error(
      "Profile lookup error:",
      findError
    );

    return false;

  }


  // ----------------------------------------
  // EXISTING PROFILE
  // ----------------------------------------

  if (existingProfile) {

    // IMPORTANT:
    // NEVER modify an administrator's profile.

    if (
      existingProfile.role === "admin"
    ) {

      return true;

    }


    const {
      error
    } = await db
      .from("profiles")
      .update({

        full_name: fullName,
        email: email,
        gender: gender,
        id_number: idNumber,
        phone: phone

      })
      .eq(
        "id",
        user.id
      );


    if (error) {

      console.error(
        "Student profile update error:",
        error
      );

      return false;

    }

    return true;

  }


  // ----------------------------------------
  // CREATE STUDENT PROFILE
  // ----------------------------------------

  const {
    error
  } = await db
    .from("profiles")
    .insert({

      id: user.id,
      full_name: fullName,
      email: email,
      gender: gender,
      id_number: idNumber,
      phone: phone,
      role: "student"

    });


  if (error) {

    console.error(
      "Student profile creation error:",
      error
    );

    return false;

  }

  return true;

}


// ==========================================
// SAVE / SYNC STUDENT RECORD
// ==========================================

async function syncStudentRecord(user) {

  if (!user) return false;

  const metadata =
    user.user_metadata || {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    "";

  const gender =
    metadata.gender ||
    "";

  const idNumber =
    metadata.id_number ||
    "";

  const phone =
    metadata.phone ||
    "";

  const email =
    user.email ||
    "";


  // ----------------------------------------
  // CHECK EXISTING STUDENT
  // ----------------------------------------

  const {
    data: existingStudent,
    error: findError
  } = await db
    .from("students")
    .select("id")
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


  // ----------------------------------------
  // UPDATE EXISTING STUDENT
  // ----------------------------------------

  if (existingStudent) {

    const {
      error
    } = await db
      .from("students")
      .update({

        full_name:
          fullName,

        gender:
          gender,

        south_african_id:
          idNumber,

        email:
          email,

        mobile_whatsapp:
          phone

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


  // ----------------------------------------
  // CREATE STUDENT
  // ----------------------------------------

  const {
    error
  } = await db
    .from("students")
    .insert({

      user_id:
        user.id,

      full_name:
        fullName,

      gender:
        gender,

      south_african_id:
        idNumber,

      email:
        email,

      mobile_whatsapp:
        phone

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


// ==========================================
// SYNC STUDENT ACCOUNT ONLY
// ==========================================

async function syncStudentAccount(user) {

  if (!user) return false;


  // ----------------------------------------
  // FIRST CHECK ROLE
  // ----------------------------------------

  const role =
    await getUserRole(user.id);


  // ----------------------------------------
  // ADMIN
  // ----------------------------------------

  if (role === "admin") {

    console.log(
      "Administrator detected. Student sync skipped."
    );

    return true;

  }


  // ----------------------------------------
  // STUDENT
  // ----------------------------------------

  const profileSaved =
    await syncStudentProfile(user);

  const studentSaved =
    await syncStudentRecord(user);


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


// ==========================================
// ROUTE USER AFTER LOGIN
// ==========================================

async function routeUser(user) {

  if (!user) {

    console.error(
      "No authenticated user found."
    );

    return;

  }


  // ----------------------------------------
  // GET ROLE FIRST
  // ----------------------------------------

  const role =
    await getUserRole(user.id);


  console.log(
    "Logged-in user:",
    user.email
  );

  console.log(
    "User role:",
    role
  );


  // ----------------------------------------
  // ADMIN
  // ----------------------------------------

  if (role === "admin") {

    showMessage(
      "Administrator login successful. Opening admin dashboard...",
      true
    );


    setTimeout(
      function() {

        window.location.href =
          "admin.html";

      },
      300
    );


    return;

  }


  // ----------------------------------------
  // STUDENT
  // ----------------------------------------

  if (role === "student") {

    await syncStudentAccount(user);


    showMessage(
      "Login successful. Opening student portal...",
      true
    );


    setTimeout(
      function() {

        window.location.href =
          getStudentDestination();

      },
      300
    );


    return;

  }


  // ----------------------------------------
  // PROFILE DOES NOT EXIST
  // ----------------------------------------

  console.error(
    "No valid role found for user:",
    user.id
  );


  showMessage(
    "Your account exists, but your account profile could not be found. Please contact Funda Online Academy."
  );

}


// ==========================================
// CHECK EXISTING SESSION
// ==========================================

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


  // IMPORTANT:
  // Route by role FIRST.
  await routeUser(user);

}


checkExistingSession();


// ==========================================
// LOGIN
// ==========================================

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


      if (!emailInput || !passwordInput) {

        showMessage(
          "Login form could not be loaded correctly."
        );

        return;

      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const password =
        passwordInput.value;


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


      // ----------------------------------------
      // SUPABASE LOGIN
      // ----------------------------------------

      const {
        data,
        error
      } = await db.auth.signInWithPassword({

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


      // ----------------------------------------
      // IMPORTANT:
      // CHECK ADMIN/STUDENT ROLE BEFORE
      // TOUCHING STUDENT TABLES.
      // ----------------------------------------

      await routeUser(
        data.user
      );

    }
  );

}


// ==========================================
// REGISTRATION
// ==========================================

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      clearMessage();


      const nameElement =
        document.getElementById(
          "signup-name"
        );

      const genderElement =
        document.getElementById(
          "signup-gender"
        );

      const idElement =
        document.getElementById(
          "signup-id-number"
        );

      const phoneElement =
        document.getElementById(
          "signup-phone"
        );

      const emailElement =
        document.getElementById(
          "signup-email"
        );

      const passwordElement =
        document.getElementById(
          "signup-password"
        );

      const confirmPasswordElement =
        document.getElementById(
          "signup-confirm-password"
        );


      if (
        !nameElement ||
        !genderElement ||
        !idElement ||
        !phoneElement ||
        !emailElement ||
        !passwordElement ||
        !confirmPasswordElement
      ) {

        showMessage(
          "Registration form is missing one or more fields."
        );

        return;

      }


      const name =
        nameElement.value.trim();

      const gender =
        genderElement.value.trim();

      const idNumber =
        idElement.value.trim();

      const phone =
        phoneElement.value.trim();

      const email =
        emailElement.value
          .trim()
          .toLowerCase();

      const password =
        passwordElement.value;

      const confirmPassword =
        confirmPasswordElement.value;


      // ----------------------------------------
      // VALIDATION
      // ----------------------------------------

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


      if (
        password.length < 6
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


      // ----------------------------------------
      // CREATE AUTH ACCOUNT
      // ----------------------------------------

      showMessage(
        "Creating your student account...",
        true
      );


      const {
        data,
        error
      } = await db.auth.signUp({

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


      // ----------------------------------------
      // ACCOUNT CREATED WITH SESSION
      // ----------------------------------------

      if (data.session) {

        // New registrations are students.
        await syncStudentProfile(
          data.user
        );

        await syncStudentRecord(
          data.user
        );


        showMessage(
          "Student account created successfully. Opening your portal...",
          true
        );


        setTimeout(
          function() {

            window.location.href =
              getStudentDestination();

          },
          800
        );


        return;

      }


      // ----------------------------------------
      // EMAIL CONFIRMATION REQUIRED
      // ----------------------------------------

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


// ==========================================
// FORGOT PASSWORD
// ==========================================

if (forgotLink) {

  forgotLink.addEventListener(
    "click",
    async function(e) {

      e.preventDefault();

      clearMessage();


      const emailElement =
        document.getElementById(
          "login-email"
        );


      if (!emailElement) {

        showMessage(
          "Please enter your email address."
        );

        return;

      }


      const email =
        emailElement.value
          .trim()
          .toLowerCase();


      if (!email) {

        showMessage(
          "Please enter your email address first."
        );

        return;

      }


      const resetUrl =
        window.location.origin +
        window.location.pathname;


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
          "Password reset could not be started."
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
