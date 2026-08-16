// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT LOGIN • REGISTRATION • PASSWORD RESET
// POLICY ACCEPTANCE • DECLARATION RECORD
// ============================================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const forgotLink = document.getElementById("forgot");

const messageBox = document.getElementById("message");


// ============================================================
// POLICY SETTINGS
// ============================================================

const POLICY_VERSION = "FOA-2026-01";

const DECLARATION_TEXT =
  "I declare that the information I have provided is true and correct " +
  "to the best of my knowledge. I understand the academy's payment " +
  "rules, student responsibilities, course rules, assessment " +
  "requirements and privacy information. I understand that accepting " +
  "these policies creates a record of my acceptance, including the " +
  "date and time of acceptance.";


// ============================================================
// REMEMBER SELECTED COURSE
// ============================================================

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


function getPendingCourse() {
  return localStorage.getItem(
    "funda_pending_course"
  );
}


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


// ============================================================
// MESSAGE FUNCTIONS
// ============================================================

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


// ============================================================
// SWITCH LOGIN / REGISTRATION
// ============================================================

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


// ============================================================
// FIND POLICY ACCEPTANCE CHECKBOX
//
// IMPORTANT:
// Our auth.html uses:
// declaration-acceptance
//
// We also support older IDs so the system is safer.
// ============================================================

function getPolicyCheckbox() {

  const possibleIds = [
    "declaration-acceptance",
    "terms-acceptance",
    "policy-acceptance",
    "accept-policies",
    "accept-policy",
    "accept-terms",
    "accept-declaration",
    "policy-accept",
    "declaration-accept"
  ];

  for (const id of possibleIds) {

    const checkbox =
      document.getElementById(id);

    if (checkbox) {
      return checkbox;
    }

  }

  return null;
}


// ============================================================
// CHECK POLICY ACCEPTANCE
// ============================================================

function validatePolicyAcceptance() {

  const checkbox =
    getPolicyCheckbox();

  if (!checkbox) {

    showMessage(
      "The Terms & Conditions acceptance box is missing. Please contact the academy administrator."
    );

    return false;
  }

  if (!checkbox.checked) {

    showMessage(
      "You must read and accept the Funda Online Academy Policies and Declaration before creating your account."
    );

    checkbox.focus();

    return false;
  }

  return true;
}


// ============================================================
// GET STUDENT RECORD
// ============================================================

async function getStudentRecord(userId) {

  const {
    data,
    error
  } = await db
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {

    console.error(
      "Student lookup error:",
      error
    );

    return null;
  }

  return data;
}


// ============================================================
// SAVE POLICY ACCEPTANCE
// ============================================================

async function savePolicyAcceptance(
  user,
  acceptedAt = null
) {

  if (!user) {
    return false;
  }


  const checkbox =
    getPolicyCheckbox();

  if (!checkbox) {

    console.error(
      "Policy acceptance checkbox not found."
    );

    return false;
  }


  if (!checkbox.checked) {

    return false;
  }


  // ----------------------------------------------------------
  // Get student record
  // ----------------------------------------------------------

  const student =
    await getStudentRecord(user.id);


  if (!student) {

    console.error(
      "Student record not found for policy acceptance."
    );

    return false;
  }


  // ----------------------------------------------------------
  // Check whether this policy version already exists
  // ----------------------------------------------------------

  const {
    data: existing,
    error: existingError
  } = await db
    .from("policy_acceptances")
    .select("*")
    .eq("user_id", user.id)
    .eq("policy_version", POLICY_VERSION)
    .maybeSingle();


  if (existingError) {

    console.error(
      "Policy acceptance lookup error:",
      existingError
    );

    return false;
  }


  // ----------------------------------------------------------
  // Do not create duplicate acceptance records
  // ----------------------------------------------------------

  if (existing) {

    return true;
  }


  // ----------------------------------------------------------
  // Actual acceptance time
  // ----------------------------------------------------------

  const acceptanceTime =
    acceptedAt ||
    new Date().toISOString();


  // ----------------------------------------------------------
  // Create policy acceptance record
  // ----------------------------------------------------------

  const {
    error
  } = await db
    .from("policy_acceptances")
    .insert({

      student_id:
        student.id,

      user_id:
        user.id,

      policy_version:
        POLICY_VERSION,

      policies_accepted:
        true,

      declaration_accepted:
        true,

      declaration_text:
        DECLARATION_TEXT,

      accepted_at:
        acceptanceTime

    });


  if (error) {

    console.error(
      "Policy acceptance save error:",
      error
    );

    return false;
  }


  return true;
}


// ============================================================
// SAVE PENDING POLICY ACCEPTANCE
//
// Used when Supabase requires email confirmation and therefore
// does not immediately provide a session.
// ============================================================

function savePendingPolicyAcceptance() {

  const checkbox =
    getPolicyCheckbox();

  if (!checkbox || !checkbox.checked) {
    return;
  }


  const pending = {

    policy_version:
      POLICY_VERSION,

    accepted_at:
      new Date().toISOString(),

    declaration_text:
      DECLARATION_TEXT

  };


  localStorage.setItem(
    "funda_pending_policy_acceptance",
    JSON.stringify(pending)
  );
}


// ============================================================
// GET PENDING POLICY ACCEPTANCE
// ============================================================

function getPendingPolicyAcceptance() {

  const value =
    localStorage.getItem(
      "funda_pending_policy_acceptance"
    );

  if (!value) {
    return null;
  }


  try {

    return JSON.parse(value);

  } catch (error) {

    console.error(
      "Pending policy data error:",
      error
    );

    return null;
  }
}


