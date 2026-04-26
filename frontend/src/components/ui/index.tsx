import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect } from 'react';

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, children, style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    border: 'none', borderRadius: 9, fontFamily: 'inherit', fontWeight: 500,
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    opacity: props.disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    padding: size === 'sm' ? '0 12px' : '0 16px',
    height: size === 'sm' ? 30 : 36,
    fontSize: size === 'sm' ? 12 : 13,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
    danger: { background: 'var(--red-light)', color: 'var(--red)' },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <input
        style={{
          width: '100%', padding: '8px 11px',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 8, fontSize: 13, color: 'var(--text1)',
          background: 'var(--surface)', outline: 'none', transition: 'border-color 0.15s',
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, style, ...props }: InputProps & { value?: string; onChange?: React.ChangeEventHandler<HTMLTextAreaElement> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <textarea
        style={{
          width: '100%', padding: '8px 11px', minHeight: 80, resize: 'vertical',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 8, fontSize: 13, color: 'var(--text1)',
          background: 'var(--surface)', outline: 'none', transition: 'border-color 0.15s',
          ...style,
        }}
        value={props.value as string}
        onChange={props.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        placeholder={props.placeholder}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export function Select({ label, value, onChange, options, style }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 11px',
          border: '1px solid var(--border)', borderRadius: 8,
          fontSize: 13, color: 'var(--text1)', background: 'var(--surface)',
          outline: 'none', cursor: 'pointer', appearance: 'none',
          ...style,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'todo' | 'in_progress' | 'done' | 'high' | 'medium' | 'low' | 'default';

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  todo:        { background: 'var(--surface3)', color: 'var(--text2)' },
  in_progress: { background: 'var(--amber-light)', color: 'var(--amber)' },
  done:        { background: 'var(--accent-light)', color: 'var(--accent-dark)' },
  high:        { background: 'var(--red-light)', color: 'var(--red)' },
  medium:      { background: 'var(--amber-light)', color: 'var(--amber)' },
  low:         { background: 'var(--blue-light)', color: 'var(--blue)' },
  default:     { background: 'var(--surface3)', color: 'var(--text2)' },
};

const badgeLabels: Record<string, string> = {
  todo: 'To do', in_progress: 'In progress', done: 'Done',
  high: 'High', medium: 'Med', low: 'Low',
};

export function Badge({ variant = 'default' }: { variant?: BadgeVariant }) {
  return (
    <span style={{
      ...badgeStyles[variant],
      fontSize: 10, fontWeight: 600, padding: '2px 7px',
      borderRadius: 4, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      {badgeLabels[variant] ?? variant}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 460 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,27,24,0.4)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-fade"
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border2)', padding: 24,
          width: '100%', maxWidth: width,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)' }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, background: 'var(--surface2)', border: 'none',
              borderRadius: 7, fontSize: 14, color: 'var(--text2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const avatarColors = [
  { bg: 'var(--purple-light)', color: 'var(--purple)' },
  { bg: 'var(--accent-light)', color: 'var(--accent-dark)' },
  { bg: 'var(--blue-light)', color: 'var(--blue)' },
  { bg: 'var(--amber-light)', color: 'var(--amber)' },
];

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.37), fontWeight: 600,
      flexShrink: 0,
      ...avatarColors[idx],
    }}>
      {initials}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>○</div>
      <p style={{ fontSize: 14, marginBottom: action ? 16 : 0 }}>{message}</p>
      {action}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--red-light)', border: '1px solid rgba(163,45,45,0.2)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
    }}>
      {message}
    </div>
  );
}
