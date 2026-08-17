/* =========================================================
   JOBSEEKER APPLICATION
========================================================= */


/* =========================================================
   DEFAULT JOB DATA
========================================================= */

const defaultJobs = [

    {
        id: 1,
        title: "Frontend Developer",
        company: "Tech Solutions Inc.",
        location: "Manila",
        category: "IT",
        type: "Full Time",
        salary: "₱35,000 - ₱50,000",
        skills: [
            "HTML",
            "CSS",
            "JavaScript"
        ],
        description:
            "Develop responsive and user-friendly websites and web applications.",
        postedBy: "system"
    },


    {
        id: 2,
        title: "Backend Developer",
        company: "Digital Systems",
        location: "Quezon City",
        category: "IT",
        type: "Full Time",
        salary: "₱40,000 - ₱60,000",
        skills: [
            "PHP",
            "MySQL",
            "API"
        ],
        description:
            "Build APIs, databases, and backend services for business applications.",
        postedBy: "system"
    },


    {
        id: 3,
        title: "UI/UX Designer",
        company: "Creative Studio",
        location: "Cebu",
        category: "Design",
        type: "Full Time",
        salary: "₱30,000 - ₱45,000",
        skills: [
            "Figma",
            "UI Design",
            "UX"
        ],
        description:
            "Create attractive and user-friendly digital interfaces.",
        postedBy: "system"
    },


    {
        id: 4,
        title: "IT Support Specialist",
        company: "Global IT Corp.",
        location: "Davao",
        category: "IT",
        type: "Full Time",
        salary: "₱25,000 - ₱35,000",
        skills: [
            "Networking",
            "Windows",
            "Linux"
        ],
        description:
            "Provide technical support and troubleshoot hardware and software problems.",
        postedBy: "system"
    },


    {
        id: 5,
        title: "Digital Marketing Specialist",
        company: "Marketing Pro",
        location: "Manila",
        category: "Marketing",
        type: "Remote",
        salary: "₱30,000 - ₱45,000",
        skills: [
            "SEO",
            "Social Media",
            "Analytics"
        ],
        description:
            "Develop digital marketing campaigns and manage social media platforms.",
        postedBy: "system"
    },


    {
        id: 6,
        title: "Data Analyst",
        company: "DataWorks",
        location: "Quezon City",
        category: "Finance",
        type: "Full Time",
        salary: "₱38,000 - ₱55,000",
        skills: [
            "Excel",
            "SQL",
            "Power BI"
        ],
        description:
            "Analyze data and create reports and dashboards for business decisions.",
        postedBy: "system"
    }

];


/* =========================================================
   APPLICATION STATE
========================================================= */

let jobs =
    JSON.parse(
        localStorage.getItem("jobs")
    ) || defaultJobs;


let users =
    JSON.parse(
        localStorage.getItem("users")
    ) || [];


let applications =
    JSON.parse(
        localStorage.getItem("applications")
    ) || [];


let savedJobs =
    JSON.parse(
        localStorage.getItem("savedJobs")
    ) || [];


let currentUser =
    JSON.parse(
        localStorage.getItem("currentUser")
    ) || null;


let selectedJob = null;


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    localStorage.setItem(
        "jobs",
        JSON.stringify(jobs)
    );

    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );

    localStorage.setItem(
        "applications",
        JSON.stringify(applications)
    );

    localStorage.setItem(
        "savedJobs",
        JSON.stringify(savedJobs)
    );
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

        const element =
            document.getElementById(id);

        if (element) {
            element.classList.add("hidden");
        }

    });


    if (page === "home") {

        document
            .getElementById("homePage")
            .classList.remove("hidden");

        renderFeaturedJobs();
    }


    if (page === "jobs") {

        document
            .getElementById("jobsPage")
            .classList.remove("hidden");

        filterJobs();
    }


    if (page === "about") {

        document
            .getElementById("aboutPage")
            .classList.remove("hidden");
    }


    if (page === "login") {

        document
            .getElementById("loginPage")
            .classList.remove("hidden");
    }


    if (page === "register") {

        document
            .getElementById("registerPage")
            .classList.remove("hidden");
    }


    if (page === "dashboard") {

        if (!currentUser) {

            showToast(
                "Please login first."
            );

            showPage("login");

            return;
        }


        document
            .getElementById("dashboardPage")
            .classList.remove("hidden");

        loadDashboard();
    }


    document
        .getElementById("navLinks")
        .classList.remove("show");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMenu() {

    document
        .getElementById("navLinks")
        .classList.toggle("show");
}


