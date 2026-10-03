-- ============================================================
-- Jobseeker database schema (PostgreSQL)
-- Usage:  createdb jobseeker && psql -d jobseeker -f jobseeker_schema.sql
-- ============================================================

BEGIN;

-- ---------- Enum types ----------
CREATE TYPE user_role          AS ENUM ('jobseeker', 'employer', 'admin');
CREATE TYPE employment_type    AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance');
CREATE TYPE work_setup         AS ENUM ('onsite', 'remote', 'hybrid');
CREATE TYPE job_status         AS ENUM ('draft', 'open', 'closed', 'archived');
CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn');
CREATE TYPE skill_level        AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- ---------- Auto-update updated_at ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Users (login accounts) ----------
CREATE TABLE users (
    user_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    role          user_role    NOT NULL DEFAULT 'jobseeker',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Jobseeker profiles ----------
CREATE TABLE jobseeker_profiles (
    profile_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name        VARCHAR(100) NOT NULL,
    middle_name       VARCHAR(100),
    last_name         VARCHAR(100) NOT NULL,
    phone             VARCHAR(30),
    birth_date        DATE,
    city              VARCHAR(100),
    province          VARCHAR(100),
    country           VARCHAR(100) DEFAULT 'Philippines',
    headline          VARCHAR(200),          -- e.g. "Junior Web Developer"
    summary           TEXT,
    expected_salary   NUMERIC(12,2),
    open_to_work      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Employers (companies) ----------
CREATE TABLE employers (
    employer_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    company_name  VARCHAR(200) NOT NULL,
    industry      VARCHAR(100),
    company_size  VARCHAR(50),               -- e.g. "11-50"
    website       VARCHAR(255),
    description   TEXT,
    logo_url      TEXT,
    city          VARCHAR(100),
    province      VARCHAR(100),
    country       VARCHAR(100) DEFAULT 'Philippines',
    is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Job categories ----------
CREATE TABLE job_categories (
    category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE
);

-- ---------- Skills catalog ----------
CREATE TABLE skills (
    skill_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE
);

-- ---------- Job postings ----------
CREATE TABLE jobs (
    job_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employer_id      BIGINT NOT NULL REFERENCES employers(employer_id) ON DELETE CASCADE,
    category_id      BIGINT REFERENCES job_categories(category_id) ON DELETE SET NULL,
    title            VARCHAR(200) NOT NULL,
    description      TEXT NOT NULL,
    requirements     TEXT,
    employment_type  employment_type NOT NULL DEFAULT 'full_time',
    work_setup       work_setup      NOT NULL DEFAULT 'onsite',
    city             VARCHAR(100),
    province         VARCHAR(100),
    country          VARCHAR(100) DEFAULT 'Philippines',
    salary_min       NUMERIC(12,2),
    salary_max       NUMERIC(12,2),
    salary_currency  CHAR(3) NOT NULL DEFAULT 'PHP',
    vacancies        INTEGER NOT NULL DEFAULT 1 CHECK (vacancies > 0),
    status           job_status NOT NULL DEFAULT 'draft',
    posted_at        TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);

-- Skills required by a job
CREATE TABLE job_skills (
    job_id   BIGINT NOT NULL REFERENCES jobs(job_id)     ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- ---------- Jobseeker details ----------
CREATE TABLE jobseeker_skills (
    profile_id        BIGINT NOT NULL REFERENCES jobseeker_profiles(profile_id) ON DELETE CASCADE,
    skill_id          BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    level             skill_level NOT NULL DEFAULT 'intermediate',
    years_experience  NUMERIC(4,1),
    PRIMARY KEY (profile_id, skill_id)
);

CREATE TABLE education (
    education_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id     BIGINT NOT NULL REFERENCES jobseeker_profiles(profile_id) ON DELETE CASCADE,
    school_name    VARCHAR(200) NOT NULL,
    degree         VARCHAR(150),
    field_of_study VARCHAR(150),
    start_date     DATE,
    end_date       DATE,
    description    TEXT,
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE work_experience (
    experience_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id    BIGINT NOT NULL REFERENCES jobseeker_profiles(profile_id) ON DELETE CASCADE,
    company_name  VARCHAR(200) NOT NULL,
    job_title     VARCHAR(150) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE,                       -- NULL = current job
    description   TEXT,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE resumes (
    resume_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  BIGINT NOT NULL REFERENCES jobseeker_profiles(profile_id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Only one default resume per jobseeker
CREATE UNIQUE INDEX uq_resumes_one_default
    ON resumes(profile_id) WHERE is_default;

-- ---------- Applications ----------
CREATE TABLE applications (
    application_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id         BIGINT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    profile_id     BIGINT NOT NULL REFERENCES jobseeker_profiles(profile_id) ON DELETE CASCADE,
    resume_id      BIGINT REFERENCES resumes(resume_id) ON DELETE SET NULL,
    cover_letter   TEXT,
    status         application_status NOT NULL DEFAULT 'submitted',
    employer_notes TEXT,
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, profile_id)               -- one application per job
);

-- Status change history
CREATE TABLE application_status_history (
    history_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    old_status     application_status,
    new_status     application_status NOT NULL,
    changed_by     BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Saved jobs (bookmarks) ----------
CREATE TABLE saved_jobs (
    profile_id BIGINT NOT NULL REFERENCES jobseeker_profiles(profile_id) ON DELETE CASCADE,
    job_id     BIGINT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, job_id)
);

-- ---------- Notifications ----------
CREATE TABLE notifications (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Indexes ----------
CREATE INDEX idx_jobs_employer      ON jobs(employer_id);
CREATE INDEX idx_jobs_category      ON jobs(category_id);
CREATE INDEX idx_jobs_status_posted ON jobs(status, posted_at DESC);
CREATE INDEX idx_jobs_location      ON jobs(province, city);
CREATE INDEX idx_jobs_search        ON jobs USING gin (to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_apps_profile       ON applications(profile_id);
CREATE INDEX idx_apps_job_status    ON applications(job_id, status);
CREATE INDEX idx_education_profile  ON education(profile_id);
CREATE INDEX idx_experience_profile ON work_experience(profile_id);
CREATE INDEX idx_notifs_user_unread ON notifications(user_id) WHERE NOT is_read;

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_users_updated        BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated     BEFORE UPDATE ON jobseeker_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employers_updated    BEFORE UPDATE ON employers          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_jobs_updated         BEFORE UPDATE ON jobs               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications       FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Log application status changes automatically ----------
CREATE OR REPLACE FUNCTION log_application_status() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO application_status_history(application_id, old_status, new_status)
        VALUES (NEW.application_id, NULL, NEW.status);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO application_status_history(application_id, old_status, new_status)
        VALUES (NEW.application_id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_status_log
    AFTER INSERT OR UPDATE OF status ON applications
    FOR EACH ROW EXECUTE FUNCTION log_application_status();

-- ---------- Seed data ----------
INSERT INTO job_categories(name) VALUES
    ('Information Technology'), ('Engineering'), ('Healthcare'), ('Education'),
    ('Sales & Marketing'), ('Finance & Accounting'), ('Customer Service'),
    ('Administrative'), ('Hospitality'), ('Manufacturing');

INSERT INTO skills(name) VALUES
    ('Communication'), ('Microsoft Excel'), ('JavaScript'), ('Python'), ('SQL'),
    ('Customer Support'), ('Project Management'), ('Graphic Design'), ('Accounting'), ('Teamwork');

COMMIT;