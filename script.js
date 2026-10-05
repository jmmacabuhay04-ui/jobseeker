/* =========================================================
   JOBSEEKER APPLICATION  (Supabase version)
========================================================= */


/* =========================================================
   SUPABASE CONNECTION
   (Public/publishable key ito - ligtas sa browser dahil
   protektado ng Row Level Security sa database.)
========================================================= */

const SUPABASE_URL = "https://nxsfvqhvqsdbjlvzxjna.supabase.co";
const SUPABASE_KEY = "sb_publishable_9Yt2Cn7A-rtJparS2lZAqw_nUoTK6L8";

if (!window.supabase) {
    console.error(
        "Supabase library did not load. Check the <script> tag in index.html."
    );
}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* =========================================================
   APPLICATION STATE
========================================================= */

let jobs = [];

let applications = [];

let savedJobs = [];

let profilesMap = {};

let currentUser = null;

let selectedJob = null;


/* =========================================================
   HELPERS: DATA MAPPING + ERRORS
========================================================= */

function mapJob(row) {
    return {
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        category: row.category,
        type: row.type,
        salary: row.salary,
        skills: row.skills || [],
        description: row.description,
        postedBy: row.posted_by
    };
}


function formatDate(value) {
    if (!value) return "-";
    const date = new Date(
        String(value).length <= 10 ? value + "T00:00:00" : value
    );
    return date.toLocaleDateString();
}


function mapApplication(row) {
    return {
        id: row.id,
        jobId: row.job_id,
        userId: row.user_id,
        status: row.status,
        appliedAt: formatDate(row.applied_at)
    };
}


function handleError(error, fallback) {
    console.error(error);
    showToast((error && error.message) || fallback || "Something went wrong.");
}


/* =========================================================
   LOAD DATA FROM DATABASE
========================================================= */

async function loadJobs() {

    const { data, error } = await sb
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });

    if (error) {
        handleError(error, "Could not load jobs.");
        return;
    }

    jobs = data.map(mapJob);
}


async function loadCurrentUser() {

    const { data: sessionData } = await sb.auth.getSession();

    const session = sessionData && sessionData.session;

    if (!session) {
        currentUser = null;
        return;
    }

    const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    if (error || !data) {
        console.error(error);
        await sb.auth.signOut();
        currentUser = null;
        return;
    }

    currentUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone || "",
        skills: data.skills || "",
        education: data.education || "",
        experience: data.experience || ""
    };
}


/* Applications, saved jobs, at applicant profiles ng naka-login */

async function refreshUserData() {

    if (!currentUser) {
        applications = [];
        savedJobs = [];
        profilesMap = {};
        return;
    }

    const [appsResult, savedResult] = await Promise.all([
        sb.from("applications").select("*").order("id", { ascending: false }),
        sb.from("saved_jobs").select("*")
    ]);

    if (appsResult.error) {
        handleError(appsResult.error, "Could not load applications.");
    } else {
        applications = appsResult.data.map(mapApplication);
    }

    if (savedResult.error) {
        handleError(savedResult.error, "Could not load saved jobs.");
    } else {
        savedJobs = savedResult.data.map(item => ({
            id: item.id,
            userId: item.user_id,
            jobId: item.job_id
        }));
    }

    if (canManageApplications()) {

        const { data } = await sb
            .from("profiles")
            .select("id, name, email, skills");

        profilesMap = Object.fromEntries(
            (data || []).map(profile => [profile.id, profile])
        );
    }
}


