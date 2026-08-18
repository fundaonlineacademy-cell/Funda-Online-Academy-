// ============================================================
// FUNDA ONLINE ACADEMY
// STUDENT DASHBOARD.JS
//
// Keeps:
// ✅ Student login
// ✅ Student profile
// ✅ Approved enrolments
// ✅ Course modules
// ✅ Lessons
// ✅ Review Lesson
// ✅ Open Lesson
// ✅ Mark Lesson Complete
// ✅ Lesson progress
// ✅ Course duration
// ✅ Available button on course cards
//
// IMPORTANT:
// This file is for dashboard.js ONLY.
// Do NOT replace dashboard.html with this code.
// ============================================================

"use strict";


// ============================================================
// SUPABASE
// ============================================================

let db = null;

let currentUser = null;
let currentStudent = null;
let currentLesson = null;


// ============================================================
// ELEMENTS
// ============================================================

const studyList =
    document.getElementById("study-list");

const userName =
    document.getElementById("user-name");

const userEmail =
    document.getElementById("user-email");

const logoutButton =
    document.getElementById("logout");

const systemStatus =
    document.getElementById("system-status");

const availableCourses =
    document.getElementById("available-courses");

const enrolmentsContainer =
    document.getElementById("enrolments");

const lessonViewer =
    document.getElementById("lesson-viewer");

const lessonViewerTitle =
    document.getElementById("lesson-viewer-title");

const lessonViewerModule =
    document.getElementById("lesson-viewer-module");

const lessonViewerContent =
    document.getElementById("lesson-viewer-content");

const lessonClose =
    document.getElementById("lesson-close");

const completeLessonButton =
    document.getElementById("complete-lesson-btn");

const lessonCompleteMessage =
    document.getElementById("lesson-complete-message");


// ============================================================
// HELPERS
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function money(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return escapeHtml(value);
    }

    return "R " + number.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function getCourseName(course) {

    return (
        course?.title ||
        course?.name ||
        course?.course_name ||
        "Course"
    );
}


function getCourseDescription(course) {

    return (
        course?.description ||
        course?.course_description ||
        "Funda Online Academy course."
    );
}


// ============================================================
// DURATION
// ============================================================

function getCourseDuration(course) {

    if (!course) {
        return "";
    }

    const duration =
        course.duration ??
        course.course_duration ??
        course.duration_text ??
        course.duration_days ??
        course.duration_weeks ??
        course.duration_months ??
        "";

    if (
        duration === null ||
        duration === undefined ||
        String(duration).trim() === ""
    ) {
        return "";
    }

    // If the database already contains text such as
    // "4 Weeks", keep it exactly as supplied.

    return String(duration);
}


// ============================================================
// SUPABASE CLIENT
// ============================================================

function createDatabase() {

    // Existing client from supabase-config.js
    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        return window.supabaseClient;
    }

    // Existing db variable from another file
    if (
        window.db &&
        typeof window.db.from === "function"
    ) {
        return window.db;
    }

    const url =
        window.SUPABASE_URL;

    const key =
        window.SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error(
            "Supabase URL or anon key is missing. Check supabase-config.js."
        );
    }

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        throw new Error(
            "Supabase library did not load."
        );
    }

    return window.supabase.createClient(
        url,
        key
    );
}


// ============================================================
// STATUS
// ============================================================

function setStatus(text) {

    if (systemStatus) {
        systemStatus.textContent = text;
    }
}


// ============================================================
// CURRENT USER
// ============================================================

async function getCurrentUser() {

    const result =
        await db.auth.getUser();

    if (result.error) {
        throw result.error;
    }

    if (
        !result.data ||
        !result.data.user
    ) {

        window.location.href = "login.html";

        return null;
    }

    return result.data.user;
}


// ============================================================
// STUDENT PROFILE
// ============================================================

async function getStudent(userId) {

    const result =
        await db
            .from("students")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

    if (result.error) {
        throw result.error;
    }

    return result.data || null;
}


// ============================================================
// APPROVED ENROLMENTS
// ============================================================

