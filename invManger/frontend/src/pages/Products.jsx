import { useEffect, useState, useCallback } from 'react';
import api, { apiError } from '../api/client.js';
import Modal from '../components/Modal.jsx';

const empty = { name: '', sku: '', description: '', price: '', cost: '', quantity: '', lowStockAt: 10, categoryId: '' };
const currency = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', categoryId: '', lowStock: false, sort: 'createdAt', page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null); // product or {} for new
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [stockFor, setStockFor] = useState(null);
  const [stockForm, setStockForm] = useState({ type: 'IN', quantity: '', note: '' });
  const [stockError, setStockError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        lowStock: filters.lowStock ? 'true' : undefined,
        sort: filters.sort,
        page: filters.page,
        limit: 20,
      };
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
      setError('');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)).catch(() => {}); }, []);

  // Debounce search input.
  function onSearch(e) {
    const v = e.target.value;
    setFilters((f) => ({ ...f, search: v, page: 1 }));
  }

  function openCreate() {
    setEditing({});
    setForm(empty);
    setFormError('');
  }
  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description || '',
      price: p.price, cost: p.cost, quantity: p.quantity,
      lowStockAt: p.lowStockAt, categoryId: p.categoryId || '',
    });
    setFormError('');
  }

  async function saveProduct(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description || null,
        price: Number(form.price || 0),
        cost: Number(form.cost || 0),
        lowStockAt: Number(form.lowStockAt || 0),
        categoryId: form.categoryId || null,
      };
      if (editing.id) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post('/products', { ...payload, quantity: Number(form.quantity || 0) });
      }
      setEditing(null);
      load();
    } catch (e) {
      setFormError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      load();
    } catch (e) {
      alert(apiError(e));
    }
  }

  function openStock(p) {
    setStockFor(p);
    setStockForm({ type: 'IN', quantity: '', note: '' });
    setStockError('');
  }
  async function submitStock(e) {
    e.preventDefault();
    setStockError('');
    try {
      await api.post(`/products/${stockFor.id}/movements`, {
        type: stockForm.type,
        quantity: Number(stockForm.quantity),
        note: stockForm.note || null,
      });
      setStockFor(null);
      load();
    } catch (e) {
      setStockError(apiError(e));
    }
  }

  function exportCsv() {
    const rows = [
      ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Quantity', 'Low stock at', 'Status'],
      ...products.map((p) => [
        p.name, p.sku, p.category?.name || '', p.price, p.cost, p.quantity, p.lowStockAt,
        p.quantity === 0 ? 'Out of stock' : p.lowStock ? 'Low' : 'OK',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Products</h1>
          <p className="muted">{pagination.total} item(s) in catalog.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={exportCsv}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={openCreate}>+ New product</button>
        </div>
      </header>

      <div className="toolbar">
        <input className="search" placeholder="Search by name or SKU…" value={filters.search} onChange={onSearch} />
        <select value={filters.categoryId} onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
          <option value="createdAt">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="quantity">Lowest stock</option>
          <option value="price">Highest price</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={filters.lowStock} onChange={(e) => setFilters((f) => ({ ...f, lowStock: e.target.checked, page: 1 }))} />
          Low stock only
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel no-pad">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : products.length === 0 ? (
          <div className="empty">No products found. Try adjusting filters or add one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="muted small">{p.sku}</div>
                  </td>
                  <td>{p.category?.name || <span className="muted">—</span>}</td>
                  <td>{currency(p.price)}</td>
                  <td><strong>{p.quantity}</strong></td>
                  <td>
                    {p.quantity === 0 ? <span className="badge badge-danger">Out of stock</span>
                      : p.lowStock ? <span className="badge badge-warn">Low</span>
                      : <span className="badge badge-ok">In stock</span>}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-sm" onClick={() => openStock(p)}>Stock</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger-ghost" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pager">
          <button className="btn btn-sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Prev</button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button className="btn btn-sm" disabled={filters.page >= pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
        </div>
      )}

      {/* Create / edit modal */}
      {editing && (
        <Modal title={editing.id ? 'Edit product' : 'New product'} onClose={() => setEditing(null)} width={560}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={saveProduct} className="form-grid">
            <label className="field span-2"><span>Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="field"><span>SKU</span>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></label>
            <label className="field"><span>Category</span>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
            <label className="field"><span>Price ($)</span>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            <label className="field"><span>Cost ($)</span>
              <input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></label>
            {!editing.id && (
              <label className="field"><span>Initial quantity</span>
                <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
            )}
            <label className="field"><span>Low stock at</span>
              <input type="number" min="0" value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} /></label>
            <label className="field span-2"><span>Description</span>
              <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="form-actions span-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock movement modal */}
      {stockFor && (
        <Modal title={`Adjust stock · ${stockFor.name}`} onClose={() => setStockFor(null)}>
          {stockError && <div className="alert alert-error">{stockError}</div>}
          <p className="muted">Current quantity: <strong>{stockFor.quantity}</strong></p>
          <form onSubmit={submitStock} className="form-grid">
            <label className="field span-2"><span>Movement type</span>
              <select value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}>
                <option value="IN">Stock in (add)</option>
                <option value="OUT">Stock out (remove)</option>
                <option value="ADJUST">Adjust (set exact quantity)</option>
              </select></label>
            <label className="field span-2">
              <span>{stockForm.type === 'ADJUST' ? 'New quantity' : 'Quantity'}</span>
              <input type="number" min={stockForm.type === 'ADJUST' ? '0' : '1'} value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required /></label>
            <label className="field span-2"><span>Note (optional)</span>
              <input value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} placeholder="e.g. Supplier delivery" /></label>
            <div className="form-actions span-2">
              <button type="button" className="btn btn-ghost" onClick={() => setStockFor(null)}>Cancel</button>
              <button className="btn btn-primary">Record movement</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