function renderDashboardData() {

    if (!currentUser) return;

    updateDashboardStats();
    renderApplications();
    renderManageApplications();
    renderSavedJobs();
    renderPostedJobs();
    updateManageBadge();
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(page) {

    const pages = [
        "homePage",
        "jobsPage",
        "aboutPage",
        "loginPage",
        "registerPage",
        "dashboardPage"
    ];

    pages.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add("hidden");
    });

    if (page === "home") {
        document.getElementById("homePage").classList.remove("hidden");
        renderFeaturedJobs();
    }

    if (page === "jobs") {
        document.getElementById("jobsPage").classList.remove("hidden");
        filterJobs();
    }

    if (page === "about") {
        document.getElementById("aboutPage").classList.remove("hidden");
    }

    if (page === "login") {
        document.getElementById("loginPage").classList.remove("hidden");
    }

    if (page === "register") {
        document.getElementById("registerPage").classList.remove("hidden");
    }

    if (page === "dashboard") {

        if (!currentUser) {
            showToast("Please login first.");
            showPage("login");
            return;
        }

        document.getElementById("dashboardPage").classList.remove("hidden");

        loadDashboard();

        refreshUserData().then(renderDashboardData);
    }

    const navLinks = document.getElementById("navLinks");
    if (navLinks) navLinks.classList.remove("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMenu() {
    const navLinks = document.getElementById("navLinks");
    if (navLinks) navLinks.classList.toggle("show");
}


/* =========================================================
   REGISTER
========================================================= */