async function getApprovedEnrollments(studentId) {

    // First try the spelling used by the existing system.
    let result =
        await db
            .from("enrollments")
            .select(`
                id,
                student_id,
                course_id,
                enrollment_status
            `)
            .eq("student_id", studentId)
            .eq("enrollment_status", "approved");

    // Some installations use "enrolments".
    if (
        result.error &&
        (
            result.error.code === "42P01" ||
            String(result.error.message || "")
                .toLowerCase()
                .includes("does not exist")
        )
    ) {

        result =
            await db
                .from("enrolments")
                .select(`
                    id,
                    student_id,
                    course_id,
                    enrollment_status
                `)
                .eq("student_id", studentId)
                .eq("enrollment_status", "approved");
    }

    if (result.error) {
        throw result.error;
    }

    return result.data || [];
}


// ============================================================
// LOAD COURSES IN ONE QUERY
//
// This is important.
// The previous dashboard loaded courses one-by-one,
// which could leave the page appearing to load forever.
//
// Here we load the required courses together.
// ============================================================

async function getCoursesByIds(courseIds) {

    if (!courseIds || courseIds.length === 0) {
        return [];
    }

    const cleanIds = [
        ...new Set(
            courseIds
                .filter(Boolean)
                .map(id => String(id))
        )
    ];

    if (cleanIds.length === 0) {
        return [];
    }

    const result =
        await db
            .from("courses")
            .select("*")
            .in("id", cleanIds);

    if (result.error) {
        throw result.error;
    }

    return result.data || [];
}


// ============================================================
// SINGLE COURSE
// ============================================================

async function getCourse(courseId) {

    const result =
        await db
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .maybeSingle();

    if (result.error) {
        throw result.error;
    }

    return result.data || null;
}


// ============================================================
// MODULES
// ============================================================

async function getModules(courseId) {

    const result =
        await db
            .from("course_modules")
            .select("*")
            .eq("course_id", courseId)
            .order("module_number", {
                ascending: true
            });

    if (result.error) {
        throw result.error;
    }

    return result.data || [];
}


// ============================================================
// LESSONS
// ============================================================

async function getLessons() {

    const result =
        await db
            .from("lessons")
            .select("*")
            .order("lesson_number", {
                ascending: true
            });

    if (result.error) {
        throw result.error;
    }

    return result.data || [];
}


// ============================================================
// LESSONS FOR MODULE
// ============================================================

function lessonsForModule(module, lessons) {

    return lessons
        .filter(lesson => {

            const sameModuleId =
                lesson.module_id &&
                module.id &&
                String(lesson.module_id) ===
                String(module.id);

            const sameModuleNumber =
                lesson.module_number !== undefined &&
                lesson.module_number !== null &&
                module.module_number !== undefined &&
                module.module_number !== null &&
                Number(lesson.module_number) ===
                Number(module.module_number);

            return (
                sameModuleId ||
                sameModuleNumber
            );
        })
        .sort((a, b) => {

            return Number(a.lesson_number || 0) -
                Number(b.lesson_number || 0);

        });
}


// ============================================================
// LESSON CONTENT
// ============================================================

function getLessonContent(lesson) {

    return (
        lesson.content ??
        lesson.lesson_content ??
        lesson.body ??
        lesson.lesson_body ??
        lesson.description ??
        ""
    );
}


function safeLessonContent(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return `
            <div class="empty-study">

                <div style="font-size:42px">
                    📖
                </div>

                <h3 style="margin-top:10px">
                    Learning content is being prepared
                </h3>

                <p style="margin-top:8px;line-height:1.6">
                    This lesson has been created,
                    but the learning content has not
                    yet been added.
                </p>

            </div>
        `;
    }

    const text = String(value);

    // Keep existing HTML lesson content.
    if (/<[a-z][\s\S]*>/i.test(text)) {
        return text;
    }

    return text
        .split(/\n\s*\n/)
        .map(paragraph => `
            <p>
                ${escapeHtml(paragraph).replace(/\n/g, "<br>")}
            </p>
        `)
        .join("");
}