// ============================================================
// COMPLETE PENDING POLICY ACCEPTANCE
// ============================================================

async function completePendingPolicyAcceptance(
  user
) {

  const pending =
    getPendingPolicyAcceptance();


  if (!pending) {
    return true;
  }


  const student =
    await getStudentRecord(user.id);


  if (!student) {
    return false;
  }


  const {
    data: existing,
    error: existingError
  } = await db
    .from("policy_acceptances")
    .select("id")
    .eq("user_id", user.id)
    .eq(
      "policy_version",
      pending.policy_version ||
      POLICY_VERSION
    )
    .maybeSingle();


  if (existingError) {

    console.error(
      "Pending policy lookup error:",
      existingError
    );

    return false;
  }


  if (!existing) {

    const {
      error
    } = await db
      .from("policy_acceptances")
      .insert({

        student_id:
          student.id,

        user_id:
          user.id,

        policy_version:
          pending.policy_version ||
          POLICY_VERSION,

        policies_accepted:
          true,

        declaration_accepted:
          true,

        declaration_text:
          pending.declaration_text ||
          DECLARATION_TEXT,

        accepted_at:
          pending.accepted_at ||
          new Date().toISOString()

      });


    if (error) {

      console.error(
        "Pending policy save error:",
        error
      );

      return false;
    }

  }


  localStorage.removeItem(
    "funda_pending_policy_acceptance"
  );

  return true;
}


// ============================================================
// SAVE / SYNC PROFILE
// ============================================================

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


  // ----------------------------------------------------------
  // Existing profile
  // ----------------------------------------------------------

  if (existingProfile) {

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
          fullName,

        email:
          email,

        gender:
          gender,

        id_number:
          idNumber,

        phone:
          phone

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


  // ----------------------------------------------------------
  // New profile
  // ----------------------------------------------------------

  const {
    error
  } = await db
    .from("profiles")
    .insert({

      id:
        user.id,

      full_name:
        fullName,

      email:
        email,

      gender:
        gender,

      id_number:
        idNumber,

      phone:
        phone,

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
// SAVE / SYNC STUDENT RECORD
// ============================================================

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


  // ----------------------------------------------------------
  // Existing student
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // New student
  // ----------------------------------------------------------

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


// ============================================================
// SYNC COMPLETE STUDENT ACCOUNT
// ============================================================

async function syncStudentAccount(user) {

  if (!user) return false;


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
    !data.session ||
    !data.session.user
  ) {

    return;
  }


  const user =
    data.session.user;


  await syncStudentAccount(user);


  await completePendingPolicyAcceptance(
    user
  );


  const {
    data: profile,
    error: profileError
  } = await db
    .from("profiles")
    .select("role")
    .eq(
      "id",
      user.id
    )
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
    profile.role ===
    "admin"
  ) {

    window.location.href =
      "admin.html";

    return;
  }


  window.location.href =
    getStudentDestination();
}


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


      await syncStudentAccount(
        data.user
      );


      // Complete acceptance if it was
      // waiting for email confirmation.

      await completePendingPolicyAcceptance(
        data.user
      );


      const {
        data: profile,
        error: profileError
      } = await db
        .from("profiles")
        .select("role")
        .eq(
          "id",
          data.user.id
        )
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


      setTimeout(
        function() {

          if (
            profile &&
            profile.role ===
            "admin"
          ) {

            window.location.href =
              "admin.html";

          } else {

            window.location.href =
              getStudentDestination();

          }

        },
        500
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


      // --------------------------------------------------------
      // CHECK POLICY FIRST
      // --------------------------------------------------------

      if (
        !validatePolicyAcceptance()
      ) {

        return;
      }


      // --------------------------------------------------------
      // GET FORM VALUES
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // SUPPORT SOUTH AFRICAN ID OR PASSPORT
      // --------------------------------------------------------

      if (
        idNumber.length < 6
      ) {

        showMessage(
          "Please enter a valid ID or passport number."
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


      // --------------------------------------------------------
      // SAVE THE ACCEPTANCE TIME NOW
      //
      // This is the actual time the student accepted.
      // --------------------------------------------------------

      const acceptedAt =
        new Date().toISOString();


      // --------------------------------------------------------
      // CREATE ACCOUNT
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // ACCOUNT CREATED WITH SESSION
      // --------------------------------------------------------

      if (data.session) {

        const synced =
          await syncStudentAccount(
            data.user
          );


        if (!synced) {

          showMessage(
            "Your account was created, but your student record could not be saved. Please contact the academy."
          );

          return;
        }


        const policySaved =
          await savePolicyAcceptance(
            data.user,
            acceptedAt
          );


        if (!policySaved) {

          showMessage(
            "Your account was created, but your policy acceptance could not be recorded. Please contact the academy."
          );

          return;
        }


        showMessage(
          "Student account created successfully. Your policies and declaration have been recorded.",
          true
        );


        setTimeout(
          function() {

            window.location.href =
              getStudentDestination();

          },
          1000
        );


        return;
      }


      // --------------------------------------------------------
      // EMAIL CONFIRMATION REQUIRED
      // --------------------------------------------------------

      savePendingPolicyAcceptance();


      showMessage(
        "Your student account has been created. Please check your email to confirm your account. Your policy acceptance will be recorded when you log in.",
        true
      );


      signupForm.reset();


      setTimeout(
        function() {

          showLogin();

        },
        3500
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