/* =========================================================
   REGISTER
========================================================= */

function register(event) {

    event.preventDefault();


    const name =
        document
            .getElementById("registerName")
            .value
            .trim();


    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("registerPassword")
            .value;


    const role =
        document
            .getElementById("registerRole")
            .value;


    const exists =
        users.some(
            user =>
                user.email === email
        );


    if (exists) {

        showToast(
            "This email is already registered."
        );

        return;
    }


    const newUser = {

        id: Date.now(),

        name,

        email,

        password,

        role,

        phone: "",

        skills: "",

        education: "",

        experience: ""

    };


    users.push(newUser);

    saveData();


    document
        .getElementById("registerName")
        .value = "";


    document
        .getElementById("registerEmail")
        .value = "";


    document
        .getElementById("registerPassword")
        .value = "";


    showToast(
        "Account created successfully!"
    );


    showPage("login");
}


/* =========================================================
   LOGIN
========================================================= */

function login(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    let user =
        users.find(
            user =>
                user.email === email &&
                user.password === password
        );


    /*
       DEMO ADMIN ACCOUNT
    */

    if (
        email ===
        "admin@workzone.com" &&
        password === "admin123"
    ) {

        user = {

            id: "admin",

            name: "Administrator",

            email:

                "admin@workzone.com",

            role: "admin"

        };

    }


    if (!user) {

        showToast(
            "Invalid email or password."
        );

        return;
    }


    currentUser = user;


    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );


    updateNavigation();


    document
        .getElementById("loginEmail")
        .value = "";


    document
        .getElementById("loginPassword")
        .value = "";


    showToast(
        "Login successful!"
    );


    showPage("dashboard");
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    currentUser = null;


    localStorage.removeItem(
        "currentUser"
    );


    updateNavigation();


    showToast(
        "You have been logged out."
    );


    showPage("home");
}


/* =========================================================
   NAVIGATION STATE
========================================================= */

function updateNavigation() {

    const guestNav =
        document.getElementById(
            "guestNav"
        );


    const userNav =
        document.getElementById(
            "userNav"
        );


    if (currentUser) {

        guestNav.classList.add(
            "hidden"
        );

        userNav.classList.remove(
            "hidden"
        );

    } else {

        guestNav.classList.remove(
            "hidden"
        );

        userNav.classList.add(
            "hidden"
        );

    }
}


/* =========================================================
   JOB CARD
========================================================= */