// ============================================================
// RENDER STUDY COURSE
// ============================================================

function renderStudy(
    enrollment,
    course,
    modules,
    lessons
) {

    if (!studyList || !course) {
        return;
    }

    const courseName =
        getCourseName(course);

    const description =
        getCourseDescription(course);

    const price =
        course.price ??
        course.amount ??
        null;

    const duration =
        getCourseDuration(course);

    let moduleHtml = "";

    modules.forEach((module, index) => {

        const moduleLessons =
            lessonsForModule(
                module,
                lessons
            );

        const moduleName =
            module.module_name ||
            module.name ||
            module.title ||
            "Module " + (index + 1);

        const moduleDescription =
            module.description ||
            module.module_description ||
            "Learning material for this module.";

        let lessonHtml = "";

        if (moduleLessons.length === 0) {

            lessonHtml = `
                <div class="empty-study">

                    <strong>
                        📖 Lessons are being prepared
                    </strong>

                    <p style="margin-top:8px">
                        Learning material for this module
                        will appear here.
                    </p>

                </div>
            `;

        } else {

            lessonHtml = `
                <div class="lesson-list">

                    ${moduleLessons.map(lesson => {

                        const lessonTitle =
                            lesson.title ||
                            lesson.lesson_title ||
                            "Lesson";

                        return `
                            <div class="lesson-item">

                                <div class="lesson-top">

                                    <span class="lesson-number">
                                        ${escapeHtml(
                                            lesson.lesson_number || ""
                                        )}
                                    </span>

                                    <div class="lesson-main">

                                        <div class="lesson-title">
                                            ${escapeHtml(lessonTitle)}
                                        </div>

                                        <div class="lesson-description">
                                            Lesson
                                            ${escapeHtml(
                                                lesson.lesson_number || ""
                                            )}
                                            in
                                            ${escapeHtml(moduleName)}.
                                        </div>

                                        <div class="lesson-actions">

                                            <button
                                                type="button"
                                                class="lesson-open"
                                                data-lesson-id="${escapeHtml(
                                                    lesson.id
                                                )}"
                                                data-module-name="${escapeHtml(
                                                    moduleName
                                                )}"
                                            >
                                                📖 Open Lesson
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        `;

                    }).join("")}

                </div>
            `;
        }

        moduleHtml += `
            <div class="module-card">

                <button
                    type="button"
                    class="module-header"
                    data-module-index="${index}"
                >

                    <span class="module-left">

                        <span class="module-number">
                            ${escapeHtml(
                                module.module_number ||
                                index + 1
                            )}
                        </span>

                        <span class="module-name">
                            ${escapeHtml(moduleName)}
                        </span>

                    </span>

                    <span class="module-icon">
                        +
                    </span>

                </button>

                <div
                    class="module-content"
                    data-module-content="${index}"
                >

                    <p class="module-description">
                        ${escapeHtml(moduleDescription)}
                    </p>

                    <p style="
                        margin-bottom:14px;
                        font-size:14px;
                        color:#68766f;
                        font-weight:700;
                    ">
                        📖 ${moduleLessons.length}
                        ${
                            moduleLessons.length === 1
                                ? "lesson"
                                : "lessons"
                        }
                    </p>

                    ${lessonHtml}

                </div>

            </div>
        `;
    });


    if (modules.length === 0) {

        moduleHtml = `
            <div class="empty-study">

                <div style="font-size:42px">
                    📚
                </div>

                <h3 style="margin-top:10px">
                    Course modules are being prepared
                </h3>

                <p style="margin-top:8px">
                    Funda Online Academy will add
                    the learning modules for this course.
                </p>

            </div>
        `;
    }


    const study =
        document.createElement("div");

    study.className =
        "study-card";


    // ========================================================
    // IMPORTANT:
    // "Available" is now a BUTTON ON THE COURSE.
    // It is NOT a separate Available Courses section.
    // ========================================================

    study.innerHTML = `

        <span class="funda-status approved">
            Approved
        </span>

        <h3 class="study-title">
            ${escapeHtml(courseName)}
        </h3>

        <p class="study-description">
            ${escapeHtml(description)}
        </p>

        <div class="study-meta">

            ${
                price !== null
                    ? `
                        <span>
                            💰 ${money(price)}
                        </span>
                    `
                    : ""
            }

            ${
                duration
                    ? `
                        <span>
                            ⏱️ ${escapeHtml(duration)}
                        </span>
                    `
                    : ""
            }

            <span>
                📚 ${modules.length}
                ${
                    modules.length === 1
                        ? "module"
                        : "modules"
                }
            </span>

            <span>
                📖 ${lessons.length}
                ${
                    lessons.length === 1
                        ? "lesson"
                        : "lessons"
                }
            </span>

        </div>

        <div
            style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                margin-top:18px;
            "
        >

            <button
                type="button"
                class="btn green study-course-button"
            >
                📚 Study Course
            </button>

            <button
                type="button"
                class="btn"
                style="
                    background:#f1faf5;
                    color:#0c8f55;
                    border:1px solid #0c8f55;
                "
                disabled
            >
                ✓ Available
            </button>

        </div>

        <div class="modules-container">

            <h3 class="modules-heading">
                📖 Course Modules
            </h3>

            ${moduleHtml}

        </div>

        <div class="progress-box">

            <div class="progress-label">

                <span>
                    Course Progress
                </span>

                <span class="progress-percent">
                    0%
                </span>

            </div>

            <div class="progress-track">

                <div
                    class="progress-bar"
                    style="width:0%"
                ></div>

            </div>

            <p style="
                margin-top:8px;
                color:#68766f;
                font-size:13px
            ">
                Your lesson progress will appear here
                as lessons are completed.
            </p>

        </div>
    `;


    studyList.appendChild(study);
}


