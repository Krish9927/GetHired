import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Home from "./components/Home";
import Jobs from "./components/Jobs";
import Browse from "./components/Browse";
import Profile from "./components/Profile";
import JobDescription from "./components/JobDescription";
import Companies from "./components/admin/Companies";
import CompanyCreate from "./components/admin/CompanyCreate";
import CompanySetup from "./components/admin/CompanySetup";
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from "./components/admin/PostJob";
import Applicants from "./components/admin/Applicants";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLogin from "./components/admin/AdminLogin";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminPanel from "./components/admin/AdminPanel";
import SelectedCandidates from "./pages/SelectedCandidates.jsx";
import ForgotPassword from "./components/auth/ForgotPassword";
import Chatbot from "./components/Chatbot";
import CreateTest from "./components/admin/CreateTest";
import TakeTest from "./components/TakeTest";
import TestResults from "./components/admin/TestResults";

const RootLayout = () => (
  <>
    <Outlet />
    <Chatbot />
  </>
);

const appRouter = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ── Public routes ────────────────────────────────────────────────────
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/jobs", element: <Jobs /> },
      { path: "/description/:id", element: <JobDescription /> },
      { path: "/browse", element: <Browse /> },
      { path: "/selected-candidates", element: <SelectedCandidates /> },
      { path: "/profile", element: <Profile /> },
      { path: "/test/:testId", element: <TakeTest /> },

      // ── Admin login (public) ─────────────────────────────────────────────
      { path: "/admin/login", element: <AdminLogin /> },

      // ── Admin-only panel (requires isAdmin flag) ─────────────────────────
      {
        path: "/admin/panel",
        element: (
          <AdminProtectedRoute>
            <AdminPanel />
          </AdminProtectedRoute>
        ),
      },

      // ── Recruiter routes (requires role === "recruiter") ─────────────────
      {
        path: "/admin/companies",
        element: (
          <ProtectedRoute>
            <Companies />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/companies/create",
        element: (
          <ProtectedRoute>
            <CompanyCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/companies/:id",
        element: (
          <ProtectedRoute>
            <CompanySetup />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/jobs",
        element: (
          <ProtectedRoute>
            <AdminJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/jobs/create",
        element: (
          <ProtectedRoute>
            <PostJob />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/jobs/:id/applicants",
        element: (
          <ProtectedRoute>
            <Applicants />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/jobs/:jobId/create-test",
        element: (
          <ProtectedRoute>
            <CreateTest />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/tests/:testId/results",
        element: (
          <ProtectedRoute>
            <TestResults />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <div className="dark:bg-gray-900 flex flex-col flex-1">
      <RouterProvider router={appRouter} />
    </div>
  );
}

export default App;
