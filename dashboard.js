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
  if (
    !window.SUPABASE_URL ||
    window.SUPABASE_URL.includes("PASTE_")
  ) {
    show("Supabase is not connected yet.");
    return;
  }

  const {
    data: { session },
    error: sessionError
  } = await db.auth.getSession();

  if (sessionError || !session) {
    location.href = "auth.html";
    return;
  }

  const emailBox = document.getElementById("user-email");
  const nameBox = document.getElementById("user-name");

  if (emailBox) {
    emailBox.textContent = session.user.email || "";
  }

  const {
    data: profile
  } = await db
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
}


/* ================================
   STUDENT ENROLMENTS
================================ */

async function loadEnrolments(uid) {

  const box = document.getElementById("enrolments");

  if (!box) return;

  const {
    data,
    error
  } = await db
    .from("enrolments")
    .select(`
      id,
      status,
      created_at,
      courses (
        name,
        price
      )
    `)
    .eq("student_id", uid)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Enrolments error:",
      error
    );

    box.innerHTML = `
      <div class="card">
        <p>Could not load your enrolments.</p>
      </div>
    `;

    return;
  }

  if (!data || !data.length) {

    box.innerHTML = `
      <div class="empty card">

        <h3>No enrolments yet</h3>

        <p>
          Choose a course below and request
          enrolment to see it here.
        </p>

        <a
          class="btn green"
          href="#available-courses"
        >
          Browse Courses
        </a>

      </div>
    `;

    return;
  }

  box.innerHTML = data.map(e => {

    const courseName =
      e.courses?.name ||
      "Course";

    const price =
      Number(e.courses?.price || 0);

    const status =
      e.status || "pending";

    return `
      <article class="card">

        <h3>
          ${escapeHtml(courseName)}
        </h3>

        <p>
          <strong>Price:</strong>
          R${price.toLocaleString("en-ZA")}
        </p>

        <p>
          <strong>Status:</strong>
          <span class="status">
            ${escapeHtml(status)}
          </span>
        </p>

        <small>
          Requested:
          ${new Date(
            e.created_at
          ).toLocaleDateString("en-ZA")}
        </small>

      </article>
    `;

  }).join("");
}


/* ================================
   AVAILABLE COURSES
================================ */

async function loadAvailableCourses(uid) {

  const box =
    document.getElementById(
      "available-courses"
    );

  if (!box) return;

  const {
    data: courses,
    error
  } = await db
    .from("courses")
    .select(`
      id,
      name,
      price,
      category,
      duration,
      description,
      modules,
      image_url,
      active
    `)
    .eq("active", true)
    .order("name");

  if (error) {

    console.error(
      "Courses error:",
      error
    );

    box.innerHTML = `
      <div class="card">
        <p>Could not load courses.</p>
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
      "Student courses error:",
      enrolmentError
    );
  }

  const enrolled =
    new Set(
      (mine || []).map(
        x => x.course_id
      )
    );


  if (!courses || !courses.length) {

    box.innerHTML = `
      <div class="card">
        <h3>No courses available</h3>
        <p>
          Courses will appear here when
          they are published.
        </p>
      </div>
    `;

    return;
  }


  /* Display courses */

  box.innerHTML = courses.map(c => {

    const alreadyEnrolled =
      enrolled.has(c.id);

    const modules =
      Array.isArray(c.modules)
        ? c.modules
        : typeof c.modules === "string"
          ? c.modules
              .split("\n")
              .filter(Boolean)
          : [];

    return `

      <article class="card course">

        ${
          c.image_url
            ? `
              <img
                class="course-image"
                src="${escapeHtml(c.image_url)}"
                alt="${escapeHtml(c.name)}"
              >
            `
            : ""
        }

        ${
          c.category
            ? `
              <div class="tag">
                ${escapeHtml(c.category)}
              </div>
            `
            : ""
        }

        <h3>
          ${escapeHtml(
            c.name || "Course"
          )}
        </h3>

        ${
          c.description
            ? `
              <p class="course-desc">
                ${escapeHtml(
                  c.description
                )}
              </p>
            `
            : ""
        }

        ${
          modules.length
            ? `
              <ul>
                ${modules
                  .map(module => `
                    <li>
                      ${escapeHtml(module)}
                    </li>
                  `)
                  .join("")}
              </ul>
            `
            : ""
        }

        <div class="course-foot">

          <span class="price">
            R${Number(
              c.price || 0
            ).toLocaleString("en-ZA")}
          </span>

          ${
            c.duration
              ? `
                <span class="duration">
                  ${escapeHtml(
                    c.duration
                  )}
                </span>
              `
              : ""
          }

        </div>

        ${
          alreadyEnrolled

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
                Enrol Now
              </button>
            `
        }

      </article>

    `;

  }).join("");


  /* Enrolment buttons */

  box
    .querySelectorAll("[data-enrol]")
    .forEach(button => {

      button.onclick = () => {

        enrol(
          button.dataset.enrol,
          uid
        );

      };

    });
}


/* ================================
   REQUEST ENROLMENT
================================ */

async function enrol(
  courseId,
  uid
) {

  const confirmed =
    confirm(
      "Send an enrolment request for this course?"
    );

  if (!confirmed) return;


  const {
    error
  } = await db
    .from("enrolments")
    .insert({
      student_id: uid,
      course_id: courseId,
      status: "pending"
    });


  if (error) {

    console.error(
      "Enrolment error:",
      error
    );

    if (error.code === "23505") {

      show(
        "You have already requested this course."
      );

    } else {

      show(
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


/* ================================
   LOGOUT
================================ */

const logoutButton =
  document.getElementById("logout");

if (logoutButton) {

  logoutButton.onclick =
    async () => {

      await db.auth.signOut();

      location.href =
        "index.html";

    };
}


/* ================================
   SECURITY / HTML ESCAPING
================================ */

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


/* ================================
   START
================================ */

init();
