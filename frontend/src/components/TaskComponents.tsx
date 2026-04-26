import { useState } from 'react';
import type { Task, User } from '../types';
import { Badge, Avatar, Button, Input, Textarea, Select, Modal, ErrorBanner } from '../components/ui';
import { tasksApi } from '../lib/api';

// ── Task Card ─────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  assignee?: User;
  onClick: () => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

export function TaskCard({ task, assignee, onClick, onStatusChange }: TaskCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  const nextStatus: Record<Task['status'], Task['status']> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  };

  return (
    <div
      className="animate-fade"
      style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)', padding: 12, marginBottom: 8,
        cursor: 'pointer', transition: 'all 0.15s',
        opacity: task.status === 'done' ? 0.65 : 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
      onClick={onClick}
    >
      <div style={{
        fontSize: 13, fontWeight: 500, color: 'var(--text1)', marginBottom: 7, lineHeight: 1.4,
        textDecoration: task.status === 'done' ? 'line-through' : 'none',
      }}>
        {task.title}
      </div>
      {task.description && (
        <div style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 8, lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Badge variant={task.priority} />
        {task.due_date && (
          <span style={{
            fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: isOverdue ? 600 : 400,
          }}>
            {isOverdue ? '⚠ ' : ''}{task.due_date}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); onStatusChange(task.id, nextStatus[task.status]); }}
            title={`Move to ${nextStatus[task.status].replace('_', ' ')}`}
            style={{
              width: 20, height: 20, border: '1px solid var(--border)', borderRadius: 5,
              background: task.status === 'done' ? 'var(--accent-light)' : 'transparent',
              cursor: 'pointer', fontSize: 10, color: task.status === 'done' ? 'var(--accent)' : 'var(--text3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {task.status === 'done' ? '✓' : '→'}
          </button>
          {assignee && <Avatar name={assignee.name} size={20} />}
        </div>
      </div>
    </div>
  );
}

// ── Task Form Modal ───────────────────────────────────────────────────────────
interface TaskModalProps {
  projectId: string;
  task?: Task | null;
  members: User[];
  onClose: () => void;
  onSave: (task: Task) => void;
}

export function TaskModal({ projectId, task, members, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description || undefined,
        status,
        priority,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
      };
      const saved = task
        ? await tasksApi.update(task.id, payload)
        : await tasksApi.create(projectId, payload);
      onSave(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'Create task'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBanner message={error} />}
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" />
        <Textarea label="Description" value={description} onChange={e => setDescription((e.target as HTMLTextAreaElement).value)} placeholder="Optional details…" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Status"
            value={status}
            onChange={v => setStatus(v as Task['status'])}
            options={[
              { value: 'todo', label: 'To do' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'done', label: 'Done' },
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={v => setPriority(v as Task['priority'])}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Assignee"
            value={assigneeId}
            onChange={setAssigneeId}
            options={[
              { value: '', label: 'Unassigned' },
              ...members.map(m => ({ value: m.id, label: m.name })),
            ]}
          />
          <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{task ? 'Save changes' : 'Create task'}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────
interface KanbanColumnProps {
  status: Task['status'];
  tasks: Task[];
  members: User[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

const colMeta: Record<Task['status'], { label: string; color: string }> = {
  todo:        { label: 'To do',       color: '#888780' },
  in_progress: { label: 'In progress', color: '#BA7517' },
  done:        { label: 'Done',        color: '#1D9E75' },
};

export function KanbanColumn({ status, tasks, members, onTaskClick, onStatusChange }: KanbanColumnProps) {
  const meta = colMeta[status];
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-lg)', padding: 14, minHeight: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {meta.label}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: 'var(--text3)',
          background: 'var(--surface)', border: '1px solid var(--border2)',
          padding: '1px 7px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace",
        }}>{tasks.length}</span>
      </div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          assignee={task.assignee_id ? memberMap[task.assignee_id] : undefined}
          onClick={() => onTaskClick(task)}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
