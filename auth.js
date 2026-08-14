// ==========================================
// FUNDA ONLINE ACADEMY
// LOGIN • REGISTRATION • PASSWORD RESET
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
// MESSAGES
// ==========================================

function showMessage(message, success = false) {

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
// SWITCH LOGIN / REGISTRATION
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

  loginTab.addEventListener("click", function(e) {

    e.preventDefault();

    showLogin();

  });

}


if (signupTab) {

  signupTab.addEventListener("click", function(e) {

    e.preventDefault();

    showSignup();

  });

}


// ==========================================
// SAVE / SYNC STUDENT PROFILE
// ==========================================

async function syncStudentProfile(user) {

  if (!user) return false;

  const metadata = user.user_metadata || {};

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


  // Find existing profile
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


  // ==========================================
  // UPDATE EXISTING PROFILE
  // ==========================================

  if (existingProfile) {

    // Do not change an existing admin into a student
    if (existingProfile.role === "admin") {

      return true;
    }


    const { error } = await db
      .from("profiles")
      .update({

        full_name: fullName,

        email: email,

        gender: gender,

        id_number: idNumber,

        phone: phone

      })
      .eq("id", user.id);


    if (error) {

      console.error(
        "Profile update error:",
        error
      );

      return false;
    }

    return true;
  }


  // ==========================================
  // CREATE NEW STUDENT PROFILE
  // ==========================================

  const { error } = await db
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
      "Profile creation error:",
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

  const metadata = user.user_metadata || {};

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


  // ==========================================
  // CHECK WHETHER STUDENT RECORD EXISTS
  // ==========================================

  const {
    data: existingStudent,
    error: findError
  } = await db
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();


  if (findError) {

    console.error(
      "Student lookup error:",
      findError
    );

    return false;
  }


  // ==========================================
  // UPDATE EXISTING STUDENT
  // ==========================================

  if (existingStudent) {

    const { error } = await db
      .from("students")
      .update({

        full_name: fullName,

        gender: gender,

        south_african_id: idNumber,

        email: email,

        mobile_whatsapp: phone

      })
      .eq("id", existingStudent.id);


    if (error) {

      console.error(
        "Student update error:",
        error
      );

      return false;
    }


    return true;
  }


  // ==========================================
  // CREATE NEW STUDENT
  // ==========================================

  const { error } = await db
    .from("students")
    .insert({

      user_id: user.id,

      full_name: fullName,

      gender: gender,

      south_african_id: idNumber,

      email: email,

      mobile_whatsapp: phone

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
// SYNC BOTH PROFILE AND STUDENT RECORD
// ==========================================

async function syncStudentAccount(user) {

  if (!user) return false;

  const profileSaved =
    await syncStudentProfile(user);


  if (!profileSaved) {

    console.warn(
      "Student profile could not be synchronized."
    );

  }


  const studentSaved =
    await syncStudentRecord(user);


  if (!studentSaved) {

    console.warn(
      "Student record could not be synchronized."
    );

  }


  return profileSaved && studentSaved;
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


  if (!data.session || !data.session.user) {

    return;
  }


  const user =
    data.session.user;


  // Synchronize student information
  await syncStudentAccount(user);


  // Get account role
  const {
    data: profile,
    error: profileError
  } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();


  if (profileError) {

    console.error(
      "Profile error:",
      profileError
    );

    return;
  }


  if (
    profile &&
    profile.role === "admin"
  ) {

    window.location.href =
      "admin.html";

  } else {

    window.location.href =
      "dashboard.html";

  }
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


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const password =
        passwordInput.value;


      if (!email || !password) {

        showMessage(
          "Please enter your email and password."
        );

        return;
      }


      showMessage(
        "Logging in...",
        true
      );


      const {
        data,
        error
      } = await db.auth.signInWithPassword({

        email: email,

        password: password

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


      if (!data || !data.user) {

        showMessage(
          "Login could not be completed. Please try again."
        );

        return;
      }


      // Synchronize profile and student record
      await syncStudentAccount(
        data.user
      );


      // Get account role
      const {
        data: profile,
        error: profileError
      } = await db
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();


      if (profileError) {

        console.error(
          "Profile lookup error:",
          profileError
        );

        showMessage(
          "Login worked, but we could not load your account profile."
        );

        return;
      }


      showMessage(
        "Login successful. Opening your portal...",
        true
      );


      setTimeout(function() {

        if (
          profile &&
          profile.role === "admin"
        ) {

          window.location.href =
            "admin.html";

        } else {

          window.location.href =
            "dashboard.html";

        }

      }, 500);

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


      // ======================================
      // GET REGISTRATION INFORMATION
      // ======================================

      const name =
        document
          .getElementById("signup-name")
          .value
          .trim();


      const gender =
        document
          .getElementById("signup-gender")
          .value
          .trim();


      const idNumber =
        document
          .getElementById("signup-id-number")
          .value
          .trim();


      const phone =
        document
          .getElementById("signup-phone")
          .value
          .trim();


      const email =
        document
          .getElementById("signup-email")
          .value
          .trim()
          .toLowerCase();


      const password =
        document
          .getElementById("signup-password")
          .value;


      const confirmPassword =
        document
          .getElementById(
            "signup-confirm-password"
          )
          .value;


      // ======================================
      // VALIDATION
      // ======================================

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


      // South African ID validation

      if (!/^\d{13}$/.test(idNumber)) {

        showMessage(
          "Please enter a valid 13-digit South African ID number."
        );

        return;
      }


      // Password validation

      if (password.length < 6) {

        showMessage(
          "Your password must contain at least 6 characters."
        );

        return;
      }


      if (password !== confirmPassword) {

        showMessage(
          "The passwords do not match."
        );

        return;
      }


      // ======================================
      // CREATE SUPABASE ACCOUNT
      // ======================================

      showMessage(
        "Creating your student account...",
        true
      );


      const {
        data,
        error
      } = await db.auth.signUp({

        email: email,

        password: password,

        options: {

          data: {

            full_name: name,

            gender: gender,

            id_number: idNumber,

            phone: phone

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


      if (!data || !data.user) {

        showMessage(
          "Account could not be created. Please try again."
        );

        return;
      }


      // ======================================
      // EMAIL CONFIRMATION DISABLED
      // ======================================

      if (data.session) {

        const accountSaved =
          await syncStudentAccount(
            data.user
          );


        if (!accountSaved) {

          console.warn(
            "Account created, but some student information could not be saved."
          );

          showMessage(
            "Your account was created, but some student information could not be saved. Please try logging in again.",
            false
          );

          return;
        }


        showMessage(
          "Student account created successfully.",
          true
        );


        setTimeout(function() {

          window.location.href =
            "dashboard.html";

        }, 900);


        return;
      }


      // ======================================
      // EMAIL CONFIRMATION REQUIRED
      // ======================================

      showMessage(
        "Your student account has been created. Please check your email to confirm your account, then log in.",
        true
      );


      signupForm.reset();


      setTimeout(function() {

        showLogin();

      }, 3000);

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


      const email =
        document
          .getElementById("login-email")
          .value
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
      } = await db.auth.resetPasswordForEmail(

        email,

        {
          redirectTo: resetUrl
        }

      );


      if (error) {

        console.error(
          "Password reset error:",
          error
        );

        showMessage(
          error.message
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