// ============================================================
// MODULE BUTTONS
// ============================================================

function setupModuleButtons() {

    document
        .querySelectorAll("[data-module-index]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        button.getAttribute(
                            "data-module-index"
                        );

                    const content =
                        document.querySelector(
                            `[data-module-content="${index}"]`
                        );

                    if (!content) {
                        return;
                    }

                    const icon =
                        button.querySelector(
                            ".module-icon"
                        );

                    const open =
                        content.classList.contains("open");

                    if (open) {

                        content.classList.remove("open");

                        if (icon) {
                            icon.textContent = "+";
                        }

                    } else {

                        content.classList.add("open");

                        if (icon) {
                            icon.textContent = "−";
                        }
                    }
                }
            );
        });
}


// ============================================================
// LESSON BUTTONS
// ============================================================

function setupLessonButtons() {

    document
        .querySelectorAll(".lesson-open")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openLesson(
                        button.getAttribute("data-lesson-id"),
                        button.getAttribute("data-module-name")
                    );

                }
            );

        });
}


// ============================================================
// OPEN LESSON
// ============================================================

async function openLesson(
    lessonId,
    moduleName
) {

    if (!lessonId) {
        return;
    }

    if (!lessonViewer) {
        return;
    }

    lessonViewer.classList.add("show");

    lessonViewer.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";


    if (lessonViewerContent) {

        lessonViewerContent.innerHTML = `
            <div class="card">
                <p class="loading">
                    Loading lesson content…
                </p>
            </div>
        `;
    }


    if (lessonCompleteMessage) {
        lessonCompleteMessage.style.display = "none";
    }


    if (completeLessonButton) {

        completeLessonButton.disabled = true;

        completeLessonButton.textContent =
            "✅ Mark Lesson Complete";
    }


    try {

        const result =
            await db
                .from("lessons")
                .select("*")
                .eq("id", lessonId)
                .maybeSingle();


        if (result.error) {
            throw result.error;
        }


        if (!result.data) {

            throw new Error(
                "The lesson could not be found."
            );
        }


        currentLesson =
            result.data;


        const title =
            currentLesson.title ||
            currentLesson.lesson_title ||
            "Lesson";


        if (lessonViewerTitle) {
            lessonViewerTitle.textContent =
                title;
        }


        if (lessonViewerModule) {
            lessonViewerModule.textContent =
                moduleName || "Course Lesson";
        }


        if (lessonViewerContent) {

            lessonViewerContent.innerHTML =
                safeLessonContent(
                    getLessonContent(currentLesson)
                );
        }


        if (completeLessonButton) {

            completeLessonButton.disabled =
                false;
        }


        await checkLessonCompletion(
            currentLesson.id
        );

    } catch (error) {

        console.error(
            "Lesson loading error:",
            error
        );


        if (lessonViewerContent) {

            lessonViewerContent.innerHTML = `
                <div class="dashboard-start-error">

                    <strong>
                        ⚠️ Lesson could not be opened
                    </strong>

                    <p style="margin-top:8px">
                        ${escapeHtml(
                            error.message ||
                            String(error)
                        )}
                    </p>

                </div>
            `;
        }
    }
}