async function register(event) {

    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();

    const email = document
        .getElementById("registerEmail")
        .value.trim()
        .toLowerCase();

    const password = document.getElementById("registerPassword").value;

    const roleValue = String(
        document.getElementById("registerRole").value
    ).toLowerCase();

    /* Employer o seeker lang ang pwede. Hindi pwedeng mag-admin sa register. */

    const role = roleValue.includes("employer") ? "employer" : "seeker";

    if (!name) {
        showToast("Please enter your name.");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters.");
        return;
    }

    const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { name, role } }
    });

    if (error) {
        handleError(error, "Could not create account.");
        return;
    }

    document.getElementById("registerName").value = "";
    document.getElementById("registerEmail").value = "";
    document.getElementById("registerPassword").value = "";

    if (data.session) {

        await loadCurrentUser();
        await refreshUserData();

        updateNavigation();

        showToast("Account created successfully!");

        showPage("dashboard");

    } else {

        showToast("Account created. Please check your email to confirm it.");

        showPage("login");
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function login(event) {

    event.preventDefault();

    const email = document
        .getElementById("loginEmail")
        .value.trim()
        .toLowerCase();

    const password = document.getElementById("loginPassword").value;

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {

        console.error("Login error:", error);

        showToast(
            error.message === "Invalid login credentials"
                ? "Invalid email or password."
                : error.message
        );

        return;
    }

    await loadCurrentUser();

    if (!currentUser) {
        showToast("Could not load your profile. Please try again.");
        return;
    }

    await refreshUserData();

    updateNavigation();

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";

    showToast("Login successful!");

    showPage("dashboard");
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    await sb.auth.signOut();

    currentUser = null;
    applications = [];
    savedJobs = [];
    profilesMap = {};

    clearProfileForm();

    updateNavigation();

    showToast("You have been logged out.");

    showPage("home");
}


/* =========================================================
   NAVIGATION STATE
========================================================= */

function updateNavigation() {
    const guestNav = document.getElementById("guestNav");
    const userNav = document.getElementById("userNav");

    if (!guestNav || !userNav) return;

    guestNav.classList.toggle("hidden", !!currentUser);
    userNav.classList.toggle("hidden", !currentUser);
}


/* =========================================================
   JOB CARD
========================================================= */

function createJobCard(job) {

    let isSaved = false;

    if (currentUser) {
        isSaved = savedJobs.some(
            item =>
                item.userId === currentUser.id &&
                item.jobId === job.id
        );
    }

    return `

        <div class="job-card">

            <h3>${escapeHTML(job.title)}</h3>

            <p class="company">${escapeHTML(job.company)}</p>

            <p class="meta">📍 ${escapeHTML(job.location)}</p>

            <p class="meta">💰 ${escapeHTML(job.salary)}</p>

            <p class="meta">💼 ${escapeHTML(job.type)}</p>

            <div class="tags">
                ${job.skills
            .map(skill => `<span class="tag">${escapeHTML(skill)}</span>`)
            .join("")}
            </div>

            <div class="job-actions">

                <button class="btn btn-primary" onclick="openJob(${job.id})">
                    View Details
                </button>

                <button class="btn btn-secondary" onclick="toggleSaved(${job.id})">
                    ${isSaved ? "★ Saved" : "☆ Save"}
                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   FEATURED JOBS
========================================================= */

function renderFeaturedJobs() {

    const container = document.getElementById("featuredJobs");

    if (!container) return;

    const featured = jobs.slice(0, 6);

    if (featured.length === 0) {
        container.innerHTML = `
            <div class="empty">No jobs available.</div>
        `;
        updateHomeStats();
        return;
    }

    container.innerHTML = featured.map(createJobCard).join("");

    updateHomeStats();
}


/* =========================================================
   ALL JOBS
========================================================= */

function renderAllJobs(jobList) {

    const container = document.getElementById("allJobs");

    if (!container) return;

    if (!jobList || jobList.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h3>No jobs found</h3>
                <p>Try changing your search or filters.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = jobList.map(createJobCard).join("");
}


/* =========================================================
   SEARCH FROM HOME
========================================================= */

function searchFromHome() {

    const keyword = document.getElementById("homeKeyword").value;
    const location = document.getElementById("homeLocation").value;
    const category = document.getElementById("homeCategory").value;

    document.getElementById("filterKeyword").value = keyword;
    document.getElementById("filterLocation").value = location;
    document.getElementById("filterCategory").value = category;

    showPage("jobs");
}


/* =========================================================
   FILTER JOBS
========================================================= */

function filterJobs() {

    const keyword = document
        .getElementById("filterKeyword")
        .value.trim()
        .toLowerCase();

    const location = document
        .getElementById("filterLocation")
        .value.trim()
        .toLowerCase();

    const category = document.getElementById("filterCategory").value;

    const type = document.getElementById("filterType").value;

    const results = jobs.filter(job => {

        const searchable = `
            ${job.title}
            ${job.company}
            ${job.location}
            ${job.category}
            ${job.skills.join(" ")}
        `.toLowerCase();

        const matchesKeyword = searchable.includes(keyword);

        const matchesLocation = (job.location || "")
            .toLowerCase()
            .includes(location);

        const matchesCategory = !category || job.category === category;

        const matchesType = !type || job.type === type;

        return (
            matchesKeyword &&
            matchesLocation &&
            matchesCategory &&
            matchesType
        );
    });

    renderAllJobs(results);
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    document.getElementById("filterKeyword").value = "";
    document.getElementById("filterLocation").value = "";
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterType").value = "";

    renderAllJobs(jobs);
}


/* =========================================================
   JOB DETAILS
========================================================= */

function openJob(id) {

    selectedJob = jobs.find(job => job.id === id);

    if (!selectedJob) return;

    document.getElementById("modalTitle").textContent = selectedJob.title;

    document.getElementById("modalCompany").textContent =
        "🏢 " + selectedJob.company;

    document.getElementById("modalLocation").textContent =
        "📍 " + selectedJob.location;

    document.getElementById("modalSalary").textContent =
        "💰 " + selectedJob.salary;

    document.getElementById("modalType").textContent =
        "💼 " + selectedJob.type;

    document.getElementById("modalDescription").textContent =
        selectedJob.description;

    document.getElementById("modalSkills").innerHTML = selectedJob.skills
        .map(skill => `<span class="tag">${escapeHTML(skill)}</span>`)
        .join("");

    document.getElementById("jobModal").classList.remove("hidden");
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {
    document.getElementById("jobModal").classList.add("hidden");
}


/* =========================================================
   APPLY FOR JOB
========================================================= */

async function applyFromModal() {

    if (!currentUser) {
        closeModal();
        showToast("Please login to apply.");
        showPage("login");
        return;
    }

    if (currentUser.role !== "seeker") {
        showToast("Only job seekers can apply.");
        return;
    }

    if (!selectedJob) return;

    const alreadyApplied = applications.some(
        application =>
            application.jobId === selectedJob.id &&
            application.userId === currentUser.id
    );

    if (alreadyApplied) {
        showToast("You already applied for this job.");
        return;
    }

    const { error } = await sb.from("applications").insert({
        job_id: selectedJob.id,
        user_id: currentUser.id
    });

    if (error) {

        if (error.code === "23505") {
            showToast("You already applied for this job.");
        } else {
            handleError(error, "Could not submit application.");
        }

        return;
    }

    closeModal();

    await refreshUserData();

    renderDashboardData();

    showToast("Application submitted! Waiting for approval.");
}


/* =========================================================
   SAVE JOB
========================================================= */

async function toggleSaved(id) {

    if (!currentUser) {
        showToast("Please login to save jobs.");
        showPage("login");
        return;
    }

    const existing = savedJobs.find(
        item => item.userId === currentUser.id && item.jobId === id
    );

    if (existing) {

        const { error } = await sb
            .from("saved_jobs")
            .delete()
            .eq("id", existing.id);

        if (error) {
            handleError(error, "Could not remove saved job.");
            return;
        }

        savedJobs = savedJobs.filter(item => item.id !== existing.id);

        showToast("Job removed from saved jobs.");

    } else {

        const { data, error } = await sb
            .from("saved_jobs")
            .insert({ user_id: currentUser.id, job_id: id })
            .select()
            .single();

        if (error) {
            handleError(error, "Could not save job.");
            return;
        }

        savedJobs.push({
            id: data.id,
            userId: data.user_id,
            jobId: data.job_id
        });

        showToast("Job saved!");
    }

    renderFeaturedJobs();
    renderAllJobs(jobs);
    renderSavedJobs();
    updateDashboardStats();
}


/* =========================================================
   SAVE CURRENT JOB
========================================================= */

function saveCurrentJob() {
    if (!selectedJob) return;
    toggleSaved(selectedJob.id);
}


/* =========================================================
   SAVED JOBS
========================================================= */

function renderSavedJobs() {

    const container = document.getElementById("savedJobList");

    if (!container) return;

    if (!currentUser) {
        container.innerHTML = `
            <div class="empty">Please login first.</div>
        `;
        return;
    }

    const savedIds = savedJobs
        .filter(item => item.userId === currentUser.id)
        .map(item => item.jobId);

    const saved = jobs.filter(job => savedIds.includes(job.id));

    if (saved.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h3>No Saved Jobs</h3>
                <p>Save jobs you are interested in.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = saved.map(createJobCard).join("");
}


/* =========================================================
   PROFILE
========================================================= */

function clearProfileForm() {
    [
        "profileName",
        "profileEmail",
        "profilePhone",
        "profileSkills",
        "profileEducation",
        "profileExperience"
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}


function loadProfile() {

    if (!currentUser) return;

    clearProfileForm();

    document.getElementById("profileName").value = currentUser.name || "";
    document.getElementById("profileEmail").value = currentUser.email || "";
    document.getElementById("profilePhone").value = currentUser.phone || "";
    document.getElementById("profileSkills").value = currentUser.skills || "";
    document.getElementById("profileEducation").value = currentUser.education || "";
    document.getElementById("profileExperience").value = currentUser.experience || "";

    /* Hindi mababago ang email dito (kailangan ng email verification) */

    document.getElementById("profileEmail").readOnly = true;
}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveProfile(event) {

    event.preventDefault();

    if (!currentUser) return;

    const updates = {
        name: document.getElementById("profileName").value.trim(),
        phone: document.getElementById("profilePhone").value.trim(),
        skills: document.getElementById("profileSkills").value.trim(),
        education: document.getElementById("profileEducation").value.trim(),
        experience: document.getElementById("profileExperience").value.trim()
    };

    const { error } = await sb
        .from("profiles")
        .update(updates)
        .eq("id", currentUser.id);

    if (error) {
        handleError(error, "Could not update profile.");
        return;
    }

    currentUser = { ...currentUser, ...updates };

    updateDashboardUser();

    showToast("Profile updated successfully!");
}


/* =========================================================
   MY APPLICATIONS (JOB SEEKER VIEW)
========================================================= */

function renderApplications() {

    const container = document.getElementById("applicationTable");

    if (!container || !currentUser) return;

    const myApplications = applications.filter(
        application => application.userId === currentUser.id
    );

    if (myApplications.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h3>No Applications</h3>
                <p>Start applying for jobs to see them here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>
                    <tr>
                        <th>Job</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>

                    ${myApplications
            .map(application => {

                const job = jobs.find(
                    item => item.id === application.jobId
                );

                if (!job) return "";

                const statusClass = application.status
                    .toLowerCase()
                    .replace(" ", "-");

                return `
                                <tr>
                                    <td>${escapeHTML(job.title)}</td>
                                    <td>${escapeHTML(job.company)}</td>
                                    <td>
                                        <span class="badge badge-${statusClass}">
                                            ${escapeHTML(application.status)}
                                        </span>
                                    </td>
                                    <td>${escapeHTML(application.appliedAt)}</td>
                                    <td>
                                        ${application.status === "Approved"
                        ? `
                                                <button class="btn btn-primary"
                                                    onclick="respondToOffer(${application.id}, 'Accepted')">
                                                    Accept
                                                </button>
                                                <button class="btn btn-danger"
                                                    onclick="respondToOffer(${application.id}, 'Declined')">
                                                    Decline
                                                </button>
                                            `
                        : "-"}
                                    </td>
                                </tr>
                            `;
            })
            .join("")}

                </tbody>

            </table>

        </div>

    `;
}


/* =========================================================
   JOB SEEKER: ACCEPT / DECLINE APPROVED APPLICATION
========================================================= */

async function respondToOffer(id, response) {

    if (!currentUser || currentUser.role !== "seeker") {
        showToast("Only job seekers can respond to an offer.");
        return;
    }

    if (response === "Declined") {
        const ok = confirm("Are you sure you want to decline this offer?");
        if (!ok) return;
    }

    const { data, error } = await sb
        .from("applications")
        .update({ status: response })
        .eq("id", id)
        .select();

    if (error) {
        handleError(error, "Could not update application.");
        return;
    }

    if (!data || data.length === 0) {
        showToast("This application is not waiting for your response.");
        await refreshUserData();
        renderDashboardData();
        return;
    }

    await refreshUserData();

    renderDashboardData();

    showToast(
        response === "Accepted"
            ? "You accepted the offer. Congratulations!"
            : "You declined the offer."
    );
}


/* =========================================================
   MANAGE APPLICATIONS (ADMIN / EMPLOYER)

   - Admin: nakikita ang LAHAT ng applications
   - Employer: applications lang sa mga job na siya ang nag-post
   (Ang database mismo ang nagpapatupad nito sa pamamagitan ng RLS.)
========================================================= */

function canManageApplications() {
    return (
        !!currentUser &&
        (currentUser.role === "admin" || currentUser.role === "employer")
    );
}


function getManageableApplications() {

    if (!canManageApplications()) return [];

    if (currentUser.role === "admin") return applications;

    return applications.filter(application => {
        const job = jobs.find(item => item.id === application.jobId);
        return job && job.postedBy === currentUser.id;
    });
}


function showManageApplications(clickedButton) {
    dashboardTab("manage", clickedButton);
}


function updateManageBadge() {

    const menu = document.getElementById("adminMenu");

    if (!menu) return;

    const pending = getManageableApplications().filter(
        application => application.status === "Pending"
    ).length;

    menu.innerHTML =
        "✅ Manage Applications" +
        (pending > 0 ? ` (${pending})` : "");
}


function renderManageApplications() {

    const container = document.getElementById("manageTable");

    if (!container || !canManageApplications()) return;

    const list = getManageableApplications();

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h3>No Applications</h3>
                <p>Applications from job seekers will appear here.</p>
            </div>
        `;
        return;
    }

    /* Pending muna sa taas, tapos pinakabago */

    const sorted = [...list].sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        return b.id - a.id;
    });

    const rows = sorted
        .map(application => {

            const job = jobs.find(item => item.id === application.jobId);

            const applicant = profilesMap[application.userId];

            if (!job) return "";

            const statusClass = application.status
                .toLowerCase()
                .replace(" ", "-");

            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(applicant ? applicant.name : "Unknown")}</strong>
                        <br>
                        <small>${escapeHTML(applicant ? applicant.email : "")}</small>
                        ${applicant && applicant.skills
                    ? `<br><small>Skills: ${escapeHTML(applicant.skills)}</small>`
                    : ""}
                    </td>
                    <td>${escapeHTML(job.title)}</td>
                    <td>${escapeHTML(job.company)}</td>
                    <td>
                        <span class="badge badge-${statusClass}">
                            ${escapeHTML(application.status)}
                        </span>
                    </td>
                    <td>${escapeHTML(application.appliedAt)}</td>
                    <td>
                        ${application.status === "Pending"
                    ? `
                                <button class="btn btn-primary"
                                    onclick="updateApplicationStatus(${application.id}, 'Approved')">
                                    Approve
                                </button>
                                <button class="btn btn-danger"
                                    onclick="updateApplicationStatus(${application.id}, 'Rejected')">
                                    Reject
                                </button>
                            `
                    : application.status === "Approved"
                        ? "<small>Waiting for applicant's response</small>"
                        : "<small>Done</small>"}
                    </td>
                </tr>
            `;
        })
        .join("");

    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>
                    <tr>
                        <th>Applicant</th>
                        <th>Job</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>${rows}</tbody>

            </table>

        </div>

    `;
}


async function updateApplicationStatus(id, status) {

    if (!canManageApplications()) {
        showToast("You are not allowed to do that.");
        return;
    }

    const { data, error } = await sb
        .from("applications")
        .update({ status })
        .eq("id", id)
        .select();

    if (error) {
        handleError(error, "Could not update application.");
        return;
    }

    if (!data || data.length === 0) {
        showToast("You cannot manage this application.");
        return;
    }

    await refreshUserData();

    renderManageApplications();

    updateManageBadge();

    showToast("Application " + status.toLowerCase() + ".");
}


/* =========================================================
   EMPLOYER POST JOB
========================================================= */

async function postJob(event) {

    event.preventDefault();

    if (!currentUser) {
        showToast("Please login first.");
        return;
    }

    if (currentUser.role !== "employer" && currentUser.role !== "admin") {
        showToast("Employer account required.");
        return;
    }

    const newJob = {
        title: document.getElementById("postTitle").value.trim(),
        company: document.getElementById("postCompany").value.trim(),
        location: document.getElementById("postLocation").value.trim(),
        category: document.getElementById("postCategory").value,
        type: document.getElementById("postType").value,
        salary: document.getElementById("postSalary").value.trim(),
        skills: document
            .getElementById("postSkills")
            .value.split(",")
            .map(skill => skill.trim())
            .filter(Boolean),
        description: document.getElementById("postDescription").value.trim(),
        posted_by: currentUser.id
    };

    const { error } = await sb.from("jobs").insert(newJob);

    if (error) {
        handleError(error, "Could not post job.");
        return;
    }

    document.querySelector("#tabEmployer form").reset();

    await loadJobs();

    renderPostedJobs();
    renderFeaturedJobs();
    renderAllJobs(jobs);
    updateHomeStats();
    updateDashboardStats();

    showToast("Job posted successfully!");
}


/* =========================================================
   POSTED JOBS
========================================================= */

function renderPostedJobs() {

    const container = document.getElementById("postedJobs");

    if (!container || !currentUser) return;

    const postedJobs = jobs.filter(job => job.postedBy === currentUser.id);

    if (postedJobs.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h3>No Jobs Posted</h3>
                <p>Create your first job posting.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = postedJobs
        .map(
            job => `
                <div class="job-card" style="margin-bottom:15px">

                    <h3>${escapeHTML(job.title)}</h3>

                    <p class="company">${escapeHTML(job.company)}</p>

                    <p class="meta">📍 ${escapeHTML(job.location)}</p>

                    <button class="btn btn-danger" onclick="deleteJob(${job.id})">
                        Delete Job
                    </button>

                </div>
            `
        )
        .join("");
}


/* =========================================================
   DELETE JOB
========================================================= */

async function deleteJob(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this job?"
    );

    if (!confirmDelete) return;

    const { error } = await sb.from("jobs").delete().eq("id", id);

    if (error) {
        handleError(error, "Could not delete job.");
        return;
    }

    await loadJobs();

    await refreshUserData();

    renderFeaturedJobs();
    renderAllJobs(jobs);
    renderDashboardData();
    updateHomeStats();

    showToast("Job deleted successfully.");
}


/* =========================================================
   DASHBOARD
========================================================= */

function dashboardTab(tab, clickedButton) {

    document.querySelectorAll(".dashboard-tab").forEach(element => {
        element.classList.add("hidden");
    });

    document.querySelectorAll(".sidebar-link").forEach(button => {
        button.classList.remove("active");
    });

    if (clickedButton) clickedButton.classList.add("active");

    const tabElement = document.getElementById(
        "tab" + tab.charAt(0).toUpperCase() + tab.slice(1)
    );

    if (tabElement) tabElement.classList.remove("hidden");

    if (tab === "profile") loadProfile();

    if (tab === "saved") renderSavedJobs();

    if (tab === "employer") renderPostedJobs();

    if (tab === "applications") renderApplications();

    if (tab === "manage") renderManageApplications();

    /* Kunin ang pinakabagong data para makita agad ang mga update */

    if (tab === "applications" || tab === "manage") {
        refreshUserData().then(renderDashboardData);
    }
}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadDashboard() {

    if (!currentUser) return;

    updateDashboardUser();

    updateDashboardStats();

    loadProfile();

    renderApplications();

    renderSavedJobs();

    renderPostedJobs();

    const employerMenu = document.getElementById("employerMenu");

    if (employerMenu) {
        const canPost =
            currentUser.role === "employer" || currentUser.role === "admin";

        employerMenu.classList.toggle("hidden", !canPost);
    }

    const adminMenu = document.getElementById("adminMenu");

    if (adminMenu) {
        adminMenu.classList.toggle("hidden", !canManageApplications());
    }

    /* Applications at Saved Jobs ay para sa job seeker lang */

    const isSeeker = currentUser.role === "seeker";

    ["seekerApplicationsMenu", "seekerSavedMenu"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", !isSeeker);
    });

    updateManageBadge();

    /* Bumalik sa Overview tuwing papasok sa dashboard */

    const overviewButton = document.querySelector(".sidebar-link");

    dashboardTab("overview", overviewButton);
}


/* =========================================================
   DASHBOARD USER
========================================================= */

function updateDashboardUser() {

    if (!currentUser) return;

    const roleLabel =
        currentUser.role === "employer"
            ? "Employer"
            : currentUser.role === "admin"
                ? "Administrator"
                : "Job Seeker";

    setText("dashboardName", currentUser.name);
    setText("sidebarName", currentUser.name);
    setText("sidebarRole", roleLabel);
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats() {

    if (!currentUser) return;

    /* Seeker: sariling applications. Admin/Employer: natatanggap na applications */

    const applicationCount = canManageApplications()
        ? getManageableApplications().length
        : applications.filter(
            application => application.userId === currentUser.id
        ).length;

    const savedCount = savedJobs.filter(
        item => item.userId === currentUser.id
    ).length;

    const postedCount = jobs.filter(
        job => job.postedBy === currentUser.id
    ).length;

    setText("dashApplications", applicationCount);
    setText("dashSaved", savedCount);
    setText("dashPosted", postedCount);
}


/* =========================================================
   HOME STATISTICS
========================================================= */

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}


function updateHomeStats() {

    const companyCount = new Set(jobs.map(job => job.company)).size;

    setText("homeJobCount", jobs.length);
    setText("homeCompanyCount", companyCount);
}


/* =========================================================
   TOAST MESSAGE
========================================================= */

let toastTimer;


function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   INITIALIZATION
   (Tinatawag ng index.html pagkatapos ma-load ang script)
========================================================= */

async function initialize() {

    await loadJobs();

    await loadCurrentUser();

    await refreshUserData();

    updateNavigation();

    renderFeaturedJobs();

    renderAllJobs(jobs);

    updateHomeStats();

    if (currentUser) {
        loadDashboard();
        renderDashboardData();
    }
}