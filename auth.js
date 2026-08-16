// ============================================================
// FUNDA ONLINE ACADEMY
// AUTHENTICATION SYSTEM
// LOGIN • REGISTRATION • PASSWORD RESET
// STUDENT PROFILE • POLICY ACCEPTANCE
// SELECTED COURSE ENROLMENT
// ============================================================

const db = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
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
// POLICY SETTINGS
// ============================================================

const POLICY_VERSION = "2026-08-16";

const DECLARATION_TEXT =
  "I declare that the information I have provided is true and correct. " +
  "I understand and accept Funda Online Academy's payment rules, terms " +
  "and conditions, assessment requirements, course rules and privacy " +
  "practices. I understand that I must complete my assessments on time " +
  "and that no assessments may be submitted through WhatsApp. I understand " +
  "that course changes are not permitted after a course has started and " +
  "that there are no refunds for voluntary course drop-outs.";


// ============================================================
// REMEMBER SELECTED COURSE
// ============================================================

const authParams =
  new URLSearchParams(
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


// ============================================================
// GET SELECTED COURSE
// ============================================================

function getPendingCourse() {

  return localStorage.getItem(
    "funda_pending_course"
  );
}


// ============================================================
// GET AFTER-LOGIN DESTINATION
// ============================================================

function getStudentDestination() {

  const course =
    getPendingCourse();

  if (course) {

    return (
      "dashboard.html?enrol=" +
      encodeURIComponent(course)
    );

  }

  return "dashboard.html";
}


// ============================================================
// MESSAGES
// ============================================================

function showMessage(
  message,
  success = false
) {

  if (!messageBox) return;

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


function clearMessage() {

  if (!messageBox) return;

  messageBox.textContent =
    "";

  messageBox.classList.add(
    "hidden"
  );
}


// ============================================================
// SWITCH LOGIN / REGISTRATION
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
// FIND POLICY CHECKBOXES
// ============================================================

function getPolicyCheckbox() {

  return (
    document.getElementById(
      "accept-policies"
    ) ||
    document.getElementById(
      "policy-accept"
    ) ||
    document.getElementById(
      "accept-terms"
    )
  );
}


function getDeclarationCheckbox() {

  return (
    document.getElementById(
      "accept-declaration"
    ) ||
    document.getElementById(
      "declaration-accept"
    )
  );
}


// ============================================================
// CHECK POLICY ACCEPTANCE
// ============================================================

function validatePolicyAcceptance() {

  const policyCheckbox =
    getPolicyCheckbox();

  const declarationCheckbox =
    getDeclarationCheckbox();


  // If the checkboxes do not exist yet,
  // stop registration rather than silently
  // creating an account without acceptance.

  if (!policyCheckbox) {

    showMessage(
      "The Terms & Conditions acceptance box is missing. Please contact the academy administrator."
    );

    return false;
  }


  if (!declarationCheckbox) {

    showMessage(
      "The declaration acceptance box is missing. Please contact the academy administrator."
    );

    return false;
  }


  if (!policyCheckbox.checked) {

    showMessage(
      "You must read and accept the Funda Online Academy Terms & Conditions before creating your account."
    );

    policyCheckbox.focus();

    return false;
  }


  if (!declarationCheckbox.checked) {

    showMessage(
      "You must accept the student declaration before creating your account."
    );

    declarationCheckbox.focus();

    return false;
  }


  return true;
}


// ============================================================
// SAVE POLICY ACCEPTANCE
// ============================================================

async function savePolicyAcceptance(
  user
) {

  if (!user) {

    throw new Error(
      "Student account could not be identified."
    );

  }


  const policyCheckbox =
    getPolicyCheckbox();

  const declarationCheckbox =
    getDeclarationCheckbox();


  if (
    !policyCheckbox ||
    !declarationCheckbox ||
    !policyCheckbox.checked ||
    !declarationCheckbox.checked
  ) {

    throw new Error(
      "Policy acceptance is required."
    );

  }


  const payload = {

    student_id: null,

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
      new Date().toISOString(),

    created_at:
      new Date().toISOString()

  };


  // ----------------------------------------------------------
  // Find the student's database record.
  // ----------------------------------------------------------

  const {
    data: student,
    error: studentError
  } = await db
    .from("students")
    .select("id")
    .eq(
      "user_id",
      user.id
    )
    .maybeSingle();


  if (studentError) {

    console.error(
      "Student lookup for policy acceptance:",
      studentError
    );

    throw studentError;
  }


  if (!student) {

    throw new Error(
      "Your student profile could not be found. Policy acceptance could not be recorded."
    );

  }


  payload.student_id =
    student.id;


  // ----------------------------------------------------------
  // Prevent duplicate acceptance of the same version.
  // ----------------------------------------------------------

  const {
    data: existing,
    error: existingError
  } = await db
    .from("policy_acceptances")
    .select("id")
    .eq(
      "user_id",
      user.id
    )
    .eq(
      "policy_version",
      POLICY_VERSION
    )
    .maybeSingle();


  if (existingError) {

    console.error(
      "Policy acceptance lookup:",
      existingError
    );

    throw existingError;
  }


  if (existing) {

    return true;

  }


  // ----------------------------------------------------------
  // Save acceptance.
  // ----------------------------------------------------------

  const {
    error
  } = await db
    .from("policy_acceptances")
    .insert(
      payload
    );


  if (error) {

    console.error(
      "Policy acceptance save:",
      error
    );

    throw error;
  }


  return true;
}


// ============================================================
// SAVE / SYNC STUDENT PROFILE
// ============================================================

async function syncStudentProfile(
  user
) {

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


  // ----------------------------------------------------------
  // UPDATE EXISTING PROFILE
  // ----------------------------------------------------------

  if (existingProfile) {

    // NEVER change an administrator into a student.

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
  // CREATE NEW STUDENT PROFILE
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

async function syncStudentRecord(
  user
) {

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
  // UPDATE EXISTING STUDENT
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
  // CREATE NEW STUDENT
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
// SYNC BOTH STUDENT TABLES
// ============================================================

async function syncStudentAccount(
  user
) {

  if (!user) return false;


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


  // ----------------------------------------------------------
  // DO NOT create policy acceptance here.
  //
  // Existing students may log in normally.
  // Policy acceptance is recorded during registration.
  // ----------------------------------------------------------

  await syncStudentAccount(
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


  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  if (
    profile &&
    profile.role ===
    "admin"
  ) {

    window.location.href =
      "admin.html";

    return;
  }


  // ----------------------------------------------------------
  // STUDENT
  // ----------------------------------------------------------

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


      // --------------------------------------------------------
      // POLICY ACCEPTANCE
      // --------------------------------------------------------

      if (
        !validatePolicyAcceptance()
      ) {

        return;
      }


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

        try {

          await syncStudentAccount(
            data.user
          );


          await savePolicyAcceptance(
            data.user
          );


        } catch (policyError) {

          console.error(
            "Policy acceptance error:",
            policyError
          );


          // The account has already been created,
          // so tell the student exactly what happened.

          showMessage(
            "Your account was created, but we could not record your policy acceptance. Please contact Funda Online Academy before continuing."
          );

          return;
        }


        showMessage(
          "Student account created successfully. Your Terms & Conditions acceptance has been recorded.",
          true
        );


        // Course enrolment is handled after login.

        setTimeout(
          function() {

            window.location.href =
              getStudentDestination();

          },
          1200
        );


        return;
      }


      // --------------------------------------------------------
      // EMAIL CONFIRMATION REQUIRED
      // --------------------------------------------------------

      showMessage(
        "Your student account has been created. Please check your email to confirm your account, then log in. Your policy acceptance will be recorded after your account is confirmed.",
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
