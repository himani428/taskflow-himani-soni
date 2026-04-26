import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { projectsApi, tasksApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Badge, Spinner, Empty, ErrorBanner } from '../components/ui';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<(Task & { projectName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const projects = await projectsApi.list();
        const allTasks: (Task & { projectName?: string })[] = [];
        await Promise.all(
          projects.map(async p => {
            try {
              const ts = await tasksApi.list(p.id, { assignee: user.id });
              ts.forEach(t => allTasks.push({ ...t, projectName: p.name }));
            } catch {}
          })
        );
        allTasks.sort((a, b) => {
          if (a.status === 'done' && b.status !== 'done') return 1;
          if (b.status === 'done' && a.status !== 'done') return -1;
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (b.priority === 'high' && a.priority !== 'high') return 1;
          return 0;
        });
        setTasks(allTasks);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await tasksApi.update(taskId, { status: newStatus });
    } catch {
      setError('Failed to update task status');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px', marginBottom: 4 }}>My Tasks</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>All tasks assigned to you across projects.</p>
      </div>

      {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} /></div>}

      {tasks.length === 0 ? (
        <Empty message="You have no tasks assigned to you." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div
                key={task.id}
                className="animate-fade"
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius)', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: task.status === 'done' ? 0.6 : 1,
                }}
              >
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                  style={{
                    width: 20, height: 20, border: '1.5px solid var(--border)',
                    borderRadius: 5, background: task.status === 'done' ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'white', flexShrink: 0, transition: 'all 0.15s',
                  }}
                >
                  {task.status === 'done' ? '✓' : ''}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, marginBottom: 3,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? 'var(--text3)' : 'var(--text1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{task.projectName}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Badge variant={task.priority} />
                  <Badge variant={task.status} />
                  {task.due_date && (
                    <span style={{
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      color: isOverdue ? 'var(--red)' : 'var(--text3)',
                      fontWeight: isOverdue ? 600 : 400,
                    }}>
                      {task.due_date}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
