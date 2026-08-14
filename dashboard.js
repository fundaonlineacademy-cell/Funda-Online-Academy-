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
  if (window.SUPABASE_URL.includes("PASTE_")) {
    show("Supabase is not connected yet.");
    return;
  }

  const {
    data: { session }
  } = await db.auth.getSession();

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
}


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
        title,
        price
      )
    `)
    .eq("student_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Enrolments error:", error);
    box.innerHTML = "<p>Could not load enrolments.</p>";
    return;
  }

  if (!data || !data.length) {
    box.innerHTML = `
      <div class="empty card">
        <h3>No enrolments yet</h3>
        <p>Choose a course and request enrolment to see it here.</p>
        <a class="btn green" href="index.html#courses">
          Browse Courses
        </a>
      </div>
    `;
    return;
  }

  box.innerHTML = data.map(e => `
    <article class="card">

      <h3>
        ${escapeHtml(e.courses?.title || "Course")}
      </h3>

      <p>
        <strong>Price:</strong>
        R${Number(e.courses?.price || 0).toLocaleString("en-ZA")}
      </p>

      <p>
        <strong>Status:</strong>
        ${escapeHtml(e.status || "pending")}
      </p>

      <small>
        Requested
        ${new Date(e.created_at).toLocaleDateString("en-ZA")}
      </small>

    </article>
  `).join("");
}


async function loadAvailableCourses(uid) {
  const box = document.getElementById("available-courses");

  if (!box) return;

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
    console.error("Courses error:", error);
    box.innerHTML = "<p>Could not load courses.</p>";
    return;
  }

  const {
    data: mine,
    error: enrolmentError
  } = await db
    .from("enrolments")
    .select("course_id")
    .eq("student_id", uid);

  if (enrolmentError) {
    console.error("Student courses error:", enrolmentError);
  }

  const enrolled = new Set(
    (mine || []).map(x => x.course_id)
  );

  if (!courses || !courses.length) {
    box.innerHTML = "<p>No courses available.</p>";
    return;
  }

  box.innerHTML = courses.map(c => `

    <article class="card">

      <h3>
        ${escapeHtml(c.title || "Course")}
      </h3>

      <p class="price">
        R${Number(c.price || 0).toLocaleString("en-ZA")}
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
        enrol(button.dataset.enrol, uid);
    });
}


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
    console.error("Enrolment error:", error);

    if (error.code === "23505") {
      show("You have already requested this course.");
    } else {
      show(error.message);
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


const logoutButton =
  document.getElementById("logout");

if (logoutButton) {
  logoutButton.onclick = async () => {
    await db.auth.signOut();
    location.href = "index.html";
  };
}


function escapeHtml(value) {
  return String(value ?? "").replace(
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


init(); 
