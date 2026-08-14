const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const msg = document.getElementById("message");

function show(text, ok = false) {
  if (!msg) return;

  msg.textContent = text;
  msg.className = "message " + (ok ? "success" : "error");
}

async function init() {
  try {
    if (
      !window.SUPABASE_URL ||
      !window.SUPABASE_ANON_KEY ||
      window.SUPABASE_URL.includes("PASTE_")
    ) {
      show("Supabase is not connected.");
      return;
    }

    const {
      data: { session },
      error
    } = await db.auth.getSession();

    if (error) {
      show("Login error: " + error.message);
      return;
    }

    if (!session) {
      location.href = "auth.html";
      return;
    }

    const emailBox = document.getElementById("user-email");
    const nameBox = document.getElementById("user-name");

    if (emailBox) {
      emailBox.textContent = session.user.email || "";
    }

    const { data: profile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (nameBox) {
      nameBox.textContent =
        profile?.full_name ||
        session.user.user_metadata?.full_name ||
        "Student";
    }

    await loadEnrolments(session.user.id);
    await loadAvailableCourses(session.user.id);

  } catch (error) {
    console.error(error);
    show("Dashboard error: " + error.message);
  }
}


/* =========================
   ENROLMENTS
========================= */

async function loadEnrolments(uid) {

  const box = document.getElementById("enrolments");

  if (!box) return;

  const { data, error } = await db
    .from("enrolments")
    .select(`
      id,
      status,
      created_at,
      course_id
    `)
    .eq("student_id", uid)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error("ENROLMENTS ERROR:", error);

    box.innerHTML = `
      <div class="card">
        <p>
          <strong>Supabase error:</strong><br>
          ${escapeHtml(error.message)}
        </p>
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {

    box.innerHTML = `
      <div class="empty card">
        <h3>No enrolments yet</h3>

        <p>
          Choose a course and request enrolment
          to see it here.
        </p>

        <a
          class="btn green"
          href="index.html#courses"
        >
          Browse Courses
        </a>
      </div>
    `;

    return;
  }

  box.innerHTML = data.map(e => `
    <article class="card">

      <h3>Course Enrolment</h3>

      <p>
        <strong>Status:</strong>
        ${escapeHtml(e.status || "pending")}
      </p>

      <small>
        Requested
        ${new Date(
          e.created_at
        ).toLocaleDateString("en-ZA")}
      </small>

    </article>
  `).join("");
}


/* =========================
   AVAILABLE COURSES
========================= */

async function loadAvailableCourses(uid) {

  const box =
    document.getElementById("available-courses");

  if (!box) return;

  /*
   IMPORTANT:
   We are ONLY asking for columns that
   we have confirmed exist in your
   courses table.
  */

  const {
    data: courses,
    error
  } = await db
    .from("courses")
    .select(`
      id,
      title,
      price,
      active
    `)
    .eq("active", true)
    .order("title");

  if (error) {

    console.error(
      "COURSES ERROR:",
      error
    );

    box.innerHTML = `
      <div class="card">
        <p>
          <strong>Supabase course error:</strong>
        </p>

        <p>
          ${escapeHtml(error.message)}
        </p>

        <small>
          Code: ${escapeHtml(error.code || "none")}
        </small>
      </div>
    `;

    return;
  }


  /* Get courses already requested */

  const {
    data: mine,
    error: enrolmentError
  } = await db
    .from("enrolments")
    .select("course_id")
    .eq("student_id", uid);

  if (enrolmentError) {

    console.error(
      "STUDENT ENROLMENT ERROR:",
      enrolmentError
    );

    box.innerHTML = `
      <div class="card">
        <p>
          <strong>Enrolment permission error:</strong>
        </p>

        <p>
          ${escapeHtml(
            enrolmentError.message
          )}
        </p>

        <small>
          Code:
          ${escapeHtml(
            enrolmentError.code || "none"
          )}
        </small>
      </div>
    `;

    return;
  }


  const enrolled =
    new Set(
      (mine || []).map(
        x => x.course_id
      )
    );


  if (!courses || courses.length === 0) {

    box.innerHTML = `
      <div class="card">
        <p>
          No active courses found.
        </p>
      </div>
    `;

    return;
  }


  /* Display courses */

  box.innerHTML = courses.map(c => `

    <article class="card">

      <h3>
        ${escapeHtml(
          c.title || "Course"
        )}
      </h3>

      <p class="price">
        R${Number(
          c.price || 0
        ).toLocaleString("en-ZA")}
      </p>

      ${
        enrolled.has(c.id)

        ? `
          <button
            class="btn ghost full"
            disabled
          >
            Already Enrolled
          </button>
        `

        : `
          <button
            class="btn green full"
            data-enrol="${c.id}"
          >
            Request Enrolment
          </button>
        `
      }

    </article>

  `).join("");


  box
    .querySelectorAll("[data-enrol]")
    .forEach(button => {

      button.onclick = () =>
        enrol(
          button.dataset.enrol,
          uid
        );

    });
}


/* =========================
   REQUEST ENROLMENT
========================= */

async function enrol(courseId, uid) {

  if (
    !confirm(
      "Send an enrolment request for this course?"
    )
  ) {
    return;
  }

  const { error } = await db
    .from("enrolments")
    .insert({
      student_id: uid,
      course_id: courseId,
      status: "pending"
    });

  if (error) {

    console.error(
      "ENROLMENT INSERT ERROR:",
      error
    );

    if (error.code === "23505") {

      show(
        "You have already requested this course."
      );

    } else {

      show(
        "Enrolment error: " +
        error.message
      );

    }

    return;
  }

  show(
    "Enrolment request sent successfully.",
    true
  );

  await loadEnrolments(uid);
  await loadAvailableCourses(uid);
}


/* =========================
   LOGOUT
========================= */

const logoutButton =
  document.getElementById("logout");

if (logoutButton) {

  logoutButton.onclick = async () => {

    await db.auth.signOut();

    location.href = "index.html";

  };
}


/* =========================
   SECURITY
========================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}


/* =========================
   START
========================= */

init();