// ============================================================
// CLOSE LESSON
// ============================================================

function closeLesson() {

    if (lessonViewer) {

        lessonViewer.classList.remove("show");

        lessonViewer.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    document.body.style.overflow = "";

    currentLesson = null;
}


// ============================================================
// CHECK LESSON COMPLETION
// ============================================================

async function checkLessonCompletion(
    lessonId
) {

    if (
        !currentUser ||
        !lessonId
    ) {
        return;
    }


    try {

        const result =
            await db
                .from("lesson_progress")
                .select("*")
                .eq("student_id", currentUser.id)
                .eq("lesson_id", lessonId)
                .maybeSingle();


        if (result.error) {

            console.warn(
                "Lesson progress check:",
                result.error
            );

            return;
        }


        if (
            result.data &&
            result.data.completed
        ) {

            if (lessonCompleteMessage) {

                lessonCompleteMessage.style.display =
                    "block";

                lessonCompleteMessage.innerHTML = `
                    <strong>
                        ✅ Lesson completed
                    </strong>

                    Your progress has already been saved.
                `;
            }


            if (completeLessonButton) {

                completeLessonButton.textContent =
                    "✅ Lesson Completed";

                completeLessonButton.disabled =
                    true;
            }

        } else {

            if (lessonCompleteMessage) {
                lessonCompleteMessage.style.display =
                    "none";
            }

            if (completeLessonButton) {

                completeLessonButton.textContent =
                    "✅ Mark Lesson Complete";

                completeLessonButton.disabled =
                    false;
            }
        }

    } catch (error) {

        console.warn(
            "Could not check lesson progress:",
            error
        );
    }
}


// ============================================================
// COMPLETE LESSON
// ============================================================

async function completeCurrentLesson() {

    if (
        !currentUser ||
        !currentLesson
    ) {

        alert(
            "Your student login could not be confirmed. Please log in again."
        );

        return;
    }


    if (completeLessonButton) {

        completeLessonButton.disabled =
            true;

        completeLessonButton.textContent =
            "Saving…";
    }


    try {

        const progressData = {

            student_id:
                currentUser.id,

            lesson_id:
                currentLesson.id,

            completed:
                true,

            completed_at:
                new Date().toISOString(),

            updated_at:
                new Date().toISOString()
        };


        const result =
            await db
                .from("lesson_progress")
                .upsert(
                    progressData,
                    {
                        onConflict:
                            "student_id,lesson_id"
                    }
                );


        if (result.error) {
            throw result.error;
        }


        if (lessonCompleteMessage) {

            lessonCompleteMessage.style.display =
                "block";

            lessonCompleteMessage.innerHTML = `
                <strong>
                    ✅ Lesson completed successfully.
                </strong>

                Your progress has been saved to your
                Funda Online Academy student account.
            `;
        }


        if (completeLessonButton) {

            completeLessonButton.textContent =
                "✅ Lesson Completed";

            completeLessonButton.disabled =
                true;
        }


    } catch (error) {

        console.error(
            "Lesson completion error:",
            error
        );


        if (completeLessonButton) {

            completeLessonButton.disabled =
                false;

            completeLessonButton.textContent =
                "✅ Mark Lesson Complete";
        }


        alert(
            "The lesson was opened successfully, but progress could not be saved yet.\n\n" +
            (
                error.message ||
                String(error)
            )
        );
    }
}


// ============================================================
// LOAD MY STUDIES
// ============================================================

async function loadMyStudies(user) {

    if (!studyList) {
        return;
    }


    studyList.innerHTML = `
        <div class="card">
            <p class="loading">
                Loading your courses…
            </p>
        </div>
    `;


    setStatus(
        "Loading your courses…"
    );


    // --------------------------------------------------------
    // Student profile
    // --------------------------------------------------------

    const student =
        currentStudent ||
        await getStudent(user.id);


    if (!student) {

        studyList.innerHTML = `
            <div class="empty-study">

                <div style="font-size:48px">
                    👤
                </div>

                <h3 style="margin-top:10px">
                    Student profile not found
                </h3>

                <p style="margin-top:8px;line-height:1.6">
                    Your login is working, but there is no
                    student record connected to this account.
                </p>

            </div>
        `;

        setStatus(
            "Login connected, but student profile was not found."
        );

        return;
    }


    currentStudent =
        student;


    // --------------------------------------------------------
    // Enrolments
    // --------------------------------------------------------

    const enrollments =
        await getApprovedEnrollments(
            student.id
        );


    if (enrollments.length === 0) {

        studyList.innerHTML = `
            <div class="empty-study">

                <div style="font-size:48px">
                    📚
                </div>

                <h3 style="margin-top:10px">
                    No approved courses yet
                </h3>

                <p style="margin-top:8px;line-height:1.6">
                    Your student account is working correctly.

                    Once Funda Online Academy approves your
                    enrolment, your course will appear here.
                </p>

            </div>
        `;

        setStatus(
            "Student account connected successfully."
        );

        return;
    }


    // --------------------------------------------------------
    // Load courses together
    // --------------------------------------------------------

    const courseIds =
        enrollments.map(
            enrollment => enrollment.course_id
        );


    const courses =
        await getCoursesByIds(courseIds);


    const courseMap =
        new Map(
            courses.map(
                course => [
                    String(course.id),
                    course
                ]
            )
        );


    // --------------------------------------------------------
    // Load lessons once
    // --------------------------------------------------------

    let allLessons = [];

    try {

        allLessons =
            await getLessons();

    } catch (error) {

        console.warn(
            "Lessons could not be loaded:",
            error
        );

        allLessons = [];
    }


    studyList.innerHTML = "";


    let displayedCourses = 0;


    // --------------------------------------------------------
    // Build each approved course
    // --------------------------------------------------------

    for (
        const enrollment of enrollments
    ) {

        try {

            const course =
                courseMap.get(
                    String(enrollment.course_id)
                );


            if (!course) {

                const errorCard =
                    document.createElement("div");

                errorCard.className =
                    "error-study";

                errorCard.innerHTML = `
                    <strong>
                        ⚠️ Course information could not be found.
                    </strong>

                    <p style="margin-top:8px">
                        Course ID:
                        ${escapeHtml(
                            enrollment.course_id
                        )}
                    </p>
                `;

                studyList.appendChild(
                    errorCard
                );

                continue;
            }


            const modules =
                await getModules(
                    enrollment.course_id
                );


            const courseModuleIds =
                new Set(
                    modules.map(
                        module => String(module.id)
                    )
                );


            const courseLessons =
                allLessons.filter(lesson => {

                    if (
                        lesson.module_id &&
                        courseModuleIds.has(
                            String(lesson.module_id)
                        )
                    ) {
                        return true;
                    }

                    return modules.some(module => {

                        return (
                            lesson.module_number !== undefined &&
                            module.module_number !== undefined &&
                            Number(
                                lesson.module_number
                            ) ===
                            Number(
                                module.module_number
                            )
                        );
                    });
                });


            renderStudy(
                enrollment,
                course,
                modules,
                courseLessons
            );


            displayedCourses++;

        } catch (error) {

            console.error(
                "Course loading error:",
                error
            );


            const errorCard =
                document.createElement("div");

            errorCard.className =
                "error-study";

            errorCard.innerHTML = `
                <strong>
                    ⚠️ One course could not be loaded.
                </strong>

                <p style="margin-top:8px">
                    ${escapeHtml(
                        error.message ||
                        String(error)
                    )}
                </p>
            `;

            studyList.appendChild(
                errorCard
            );
        }
    }


    setupModuleButtons();
    setupLessonButtons();


    if (displayedCourses > 0) {

        setStatus(
            "Student learning system ready."
        );

    } else {

        setStatus(
            "No course could be displayed."
        );
    }
}


// ============================================================
// HEADER
// ============================================================

async function loadStudentHeader(user) {

    if (userEmail) {
        userEmail.textContent =
            user.email || "";
    }


    const student =
        currentStudent ||
        await getStudent(user.id);


    if (
        student &&
        userName
    ) {

        userName.textContent =
            student.full_name ||
            student.first_name ||
            "Student";

    } else if (userName) {

        userName.textContent =
            user.user_metadata?.full_name ||
            "Student";
    }
}


// ============================================================
// ENROLMENTS DISPLAY
// ============================================================

async function loadEnrolments() {

    if (
        !enrolmentsContainer ||
        !currentStudent
    ) {
        return;
    }


    const enrollments =
        await getApprovedEnrollments(
            currentStudent.id
        );


    if (enrollments.length === 0) {

        enrolmentsContainer.innerHTML = `
            <div class="empty-study">
                <p>
                    You do not have approved enrolments yet.
                </p>
            </div>
        `;

        return;
    }


    const courseIds =
        enrollments.map(
            item => item.course_id
        );


    const courses =
        await getCoursesByIds(courseIds);


    const courseMap =
        new Map(
            courses.map(
                course => [
                    String(course.id),
                    course
                ]
            )
        );


    enrolmentsContainer.innerHTML =
        enrollments.map(enrollment => {

            const course =
                courseMap.get(
                    String(enrollment.course_id)
                );


            const name =
                getCourseName(course);


            const duration =
                getCourseDuration(course);


            return `
                <div class="card">

                    <span class="funda-status approved">
                        Approved
                    </span>

                    <h3>
                        ${escapeHtml(name)}
                    </h3>

                    ${
                        duration
                            ? `
                                <p style="margin-top:8px">
                                    ⏱️
                                    <strong>Duration:</strong>
                                    ${escapeHtml(duration)}
                                </p>
                            `
                            : ""
                    }

                    <p style="margin-top:8px">
                        Your enrolment has been approved.
                    </p>

                </div>
            `;

        }).join("");
}


// ============================================================
// AVAILABLE BUTTON SECTION
//
// The existing HTML contains an "available-courses"
// container. We DO NOT use it for a second course list.
//
// Instead, keep it quiet so courses only appear under
// My Studies, where each course has its own Available button.
// ============================================================

function hideSeparateAvailableCoursesSection() {

    if (!availableCourses) {
        return;
    }


    const section =
        availableCourses.closest("section");


    if (section) {

        // Hide the old duplicate "Available Courses"
        // section so it does not create another course list.

        section.style.display = "none";
    }
}


// ============================================================
// POLICY
// ============================================================

const policyCheckbox =
    document.getElementById(
        "policy-checkbox"
    );

const acceptPolicyButton =
    document.getElementById(
        "accept-policy-btn"
    );

const policyAccepted =
    document.getElementById(
        "policy-accepted"
    );


async function loadPolicyStatus(user) {

    const key =
        "foa_policy_accepted_" +
        user.id;


    if (
        localStorage.getItem(key) === "true"
    ) {

        if (policyCheckbox) {

            policyCheckbox.checked =
                true;

            policyCheckbox.disabled =
                true;
        }


        if (acceptPolicyButton) {

            acceptPolicyButton.disabled =
                true;
        }


        if (policyAccepted) {

            policyAccepted.style.display =
                "block";

            policyAccepted.innerHTML = `
                <strong>
                    ✅ Declaration accepted
                </strong>

                Your policy declaration has already
                been accepted on this device.
            `;
        }
    }
}


if (acceptPolicyButton) {

    acceptPolicyButton.addEventListener(
        "click",
        async () => {

            if (
                !policyCheckbox ||
                !policyCheckbox.checked
            ) {

                alert(
                    "Please tick the declaration checkbox before continuing."
                );

                return;
            }


            if (!currentUser) {
                return;
            }


            localStorage.setItem(
                "foa_policy_accepted_" +
                currentUser.id,
                "true"
            );


            if (policyAccepted) {

                policyAccepted.style.display =
                    "block";

                policyAccepted.innerHTML = `
                    <strong>
                        ✅ Declaration accepted
                    </strong>

                    Thank you. Your acceptance has
                    been recorded on this device.
                `;
            }


            policyCheckbox.disabled =
                true;

            acceptPolicyButton.disabled =
                true;
        }
    );
}


// ============================================================
// LESSON VIEWER EVENTS
// ============================================================

if (lessonClose) {

    lessonClose.addEventListener(
        "click",
        closeLesson
    );
}


if (lessonViewer) {

    lessonViewer.addEventListener(
        "click",
        event => {

            if (
                event.target === lessonViewer
            ) {

                closeLesson();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            lessonViewer &&
            lessonViewer.classList.contains("show")
        ) {

            closeLesson();
        }
    }
);


if (completeLessonButton) {

    completeLessonButton.addEventListener(
        "click",
        completeCurrentLesson
    );
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                if (db) {
                    await db.auth.signOut();
                }

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to log out. Please try again."
                );
            }
        }
    );
}


