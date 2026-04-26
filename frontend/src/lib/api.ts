import type { AuthResponse, Project, ProjectWithTasks, Task, ProjectStats } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL;

function getToken(): string | null {
  return localStorage.getItem('tf_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed') as Error & { fields?: Record<string, string>; status: number };
    err.status = res.status;
    err.fields = data.fields;
    throw err;
  }

  return data as T;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
};

// Projects
export const projectsApi = {
  list: () => request<{ projects: Project[] }>('/projects').then(r => r.projects),
  get: (id: string) => request<ProjectWithTasks>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string }) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  stats: (id: string) => request<ProjectStats>(`/projects/${id}/stats`),
};

// Tasks
export const tasksApi = {
  list: (projectId: string, filters?: { status?: string; assignee?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.assignee) params.set('assignee', filters.assignee);
    const qs = params.toString();
    return request<{ tasks: Task[] }>(`/projects/${projectId}/tasks${qs ? '?' + qs : ''}`).then(r => r.tasks);
  },
  create: (projectId: string, data: Partial<Task>) =>
    request<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
