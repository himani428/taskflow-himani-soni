import { useState } from 'react';
import type { Project } from '../types';
import { Button, Input, Textarea, Modal, ErrorBanner } from '../components/ui';
import { projectsApi } from '../lib/api';

interface ProjectModalProps {
  project?: Project | null;
  onClose: () => void;
  onSave: (p: Project) => void;
}

export function ProjectModal({ project, onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const saved = project
        ? await projectsApi.update(project.id, { name: name.trim(), description: description || undefined })
        : await projectsApi.create({ name: name.trim(), description: description || undefined });
      onSave(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBanner message={error} />}
        <Input label="Project name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" autoFocus />
        <Textarea label="Description (optional)" value={description} onChange={e => setDescription((e.target as HTMLTextAreaElement).value)} placeholder="What is this project about?" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{project ? 'Save' : 'Create project'}</Button>
        </div>
      </div>
    </Modal>
  );
}