// ============================================================
// START
// ============================================================

async function initDashboard() {

    try {

        setStatus(
            "Connecting to Funda Online Academy…"
        );


        db =
            createDatabase();


        setStatus(
            "Checking student login…"
        );


        currentUser =
            await getCurrentUser();


        if (!currentUser) {
            return;
        }


        console.log(
            "Authenticated student:",
            currentUser.id
        );


        // ----------------------------------------------------
        // Student profile
        // ----------------------------------------------------

        try {

            currentStudent =
                await getStudent(
                    currentUser.id
                );

        } catch (error) {

            console.warn(
                "Student profile could not load:",
                error
            );
        }


        // ----------------------------------------------------
        // Header
        // ----------------------------------------------------

        try {

            await loadStudentHeader(
                currentUser
            );

        } catch (error) {

            console.warn(
                "Header could not load:",
                error
            );
        }


        // ----------------------------------------------------
        // Policy
        // ----------------------------------------------------

        try {

            await loadPolicyStatus(
                currentUser
            );

        } catch (error) {

            console.warn(
                "Policy could not load:",
                error
            );
        }


        // ----------------------------------------------------
        // Hide only the OLD duplicate Available Courses area.
        //
        // The Available button is still displayed on each
        // course under My Studies.
        // ----------------------------------------------------

        hideSeparateAvailableCoursesSection();


        // ----------------------------------------------------
        // Main course loading
        // ----------------------------------------------------

        await loadMyStudies(
            currentUser
        );


        // ----------------------------------------------------
        // Enrolments
        // ----------------------------------------------------

        try {

            await loadEnrolments();

        } catch (error) {

            console.warn(
                "Enrolments could not load:",
                error
            );
        }


        setStatus(
            "Student learning system ready."
        );


    } catch (error) {

        console.error(
            "FUNDA DASHBOARD ERROR:",
            error
        );


        setStatus(
            "Student learning system could not start."
        );


        if (studyList) {

            studyList.innerHTML = `
                <div class="dashboard-start-error">

                    <strong>
                        ⚠️ Student learning system could not start
                    </strong>

                    <p style="margin-top:10px">
                        ${escapeHtml(
                            error.message ||
                            String(error)
                        )}
                    </p>

                    <p style="margin-top:10px;font-size:14px">
                        Please make sure you are logged in
                        and that the Supabase connection is working.
                    </p>

                </div>
            `;
        }
    }
}


// ============================================================
// RUN
// ============================================================

initDashboard();
