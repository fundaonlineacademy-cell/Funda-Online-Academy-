// Funda Online Academy
// Login, Registration and Password Reset

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


// Switch to Login
if (loginTab) {
  loginTab.addEventListener("click", function (e) {
    e.preventDefault();
    showLogin();
  });
}


// Switch to Create Account
if (signupTab) {
  signupTab.addEventListener("click", function (e) {
    e.preventDefault();
    showSignup();
  });
}


// Check existing session
async function checkExistingSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return;
  }

  if (!data.session || !data.session.user) {
    return;
  }

  const userId = data.session.user.id;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Profile error:", profileError);
    return;
  }

  if (profile && profile.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "dashboard.html";
  }
}


// Run session check
checkExistingSession();


// =============================
// LOGIN
// =============================

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    clearMessage();

    const emailInput =
      document.getElementById("login-email");

    const passwordInput =
      document.getElementById("login-password");

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage(
        "Please enter your email and password."
      );
      return;
    }

    showMessage("Logging in...", true);

    const { data, error } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      console.error("Login error:", error);

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

    const { data: profile, error: profileError } =
      await db
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);

      showMessage(
        "Login worked, but we could not load your account profile."
      );

      return;
    }

    showMessage(
      "Login successful. Opening your portal...",
      true
    );

    setTimeout(function () {

      if (profile && profile.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }

    }, 500);
  });
}


// =============================
// REGISTRATION
// =============================

if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    clearMessage();

    const name =
      document.getElementById("signup-name").value.trim();

    const email =
      document
        .getElementById("signup-email")
        .value
        .trim()
        .toLowerCase();

    const password =
      document.getElementById("signup-password").value;

    const confirmPassword =
      document.getElementById(
        "signup-confirm-password"
      ).value;


    if (!name || !email || !password || !confirmPassword) {
      showMessage(
        "Please complete all registration fields."
      );
      return;
    }


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


    showMessage(
      "Creating your student account...",
      true
    );


    const { data, error } =
      await db.auth.signUp({
        email: email,
        password: password,

        options: {
          data: {
            full_name: name
          }
        }
      });


    if (error) {
      console.error("Registration error:", error);

      showMessage(error.message);
      return;
    }


    if (data.session && data.user) {

      showMessage(
        "Account created successfully.",
        true
      );

      setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 700);

      return;
    }


    showMessage(
      "Your account has been created. Please check your email to confirm your account, then log in.",
      true
    );

    signupForm.reset();

    setTimeout(function () {
      showLogin();
    }, 2500);
  });
}


// =============================
// FORGOT PASSWORD
// =============================

if (forgotLink) {
  forgotLink.addEventListener("click", async function (e) {
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


    const { error } =
      await db.auth.resetPasswordForEmail(
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

      showMessage(error.message);
      return;
    }


    showMessage(
      "Password reset instructions have been sent to your email.",
      true
    );
  });
}
