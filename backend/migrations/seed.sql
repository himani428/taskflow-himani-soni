-- Seed data for TaskFlow
-- Password for test@taskflow.io is: password123

INSERT INTO users (id, name, email, password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Arjun Kumar',  'test@taskflow.io',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgB10Z2e8W5vH2yBkJNm1i'),
  ('00000000-0000-0000-0000-000000000002', 'Sneha Rao',    'sneha@taskflow.io', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgB10Z2e8W5vH2yBkJNm1i'),
  ('00000000-0000-0000-0000-000000000003', 'Priya Joshi',  'priya@taskflow.io', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgB10Z2e8W5vH2yBkJNm1i')
ON CONFLICT DO NOTHING;

INSERT INTO projects (id, name, description, owner_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Website Redesign', 'Q2 brand refresh and performance overhaul', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'API Integration',  'Connect third-party payment and analytics APIs', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, due_date) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Redesign navigation menu',  'Update global nav with new brand guidelines', 'todo',        'high',   '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-04-20'),
  ('20000000-0000-0000-0000-000000000002', 'Homepage hero section',     'New layout with animation and CTA block',    'in_progress', 'high',   '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-04-15'),
  ('20000000-0000-0000-0000-000000000003', 'Color palette finalized',   'Sign off on brand colors with stakeholders', 'done',        'medium', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-04-05'),
  ('20000000-0000-0000-0000-000000000004', 'Write API documentation',   'Cover all endpoints with examples',          'todo',        'medium', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-04-25'),
  ('20000000-0000-0000-0000-000000000005', 'Auth flow integration',     'JWT login and protected routes',             'in_progress', 'high',   '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '2026-04-18')
ON CONFLICT DO NOTHING;
