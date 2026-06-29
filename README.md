# GetHired — Full Stack Job Portal

> A complete MERN stack job portal with candidate verification, ATS scoring, company trust system, coding assessments, and global job board integration.

**Live Demo:** https://gethired-3f5z.onrender.com  
**Author:** Krishna.developer  
**GitHub:** https://github.com/Krish9927/GetHired

---

## Features

### For Candidates
- **Email OTP Verification** — verify with college email (.edu / .ac.in) for bonus trust score
- **ATS Resume Scoring** — upload PDF resume, get instant ATS score (0–100)
- **Candidate Trust Score** — composite score based on email, resume, GitHub, LinkedIn, CGPA
- **Verified Candidate Badge** — earned when trust score ≥ 60 and email verified
- **Job Search & Filters** — filter by location, role, salary, experience, job type
- **Global Job Board** — remote + on-site jobs from Remotive, Arbeitnow, The Muse
- **Coding Assessments** — MCQ tests linked to job applications
- **Forgot Password** — OTP-based password reset via email
- **AI Chatbot** — built-in assistant for profile and job guidance

### For Recruiters
- **Company Registration & Verification** — official email domain + website HTTPS check + trust score
- **Job Posting** — with CGPA eligibility, minimum score filter
- **Fake Job Detection** — auto-detects scam phrases, routes suspicious jobs to admin review
- **Candidate Assessment** — create MCQ tests from question bank, start test, view leaderboard
- **Application Management** — approve/reject applicants, auto-accept when candidate passes test
- **Email Notifications** — welcome, OTP, test invite, result, interview invite emails

### For Admins
- **Company Approval/Rejection/Ban** — trust score + domain verification
- **Suspicious Job Review** — approve or reject flagged jobs
- **Candidate Metrics** — trust score, ATS score, CGPA visible per applicant

---

## Tech Stack

### Frontend
- React 18 + Vite
- Redux Toolkit + Redux Persist
- React Router v6
- Tailwind CSS + shadcn/ui
- Framer Motion
- Axios

### Backend
- Node.js + Express.js (ESM)
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (file uploads)
- Nodemailer (Gmail SMTP)
- pdf-parse (ATS scoring)

---

## Getting Started (Local Development)

### 1. Clone the repo
```bash
git clone https://github.com/Krish9927/GetHired.git
cd GetHired
```

### 2. Set up backend environment
```bash
cp backend/.env.sample backend/.env
# Fill in all values in backend/.env
```

### 3. Run backend
```bash
cd backend && npm install && npm run dev
```

### 4. Run frontend
```bash
cd Frontend && npm install && npm run dev
```

---

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `SECRET_KEY` | JWT secret key |
| `CLOUD_NAME` | Cloudinary cloud name |
| `API_KEY` | Cloudinary API key |
| `API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail App Password |
| `ADMIN_EMAILS` | Comma-separated admin emails |
| `CLIENT_URL` | Frontend URL (for email links) |

---

## Deploy on Render

1. Push to GitHub
2. Create a **Web Service** on Render, connect your repo
3. Set **Build Command:** `npm run build`
4. Set **Start Command:** `npm run start`
5. Add all environment variables from table above
6. Set `NODE_VERSION = 20.19.0` in Render environment
7. In MongoDB Atlas → Network Access → Allow `0.0.0.0/0`

---

## Assessment Feature Flow

1. Recruiter creates a test when posting a job (pick topics or custom questions)
2. Recruiter starts the test — all applicants get an email invite with test link + scheduled time
3. Candidate takes the timed MCQ test from their Profile → Applied Jobs section
4. On passing: application auto-accepted + interview invite email sent
5. On failing: no email sent (candidate sees score on screen)
6. Recruiter views leaderboard with rankings

---

© 2027 Krishna.developer. All Rights Reserved.