function createJobCard(job) {

    let isSaved = false;


    if (currentUser) {

        isSaved =
            savedJobs.some(
                item =>
                    item.userId ===
                    currentUser.id &&
                    item.jobId ===
                    job.id
            );

    }


    return `

        <div class="job-card">

            <h3>
                ${escapeHTML(job.title)}
            </h3>


            <p class="company">
                ${escapeHTML(job.company)}
            </p>


            <p class="meta">
                📍
                ${escapeHTML(job.location)}
            </p>


            <p class="meta">
                💰
                ${escapeHTML(job.salary)}
            </p>


            <p class="meta">
                💼
                ${escapeHTML(job.type)}
            </p>


            <div class="tags">

                ${job.skills
            .map(
                skill =>
                    `
                                <span class="tag">
                                    ${escapeHTML(skill)}
                                </span>
                                `
            )
            .join("")
        }

            </div>


            <div class="job-actions">

                <button
                    class="btn btn-primary"
                    onclick="openJob(${job.id})">

                    View Details

                </button>


                <button
                    class="btn btn-secondary"
                    onclick="toggleSaved(${job.id})">

                    ${isSaved
            ? "★ Saved"
            : "☆ Save"
        }

                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   FEATURED JOBS
========================================================= */

function renderFeaturedJobs() {

    const container =
        document.getElementById(
            "featuredJobs"
        );


    if (!container) return;


    const featured =
        jobs.slice(0, 6);


    if (featured.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No jobs available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        featured
            .map(createJobCard)
            .join("");


    updateHomeStats();
}


/* =========================================================
   ALL JOBS
========================================================= */

function renderAllJobs(jobList) {

    const container =
        document.getElementById(
            "allJobs"
        );


    if (!container) return;


    if (
        !jobList ||
        jobList.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <h3>
                    No jobs found
                </h3>

                <p>
                    Try changing your search
                    or filters.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        jobList
            .map(createJobCard)
            .join("");
}


/* =========================================================
   SEARCH FROM HOME
========================================================= */

function searchFromHome() {

    const keyword =
        document
            .getElementById(
                "homeKeyword"
            )
            .value;


    const location =
        document
            .getElementById(
                "homeLocation"
            )
            .value;


    const category =
        document
            .getElementById(
                "homeCategory"
            )
            .value;


    document
        .getElementById(
            "filterKeyword"
        )
        .value = keyword;


    document
        .getElementById(
            "filterLocation"
        )
        .value = location;


    document
        .getElementById(
            "filterCategory"
        )
        .value = category;


    showPage("jobs");
}


/* =========================================================
   FILTER JOBS
========================================================= */

function filterJobs() {

    const keyword =
        document
            .getElementById(
                "filterKeyword"
            )
            .value
            .trim()
            .toLowerCase();


    const location =
        document
            .getElementById(
                "filterLocation"
            )
            .value
            .trim()
            .toLowerCase();


    const category =
        document
            .getElementById(
                "filterCategory"
            )
            .value;


    const type =
        document
            .getElementById(
                "filterType"
            )
            .value;


    const results =
        jobs.filter(job => {

            const searchable = `

                ${job.title}

                ${job.company}

                ${job.location}

                ${job.category}

                ${job.skills.join(" ")}

            `.toLowerCase();


            const matchesKeyword =
                searchable.includes(
                    keyword
                );


            const matchesLocation =
                job.location
                    .toLowerCase()
                    .includes(location);


            const matchesCategory =
                !category ||
                job.category === category;


            const matchesType =
                !type ||
                job.type === type;


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

    document
        .getElementById(
            "filterKeyword"
        )
        .value = "";


    document
        .getElementById(
            "filterLocation"
        )
        .value = "";


    document
        .getElementById(
            "filterCategory"
        )
        .value = "";


    document
        .getElementById(
            "filterType"
        )
        .value = "";


    renderAllJobs(jobs);
}


/* =========================================================
   JOB DETAILS
========================================================= */

function openJob(id) {

    selectedJob =
        jobs.find(
            job => job.id === id
        );


    if (!selectedJob) return;


    document
        .getElementById(
            "modalTitle"
        )
        .textContent =
        selectedJob.title;


    document
        .getElementById(
            "modalCompany"
        )
        .textContent =
        "🏢 " +
        selectedJob.company;


    document
        .getElementById(
            "modalLocation"
        )
        .textContent =
        "📍 " +
        selectedJob.location;


    document
        .getElementById(
            "modalSalary"
        )
        .textContent =
        "💰 " +
        selectedJob.salary;


    document
        .getElementById(
            "modalType"
        )
        .textContent =
        "💼 " +
        selectedJob.type;


    document
        .getElementById(
            "modalDescription"
        )
        .textContent =
        selectedJob.description;


    document
        .getElementById(
            "modalSkills"
        )
        .innerHTML =
        selectedJob.skills
            .map(
                skill =>
                    `
                        <span class="tag">
                            ${escapeHTML(skill)}
                        </span>
                        `
            )
            .join("");


    document
        .getElementById(
            "jobModal"
        )
        .classList.remove(
            "hidden"
        );
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    document
        .getElementById(
            "jobModal"
        )
        .classList.add(
            "hidden"
        );
}


/* =========================================================
   APPLY FOR JOB
========================================================= */

function applyFromModal() {

    if (!currentUser) {

        closeModal();

        showToast(
            "Please login to apply."
        );

        showPage("login");

        return;
    }


    if (
        currentUser.role !==
        "seeker"
    ) {

        showToast(
            "Only job seekers can apply."
        );

        return;
    }


    if (!selectedJob) return;


    const alreadyApplied =
        applications.some(
            application =>
                application.jobId ===
                selectedJob.id &&
                application.userId ===
                currentUser.id
        );


    if (alreadyApplied) {

        showToast(
            "You already applied for this job."
        );

        return;
    }


    applications.push({

        id: Date.now(),

        jobId:
            selectedJob.id,

        userId:
            currentUser.id,

        status:
            "Pending",

        appliedAt:
            new Date()
                .toLocaleDateString()

    });


    saveData();


    closeModal();


    showToast(
        "Application submitted!"
    );


    updateDashboardStats();


    renderApplications();
}


/* =========================================================
   SAVE JOB
========================================================= */

function toggleSaved(id) {

    if (!currentUser) {

        showToast(
            "Please login to save jobs."
        );

        showPage("login");

        return;
    }


    const index =
        savedJobs.findIndex(
            item =>
                item.userId ===
                currentUser.id &&
                item.jobId === id
        );


    if (index !== -1) {

        savedJobs.splice(
            index,
            1
        );


        showToast(
            "Job removed from saved jobs."
        );

    } else {

        savedJobs.push({

            id: Date.now(),

            userId:
                currentUser.id,

            jobId: id

        });


        showToast(
            "Job saved!"
        );
    }


    saveData();


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

    toggleSaved(
        selectedJob.id
    );
}


/* =========================================================
   SAVED JOBS
========================================================= */

function renderSavedJobs() {

    const container =
        document.getElementById(
            "savedJobList"
        );


    if (!container) return;


    if (!currentUser) {

        container.innerHTML = `
            <div class="empty">
                Please login first.
            </div>
        `;

        return;
    }


    const savedIds =
        savedJobs
            .filter(
                item =>
                    item.userId ===
                    currentUser.id
            )
            .map(
                item =>
                    item.jobId
            );


    const saved =
        jobs.filter(
            job =>
                savedIds.includes(
                    job.id
                )
        );


    if (saved.length === 0) {

        container.innerHTML = `

            <div class="empty">

                <h3>
                    No Saved Jobs
                </h3>

                <p>
                    Save jobs you are
                    interested in.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        saved
            .map(createJobCard)
            .join("");
}


