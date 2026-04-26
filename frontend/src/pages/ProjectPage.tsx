import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ProjectWithTasks, Task, User } from '../types';
import { projectsApi, tasksApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Spinner, Badge, Empty, ErrorBanner } from '../components/ui';
import { KanbanColumn, TaskModal } from '../components/TaskComponents';
import { ProjectModal } from '../components/ProjectModal';

const STATUSES: Task['status'][] = ['todo', 'in_progress', 'done'];
const STATUS_LABELS: Record<Task['status'], string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' };

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      const data = await projectsApi.get(id);
      setProject(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // Collect unique members from task assignees + current user
  const members: User[] = [];
  if (user) members.push(user);
  // In a real app, you'd fetch all project members; we derive from tasks here

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!project) return;
    // Optimistic update
    const prev = project.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setProject({ ...project, tasks: prev });
    try {
      await tasksApi.update(taskId, { status: newStatus });
    } catch {
      fetchProject(); // revert
    }
  };

  const handleTaskSave = (saved: Task) => {
    if (!project) return;
    const exists = project.tasks.find(t => t.id === saved.id);
    const tasks = exists
      ? project.tasks.map(t => t.id === saved.id ? saved : t)
      : [saved, ...project.tasks];
    setProject({ ...project, tasks });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskClick = (task: Task) => { setEditingTask(task); setShowTaskModal(true); };

  const handleDeleteProject = async () => {
    if (!project || !window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
    try {
      await projectsApi.delete(project.id);
      navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const filteredTasks = (project?.tasks ?? []).filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = (status: Task['status']) => filteredTasks.filter(t => t.status === status);

  const isOwner = project?.owner_id === user?.id;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <Spinner size={28} />
    </div>
  );

  if (error) return (
    <div style={{ padding: 24 }}><ErrorBanner message={error} /></div>
  );

  if (!project) return null;

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px', marginBottom: 4 }}>{project.name}</h1>
          {project.description && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{project.description}</p>
          )}
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, maxWidth: 180, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
              {doneTasks}/{totalTasks} done
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
          {isOwner && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowProjectModal(true)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={handleDeleteProject}>Delete</Button>
            </>
          )}
          <Button size="sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
            + Task
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: totalTasks, color: 'var(--purple)' },
          { label: 'To do', value: project.tasks.filter(t => t.status === 'todo').length, color: 'var(--text3)' },
          { label: 'In progress', value: project.tasks.filter(t => t.status === 'in_progress').length, color: 'var(--amber)' },
          { label: 'Done', value: doneTasks, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
          {(['board', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12.5,
              fontFamily: 'inherit', cursor: 'pointer',
              background: view === v ? 'var(--surface)' : 'transparent',
              color: view === v ? 'var(--text1)' : 'var(--text2)',
              fontWeight: view === v ? 500 : 400, transition: 'all 0.15s',
            }}>
              {v === 'board' ? '⊞ Board' : '☰ List'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(filterStatus || filterPriority) && (
          <button onClick={() => { setFilterStatus(''); setFilterPriority(''); }} style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Board view */}
      {view === 'board' && (
        filteredTasks.length === 0 && (filterStatus || filterPriority) ? (
          <Empty message="No tasks match the current filters." />
        ) : filteredTasks.length === 0 ? (
          <Empty
            message="No tasks yet. Add the first one!"
            action={<Button onClick={() => setShowTaskModal(true)}>Add task</Button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus(status)}
                members={members}
                onTaskClick={handleTaskClick}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {filteredTasks.length === 0 ? (
            <Empty message="No tasks match the current filters." />
          ) : (
            filteredTasks.map((task, i) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: i < filteredTasks.length - 1 ? '1px solid var(--border2)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                  opacity: task.status === 'done' ? 0.65 : 1,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <Badge variant={task.status} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text3)' : 'var(--text1)' }}>
                  {task.title}
                </span>
                <Badge variant={task.priority} />
                {task.due_date && (
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    {task.due_date}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          projectId={project.id}
          task={editingTask}
          members={members}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleTaskSave}
        />
      )}
      {showProjectModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onSave={updated => { setProject({ ...project, ...updated }); setShowProjectModal(false); }}
        />
      )}
    </div>
  );
}
