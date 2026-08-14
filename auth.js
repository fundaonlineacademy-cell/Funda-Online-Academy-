// Funda Online Academy
// Student Login & Registration

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
  messageBox.textContent = "";
  messageBox.classList.add("hidden");
}


function showLogin() {
  clearMessage();
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
}


function showSignup() {
  clearMessage();
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
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


// Check whether a student is already logged in
async function checkExistingSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  if (data.session) {
    window.location.href = "dashboard.html";
  }
}

checkExistingSession();


// =============================
// STUDENT LOGIN
// =============================

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  clearMessage();

  const email = document
    .getElementById("login-email")
    .value
    .trim()
    .toLowerCase();

  const password = document
    .getElementById("login-password")
    .value;

  if (!email || !password) {
    showMessage("Please enter your email and password.");
    return;
  }

  showMessage("Logging in...", true);

  const { data, error } = await db.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    showMessage(
      "Login failed. Please check your email and password."
    );
    console.error(error);
    return;
  }

  if (!data.session) {
    showMessage(
      "Login could not be completed. Please try again."
    );
    return;
  }

 showMessage("Login successful. Opening your portal...", true);

const { data: profile } = await db
  .from("profiles")
  .select("role")
  .eq("id", data.user.id)
  .single();

setTimeout(function () {
  if (profile && profile.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "dashboard.html";
  }
}, 500); 


// =============================
// STUDENT REGISTRATION
// =============================

signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  clearMessage();

  const name = document
    .getElementById("signup-name")
    .value
    .trim();

  const email = document
    .getElementById("signup-email")
    .value
    .trim()
    .toLowerCase();

  const password = document
    .getElementById("signup-password")
    .value;

  const confirmPassword = document
    .getElementById("signup-confirm-password")
    .value;


  // Check required fields
  if (!name || !email || !password || !confirmPassword) {
    showMessage("Please complete all registration fields.");
    return;
  }


  // Check password length
  if (password.length < 6) {
    showMessage(
      "Your password must contain at least 6 characters."
    );
    return;
  }


  // Check passwords match
  if (password !== confirmPassword) {
    showMessage(
      "The passwords do not match. Please enter the same password twice."
    );
    return;
  }


  showMessage("Creating your student account...", true);


  const { data, error } = await db.auth.signUp({
    email: email,
    password: password,

    options: {
      data: {
        full_name: name
      }
    }
  });


  if (error) {
    console.error(error);

    showMessage(error.message);
    return;
  }


  // If Supabase immediately creates a session
  if (data.session) {
    showMessage(
      "Account created successfully. Opening your student portal...",
      true
    );

    setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 700);

    return;
  }


  // If email confirmation is required
  showMessage(
    "Your account has been created. Please check your email to confirm your account, then log in.",
    true
  );

  signupForm.reset();

  setTimeout(function () {
    showLogin();
  }, 2500);
});


// =============================
// FORGOT PASSWORD
// =============================

forgotLink.addEventListener("click", async function (e) {
  e.preventDefault();

  clearMessage();

  const email = document
    .getElementById("login-email")
    .value
    .trim()
    .toLowerCase();

  if (!email) {
    showMessage(
      "Please enter your email address first, then tap Forgot Password."
    );
    return;
  }


  const resetUrl =
    window.location.origin +
    window.location.pathname;


  const { error } = await db.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: resetUrl
    }
  );


  if (error) {
    console.error(error);
    showMessage(error.message);
    return;
  }


  showMessage(
    "Password reset instructions have been sent to your email.",
    true
  );
});
