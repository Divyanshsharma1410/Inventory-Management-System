import { useEffect, useState } from 'react';
import api, { apiError } from '../api/client.js';
import Modal from '../components/Modal.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get('/categories')
      .then((r) => setCategories(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() { setEditing({}); setForm({ name: '', description: '' }); setFormError(''); }
  function openEdit(c) { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setFormError(''); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name, description: form.description || null };
      if (editing.id) await api.put(`/categories/${editing.id}`, payload);
      else await api.post('/categories', payload);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!confirm(`Delete "${c.name}"? Products in it become uncategorized.`)) return;
    try { await api.delete(`/categories/${c.id}`); load(); }
    catch (e) { alert(apiError(e)); }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Categories</h1>
          <p className="muted">Group your products for easier management.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New category</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel no-pad">
        {loading ? <div className="loading">Loading…</div>
          : categories.length === 0 ? <div className="empty">No categories yet.</div>
          : (
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th><th>Products</th><th></th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td className="muted">{c.description || '—'}</td>
                    <td><span className="badge badge-ok">{c.productCount}</span></td>
                    <td className="row-actions">
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-sm btn-danger-ghost" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit category' : 'New category'} onClose={() => setEditing(null)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={save} className="form-grid">
            <label className="field span-2"><span>Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="field span-2"><span>Description</span>
              <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="form-actions span-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