/* =========================================================
   PROFILE
========================================================= */

function loadProfile() {

    if (
        !currentUser ||
        currentUser.role === "admin"
    ) {
        return;
    }


    const user =
        users.find(
            user =>
                user.id ===
                currentUser.id
        );


    if (!user) return;


    document
        .getElementById(
            "profileName"
        )
        .value =
        user.name || "";


    document
        .getElementById(
            "profileEmail"
        )
        .value =
        user.email || "";


    document
        .getElementById(
            "profilePhone"
        )
        .value =
        user.phone || "";


    document
        .getElementById(
            "profileSkills"
        )
        .value =
        user.skills || "";


    document
        .getElementById(
            "profileEducation"
        )
        .value =
        user.education || "";


    document
        .getElementById(
            "profileExperience"
        )
        .value =
        user.experience || "";
}


/* =========================================================
   SAVE PROFILE
========================================================= */

function saveProfile(event) {

    event.preventDefault();


    if (!currentUser) return;


    const user =
        users.find(
            user =>
                user.id ===
                currentUser.id
        );


    if (!user) return;


    user.name =
        document
            .getElementById(
                "profileName"
            )
            .value
            .trim();


    user.email =
        document
            .getElementById(
                "profileEmail"
            )
            .value
            .trim();


    user.phone =
        document
            .getElementById(
                "profilePhone"
            )
            .value
            .trim();


    user.skills =
        document
            .getElementById(
                "profileSkills"
            )
            .value
            .trim();


    user.education =
        document
            .getElementById(
                "profileEducation"
            )
            .value
            .trim();


    user.experience =
        document
            .getElementById(
                "profileExperience"
            )
            .value
            .trim();


    currentUser =
        user;


    localStorage.setItem(
        "currentUser",
        JSON.stringify(
            currentUser
        )
    );


    saveData();


    updateDashboardUser();


    showToast(
        "Profile updated successfully!"
    );
}


