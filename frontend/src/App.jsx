import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import SmoothScroll from "./Components/SmoothScroll";
import { ToastContainer, useToast } from "./Components/Toast";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import ThreatReportPage from "./pages/ThreatReportPage";
import TeamPage from "./pages/TeamPage";
import IntelligencePage from "./pages/IntelligencePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ResponsePage from "./pages/ResponsePage";
import CommunityPage from "./pages/CommunityPage";
import SandboxPage from "./pages/SandboxPage";

function AppWithToast() {
  const { toasts, removeToast } = useToast();
  
  return (
    <>
      <AppContent />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function AppContent() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <SmoothScroll>
        <Routes>
          <Route path="/" element={<HomePage auth={{ token }} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ThreatReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intelligence"
            element={
              <ProtectedRoute>
                <IntelligencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/response"
            element={
              <ProtectedRoute>
                <ResponsePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sandbox"
            element={
              <ProtectedRoute>
                <SandboxPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SmoothScroll>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppWithToast />;
}

