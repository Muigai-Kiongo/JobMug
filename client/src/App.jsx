import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const CreateJob = lazy(() => import('./pages/CreateJob'));
const ApplicantDashboard = lazy(() => import('./pages/ApplicantDashboard'));
const ApplicantsList = lazy(() => import('./pages/ApplicantsList'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProfileEditor = lazy(() => import('./pages/ProfileEditor'));

// Scroll-to-top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Loader component
function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-neutral-400">
      <Loader2 className="animate-spin w-6 h-6 mr-2" />
      Loading...
    </div>
  );
}

// Auth wrapper
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-neutral-500">
            You don’t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <>
      <Toaster />
      <ScrollToTop />

      <div className="min-h-screen flex flex-col">
        <NavBar />

        <main className="flex-1 app-container py-8">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jobs/:id" element={<JobDetails />} />

              <Route
                path="/create"
                element={
                  <RequireAuth roles={['recruiter', 'admin']}>
                    <CreateJob />
                  </RequireAuth>
                }
              />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <RequireAuth roles={['recruiter', 'admin']}>
                    <ApplicantDashboard />
                  </RequireAuth>
                }
              />

              <Route
                path="/jobs/:id/applicants"
                element={
                  <RequireAuth roles={['recruiter', 'admin']}>
                    <ApplicantsList />
                  </RequireAuth>
                }
              />

              <Route
                path="/notifications"
                element={
                  <RequireAuth>
                    <Notifications />
                  </RequireAuth>
                }
              />

              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ProfileEditor />
                  </RequireAuth>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </>
  );
}
