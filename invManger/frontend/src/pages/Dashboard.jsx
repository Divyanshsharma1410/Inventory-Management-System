import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import api, { apiError } from '../api/client.js';

const currency = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const movementLabel = { IN: 'Stock in', OUT: 'Stock out', ADJUST: 'Adjusted' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data)).catch((e) => setError(apiError(e)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  const { totals, lowStockItems, stockByCategory, recentMovements } = data;

  const cards = [
    { label: 'Total Products', value: totals.totalProducts, accent: 'blue' },
    { label: 'Stock Units', value: totals.totalUnits.toLocaleString(), accent: 'violet' },
    { label: 'Inventory Value', value: currency(totals.inventoryValue), accent: 'green' },
    { label: 'Low / Out of Stock', value: `${totals.lowStockCount} / ${totals.outOfStockCount}`, accent: 'amber' },
  ];

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Overview of your inventory health.</p>
        </div>
        <Link to="/products" className="btn btn-primary">Manage products</Link>
      </header>

      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card accent-${c.accent}`}>
            <span className="stat-label">{c.label}</span>
            <strong className="stat-value">{c.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <section className="panel">
          <h3>Stock by category</h3>
          {stockByCategory.length === 0 ? (
            <p className="muted">No products yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                  {stockByCategory.map((_, i) => (
                    <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel">
          <h3>Low stock alerts</h3>
          {lowStockItems.length === 0 ? (
            <p className="muted">Everything is well stocked. ✅</p>
          ) : (
            <ul className="alert-list">
              {lowStockItems.map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.name}</strong>
                    <span className="muted"> · {p.sku}</span>
                  </div>
                  <span className={`badge ${p.quantity === 0 ? 'badge-danger' : 'badge-warn'}`}>
                    {p.quantity === 0 ? 'Out of stock' : `${p.quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <h3>Recent stock activity</h3>
        {recentMovements.length === 0 ? (
          <p className="muted">No movements recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Type</th><th>Qty</th><th>By</th><th>When</th></tr>
            </thead>
            <tbody>
              {recentMovements.map((m) => (
                <tr key={m.id}>
                  <td>{m.product?.name} <span className="muted">({m.product?.sku})</span></td>
                  <td><span className={`badge badge-${m.type.toLowerCase()}`}>{movementLabel[m.type]}</span></td>
                  <td>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td>{m.user?.name || '—'}</td>
                  <td className="muted">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
