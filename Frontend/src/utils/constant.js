// In production (Render), the frontend is served by the same Express server
// so we use relative URLs. In development, we use localhost:8000.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? "" : "http://localhost:8000");

export const USER_API_END_POINT = `${BASE_URL}/api/v1/user`;
export const JOB_API_END_POINT = `${BASE_URL}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${BASE_URL}/api/v1/application`;
export const COMPANY_API_END_POINT = `${BASE_URL}/api/v1/company`;
export const VERIFICATION_API_END_POINT = `${BASE_URL}/api/v1/verification`;
export const COMPANY_VERIFICATION_API_END_POINT = `${BASE_URL}/api/v1/company-verification`;
export const EXTERNAL_JOBS_API_END_POINT = `${BASE_URL}/api/v1/external-jobs`;
