import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Sidebar, Topbar } from './components/layout';
import { ProjectModal } from './components/ProjectModal';
import { projectsApi } from './lib/api';
import type { Project } from './types';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import MyTasksPage from './pages/MyTasksPage';

function ProtectedShell() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      projectsApi.list().then(setProjects).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts[0] === 'projects' ? 'Projects' : pathParts[0] === 'my-tasks' ? 'Menu' : undefined;
  const pageTitle =
    pathParts[0] === 'projects' && pathParts[1]
      ? projects.find(p => p.id === pathParts[1])?.name ?? 'Project'
      : pathParts[0] === 'my-tasks' ? 'My Tasks'
      : 'Dashboard';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        projects={projects}
        onNewProject={() => setShowNewProject(true)}
        collapsed={!sidebarOpen}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          title={pageTitle}
          breadcrumb={breadcrumb}
          onMenuToggle={() => setSidebarOpen(v => !v)}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
          </Routes>
        </main>
      </div>

      {showNewProject && (
        <ProjectModal
          onClose={() => setShowNewProject(false)}
          onSave={p => { setProjects(prev => [p, ...prev]); setShowNewProject(false); }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPublic />} />
          <Route path="/*" element={<ProtectedShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginPublic() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoginPage />;
}
