import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiError } from '../api/client.js';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">◧</span> InvManager
        </div>
        <h2>Create your account</h2>
        <p className="muted">The first account created becomes the admin.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={update('name')} required minLength={2} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={update('email')} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={update('password')} required minLength={6} />
          </label>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