/* =========================================================
   APPLICATIONS
========================================================= */

function renderApplications() {

    const container =
        document.getElementById(
            "applicationTable"
        );


    if (
        !container ||
        !currentUser
    ) {
        return;
    }


    const myApplications =
        applications.filter(
            application =>
                application.userId ===
                currentUser.id
        );


    if (
        myApplications.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <h3>
                    No Applications
                </h3>

                <p>
                    Start applying for jobs
                    to see them here.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>
                            Job
                        </th>

                        <th>
                            Company
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Applied
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${myApplications
            .map(
                application => {

                    const job =
                        jobs.find(
                            item =>
                                item.id ===
                                application.jobId
                        );


                    if (!job) {
                        return "";
                    }


                    const statusClass =
                        application.status
                            .toLowerCase()
                            .replace(
                                " ",
                                "-"
                            );


                    return `

                                        <tr>

                                            <td>
                                                ${escapeHTML(job.title)}
                                            </td>

                                            <td>
                                                ${escapeHTML(job.company)}
                                            </td>

                                            <td>

                                                <span
                                                    class="
                                                        badge
                                                        badge-${statusClass}
                                                    ">

                                                    ${escapeHTML(application.status)}

                                                </span>

                                            </td>

                                            <td>
                                                ${escapeHTML(application.appliedAt)}
                                            </td>

                                        </tr>

                                    `;

                }
            )
            .join("")
        }

                </tbody>

            </table>

        </div>

    `;
}


/* =========================================================
   EMPLOYER POST JOB
========================================================= */

function postJob(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;
    }


    if (
        currentUser.role !==
        "employer" &&
        currentUser.role !==
        "admin"
    ) {

        showToast(
            "Employer account required."
        );

        return;
    }


    const newJob = {

        id: Date.now(),

        title:
            document
                .getElementById(
                    "postTitle"
                )
                .value
                .trim(),

        company:
            document
                .getElementById(
                    "postCompany"
                )
                .value
                .trim(),

        location:
            document
                .getElementById(
                    "postLocation"
                )
                .value
                .trim(),

        category:
            document
                .getElementById(
                    "postCategory"
                )
                .value,

        type:
            document
                .getElementById(
                    "postType"
                )
                .value,

        salary:
            document
                .getElementById(
                    "postSalary"
                )
                .value
                .trim(),

        skills:
            document
                .getElementById(
                    "postSkills"
                )
                .value
                .split(",")
                .map(
                    skill =>
                        skill.trim()
                )
                .filter(Boolean),

        description:
            document
                .getElementById(
                    "postDescription"
                )
                .value
                .trim(),

        postedBy:
            currentUser.id

    };


    jobs.unshift(
        newJob
    );


    saveData();


    document
        .querySelector(
            "#tabEmployer form"
        )
        .reset();


    renderPostedJobs();

    renderFeaturedJobs();

    renderAllJobs(jobs);

    updateHomeStats();

    updateDashboardStats();


    showToast(
        "Job posted successfully!"
    );
}


/* =========================================================
   POSTED JOBS
========================================================= */

function renderPostedJobs() {

    const container =
        document.getElementById(
            "postedJobs"
        );


    if (
        !container ||
        !currentUser
    ) {
        return;
    }


    const postedJobs =
        jobs.filter(
            job =>
                job.postedBy ===
                currentUser.id
        );


    if (
        postedJobs.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <h3>
                    No Jobs Posted
                </h3>

                <p>
                    Create your first
                    job posting.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        postedJobs
            .map(
                job => `

                    <div
                        class="job-card"
                        style="margin-bottom:15px">

                        <h3>
                            ${escapeHTML(job.title)}
                        </h3>

                        <p class="company">
                            ${escapeHTML(job.company)}
                        </p>

                        <p class="meta">
                            📍
                            ${escapeHTML(job.location)}
                        </p>

                        <button
                            class="btn btn-danger"
                            onclick="deleteJob(${job.id})">

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

function deleteJob(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this job?"
        );


    if (!confirmDelete) {
        return;
    }


    jobs =
        jobs.filter(
            job =>
                job.id !== id
        );


    applications =
        applications.filter(
            application =>
                application.jobId !== id
        );


    savedJobs =
        savedJobs.filter(
            item =>
                item.jobId !== id
        );


    saveData();


    renderPostedJobs();

    renderFeaturedJobs();

    renderAllJobs(jobs);

    renderApplications();

    renderSavedJobs();

    updateHomeStats();

    updateDashboardStats();


    showToast(
        "Job deleted successfully."
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

function dashboardTab(
    tab,
    clickedButton
) {

    document
        .querySelectorAll(
            ".dashboard-tab"
        )
        .forEach(element => {

            element.classList.add(
                "hidden"
            );

        });


    document
        .querySelectorAll(
            ".sidebar-link"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    if (clickedButton) {

        clickedButton.classList.add(
            "active"
        );
    }


    const tabElement =
        document.getElementById(
            "tab" +
            tab
                .charAt(0)
                .toUpperCase() +
            tab.slice(1)
        );


    if (tabElement) {

        tabElement.classList.remove(
            "hidden"
        );
    }


    if (tab === "profile") {

        loadProfile();
    }


    if (tab === "applications") {

        renderApplications();
    }


    if (tab === "saved") {

        renderSavedJobs();
    }


    if (tab === "employer") {

        renderPostedJobs();
    }
}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadDashboard() {

    if (!currentUser) {
        return;
    }


    updateDashboardUser();

    updateDashboardStats();

    loadProfile();

    renderApplications();

    renderSavedJobs();

    renderPostedJobs();


    const employerMenu =
        document.getElementById(
            "employerMenu"
        );


    if (
        currentUser.role ===
        "employer" ||
        currentUser.role ===
        "admin"
    ) {

        employerMenu.classList.remove(
            "hidden"
        );

    } else {

        employerMenu.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   DASHBOARD USER
========================================================= */

function updateDashboardUser() {

    if (!currentUser) {
        return;
    }


    document
        .getElementById(
            "dashboardName"
        )
        .textContent =
        currentUser.name;


    document
        .getElementById(
            "sidebarName"
        )
        .textContent =
        currentUser.name;


    document
        .getElementById(
            "sidebarRole"
        )
        .textContent =
        currentUser.role ===
            "employer"
            ? "Employer"
            : currentUser.role ===
                "admin"
                ? "Administrator"
                : "Job Seeker";
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats() {

    if (!currentUser) {
        return;
    }


    const applicationCount =
        applications.filter(
            application =>
                application.userId ===
                currentUser.id
        ).length;


    const savedCount =
        savedJobs.filter(
            item =>
                item.userId ===
                currentUser.id
        ).length;


    const postedCount =
        jobs.filter(
            job =>
                job.postedBy ===
                currentUser.id
        ).length;


    document
        .getElementById(
            "dashApplications"
        )
        .textContent =
        applicationCount;


    document
        .getElementById(
            "dashSaved"
        )
        .textContent =
        savedCount;


    document
        .getElementById(
            "dashPosted"
        )
        .textContent =
        postedCount;
}


/* =========================================================
   HOME STATISTICS
========================================================= */

function updateHomeStats() {

    const companyCount =
        new Set(
            jobs.map(
                job =>
                    job.company
            )
        ).size;


    const applicantCount =
        users.filter(
            user =>
                user.role ===
                "seeker"
        ).length;


    document
        .getElementById(
            "homeJobCount"
        )
        .textContent =
        jobs.length;


    document
        .getElementById(
            "homeCompanyCount"
        )
        .textContent =
        companyCount;


    document
        .getElementById(
            "homeApplicantCount"
        )
        .textContent =
        applicantCount;
}


/* =========================================================
   TOAST MESSAGE
========================================================= */

let toastTimer;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.style.display =
        "block";


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.style.display =
                    "none";

            },
            3000
        );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {

    updateNavigation();

    renderFeaturedJobs();

    renderAllJobs(jobs);

    updateHomeStats();


    if (currentUser) {

        loadDashboard();

    }

}


/* START APPLICATION */

initialize();