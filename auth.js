// ============================================
// FUNDA ONLINE ACADEMY
// LOGIN, REGISTRATION & PASSWORD RESET
// ============================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


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


// ============================================
// MESSAGE
// ============================================

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


// ============================================
// FORM SWITCHING
// ============================================

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


// ============================================
// SAVE / UPDATE STUDENT PROFILE
// ============================================

async function saveStudentProfile(user, details = {}) {

  if (!user) {
    return {
      success: false,
      error: "No authenticated user."
    };
  }


  const profile = {

    id: user.id,

    full_name:
      details.full_name ||
      user.user_metadata?.full_name ||
      "",

    email:
      user.email || "",

    gender:
      details.gender ||
      user.user_metadata?.gender ||
      null,

    id_number:
      details.id_number ||
      user.user_metadata?.id_number ||
      null,

    phone:
      details.phone ||
      user.user_metadata?.phone ||
      null,

    role: "student"

  };


  const { error } = await db
    .from("profiles")
    .upsert(
      profile,
      {
        onConflict: "id"
      }
    );


  if (error) {

    console.error(
      "Profile save error:",
      error
    );

    return {
      success: false,
      error: error
    };
  }


  return {
    success: true
  };
}


// ============================================
// REDIRECT USER
// ============================================

async function redirectUser(user) {

  if (!user) return;


  const {
    data: profile,
    error
  } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();


  if (error) {

    console.error(
      "Profile lookup error:",
      error
    );

    showMessage(
      "Login worked, but we could not load your account profile."
    );

    return;
  }


  if (
    profile &&
    profile.role === "admin"
  ) {

    window.location.href =
      "admin.html";

    return;
  }


  window.location.href =
    "dashboard.html";
}


// ============================================
// CHECK EXISTING SESSION
// ============================================

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
    !data.session ||
    !data.session.user
  ) {

    return;
  }


  await redirectUser(
    data.session.user
  );
}


checkExistingSession();


// ============================================
// LOGIN
// ============================================

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

      const loginButton =
        document.getElementById(
          "login-button"
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


      loginButton.disabled = true;

      loginButton.textContent =
        "Logging in...";


      const {
        data,
        error
      } =
        await db.auth.signInWithPassword({

          email: email,

          password: password

        });


      if (error) {

        console.error(
          "Login error:",
          error
        );

        loginButton.disabled = false;

        loginButton.textContent =
          "Login";

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

        loginButton.disabled = false;

        loginButton.textContent =
          "Login";

        showMessage(
          "Login could not be completed. Please try again."
        );

        return;
      }


      // Make sure the profile exists.
      await saveStudentProfile(
        data.user,
        {
          full_name:
            data.user.user_metadata?.full_name,

          gender:
            data.user.user_metadata?.gender,

          id_number:
            data.user.user_metadata?.id_number,

          phone:
            data.user.user_metadata?.phone
        }
      );


      showMessage(
        "Login successful. Opening your portal...",
        true
      );


      setTimeout(
        async function() {

          await redirectUser(
            data.user
          );

        },
        500
      );

    }
  );

}


// ============================================
// REGISTRATION
// ============================================

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      clearMessage();


      const name =
        document
          .getElementById(
            "signup-name"
          )
          .value
          .trim();


      const gender =
        document
          .getElementById(
            "signup-gender"
          )
          .value
          .trim();


      const idNumber =
        document
          .getElementById(
            "signup-id-number"
          )
          .value
          .trim();


      const phone =
        document
          .getElementById(
            "signup-phone"
          )
          .value
          .trim();


      const email =
        document
          .getElementById(
            "signup-email"
          )
          .value
          .trim()
          .toLowerCase();


      const password =
        document
          .getElementById(
            "signup-password"
          )
          .value;


      const confirmPassword =
        document
          .getElementById(
            "signup-confirm-password"
          )
          .value;


      const signupButton =
        document.getElementById(
          "signup-button"
        );


      // ====================================
      // VALIDATION
      // ====================================

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


      if (password.length < 6) {

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


      signupButton.disabled = true;

      signupButton.textContent =
        "Creating Account...";


      showMessage(
        "Creating your student account...",
        true
      );


      // ====================================
      // CREATE SUPABASE AUTH ACCOUNT
      // ====================================

      const {
        data,
        error
      } =
        await db.auth.signUp({

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

        signupButton.disabled = false;

        signupButton.textContent =
          "Create Student Account";

        showMessage(
          error.message
        );

        return;
      }


      if (
        !data ||
        !data.user
      ) {

        signupButton.disabled = false;

        signupButton.textContent =
          "Create Student Account";

        showMessage(
          "The account could not be created. Please try again."
        );

        return;
      }


      // ====================================
      // IF SUPABASE LOGGED USER IN IMMEDIATELY
      // SAVE PROFILE NOW
      // ====================================

      if (data.session) {

        const profileResult =
          await saveStudentProfile(

            data.user,

            {

              full_name: name,

              gender: gender,

              id_number: idNumber,

              phone: phone

            }

          );


        if (
          !profileResult.success
        ) {

          console.error(
            profileResult.error
          );

          showMessage(
            "Your account was created, but your student profile could not be saved. Please contact the academy."
          );

          signupButton.disabled = false;

          signupButton.textContent =
            "Create Student Account";

          return;
        }


        showMessage(
          "Student account created successfully.",
          true
        );


        setTimeout(
          function() {

            window.location.href =
              "dashboard.html";

          },
          800
        );


        return;
      }


      // ====================================
      // EMAIL CONFIRMATION REQUIRED
      // ====================================

      showMessage(
        "Your student account has been created. Please check your email to confirm your account, then log in.",
        true
      );


      signupForm.reset();

      signupButton.disabled = false;

      signupButton.textContent =
        "Create Student Account";


      setTimeout(
        function() {

          showLogin();

        },
        3000
      );

    }
  );

}


// ============================================
// FORGOT PASSWORD
// ============================================

if (forgotLink) {

  forgotLink.addEventListener(
    "click",
    async function(e) {

      e.preventDefault();

      clearMessage();


      const email =
        document
          .getElementById(
            "login-email"
          )
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
      } =
        await db.auth
          .resetPasswordForEmail(

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
