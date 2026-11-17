
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./common/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import AIAnalysis from "./pages/AIAnalysis";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/projects"
                element={<Projects />}
              />

              <Route
                path="/projects/:projectId"
                element={<ProjectDetails />}
              />

              <Route
                path="/tasks"
                element={<Tasks />}
              />

              <Route
                path="/ai-analysis"
                element={<AIAnalysis />}
              />

              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/team" element={<Team />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
