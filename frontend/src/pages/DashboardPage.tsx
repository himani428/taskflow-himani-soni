import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { projectsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Spinner, Empty, Avatar } from '../components/ui';
import { ProjectModal } from '../components/ProjectModal';

const PROJECT_COLORS = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5', '#A32D2D'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (p: Project) => {
    setProjects(prev => [p, ...prev]);
    setShowModal(false);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Good day, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text3)' }}>Here's what's happening across your projects.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <span>+</span> New project
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
      ) : projects.length === 0 ? (
        <Empty
          message="No projects yet. Create your first one to get started."
          action={<Button onClick={() => setShowModal(true)}>Create project</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projects.map((p, i) => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="animate-fade"
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-lg)', padding: 20, cursor: 'pointer',
                  transition: 'all 0.15s', animationDelay: `${i * 0.05}s`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: PROJECT_COLORS[i % PROJECT_COLORS.length] + '22',
                    border: `1px solid ${PROJECT_COLORS[i % PROJECT_COLORS.length]}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    ◈
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description ?? 'No description'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.owner_id === user?.id && (
                      <span style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                        Owner
                      </span>
                    )}
                    <Avatar name={user?.name ?? 'U'} size={22} />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Add new card */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              background: 'transparent', border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 20, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 130, transition: 'all 0.15s', color: 'var(--text3)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--text3)'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>New project</div>
          </div>
        </div>
      )}

      {showModal && (
        <ProjectModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
