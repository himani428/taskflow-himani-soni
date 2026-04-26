import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../lib/api';
import { Button, Input, ErrorBanner } from '../components/ui';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (mode === 'register' && !name) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await authApi.login(email, password)
          : await authApi.register(name, email, password);

      login(res.token, res.user);
      navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 10,
          padding: '7px 14px',
          fontSize: 13,
          color: 'var(--text2)',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            background: 'var(--accent)',
            borderRadius: '50%',
          }}
        />
        TaskFlow — Task Management
      </div>

      <div
        className="animate-fade"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 18,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 380,
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div
            style={{
              width: 30,
              height: 30,
              background: 'var(--accent)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 14 14" fill="white">
              <path d="M2 3h10v1.5H2zm0 3h7v1.5H2zm0 3h5v1.5H2z" />
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 600 }}>TaskFlow</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>

        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          {mode === 'login'
            ? 'Sign in to your workspace'
            : 'Get started for free'}
        </p>

        {/* Toggle */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--surface2)',
            borderRadius: 9,
            padding: 4,
            marginBottom: 18,
          }}
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError('');
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: mode === m ? 'var(--surface)' : 'transparent',
              }}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <ErrorBanner message={error} />}

          {mode === 'register' && (
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          )}

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <Button onClick={handleSubmit} loading={loading} style={{ width: '100%' }}>
            {mode === 'login' ? 'Sign in →' : 'Create account →'}
          </Button>
        </div>
      </div>
    </div>
  );
}