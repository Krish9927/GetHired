import axios from "axios";

// Strip HTML tags from description
const stripHtml = (html) =>
    (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 220);

// ─── Normalizers ─────────────────────────────────────────────────────────────
const normalize = {
    remotive: (job) => ({
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || "Remote",
        jobType: job.job_type || "Full-time",
        description: stripHtml(job.description),
        url: job.url,
        salary: job.salary || "",
        tags: job.tags || [],
        source: "Remotive",
        postedAt: job.publication_date,
        logo: job.company_logo || "",
        isRemote: true,
    }),

    arbeitnow: (job) => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || "Remote",
        jobType: job.job_types?.[0] || "Full-time",
        description: stripHtml(job.description),
        url: job.url,
        salary: "",
        tags: job.tags || [],
        source: "Arbeitnow",
        postedAt: job.created_at,
        logo: job.company_logo || "",
        isRemote: job.remote === true,
    }),

    themuse: (job) => ({
        id: `themuse-${job.id}`,
        title: job.name,
        company: job.company?.name || "",
        location: job.locations?.[0]?.name || "Remote",
        jobType: job.type || "Full-time",
        description: stripHtml(job.contents),
        url: job.refs?.landing_page || "",
        salary: "",
        tags: job.categories?.map((c) => c.name) || [],
        source: "The Muse",
        postedAt: job.publication_date,
        logo: "",
        isRemote: (job.locations?.[0]?.name || "").toLowerCase().includes("remote"),
    }),
};

// ─── Remote Jobs (Remotive = all remote, Arbeitnow remote=true) ───────────────
export const getRemoteJobs = async (req, res) => {
    try {
        const { search = "" } = req.query;

        const [remotiveRes, arbeitnowRes] = await Promise.allSettled([
            axios.get(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`, { timeout: 8000 }),
            axios.get(`https://arbeitnow.com/api/job-board-api?page=1`, { timeout: 8000 }),
        ]);

        let jobs = [];

        if (remotiveRes.status === "fulfilled") {
            const remJobs = (remotiveRes.value.data.jobs || []).slice(0, 15).map(normalize.remotive);
            jobs.push(...remJobs);
        }

        if (arbeitnowRes.status === "fulfilled") {
            let abJobs = (arbeitnowRes.value.data.data || [])
                .filter((j) => j.remote === true)
                .map(normalize.arbeitnow);

            if (search) {
                const q = search.toLowerCase();
                abJobs = abJobs.filter(
                    (j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
                );
            }
            jobs.push(...abJobs.slice(0, 15));
        }

        return res.status(200).json({ success: true, jobs, total: jobs.length });
    } catch (error) {
        console.error("Remote jobs error:", error.message);
        return res.status(500).json({ success: false, jobs: [], message: "Failed to fetch remote jobs" });
    }
};

// ─── Non-Remote Jobs (Arbeitnow remote=false + The Muse) ─────────────────────
export const getNonRemoteJobs = async (req, res) => {
    try {
        const { search = "" } = req.query;

        const [arbeitnowRes, museRes] = await Promise.allSettled([
            axios.get(`https://arbeitnow.com/api/job-board-api?page=1`, { timeout: 8000 }),
            axios.get(
                `https://www.themuse.com/api/public/jobs?query=${encodeURIComponent(search || "developer")}&page=1`,
                { timeout: 8000 }
            ),
        ]);

        let jobs = [];

        if (arbeitnowRes.status === "fulfilled") {
            let abJobs = (arbeitnowRes.value.data.data || [])
                .filter((j) => j.remote !== true)
                .map(normalize.arbeitnow);

            if (search) {
                const q = search.toLowerCase();
                abJobs = abJobs.filter(
                    (j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
                );
            }
            jobs.push(...abJobs.slice(0, 15));
        }

        if (museRes.status === "fulfilled") {
            const museJobs = (museRes.value.data.results || [])
                .filter((j) => !(j.locations?.[0]?.name || "").toLowerCase().includes("remote"))
                .slice(0, 15)
                .map(normalize.themuse);
            jobs.push(...museJobs);
        }

        return res.status(200).json({ success: true, jobs, total: jobs.length });
    } catch (error) {
        console.error("Non-remote jobs error:", error.message);
        return res.status(500).json({ success: false, jobs: [], message: "Failed to fetch non-remote jobs" });
    }
};

// ─── All External (combined search) ──────────────────────────────────────────
export const searchAllExternal = async (req, res) => {
    try {
        const { search = "" } = req.query;

        const [remotiveRes, arbeitnowRes, museRes] = await Promise.allSettled([
            axios.get(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`, { timeout: 8000 }),
            axios.get(`https://arbeitnow.com/api/job-board-api?page=1`, { timeout: 8000 }),
            axios.get(
                `https://www.themuse.com/api/public/jobs?query=${encodeURIComponent(search || "developer")}&page=1`,
                { timeout: 8000 }
            ),
        ]);

        let jobs = [];

        if (remotiveRes.status === "fulfilled") {
            jobs.push(...(remotiveRes.value.data.jobs || []).slice(0, 10).map(normalize.remotive));
        }

        if (arbeitnowRes.status === "fulfilled") {
            let abJobs = (arbeitnowRes.value.data.data || []).map(normalize.arbeitnow);
            if (search) {
                const q = search.toLowerCase();
                abJobs = abJobs.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
            }
            jobs.push(...abJobs.slice(0, 10));
        }

        if (museRes.status === "fulfilled") {
            jobs.push(...(museRes.value.data.results || []).slice(0, 10).map(normalize.themuse));
        }

        return res.status(200).json({ success: true, jobs, total: jobs.length });
    } catch (error) {
        console.error("External search error:", error.message);
        return res.status(500).json({ success: false, jobs: [], message: "External search failed" });
    }
};
