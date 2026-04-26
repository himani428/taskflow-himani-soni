
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '⊞' },
  { path: '/my-tasks', label: 'My Tasks', icon: '☑' },
];

interface SidebarProps {
  projects: { id: string; name: string; owner_id: string }[];
  onNewProject: () => void;
  collapsed: boolean;
}

const PROJECT_COLORS = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5', '#A32D2D'];

export function Sidebar({ projects, onNewProject, collapsed }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside style={{
      width: collapsed ? 0 : 220,
      minWidth: collapsed ? 0 : 220,
      overflow: 'hidden',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border2)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--accent)', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <path d="M2 3h10v1.5H2zm0 3h7v1.5H2zm0 3h5v1.5H2z"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>TaskFlow</span>
          <span style={{
            fontSize: 9, fontWeight: 600, background: 'var(--accent-light)', color: 'var(--accent-dark)',
            padding: '2px 6px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace",
          }}>v1</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 6px 4px' }}>
        <div style={{ padding: '0 6px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Menu</div>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 10px', borderRadius: 8, margin: '1px 0',
                fontSize: 13, cursor: 'pointer',
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent-dark)' : 'var(--text2)',
                fontWeight: active ? 500 : 400,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Projects */}
      <div style={{ padding: '8px 6px 4px' }}>
        <div style={{ padding: '0 6px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projects</div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {projects.map((p, i) => {
            const active = location.pathname === `/projects/${p.id}`;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8, margin: '1px 0',
                  fontSize: 12.5, cursor: 'pointer',
                  background: active ? 'var(--purple-light)' : 'transparent',
                  color: active ? 'var(--purple)' : 'var(--text2)',
                  fontWeight: active ? 500 : 400,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: PROJECT_COLORS[i % PROJECT_COLORS.length],
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {p.name}
                  </span>
                </div>
              </Link>
            );
          })}
          <div
            onClick={onNewProject}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8, margin: '1px 0',
              fontSize: 12.5, cursor: 'pointer', color: 'var(--text3)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border)' }} />
            + New project
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border2)' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 8, borderRadius: 8 }}>
            <Avatar name={user.name} size={30} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text1)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

interface TopbarProps {
  title: string;
  breadcrumb?: string;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}

export function Topbar({ title, breadcrumb, onMenuToggle, actions, tabs }: TopbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border2)',
      padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12,
      flexShrink: 0,
    }}>
      <button
        onClick={onMenuToggle}
        style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text3)', cursor: 'pointer', padding: '0 4px' }}
      >☰</button>

      <div>
        {breadcrumb && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{breadcrumb} / </span>}
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px' }}>{title}</span>
      </div>

      {tabs && <div style={{ marginLeft: 12 }}>{tabs}</div>}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {actions}
        <button
          onClick={handleLogout}
          style={{
            padding: '0 12px', height: 30, background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
      {items.map(item => (
        <button
          key={item}
          onClick={() => onChange(item)}
          style={{
            padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12.5, cursor: 'pointer',
            background: active === item ? 'var(--surface)' : 'transparent',
            color: active === item ? 'var(--text1)' : 'var(--text2)',
            fontWeight: active === item ? 500 : 400,
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
